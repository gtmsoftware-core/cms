import type { TenantId } from '@/domain/tenants';
import type { Site, SiteId, SiteScope } from './entities';

export interface SiteRepository {
  findById(scope: SiteScope): Promise<Site | null>;
  listByTenant(tenantId: TenantId): Promise<Site[]>;
  save(scope: SiteScope, site: Site): Promise<void>;
  /**
   * Only for API key authentication, where the request knows the site id but not the tenant.
   * Callers must verify the key before using the returned site's scope.
   */
  findForApiKey(siteId: SiteId): Promise<Site | null>;
}
