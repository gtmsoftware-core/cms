import type { Brand } from '@/shared/ids';
import { err, ok, type Result } from '@/shared/result';
import { InvalidSlugError } from './errors';

export type TenantId = Brand<string, 'TenantId'>;
export type Slug = Brand<string, 'Slug'>;

export type Tenant = Readonly<{
  id: TenantId;
  name: string;
  slug: Slug;
  createdAt: Date;
}>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 63;

export function parseSlug(value: string): Result<Slug, InvalidSlugError> {
  if (value.length === 0 || value.length > SLUG_MAX_LENGTH || !SLUG_PATTERN.test(value)) {
    return err(new InvalidSlugError(value));
  }
  return ok(value as Slug);
}
