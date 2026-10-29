import { eq } from 'drizzle-orm';
import type { Membership, MembershipRepository, UserId } from '@/domain/identity';
import type { TenantId } from '@/domain/tenants';
import { tables, type Database } from '@/infrastructure/db';

type MembershipRow = typeof tables.memberships.$inferSelect;

const toMembership = (row: MembershipRow): Membership => ({
  userId: row.userId as UserId,
  tenantId: row.tenantId as TenantId,
  role: row.role,
});

export function createDrizzleMembershipRepository(db: Database): MembershipRepository {
  const { memberships } = tables;
  return {
    async listByUser(userId) {
      return (await db.select().from(memberships).where(eq(memberships.userId, userId))).map(toMembership);
    },
    async listByTenant(tenantId) {
      return (await db.select().from(memberships).where(eq(memberships.tenantId, tenantId))).map(toMembership);
    },
    async save(membership) {
      await db
        .insert(memberships)
        .values(membership)
        .onConflictDoUpdate({ target: [memberships.userId, memberships.tenantId], set: { role: membership.role } });
    },
  };
}
