import { assertCanAccessTenant, type Actor, type MembershipRepository, type UserRepository } from '@/domain/identity';
import type { TenantId } from '@/domain/tenants';
import type { MemberSummary } from '../dto';

export type ListMembersDeps = Readonly<{ users: UserRepository; memberships: MembershipRepository }>;

export function makeListMembers({ users, memberships }: ListMembersDeps) {
  return async function listMembers(actor: Actor, tenantId: string): Promise<MemberSummary[]> {
    const id = tenantId as TenantId;
    assertCanAccessTenant(actor, id);

    const members = await memberships.listByTenant(id);
    const rows = await Promise.all(
      members.map(async (m) => {
        const user = await users.findById(m.userId);
        return user && { userId: user.id, email: user.email, name: user.name, role: m.role };
      }),
    );
    return rows.filter((row) => row !== null);
  };
}
