import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sites } from './sites';
import { tenants } from './tenants';

export const contentType = pgEnum('content_type', ['page', 'site-settings']);
export const contentStatus = pgEnum('content_status', ['draft', 'published']);

export const contents = pgTable(
  'contents',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'restrict' }),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'restrict' }),
    type: contentType('type').notNull(),
    slug: text('slug').notNull(),
    status: contentStatus('status').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    version: integer('version').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('contents_site_type_slug_key').on(t.siteId, t.type, t.slug).where(sql`${t.deletedAt} is null`),
    index('contents_site_status_idx').on(t.siteId, t.status),
  ],
);
