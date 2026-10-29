import type { Slug, Tenant, TenantId } from './entities';

export interface TenantRepository {
  findById(id: TenantId): Promise<Tenant | null>;
  findBySlug(slug: Slug): Promise<Tenant | null>;
  listByIds(ids: readonly TenantId[]): Promise<Tenant[]>;
  /** Only for superadmins: tenants are the top-level scope, so there is nothing above them to filter by. */
  listAll(): Promise<Tenant[]>;
  save(tenant: Tenant): Promise<void>;
}
