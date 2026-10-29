import { assertCanEdit, type Actor } from '@/domain/identity';
import { SiteNotFoundError, type Site, type SiteId, type SiteRepository } from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';

/**
 * Checks that the actor edits this tenant and that the site really belongs to it.
 * Mixing a tenant id with another tenant's site id ends here as SiteNotFoundError.
 */
export async function authorizeSite(
  sites: SiteRepository,
  actor: Actor,
  ref: Readonly<{ tenantId: string; siteId: string }>,
): Promise<Site> {
  const scope = { tenantId: ref.tenantId as TenantId, siteId: ref.siteId as SiteId };
  assertCanEdit(actor, scope);
  const site = await sites.findById(scope);
  if (!site) throw new SiteNotFoundError();
  return site;
}
