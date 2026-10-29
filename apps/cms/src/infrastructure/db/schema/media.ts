import { index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { sites } from './sites';
import { tenants } from './tenants';

export const mediaMime = pgEnum('media_mime', ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml']);

export const media = pgTable(
  'media',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'restrict' }),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'restrict' }),
    storageKey: text('storage_key').notNull().unique(),
    mime: mediaMime('mime').notNull(),
    size: integer('size').notNull(),
    alt: text('alt').notNull(),
    filename: text('filename').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('media_site_created_idx').on(t.siteId, t.createdAt)],
);
