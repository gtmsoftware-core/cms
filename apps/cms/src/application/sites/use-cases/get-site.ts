import { canAccessTenant, type Actor } from '@/domain/identity';
import { SiteNotFoundError, type SiteId, type SiteRepository } from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';
import { toSiteSummary, type SiteSummary } from '../dto';

export type GetSiteDeps = Readonly<{ sites: SiteRepository }>;

export function makeGetSite({ sites }: GetSiteDeps) {
  return async function getSite(actor: Actor, tenantId: string, siteId: string): Promise<SiteSummary> {
    const scope = { tenantId: tenantId as TenantId, siteId: siteId as SiteId };
    if (!canAccessTenant(actor, scope.tenantId)) throw new SiteNotFoundError();

    const site = await sites.findById(scope);
    if (!site) throw new SiteNotFoundError();
    return toSiteSummary(site);
  };
}
