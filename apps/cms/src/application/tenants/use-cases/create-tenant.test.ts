import { describe, expect, it } from 'vitest';
import { ForbiddenError } from '@/domain/identity';
import { TenantSlugAlreadyInUseError, type TenantId } from '@/domain/tenants';
import { editorOf, fixedClock, inMemoryTenants, superadmin } from '../../../../tests/fakes/in-memory-repositories';
import { makeCreateTenant } from './create-tenant';

describe('createTenant', () => {
  it('creates a tenant with a normalized slug', async () => {
    const createTenant = makeCreateTenant({ tenants: inMemoryTenants(), clock: fixedClock });
    const tenant = await createTenant(superadmin, { name: ' Clínica Sorriso ', slug: 'Clinica-Sorriso' });
    expect(tenant).toMatchObject({ name: 'Clínica Sorriso', slug: 'clinica-sorriso' });
    expect(tenant.id).toMatch(/^tnt_/);
  });

  it('rejects a slug already in use', async () => {
    const createTenant = makeCreateTenant({ tenants: inMemoryTenants(), clock: fixedClock });
    await createTenant(superadmin, { name: 'Um', slug: 'mesmo' });
    await expect(createTenant(superadmin, { name: 'Dois', slug: 'mesmo' })).rejects.toThrow(TenantSlugAlreadyInUseError);
  });

  it('is restricted to superadmins', async () => {
    const createTenant = makeCreateTenant({ tenants: inMemoryTenants(), clock: fixedClock });
    await expect(createTenant(editorOf('tnt_x' as TenantId), { name: 'Novo', slug: 'novo' })).rejects.toThrow(
      ForbiddenError,
    );
  });
});
