import { pageEvent } from '@/application/webhooks';
import { authorizeSite } from '@/application/sites';
import { publishContent, unpublishContent } from '@/domain/content';
import type { Actor } from '@/domain/identity';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import type { Clock } from '@/shared/clock';
import { toPageDetail, type PageDetail } from '../dto';
import { assertVersion, loadContent } from '../load-content';
import type { UnitOfWork } from '../ports';
import { versionedRefSchema, type VersionedContentRef } from '../schemas/content-ref.schema';

export type ChangePageStatusDeps = Readonly<{ sites: SiteRepository; uow: UnitOfWork; clock: Clock }>;

const transitions = {
  publish: { apply: publishContent, event: 'content.published' },
  unpublish: { apply: unpublishContent, event: 'content.unpublished' },
} as const;

/** Publishes or unpublishes a page and records the event in the same transaction. */
export function makeChangePageStatus({ sites, uow, clock }: ChangePageStatusDeps) {
  return async function changePageStatus(
    actor: Actor,
    transition: keyof typeof transitions,
    input: VersionedContentRef,
  ): Promise<PageDetail> {
    const { contentId, version, ...ref } = versionedRefSchema.parse(input);
    const scope = scopeOf(await authorizeSite(sites, actor, ref));
    const { apply, event } = transitions[transition];
    const now = clock.now();

    const changed = await uow.transaction(async ({ contents, outbox }) => {
      const current = await loadContent(contents, scope, 'page', contentId);
      assertVersion(current, version);
      const next = apply(current, now);
      await contents.save(scope, next);
      await outbox.add(scope, pageEvent(event, next, now));
      return next;
    });
    return toPageDetail(changed);
  };
}
