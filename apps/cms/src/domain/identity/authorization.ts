import type { SiteScope } from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';
import type { Actor } from './entities';
import { ForbiddenError } from './errors';

export function canAccessTenant(actor: Actor, tenantId: TenantId): boolean {
  return actor.isSuperadmin || actor.memberships.some((m) => m.tenantId === tenantId);
}

export function assertCanAccessTenant(actor: Actor, tenantId: TenantId): void {
  if (!canAccessTenant(actor, tenantId)) throw new ForbiddenError();
}

export function assertSuperadmin(actor: Actor): void {
  if (!actor.isSuperadmin) throw new ForbiddenError();
}

/** Owners and editors of the tenant edit its sites' content. Superadmins edit everything. */
export function assertCanEdit(actor: Actor, scope: SiteScope): void {
  assertCanAccessTenant(actor, scope.tenantId);
}
