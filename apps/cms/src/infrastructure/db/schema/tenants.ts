import { index, pgEnum, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const membershipRole = pgEnum('membership_role', ['owner', 'editor']);

export const memberships = pgTable(
  'memberships',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    role: membershipRole('role').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.tenantId] }), index('memberships_tenant_id_idx').on(t.tenantId)],
);
