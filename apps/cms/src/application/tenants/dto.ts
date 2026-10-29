import type { Tenant } from '@/domain/tenants';

export type TenantSummary = Readonly<{ id: string; name: string; slug: string }>;

export const toTenantSummary = (tenant: Tenant): TenantSummary => ({
  id: tenant.id,
  name: tenant.name,
  slug: tenant.slug,
});
