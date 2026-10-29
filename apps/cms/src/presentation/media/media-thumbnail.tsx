import Image from 'next/image';
import type { MediaSummary } from '@/application/media';

/** Admin preview. Served as is: the library may live on localhost or on any R2 domain. */
export function MediaThumbnail({ media }: { media: MediaSummary }) {
  return (
    <div className="bg-muted relative aspect-square overflow-hidden rounded-md">
      <Image src={media.url} alt={media.alt || media.filename} fill unoptimized sizes="160px" className="object-cover" />
    </div>
  );
}
