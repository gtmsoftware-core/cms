import { and, asc, eq, inArray, isNotNull, isNull, lte, or, lt } from 'drizzle-orm';
import type { SiteScope } from '@/domain/sites';
import type { OutboxEvent, OutboxEventId, OutboxRepository } from '@/domain/webhooks';
import { tables, type Executor } from '@/infrastructure/db';

type OutboxRow = typeof tables.outboxEvents.$inferSelect;

const toEvent = (row: OutboxRow): OutboxEvent => ({
  id: row.id as OutboxEventId,
  tenantId: row.tenantId as OutboxEvent['tenantId'],
  siteId: row.siteId as OutboxEvent['siteId'],
  type: row.type,
  payload: row.payload,
  createdAt: row.createdAt,
  processedAt: row.processedAt,
  attempts: row.attempts,
  nextAttemptAt: row.nextAttemptAt,
  lastError: row.lastError,
});

export function createDrizzleOutboxRepository(db: Executor): OutboxRepository {
  const { outboxEvents: outbox } = tables;
  const inScope = (scope: SiteScope) => and(eq(outbox.tenantId, scope.tenantId), eq(outbox.siteId, scope.siteId));
  const failed = and(isNull(outbox.processedAt), isNull(outbox.nextAttemptAt));

  return {
    async add(scope, event) {
      if (event.tenantId !== scope.tenantId || event.siteId !== scope.siteId) {
        throw new Error('Event does not belong to the given scope');
      }
      await db.insert(outbox).values({ ...event, payload: { ...event.payload, tags: [...event.payload.tags] } });
    },
    async claimDue(now, lockMs, limit) {
      const due = db
        .select({ id: outbox.id })
        .from(outbox)
        .where(
          and(
            isNull(outbox.processedAt),
            isNotNull(outbox.nextAttemptAt),
            lte(outbox.nextAttemptAt, now),
            or(isNull(outbox.lockedUntil), lt(outbox.lockedUntil, now)),
          ),
        )
        .orderBy(asc(outbox.createdAt))
        .limit(limit)
        .for('update', { skipLocked: true });
      const rows = await db
        .update(outbox)
        .set({ lockedUntil: new Date(now.getTime() + lockMs) })
        .where(inArray(outbox.id, due))
        .returning();
      return rows.map(toEvent).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },
    async markDelivered(scope, ids, at) {
      if (ids.length === 0) return;
      await db
        .update(outbox)
        .set({ processedAt: at, nextAttemptAt: null, lockedUntil: null, lastError: null })
        .where(and(inScope(scope), inArray(outbox.id, [...ids])));
    },
    async recordFailure(scope, id, { attempts, nextAttemptAt, lastError }) {
      await db
        .update(outbox)
        .set({ attempts, nextAttemptAt, lastError, lockedUntil: null })
        .where(and(inScope(scope), eq(outbox.id, id)));
    },
    async listFailed(scope) {
      const rows = await db.select().from(outbox).where(and(inScope(scope), failed)).orderBy(asc(outbox.createdAt));
      return rows.map(toEvent);
    },
    async retryFailed(scope, now) {
      const rows = await db
        .update(outbox)
        .set({ attempts: 0, nextAttemptAt: now, lastError: null, lockedUntil: null })
        .where(and(inScope(scope), failed))
        .returning({ id: outbox.id });
      return rows.length;
    },
  };
}
