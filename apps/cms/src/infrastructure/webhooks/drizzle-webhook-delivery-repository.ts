import { and, desc, eq } from 'drizzle-orm';
import type { SiteScope } from '@/domain/sites';
import type { OutboxEventId, OutboxEventType, WebhookDelivery, WebhookDeliveryId, WebhookDeliveryRepository } from '@/domain/webhooks';
import { tables, type Executor } from '@/infrastructure/db';

type DeliveryRow = typeof tables.webhookDeliveries.$inferSelect;

const EVENT_TYPES = new Set<string>(tables.outboxEventType.enumValues);
const isEventType = (value: string): value is OutboxEventType => EVENT_TYPES.has(value);

const toDelivery = (row: DeliveryRow): WebhookDelivery => ({
  id: row.id as WebhookDeliveryId,
  tenantId: row.tenantId as WebhookDelivery['tenantId'],
  siteId: row.siteId as WebhookDelivery['siteId'],
  eventIds: row.eventIds as OutboxEventId[],
  eventTypes: row.eventTypes.filter(isEventType),
  status: row.status,
  httpStatus: row.httpStatus,
  durationMs: row.durationMs,
  error: row.error,
  attemptedAt: row.attemptedAt,
});

export function createDrizzleWebhookDeliveryRepository(db: Executor): WebhookDeliveryRepository {
  const { webhookDeliveries: deliveries } = tables;
  const inScope = (scope: SiteScope) => and(eq(deliveries.tenantId, scope.tenantId), eq(deliveries.siteId, scope.siteId));

  return {
    async add(scope, delivery) {
      if (delivery.tenantId !== scope.tenantId || delivery.siteId !== scope.siteId) {
        throw new Error('Delivery does not belong to the given scope');
      }
      await db.insert(deliveries).values({ ...delivery, eventIds: [...delivery.eventIds], eventTypes: [...delivery.eventTypes] });
    },
    async listRecent(scope, limit) {
      const rows = await db
        .select()
        .from(deliveries)
        .where(inScope(scope))
        .orderBy(desc(deliveries.attemptedAt))
        .limit(limit);
      return rows.map(toDelivery);
    },
  };
}
