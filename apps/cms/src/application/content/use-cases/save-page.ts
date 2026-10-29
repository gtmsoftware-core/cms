import { pageEvent } from '@/application/webhooks';
import { authorizeSite } from '@/application/sites';
import { editContent, isLive, SlugAlreadyInUseError } from '@/domain/content';
import type { Actor } from '@/domain/identity';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import type { Clock } from '@/shared/clock';
import { toPageData, toPageDetail, type PageDetail } from '../dto';
import { assertVersion, loadContent } from '../load-content';
import type { UnitOfWork } from '../ports';
import { savePageSchema, type SavePageInput } from '../schemas/page.schema';

export type SavePageDeps = Readonly<{ sites: SiteRepository; uow: UnitOfWork; clock: Clock }>;

/** Saves a draft (no event) or updates the live page (`content.updated`, in the same transaction). */
export function makeSavePage({ sites, uow, clock }: SavePageDeps) {
  return async function savePage(actor: Actor, input: SavePageInput): Promise<PageDetail> {
    const { contentId, version, page, ...ref } = savePageSchema.parse(input);
    const scope = scopeOf(await authorizeSite(sites, actor, ref));
    const now = clock.now();

    const saved = await uow.transaction(async ({ contents, outbox }) => {
      const current = await loadContent(contents, scope, 'page', contentId);
      assertVersion(current, version);
      if (page.slug !== current.slug && (await contents.findBySlug(scope, 'page', page.slug))) {
        throw new SlugAlreadyInUseError(page.slug);
      }

      const next = editContent(current, { slug: page.slug, data: toPageData(page) }, now);
      await contents.save(scope, next);
      if (isLive(next)) await outbox.add(scope, pageEvent('content.updated', next, now, current.slug));
      return next;
    });
    return toPageDetail(saved);
  };
}
