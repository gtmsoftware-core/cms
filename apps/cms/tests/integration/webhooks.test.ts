import { webhookPayloadSchema } from '@gtmsoftware-core/cms-sdk';
import { createRevalidateHandler } from '@gtmsoftware-core/cms-sdk/next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Container } from '@/composition/container';
import { ForbiddenError, type Actor, type UserId } from '@/domain/identity';
import type { SiteId } from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';
import { MAX_ATTEMPTS } from '@/domain/webhooks';
import { GET as cronSweep } from '@/app/api/cron/webhooks/route';
import { createDrizzleContentRepository } from '@/infrastructure/content';
import type { Database } from '@/infrastructure/db';
import { createDrizzleOutboxRepository, createDrizzleUnitOfWork } from '@/infrastructure/webhooks';
import { createTestContainer } from './database';

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock('next/cache', () => ({ revalidateTag }));

const WEBHOOK_URL = 'https://site.test/api/revalidate';
const emptyPage = { seo: { title: '', description: '', image: null }, blocks: [] };

/** A clock that starts at the real time (the site handler checks timestamps) and can move forward. */
function movableClock() {
  let now = Date.now();
  return { now: () => new Date(now), advance: (ms: number) => void (now += ms) };
}

/**
 * Publish in the CMS → signed webhook → the site's handler (from the SDK) calls revalidateTag.
 * The real fetch sender is used; only the network is replaced by the handler itself.
 */
