import type { Media } from '@/domain/media';
import type { MediaStorage } from './ports';

export type MediaSummary = Readonly<{
  id: string;
  url: string;
  alt: string;
  mime: string;
  size: number;
  filename: string;
  createdAt: Date;
}>;

export const toMediaSummary = (media: Media, storage: MediaStorage): MediaSummary => ({
  id: media.id,
  url: storage.publicUrl(media.storageKey),
  alt: media.alt,
  mime: media.mime,
  size: media.size,
  filename: media.filename,
  createdAt: media.createdAt,
});
