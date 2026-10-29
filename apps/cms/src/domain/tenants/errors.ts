export class InvalidSlugError extends Error {
  override readonly name = 'InvalidSlugError';
  constructor(readonly value: string) {
    super(`Invalid slug: "${value}"`);
  }
}

export class TenantSlugAlreadyInUseError extends Error {
  override readonly name = 'TenantSlugAlreadyInUseError';
  constructor(readonly slug: string) {
    super(`Tenant slug already in use: "${slug}"`);
  }
}

export class TenantNotFoundError extends Error {
  override readonly name = 'TenantNotFoundError';
  constructor() {
    super('Tenant not found');
  }
}
