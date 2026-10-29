import { pageEvent } from '@/application/webhooks';
import { authorizeSite } from '@/application/sites';
import { isLive } from '@/domain/content';
import type { Actor } from '@/domain/identity';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import type { Clock } from '@/shared/clock';
import { assertVersion, loadContent } from '../load-content';
import type { UnitOfWork } from '../ports';
import { versionedRefSchema, type VersionedContentRef } from '../schemas/content-ref.schema';

export type DeletePageDeps = Readonly<{ sites: SiteRepository; uow: UnitOfWork; clock: Clock }>;

/** Logical delete. A published page also records `content.deleted` in the same transaction. */
export function makeDeletePage({ sites, uow, clock }: DeletePageDeps) {
  return async function deletePage(actor: Actor, input: VersionedContentRef): Promise<void> {
    const { contentId, version, ...ref } = versionedRefSchema.parse(input);
    const scope = scopeOf(await authorizeSite(sites, actor, ref));
    const now = clock.now();

    await uow.transaction(async ({ contents, outbox }) => {
      const current = await loadContent(contents, scope, 'page', contentId);
      assertVersion(current, version);
      await contents.delete(scope, current.id, now);
      if (isLive(current)) await outbox.add(scope, pageEvent('content.deleted', current, now));
    });
  };
}
