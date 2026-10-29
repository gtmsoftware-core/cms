import { authorizeSite } from '@/application/sites';
import type { Actor } from '@/domain/identity';
import {
  MAX_MEDIA_BYTES,
  MediaTooLargeError,
  UnsafeSvgError,
  UnsupportedMediaTypeError,
  detectImageType,
  isStaticSvg,
  withSvgNamespaces,
  storageKeyFor,
  type Media,
  type MediaId,
  type MediaRepository,
} from '@/domain/media';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import type { Clock } from '@/shared/clock';
import { newId } from '@/shared/ids';
import { toMediaSummary, type MediaSummary } from '../dto';
import type { MediaStorage } from '../ports';
import { uploadMediaSchema, type UploadMediaInput } from '../schemas/media.schema';

export type UploadMediaDeps = Readonly<{ sites: SiteRepository; media: MediaRepository; storage: MediaStorage; clock: Clock }>;

/** Stores the file first and the record second; if the record fails, the file is removed again. */
export function makeUploadMedia({ sites, media, storage, clock }: UploadMediaDeps) {
  return async function uploadMedia(actor: Actor, input: UploadMediaInput): Promise<MediaSummary> {
    const { alt, filename, ...ref } = uploadMediaSchema.parse(input);
    const scope = scopeOf(await authorizeSite(sites, actor, ref));

    if (input.bytes.byteLength > MAX_MEDIA_BYTES) throw new MediaTooLargeError(input.bytes.byteLength);
    const type = detectImageType(input.bytes);
    if (!type) throw new UnsupportedMediaTypeError();
    if (type.mime === 'image/svg+xml' && !isStaticSvg(input.bytes)) throw new UnsafeSvgError();
    const bytes = type.mime === 'image/svg+xml' ? withSvgNamespaces(input.bytes) : input.bytes;

    const id = newId('med') as MediaId;
    const item: Media = {
      id,
      ...scope,
      storageKey: storageKeyFor(scope, id, type),
      mime: type.mime,
      size: bytes.byteLength,
      alt,
      filename,
      createdAt: clock.now(),
    };

    await storage.put(item.storageKey, bytes, item.mime);
    try {
      await media.save(scope, item);
    } catch (error) {
      await storage.delete(item.storageKey);
      throw error;
    }
    return toMediaSummary(item, storage);
  };
}
