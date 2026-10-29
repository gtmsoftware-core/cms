import { and, asc, eq } from 'drizzle-orm';
import type { Site, SiteId, SiteRepository, SiteScope } from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';
import { tables, type Database } from '@/infrastructure/db';

type SiteRow = typeof tables.sites.$inferSelect;

const toSite = (row: SiteRow): Site => ({
  id: row.id as SiteId,
  tenantId: row.tenantId as TenantId,
  name: row.name,
  primaryDomain: row.primaryDomain,
  status: row.status,
  apiKey: row.apiKeyHash && row.apiKeyPrefix ? { hash: row.apiKeyHash, prefix: row.apiKeyPrefix } : null,
  webhookUrl: row.webhookUrl,
  webhookSecretEnc: row.webhookSecretEnc,
  createdAt: row.createdAt,
});

export function createDrizzleSiteRepository(db: Database): SiteRepository {
  const { sites } = tables;
  const inScope = (scope: SiteScope) => and(eq(sites.tenantId, scope.tenantId), eq(sites.id, scope.siteId));

  return {
    async findById(scope) {
      const [row] = await db.select().from(sites).where(inScope(scope)).limit(1);
      return row ? toSite(row) : null;
    },
    async listByTenant(tenantId) {
      const rows = await db.select().from(sites).where(eq(sites.tenantId, tenantId)).orderBy(asc(sites.name));
      return rows.map(toSite);
    },
    async findForApiKey(siteId) {
      const [row] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
      return row ? toSite(row) : null;
    },
    async save(scope, site) {
      if (site.tenantId !== scope.tenantId || site.id !== scope.siteId) {
        throw new Error('Site does not belong to the given scope');
      }
      const changes = {
        name: site.name,
        primaryDomain: site.primaryDomain,
        status: site.status,
        apiKeyHash: site.apiKey?.hash ?? null,
        apiKeyPrefix: site.apiKey?.prefix ?? null,
        webhookUrl: site.webhookUrl,
        webhookSecretEnc: site.webhookSecretEnc,
      };
      await db
        .insert(sites)
        .values({ id: site.id, tenantId: site.tenantId, createdAt: site.createdAt, ...changes })
        .onConflictDoUpdate({ target: sites.id, set: changes, setWhere: inScope(scope) });
    },
  };
}
