import type { Actor } from '@/domain/identity';
import type { TenantRepository } from '@/domain/tenants';
import { toTenantSummary, type TenantSummary } from '../dto';

export type ListTenantsDeps = Readonly<{ tenants: TenantRepository }>;

export function makeListTenants({ tenants }: ListTenantsDeps) {
  return async function listTenants(actor: Actor): Promise<TenantSummary[]> {
    const found = actor.isSuperadmin
      ? await tenants.listAll()
      : await tenants.listByIds(actor.memberships.map((m) => m.tenantId));
    return found.map(toTenantSummary);
  };
}
