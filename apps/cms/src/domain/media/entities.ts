import type { SiteScope } from '@/domain/sites';
import type { Brand } from '@/shared/ids';
import { looksLikeSvg } from './svg';

export type MediaId = Brand<string, 'MediaId'>;

export type ImageType = Readonly<{ mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'image/avif' | 'image/svg+xml'; extension: string }>;

export type Media = Readonly<{
  id: MediaId;
  tenantId: SiteScope['tenantId'];
  siteId: SiteScope['siteId'];
  /** `<tenantId>/<siteId>/<mediaId>.<ext>`: every object lives under its tenant and site. */
  storageKey: string;
  mime: ImageType['mime'];
  size: number;
  alt: string;
  filename: string;
  createdAt: Date;
}>;

/** Fits under the 4.5 MB request limit of serverless platforms, with room for the form overhead. */
export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;

export const storageKeyFor = (scope: SiteScope, id: MediaId, type: ImageType): string =>
  `${scope.tenantId}/${scope.siteId}/${id}.${type.extension}`;

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));

/**
 * Identifies the image by its first bytes (magic numbers), never by file name or declared type.
 * SVG is text, so it is recognized by its root element; the upload still requires it to be static
 * (see `isStaticSvg`), because SVG can carry scripts.
 */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', extension: 'jpg' };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', extension: 'png' };
  if (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a') return { mime: 'image/gif', extension: 'gif' };
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return { mime: 'image/webp', extension: 'webp' };
  if (ascii(bytes, 4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(bytes, 8, 12))) return { mime: 'image/avif', extension: 'avif' };
  if (looksLikeSvg(bytes)) return { mime: 'image/svg+xml', extension: 'svg' };
  return null;
}
