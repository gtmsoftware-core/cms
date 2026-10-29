export class ContentNotFoundError extends Error {
  override readonly name = 'ContentNotFoundError';
  constructor() {
    super('Content not found');
  }
}

export class SlugAlreadyInUseError extends Error {
  override readonly name = 'SlugAlreadyInUseError';
  constructor(readonly slug: string) {
    super(`Slug already in use: ${slug}`);
  }
}

/** Someone else saved the content after it was loaded. */
export class ContentConflictError extends Error {
  override readonly name = 'ContentConflictError';
  constructor() {
    super('Content was changed by someone else');
  }
}
