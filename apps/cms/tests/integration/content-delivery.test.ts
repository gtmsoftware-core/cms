import { createCmsClient, type CmsFetch } from '@gtmsoftware-core/cms-sdk';
import { beforeAll, describe, expect, it } from 'vitest';
import { InvalidApiKeyError } from '@/application/delivery';
import type { Container } from '@/composition/container';
import { ForbiddenError, type Actor, type UserId } from '@/domain/identity';
import type { TenantId } from '@/domain/tenants';
import { GET as getPage } from '@/app/api/v1/sites/[siteId]/pages/[slug]/route';
import { GET as listPages } from '@/app/api/v1/sites/[siteId]/pages/route';
import { GET as getSettings } from '@/app/api/v1/sites/[siteId]/settings/route';
import { createTestContainer } from './database';

/**
 * Mandatory isolation tests (AGENTS.md §6.2) for the Content Delivery API: an API key of site X
 * never reads content of site Y, and only published content leaves the CMS.
 */
describe('content delivery', () => {
  let container: Container;
  let root: Actor;
  const site = {} as Record<'x' | 'y', { tenantId: string; siteId: string; apiKey: string }>;

  async function publishPage(ref: { tenantId: string; siteId: string }, title: string, slug: string) {
    const created = await container.createPage(root, { ...ref, title, slug });
    await container.changePageStatus(root, 'publish', { ...ref, contentId: created.id, version: 1 });
    return created;
  }

  beforeAll(async () => {
    const setup = await createTestContainer();
    container = setup.container;
    // Route handlers read the cached container; point it at the test database.
    Object.assign(globalThis, { __cmsContainer: Promise.resolve(container) });

    const rootId = await container.createSuperadmin({ email: 'root@cms.dev', name: 'Root', password: 'senha-do-root-123' });
    root = { userId: rootId, isSuperadmin: true, memberships: [] };

    for (const key of ['x', 'y'] as const) {
      const tenant = await container.createTenant(root, { name: `Cliente ${key}`, slug: `cliente-${key}` });
      const created = await container.createSite(root, { tenantId: tenant.id, name: `Site ${key}`, primaryDomain: '' });
      const ref = { tenantId: tenant.id, siteId: created.id };
      const { apiKey } = await container.issueApiKey(root, ref);
      site[key] = { ...ref, apiKey };
      await publishPage(ref, `Serviços ${key}`, 'servicos');
    }
    await container.createPage(root, { ...site.x, title: 'Rascunho', slug: 'rascunho' });
    const settings = await container.getSiteSettings(root, site.x);
    await container.saveSiteSettings(root, { ...site.x, version: 0, settings: { ...settings.settings, businessName: 'Negócio X' } });
  });

  /** Dispatches SDK requests straight to the route handlers, like a site would over HTTP. */
  const routeFetch: CmsFetch = async (url, init) => {
    const request = new Request(url, { headers: init.headers });
    const [, siteId, rest] = /\/api\/v1\/sites\/([^/]+)\/(.+)$/.exec(new URL(url).pathname) ?? [];
    const params = <T extends object>(value: T) => ({ params: Promise.resolve({ siteId: decodeURIComponent(siteId ?? ''), ...value }) });
    if (rest === 'settings') return getSettings(request, params({}));
    if (rest === 'pages') return listPages(request, params({}));
    const slug = decodeURIComponent(rest?.replace(/^pages\//, '') ?? '');
    return getPage(request, params({ slug }));
  };

  const clientFor = (siteId: string, apiKey: string) =>
    createCmsClient({ baseUrl: 'https://cms.test', siteId, apiKey, fetch: routeFetch });

  it('serves only published content of the authenticated site', async () => {
    const client = clientFor(site.x.siteId, site.x.apiKey);
    expect((await client.listPages()).map((p) => p.slug)).toEqual(['servicos']);
    expect(await client.getPage('servicos')).toMatchObject({ title: 'Serviços x' });
    expect(await client.getPage('rascunho')).toBeNull();
    expect(await client.getSettings()).toMatchObject({ businessName: 'Negócio X' });
  });

  it('does not let the key of site X read site Y', async () => {
    const request = (path: string) =>
      new Request(`https://cms.test/api/v1/sites/${site.y.siteId}/${path}`, {
        headers: { authorization: `Bearer ${site.x.apiKey}` },
      });
    const params = { params: Promise.resolve({ siteId: site.y.siteId, slug: 'servicos' }) };

    expect((await listPages(request('pages'), params)).status).toBe(401);
    expect((await getPage(request('pages/servicos'), params)).status).toBe(401);
    expect((await getSettings(request('settings'), params)).status).toBe(401);
    await expect(clientFor(site.y.siteId, site.x.apiKey).getPage('servicos')).rejects.toThrow('401');
  });

  it('rejects missing, malformed and unknown keys with the same 401', async () => {
    for (const authorization of ['', 'Bearer x', `Basic ${site.x.apiKey}`, `Bearer cms_live_${'a'.repeat(40)}`]) {
      await expect(container.authenticateSite({ siteId: site.x.siteId, authorization })).rejects.toThrow(InvalidApiKeyError);
    }
    const response = await listPages(new Request('https://cms.test'), { params: Promise.resolve({ siteId: site.x.siteId }) });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'unauthorized' });
  });

  it('stops serving a page after unpublishing or deleting it', async () => {
    const client = clientFor(site.y.siteId, site.y.apiKey);
    const page = await publishPage(site.y, 'Contato', 'contato');
    expect(await client.getPage('contato')).not.toBeNull();

    await container.changePageStatus(root, 'unpublish', { ...site.y, contentId: page.id, version: 2 });
    expect(await client.getPage('contato')).toBeNull();

    await container.deletePage(root, { ...site.y, contentId: page.id, version: 3 });
    expect((await client.listPages()).map((p) => p.slug)).toEqual(['servicos']);
  });

  it('invalidates the previous key on rotation', async () => {
    const ref = { tenantId: site.y.tenantId, siteId: site.y.siteId };
    const { apiKey } = await container.issueApiKey(root, ref);
    await expect(clientFor(site.y.siteId, site.y.apiKey).listPages()).rejects.toThrow('401');
    await expect(clientFor(site.y.siteId, apiKey).listPages()).resolves.toHaveLength(1);
    site.y.apiKey = apiKey;
  });

  it('lets only superadmins issue keys', async () => {
    const userId = 'usr_owner_x' as UserId;
    const ownerOfX: Actor = { userId, isSuperadmin: false, memberships: [{ userId, tenantId: site.x.tenantId as TenantId, role: 'owner' }] };
    await expect(container.issueApiKey(ownerOfX, site.x)).rejects.toThrow(ForbiddenError);
  });
});
