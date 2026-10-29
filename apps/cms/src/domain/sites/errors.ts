export class SiteNotFoundError extends Error {
  override readonly name = 'SiteNotFoundError';
  constructor() {
    super('Site not found');
  }
}
