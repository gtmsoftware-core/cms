import { describe, expect, it } from 'vitest';
import type { Slug, TenantId } from '@/domain/tenants';
import { fixedClock, inMemoryIdentity, inMemoryTenants, superadmin } from '../../../../tests/fakes/in-memory-repositories';
import { PasswordRequiredError } from '../errors';
import { makeAddMember } from './add-member';

const tenant = { id: 'tnt_a' as TenantId, name: 'A', slug: 'a' as Slug, createdAt: fixedClock.now() };

function setup() {
  const identity = inMemoryIdentity();
  const addMember = makeAddMember({ tenants: inMemoryTenants([tenant]), ...identity });
  return { identity, addMember };
}

describe('addMember', () => {
  it('creates the account when the e-mail is new', async () => {
    const { identity, addMember } = setup();
    const input = { tenantId: tenant.id, email: 'Ana@Exemplo.com', name: 'Ana', role: 'owner' as const, password: 'senha-forte-123' };
    const member = await addMember(superadmin, input);

    expect(member).toMatchObject({ email: 'ana@exemplo.com', role: 'owner' });
    expect(await identity.memberships.listByTenant(tenant.id)).toHaveLength(1);
  });

  it('requires a password for a new account', async () => {
    const { addMember } = setup();
    const input = { tenantId: tenant.id, email: 'bia@exemplo.com', name: 'Bia', role: 'editor' as const, password: '' };
    await expect(addMember(superadmin, input)).rejects.toThrow(PasswordRequiredError);
  });

  it('reuses an existing account without a password', async () => {
    const { identity, addMember } = setup();
    await identity.accounts.register({ email: 'caio@exemplo.com', name: 'Caio', password: 'x', isSuperadmin: false });
    const input = { tenantId: tenant.id, email: 'caio@exemplo.com', name: 'Outro nome', role: 'editor' as const, password: '' };

    expect(await addMember(superadmin, input)).toMatchObject({ name: 'Caio', role: 'editor' });
  });
});
