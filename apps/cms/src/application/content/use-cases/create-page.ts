import { createContent, SlugAlreadyInUseError, type ContentId } from '@/domain/content';
import type { Actor } from '@/domain/identity';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import type { Clock } from '@/shared/clock';
import { newId } from '@/shared/ids';
import { authorizeSite } from '@/application/sites';
import { toPageData, toPageSummary, type PageSummary } from '../dto';
import type { UnitOfWork } from '../ports';
import { createPageSchema, type CreatePageInput } from '../schemas/page.schema';

export type CreatePageDeps = Readonly<{ sites: SiteRepository; uow: UnitOfWork; clock: Clock }>;

/** New pages start as drafts, so nothing is sent to the site. */
export function makeCreatePage({ sites, uow, clock }: CreatePageDeps) {
  return async function createPage(actor: Actor, input: CreatePageInput): Promise<PageSummary> {
    const { title, slug, ...ref } = createPageSchema.parse(input);
    const scope = scopeOf(await authorizeSite(sites, actor, ref));

    const page = createContent({
      id: newId('cnt') as ContentId,
      scope,
      type: 'page',
      slug,
      status: 'draft',
      data: toPageData({ title, slug, seo: { title: '', description: '', image: null }, blocks: [] }),
      now: clock.now(),
    });
    await uow.transaction(async ({ contents }) => {
      if (await contents.findBySlug(scope, 'page', slug)) throw new SlugAlreadyInUseError(slug);
      await contents.save(scope, page);
    });
    return toPageSummary(page);
  };
}