describe('webhooks end to end', () => {
  let container: Container;
  let db: Database;
  let clock: ReturnType<typeof movableClock>;
  let root: Actor;
  let ref: { tenantId: string; siteId: string };
  let siteHandler: (request: Request) => Promise<Response>;
  const received: Request[] = [];

  beforeEach(async () => {
    clock = movableClock();
    const setup = await createTestContainer({ clock });
    container = setup.container;
    db = setup.db;
    revalidateTag.mockClear();
    received.length = 0;

    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      const request = new Request(url, init);
      received.push(request.clone());
      return siteHandler(request);
    });

    // Use cases only read the actor; no account (and no slow password hashing) is needed.
    root = { userId: 'usr_root' as UserId, isSuperadmin: true, memberships: [] };
    const tenant = await container.createTenant(root, { name: 'Cliente', slug: 'cliente' });
    const site = await container.createSite(root, { tenantId: tenant.id, name: 'Site', primaryDomain: '' });
    ref = { tenantId: tenant.id, siteId: site.id };

    await container.setWebhookUrl(root, { ...ref, webhookUrl: WEBHOOK_URL });
    const secret = await container.rotateWebhookSecret(root, ref);
    siteHandler = createRevalidateHandler({ secret });
  });

  afterEach(() => vi.unstubAllGlobals());

  async function publishedPage(title: string, slug: string) {
    const page = await container.createPage(root, { ...ref, title, slug });
    await container.changePageStatus(root, 'publish', { ...ref, contentId: page.id, version: 1 });
    return page;
  }

  it('revalidates the page tags on the site after publishing', async () => {
    await publishedPage('Serviços', 'servicos');
    expect(await container.dispatchDue()).toEqual({ delivered: 1, failed: 0, skipped: 0 });

    expect(revalidateTag.mock.calls).toEqual([
      ['cms:site', 'max'],
      ['cms:page:list', 'max'],
      ['cms:page:servicos', 'max'],
    ]);
    const [request] = received;
    expect(request?.headers.get('x-cms-event')).toBe('content.published');
    expect(request?.headers.get('x-cms-signature')).toMatch(/^v1=[0-9a-f]{64}$/);
  });

  it('groups several changes of a site into one webhook with the union of tags', async () => {
    await publishedPage('Serviços', 'servicos');
    await publishedPage('Contato', 'contato');
    const settings = await container.getSiteSettings(root, ref);
    await container.saveSiteSettings(root, { ...ref, version: 0, settings: settings.settings });

    await container.dispatchDue();
    expect(received).toHaveLength(1);
    // Events recorded in the same instant have no meaningful order; compare as sets.
    const body = webhookPayloadSchema.parse(await received[0]?.json());
    expect(body.siteId).toBe(ref.siteId);
    expect(body.events.map((e) => e.type).sort()).toEqual(['content.published', 'content.published', 'site.settings.updated']);
    expect([...body.tags].sort()).toEqual(['cms:page:contato', 'cms:page:list', 'cms:page:servicos', 'cms:settings', 'cms:site']);
  });

  it('sends nothing for drafts', async () => {
    const page = await container.createPage(root, { ...ref, title: 'Rascunho', slug: 'rascunho' });
    await container.savePage(root, { ...ref, contentId: page.id, version: 1, page: { ...emptyPage, title: 'Rascunho', slug: 'rascunho' } });
    expect(await container.dispatchDue()).toEqual({ delivered: 0, failed: 0, skipped: 0 });
    expect(received).toHaveLength(0);
  });

  it('retries with backoff, gives up after the last attempt and resends on request', async () => {
    siteHandler = createRevalidateHandler({ secret: 'whsec_wrong' });
    await publishedPage('Serviços', 'servicos');

    expect(await container.dispatchDue()).toMatchObject({ failed: 1 });
    expect(await container.dispatchDue()).toMatchObject({ failed: 0 }); // next attempt only in 30 s
    for (let attempt = 2; attempt <= MAX_ATTEMPTS; attempt++) {
      clock.advance(7 * 60 * 60 * 1000);
      await container.dispatchDue();
    }
    expect(received).toHaveLength(MAX_ATTEMPTS);

    const overview = await container.getWebhookOverview(root, ref);
    expect(overview.failedEvents).toBe(1);
    expect(overview.deliveries[0]).toMatchObject({ status: 'failed', httpStatus: 401, error: 'HTTP 401' });

    clock.advance(7 * 60 * 60 * 1000);
    expect(await container.dispatchDue()).toMatchObject({ failed: 0 }); // given up

    clock.advance(-clock.now().getTime() + Date.now()); // back to real time for the handler's check
    siteHandler = createRevalidateHandler({ secret: await container.rotateWebhookSecret(root, ref) });
    expect(await container.retryFailed(root, ref)).toBe(1);
    expect(await container.dispatchDue()).toMatchObject({ delivered: 1 });
    expect((await container.getWebhookOverview(root, ref)).failedEvents).toBe(0);
  });

  it('tests the connection with a ping and logs it', async () => {
    expect(await container.testConnection(root, ref)).toMatchObject({ ok: true, httpStatus: 200 });
    expect(revalidateTag).not.toHaveBeenCalled();
    const [delivery] = (await container.getWebhookOverview(root, ref)).deliveries;
    expect(delivery).toMatchObject({ status: 'success', eventTypes: ['ping'] });
  });

  it('revalidates the whole site on request', async () => {
    await container.revalidateSite(root, ref);
    await container.dispatchDue();
    expect(revalidateTag.mock.calls).toEqual([['cms:site', 'max']]);
  });

  it('marks events of sites without a webhook as processed without sending', async () => {
    await container.setWebhookUrl(root, { ...ref, webhookUrl: '' });
    await publishedPage('Serviços', 'servicos');
    expect(await container.dispatchDue()).toEqual({ delivered: 0, failed: 0, skipped: 1 });
    expect(received).toHaveLength(0);
  });

  it('rolls back the content change when the transaction fails', async () => {
    const page = await container.createPage(root, { ...ref, title: 'Serviços', slug: 'servicos' });
    const scope = { tenantId: ref.tenantId as TenantId, siteId: ref.siteId as SiteId };
    const uow = createDrizzleUnitOfWork(db);

    await expect(
      uow.transaction(async ({ contents }) => {
        const stored = await contents.findBySlug(scope, 'page', 'servicos');
        if (stored) await contents.save(scope, { ...stored, status: 'published', version: 2 });
        throw new Error('outbox failure');
      }),
    ).rejects.toThrow('outbox failure');

    const stored = await createDrizzleContentRepository(db).findBySlug(scope, 'page', page.slug);
    expect(stored).toMatchObject({ status: 'draft', version: 1 });
    expect(await createDrizzleOutboxRepository(db).claimDue(clock.now(), 1000, 10)).toEqual([]);
  });

  it('protects the cron sweep with CRON_SECRET', async () => {
    Object.assign(globalThis, { __cmsContainer: Promise.resolve(container) });
    await publishedPage('Serviços', 'servicos');

    expect((await cronSweep(new Request('https://cms.test/api/cron/webhooks'))).status).toBe(401);
    const authorized = new Request('https://cms.test/api/cron/webhooks', {
      headers: { authorization: `Bearer ${container.cronSecret}` },
    });
    const response = await cronSweep(authorized);
    expect(await response.json()).toEqual({ delivered: 1, failed: 0, skipped: 0 });
  });

  it("does not let users of other tenants manage this site's webhooks", async () => {
    const other = await container.createTenant(root, { name: 'Outro', slug: 'outro' });
    const userId = 'usr_other' as UserId;
    const outsider: Actor = { userId, isSuperadmin: false, memberships: [{ userId, tenantId: other.id as TenantId, role: 'owner' }] };
    const ownerOfSite: Actor = { userId, isSuperadmin: false, memberships: [{ userId, tenantId: ref.tenantId as TenantId, role: 'owner' }] };

    await expect(container.getWebhookOverview(outsider, ref)).rejects.toThrow(ForbiddenError);
    await expect(container.retryFailed(outsider, ref)).rejects.toThrow(ForbiddenError);
    await expect(container.revalidateSite(outsider, ref)).rejects.toThrow(ForbiddenError);
    await expect(container.setWebhookUrl(ownerOfSite, { ...ref, webhookUrl: 'https://evil.test' })).rejects.toThrow(ForbiddenError);
    await expect(container.rotateWebhookSecret(ownerOfSite, ref)).rejects.toThrow(ForbiddenError);
    await expect(container.testConnection(ownerOfSite, ref)).rejects.toThrow(ForbiddenError);
  });
});
