import { assertSuperadmin, type Actor } from '@/domain/identity';
import { scopeOf, type Site, type SiteId, type SiteRepository } from '@/domain/sites';
import { TenantNotFoundError, type TenantId, type TenantRepository } from '@/domain/tenants';
import type { Clock } from '@/shared/clock';
import { newId } from '@/shared/ids';
import { toSiteSummary, type SiteSummary } from '../dto';
import { createSiteSchema, type CreateSiteInput } from '../schemas/create-site.schema';

export type CreateSiteDeps = Readonly<{ sites: SiteRepository; tenants: TenantRepository; clock: Clock }>;

export function makeCreateSite({ sites, tenants, clock }: CreateSiteDeps) {
  return async function createSite(actor: Actor, input: CreateSiteInput): Promise<SiteSummary> {
    const data = createSiteSchema.parse(input);
    assertSuperadmin(actor);

    const tenant = await tenants.findById(data.tenantId as TenantId);
    if (!tenant) throw new TenantNotFoundError();

    const site: Site = {
      id: newId('site') as SiteId,
      tenantId: tenant.id,
      name: data.name,
      primaryDomain: data.primaryDomain || null,
      status: 'active',
      apiKey: null,
      webhookUrl: null,
      webhookSecretEnc: null,
      createdAt: clock.now(),
    };
    await sites.save(scopeOf(site), site);
    return toSiteSummary(site);
  };
}
