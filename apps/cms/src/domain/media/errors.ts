export class MediaNotFoundError extends Error {
  override readonly name = 'MediaNotFoundError';
  constructor() {
    super('Media not found');
  }
}

/** Not one of the accepted image formats, judged by the file content. */
export class UnsupportedMediaTypeError extends Error {
  override readonly name = 'UnsupportedMediaTypeError';
  constructor() {
    super('Unsupported media type');
  }
}

/** An SVG with scripts, event handlers or external references. */
export class UnsafeSvgError extends Error {
  override readonly name = 'UnsafeSvgError';
  constructor() {
    super('SVG with active content');
  }
}

export class MediaTooLargeError extends Error {
  override readonly name = 'MediaTooLargeError';
  constructor(readonly size: number) {
    super(`Media too large: ${size} bytes`);
  }
}
