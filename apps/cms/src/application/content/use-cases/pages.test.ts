import { describe, expect, it } from 'vitest';
import { ContentConflictError, SlugAlreadyInUseError } from '@/domain/content';
import { ForbiddenError } from '@/domain/identity';
import { SiteNotFoundError, type Site, type SiteId } from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';
import {
  editorOf,
  fixedClock,
  inMemoryContents,
  inMemoryOutbox,
  inMemoryUnitOfWork,
  inMemorySites,
  superadmin,
} from '../../../../tests/fakes/in-memory-repositories';
import { makeChangePageStatus } from './change-page-status';
import { makeCreatePage } from './create-page';
import { makeDeletePage } from './delete-page';
import { makeGetPage } from './get-page';
import { makeListPages } from './list-pages';
import { makeSavePage } from './save-page';

const site: Site = {
  id: 'site_a' as SiteId,
  tenantId: 'tnt_a' as TenantId,
  name: 'Site A',
  primaryDomain: null,
  status: 'active',
  apiKey: null,
  webhookUrl: null,
  webhookSecretEnc: null,
  createdAt: fixedClock.now(),
};
const ref = { tenantId: site.tenantId, siteId: site.id };

function setup() {
  const contents = inMemoryContents();
  const outbox = inMemoryOutbox();
  const deps = { sites: inMemorySites([site]), contents, uow: inMemoryUnitOfWork(contents, outbox.repository), clock: fixedClock };
  return {
    events: outbox.events,
    createPage: makeCreatePage(deps),
    savePage: makeSavePage(deps),
    getPage: makeGetPage(deps),
    listPages: makeListPages(deps),
    changePageStatus: makeChangePageStatus(deps),
    deletePage: makeDeletePage(deps),
  };
}

describe('page use cases', () => {
  it('creates a draft page and saves blocks', async () => {
    const uc = setup();
    const created = await uc.createPage(editorOf(site.tenantId), { ...ref, title: 'Serviços', slug: 'servicos' });
    expect(created).toMatchObject({ status: 'draft', slug: 'servicos' });

    const detail = await uc.getPage(superadmin, { ...ref, contentId: created.id });
    const blocks = [{ id: 'b1', type: 'cta' as const, heading: 'Agende', text: '', button: { label: 'WhatsApp', href: 'https://wa.me/1' } }];
    const saved = await uc.savePage(superadmin, { ...ref, contentId: created.id, version: detail.version, page: { ...detail.page, blocks } });

    expect(saved.version).toBe(2);
    expect(saved.page.blocks).toEqual([{ ...blocks[0], menuLabel: '', highlight: '', secondaryButton: null }]);
  });

  it('rejects a stale version', async () => {
    const uc = setup();
    const created = await uc.createPage(superadmin, { ...ref, title: 'Início', slug: 'inicio' });
    const detail = await uc.getPage(superadmin, { ...ref, contentId: created.id });
    await uc.savePage(superadmin, { ...ref, contentId: created.id, version: 1, page: detail.page });

    await expect(
      uc.savePage(superadmin, { ...ref, contentId: created.id, version: 1, page: detail.page }),
    ).rejects.toThrow(ContentConflictError);
  });

  it('rejects a slug already used by another page', async () => {
    const uc = setup();
    await uc.createPage(superadmin, { ...ref, title: 'Um', slug: 'um' });
    await expect(uc.createPage(superadmin, { ...ref, title: 'Dois', slug: 'um' })).rejects.toThrow(SlugAlreadyInUseError);
  });

  it('records an outbox event only when the public site changes', async () => {
    const uc = setup();
    const { id } = await uc.createPage(superadmin, { ...ref, title: 'Sobre', slug: 'sobre' });
    const { page } = await uc.getPage(superadmin, { ...ref, contentId: id });
    await uc.savePage(superadmin, { ...ref, contentId: id, version: 1, page });
    expect(uc.events).toEqual([]);

    await uc.changePageStatus(superadmin, 'publish', { ...ref, contentId: id, version: 2 });
    await uc.savePage(superadmin, { ...ref, contentId: id, version: 3, page: { ...page, slug: 'quem-somos' } });
    await uc.deletePage(superadmin, { ...ref, contentId: id, version: 4 });

    expect(uc.events.map((e) => e.type)).toEqual(['content.published', 'content.updated', 'content.deleted']);
    expect(uc.events[1]?.payload.tags).toEqual(['cms:site', 'cms:page:list', 'cms:page:quem-somos', 'cms:page:sobre']);
  });

  it('publishes, unpublishes and deletes', async () => {
    const uc = setup();
    const { id } = await uc.createPage(superadmin, { ...ref, title: 'Contato', slug: 'contato' });

    const published = await uc.changePageStatus(superadmin, 'publish', { ...ref, contentId: id, version: 1 });
    expect(published).toMatchObject({ status: 'published', version: 2, publishedAt: fixedClock.now() });

    const draft = await uc.changePageStatus(superadmin, 'unpublish', { ...ref, contentId: id, version: 2 });
    expect(draft).toMatchObject({ status: 'draft', publishedAt: null });

    await uc.deletePage(superadmin, { ...ref, contentId: id, version: 3 });
    expect(await uc.listPages(superadmin, ref)).toEqual([]);
  });

  it('denies other tenants and unknown sites', async () => {
    const uc = setup();
    const outsider = editorOf('tnt_b' as TenantId);
    await expect(uc.listPages(outsider, ref)).rejects.toThrow(ForbiddenError);
    await expect(uc.listPages(superadmin, { ...ref, siteId: 'site_x' })).rejects.toThrow(SiteNotFoundError);
  });
});
