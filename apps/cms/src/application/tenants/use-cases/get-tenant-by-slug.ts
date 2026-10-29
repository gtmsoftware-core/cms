import { canAccessTenant, type Actor } from '@/domain/identity';
import { parseSlug, TenantNotFoundError, type TenantRepository } from '@/domain/tenants';
import { toTenantSummary, type TenantSummary } from '../dto';

export type GetTenantBySlugDeps = Readonly<{ tenants: TenantRepository }>;

export function makeGetTenantBySlug({ tenants }: GetTenantBySlugDeps) {
  /** Tenants the actor cannot access are reported as not found, so their existence does not leak. */
  return async function getTenantBySlug(actor: Actor, rawSlug: string): Promise<TenantSummary> {
    const slug = parseSlug(rawSlug);
    if (!slug.ok) throw new TenantNotFoundError();

    const tenant = await tenants.findBySlug(slug.value);
    if (!tenant || !canAccessTenant(actor, tenant.id)) throw new TenantNotFoundError();
    return toTenantSummary(tenant);
  };
}
