import { mediaDeletedEvent } from '@/application/webhooks';
import type { UnitOfWork } from '@/application/content';
import { authorizeSite } from '@/application/sites';
import type { Actor } from '@/domain/identity';
import { MediaNotFoundError, type MediaId, type MediaRepository } from '@/domain/media';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import type { Clock } from '@/shared/clock';
import { toMediaSummary, type MediaSummary } from '../dto';
import type { MediaStorage } from '../ports';
import { mediaRefSchema, mediaSiteRefSchema, type MediaRef, type MediaSiteRef } from '../schemas/media.schema';

export type ManageMediaDeps = Readonly<{
  sites: SiteRepository;
  media: MediaRepository;
  storage: MediaStorage;
  uow: UnitOfWork;
  clock: Clock;
}>;

export function makeListMedia({ sites, media, storage }: Pick<ManageMediaDeps, 'sites' | 'media' | 'storage'>) {
  return async function listMedia(actor: Actor, input: MediaSiteRef): Promise<MediaSummary[]> {
    const site = await authorizeSite(sites, actor, mediaSiteRefSchema.parse(input));
    return (await media.list(scopeOf(site))).map((item) => toMediaSummary(item, storage));
  };
}

/**
 * Deletes the record and records `media.deleted` in one transaction, then removes the file.
 * A failure removing the file leaves an orphan object, never a record pointing to nothing.
 */
export function makeDeleteMedia({ sites, storage, uow, clock }: Omit<ManageMediaDeps, 'media'>) {
  return async function deleteMedia(actor: Actor, input: MediaRef): Promise<void> {
    const { mediaId, ...ref } = mediaRefSchema.parse(input);
    const scope = scopeOf(await authorizeSite(sites, actor, ref));
    const now = clock.now();

    const deleted = await uow.transaction(async ({ media, outbox }) => {
      const item = await media.findById(scope, mediaId as MediaId);
      if (!item) throw new MediaNotFoundError();
      await media.delete(scope, item.id);
      await outbox.add(scope, mediaDeletedEvent(item, now));
      return item;
    });
    await storage.delete(deleted.storageKey);
  };
}
