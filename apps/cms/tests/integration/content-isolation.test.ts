import { beforeAll, describe, expect, it } from 'vitest';
import type { PageSummary } from '@/application/content';
import type { Container } from '@/composition/container';
import { ContentConflictError, SlugAlreadyInUseError, type ContentId } from '@/domain/content';
import { ForbiddenError, type Actor, type UserId } from '@/domain/identity';
import { SiteNotFoundError, type SiteId } from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';
import { createDrizzleContentRepository } from '@/infrastructure/content';
import { createTestContainer } from './database';

/**
 * Mandatory isolation tests (AGENTS.md §6.2) for content: a user of tenant A never reads,
 * edits, publishes or deletes pages and settings of tenant B.
 */
describe('content isolation', () => {
  let container: Container;
  let contents: ReturnType<typeof createDrizzleContentRepository>;
  let root: Actor;
  let editorOfA: Actor;
  let pageB: PageSummary;
  const ref = {} as Record<'a' | 'b', { tenantId: string; siteId: string }>;

  beforeAll(async () => {
    const setup = await createTestContainer();
    container = setup.container;
    contents = createDrizzleContentRepository(setup.db);

    const rootId = await container.createSuperadmin({ email: 'root@cms.dev', name: 'Root', password: 'senha-do-root-123' });
    root = { userId: rootId, isSuperadmin: true, memberships: [] };

    for (const [key, slug] of [['a', 'clinica-a'], ['b', 'oficina-b']] as const) {
      const tenant = await container.createTenant(root, { name: slug, slug });
      const site = await container.createSite(root, { tenantId: tenant.id, name: `Site ${key}`, primaryDomain: '' });
      ref[key] = { tenantId: tenant.id, siteId: site.id };
    }
    pageB = await container.createPage(root, { ...ref.b, title: 'Serviços B', slug: 'servicos' });

    const userId = 'usr_editor_a' as UserId;
    editorOfA = { userId, isSuperadmin: false, memberships: [{ userId, tenantId: ref.a.tenantId as TenantId, role: 'editor' }] };
  });

  it("does not list or read another tenant's pages", async () => {
    await expect(container.listPages(editorOfA, ref.b)).rejects.toThrow(ForbiddenError);
    await expect(container.getPage(editorOfA, { ...ref.b, contentId: pageB.id })).rejects.toThrow(ForbiddenError);
  });

  it("cannot reach another tenant's site by mixing its own tenant id with a foreign site id", async () => {
    const mixed = { tenantId: ref.a.tenantId, siteId: ref.b.siteId };
    await expect(container.listPages(editorOfA, mixed)).rejects.toThrow(SiteNotFoundError);
    await expect(container.createPage(editorOfA, { ...mixed, title: 'Invasor', slug: 'invasor' })).rejects.toThrow(
      SiteNotFoundError,
    );
    await expect(container.getSiteSettings(editorOfA, mixed)).rejects.toThrow(SiteNotFoundError);
  });

  it("cannot edit, publish or delete another tenant's page", async () => {
    const target = { ...ref.b, contentId: pageB.id, version: 1 };
    const page = { title: 'Invadida', slug: 'servicos', seo: { title: '', description: '', image: null }, blocks: [] };
    await expect(container.savePage(editorOfA, { ...target, page })).rejects.toThrow(ForbiddenError);
    await expect(container.changePageStatus(editorOfA, 'publish', target)).rejects.toThrow(ForbiddenError);
    await expect(container.deletePage(editorOfA, target)).rejects.toThrow(ForbiddenError);

    const untouched = await container.getPage(root, { ...ref.b, contentId: pageB.id });
    expect(untouched).toMatchObject({ status: 'draft', version: 1, page: { title: 'Serviços B' } });
  });

  it("does not find another site's page through its own site", async () => {
    await expect(container.getPage(editorOfA, { ...ref.a, contentId: pageB.id })).rejects.toThrow('Content not found');
  });

  it('scopes repository reads and writes by tenant and site', async () => {
    const scopeA = { tenantId: ref.a.tenantId as TenantId, siteId: ref.a.siteId as SiteId };
    const scopeB = { tenantId: ref.b.tenantId as TenantId, siteId: ref.b.siteId as SiteId };
    expect(await contents.findById(scopeA, pageB.id as ContentId)).toBeNull();

    const stored = await contents.findById(scopeB, pageB.id as ContentId);
    expect(stored).not.toBeNull();
    await expect(contents.save(scopeA, { ...stored!, version: 2 })).rejects.toThrow();
    await contents.delete(scopeA, pageB.id as ContentId, new Date());
    expect(await contents.findById(scopeB, pageB.id as ContentId)).not.toBeNull();
  });

  it('keeps settings separate per site', async () => {
    const settingsA = await container.getSiteSettings(editorOfA, ref.a);
    await container.saveSiteSettings(editorOfA, { ...ref.a, version: 0, settings: { ...settingsA.settings, businessName: 'Clínica A' } });

    expect((await container.getSiteSettings(editorOfA, ref.a)).settings.businessName).toBe('Clínica A');
    expect((await container.getSiteSettings(root, ref.b)).settings.businessName).toBe('Site b');
  });
});

describe('content persistence', () => {
  it('enforces unique slugs and optimistic concurrency in the database', async () => {
    const { container } = await createTestContainer();
    const rootId = await container.createSuperadmin({ email: 'root@cms.dev', name: 'Root', password: 'senha-do-root-123' });
    const root: Actor = { userId: rootId, isSuperadmin: true, memberships: [] };
    const tenant = await container.createTenant(root, { name: 'Cliente', slug: 'cliente' });
    const site = await container.createSite(root, { tenantId: tenant.id, name: 'Site', primaryDomain: '' });
    const ref = { tenantId: tenant.id, siteId: site.id };

    const home = await container.createPage(root, { ...ref, title: 'Início', slug: 'inicio' });
    const about = await container.createPage(root, { ...ref, title: 'Sobre', slug: 'sobre' });
    const { page } = await container.getPage(root, { ...ref, contentId: about.id });

    await expect(
      container.savePage(root, { ...ref, contentId: about.id, version: 1, page: { ...page, slug: 'inicio' } }),
    ).rejects.toThrow(SlugAlreadyInUseError);

    await container.savePage(root, { ...ref, contentId: about.id, version: 1, page });
    await expect(container.savePage(root, { ...ref, contentId: about.id, version: 1, page })).rejects.toThrow(
      ContentConflictError,
    );

    await container.deletePage(root, { ...ref, contentId: home.id, version: 1 });
    await expect(container.createPage(root, { ...ref, title: 'Novo início', slug: 'inicio' })).resolves.toMatchObject({
      slug: 'inicio',
    });
  });
});
