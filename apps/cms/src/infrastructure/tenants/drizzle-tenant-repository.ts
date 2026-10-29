import { asc, eq, inArray } from 'drizzle-orm';
import type { Slug, Tenant, TenantId, TenantRepository } from '@/domain/tenants';
import { tables, type Database } from '@/infrastructure/db';

type TenantRow = typeof tables.tenants.$inferSelect;

const toTenant = (row: TenantRow): Tenant => ({
  id: row.id as TenantId,
  name: row.name,
  slug: row.slug as Slug,
  createdAt: row.createdAt,
});

export function createDrizzleTenantRepository(db: Database): TenantRepository {
  const { tenants } = tables;
  return {
    async findById(id) {
      const [row] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
      return row ? toTenant(row) : null;
    },
    async findBySlug(slug) {
      const [row] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
      return row ? toTenant(row) : null;
    },
    async listByIds(ids) {
      if (ids.length === 0) return [];
      const rows = await db.select().from(tenants).where(inArray(tenants.id, [...ids])).orderBy(asc(tenants.name));
      return rows.map(toTenant);
    },
    async listAll() {
      return (await db.select().from(tenants).orderBy(asc(tenants.name))).map(toTenant);
    },
    async save(tenant) {
      await db
        .insert(tenants)
        .values(tenant)
        .onConflictDoUpdate({ target: tenants.id, set: { name: tenant.name, slug: tenant.slug } });
    },
  };
}
