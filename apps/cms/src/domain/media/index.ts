export {
  MAX_MEDIA_BYTES,
  detectImageType,
  storageKeyFor,
  type ImageType,
  type Media,
  type MediaId,
} from './entities';
export { MediaNotFoundError, MediaTooLargeError, UnsafeSvgError, UnsupportedMediaTypeError } from './errors';
export { isStaticSvg, withSvgNamespaces } from './svg';
export type { MediaRepository } from './repository';
