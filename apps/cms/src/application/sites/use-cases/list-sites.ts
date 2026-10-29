import { assertCanAccessTenant, type Actor } from '@/domain/identity';
import type { SiteRepository } from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';
import { toSiteSummary, type SiteSummary } from '../dto';

export type ListSitesDeps = Readonly<{ sites: SiteRepository }>;

export function makeListSites({ sites }: ListSitesDeps) {
  return async function listSites(actor: Actor, tenantId: string): Promise<SiteSummary[]> {
    const id = tenantId as TenantId;
    assertCanAccessTenant(actor, id);
    return (await sites.listByTenant(id)).map(toSiteSummary);
  };
}
