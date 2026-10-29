import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const siteStatus = pgEnum('site_status', ['active', 'archived']);

export const sites = pgTable(
  'sites',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    primaryDomain: text('primary_domain'),
    status: siteStatus('status').notNull().default('active'),
    apiKeyHash: text('api_key_hash'),
    apiKeyPrefix: text('api_key_prefix'),
    webhookUrl: text('webhook_url'),
    webhookSecretEnc: text('webhook_secret_enc'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('sites_tenant_id_idx').on(t.tenantId)],
);
