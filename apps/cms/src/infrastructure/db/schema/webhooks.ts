import { index, integer, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { sites } from './sites';
import { tenants } from './tenants';

export const outboxEventType = pgEnum('outbox_event_type', [
  'content.published',
  'content.updated',
  'content.unpublished',
  'content.deleted',
  'site.settings.updated',
  'site.revalidated',
  'media.deleted',
  'ping',
]);

export type OutboxPayloadColumn = {
  contentType?: 'page' | 'site-settings';
  id?: string;
  slug?: string;
  tags: string[];
};

export const outboxEvents = pgTable(
  'outbox_events',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'restrict' }),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'restrict' }),
    type: outboxEventType('type').notNull(),
    payload: jsonb('payload').$type<OutboxPayloadColumn>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    lastError: text('last_error'),
    /** Set while a dispatcher holds the event; expired locks are claimable again. */
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
  },
  (t) => [
    index('outbox_events_processed_next_idx').on(t.processedAt, t.nextAttemptAt),
    index('outbox_events_site_idx').on(t.siteId),
  ],
);

export const webhookDeliveryStatus = pgEnum('webhook_delivery_status', ['success', 'failed']);

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'restrict' }),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'restrict' }),
    eventIds: text('event_ids').array().notNull(),
    eventTypes: text('event_types').array().notNull(),
    status: webhookDeliveryStatus('status').notNull(),
    httpStatus: integer('http_status'),
    durationMs: integer('duration_ms').notNull(),
    error: text('error'),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('webhook_deliveries_site_attempted_idx').on(t.siteId, t.attemptedAt)],
);
