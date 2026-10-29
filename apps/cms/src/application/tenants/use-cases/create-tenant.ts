import { assertSuperadmin, type Actor } from '@/domain/identity';
import { parseSlug, TenantSlugAlreadyInUseError, type TenantId, type TenantRepository } from '@/domain/tenants';
import type { Clock } from '@/shared/clock';
import { newId } from '@/shared/ids';
import { toTenantSummary, type TenantSummary } from '../dto';
import { createTenantSchema, type CreateTenantInput } from '../schemas/create-tenant.schema';

export type CreateTenantDeps = Readonly<{ tenants: TenantRepository; clock: Clock }>;

export function makeCreateTenant({ tenants, clock }: CreateTenantDeps) {
  return async function createTenant(actor: Actor, input: CreateTenantInput): Promise<TenantSummary> {
    const data = createTenantSchema.parse(input);
    assertSuperadmin(actor);

    const slug = parseSlug(data.slug);
    if (!slug.ok) throw slug.error;
    if (await tenants.findBySlug(slug.value)) throw new TenantSlugAlreadyInUseError(slug.value);

    const tenant = { id: newId('tnt') as TenantId, name: data.name, slug: slug.value, createdAt: clock.now() };
    await tenants.save(tenant);
    return toTenantSummary(tenant);
  };
}
