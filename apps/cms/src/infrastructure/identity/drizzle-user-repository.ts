import { eq } from 'drizzle-orm';
import type { User, UserId, UserRepository } from '@/domain/identity';
import { tables, type Database } from '@/infrastructure/db';

type UserRow = typeof tables.users.$inferSelect;

const toUser = (row: UserRow): User => ({
  id: row.id as UserId,
  email: row.email,
  name: row.name,
  isSuperadmin: row.isSuperadmin,
});

export function createDrizzleUserRepository(db: Database): UserRepository {
  const { users } = tables;
  return {
    async findById(id) {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return row ? toUser(row) : null;
    },
    async findByEmail(email) {
      const [row] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      return row ? toUser(row) : null;
    },
  };
}
