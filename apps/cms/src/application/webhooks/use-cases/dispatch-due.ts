import { scopeOf, type SiteRepository } from '@/domain/sites';
import {
  nextAttemptAfter,
  type OutboxEvent,
  type OutboxRepository,
  type WebhookDeliveryRepository,
} from '@/domain/webhooks';
import type { Clock } from '@/shared/clock';
import { buildWebhook, targetOf } from '../delivery';
import type { WebhookSecrets, WebhookSender } from '../ports';

export type DispatchDueDeps = Readonly<{
  outbox: OutboxRepository;
  deliveries: WebhookDeliveryRepository;
  sites: SiteRepository;
  secrets: WebhookSecrets;
  sender: WebhookSender;
  clock: Clock;
}>;

export type DispatchSummary = Readonly<{ delivered: number; failed: number; skipped: number }>;

const BATCH = 100;
const LOCK_MS = 60_000;

function groupBySite(events: readonly OutboxEvent[]): OutboxEvent[][] {
  const groups = new Map<string, OutboxEvent[]>();
  for (const event of events) groups.set(event.siteId, [...(groups.get(event.siteId) ?? []), event]);
  return [...groups.values()];
}

/**
 * Sends every due event: one webhook per site with the union of the tags. Failures follow the
 * backoff from the domain; events of sites without a webhook are marked as processed.
 * Called after each change (via `after()`) and by the cron sweep.
 */
export function makeDispatchDue({ outbox, deliveries, sites, secrets, sender, clock }: DispatchDueDeps) {
  async function dispatchSite(events: OutboxEvent[]): Promise<keyof DispatchSummary> {
    const first = events[0];
    if (!first) return 'skipped';
    const scope = { tenantId: first.tenantId, siteId: first.siteId };
    const ids = events.map((event) => event.id);
    const now = clock.now();

    const site = await sites.findById(scope);
    const target = site && targetOf(site, secrets);
    if (!site || !target) {
      await outbox.markDelivered(scope, ids, now);
      return 'skipped';
    }

    const webhook = buildWebhook(site.id, events, now);
    const result = await sender.send(target, webhook);
    await deliveries.add(scopeOf(site), {
      id: webhook.deliveryId,
      ...scope,
      eventIds: ids,
      eventTypes: events.map((event) => event.type),
      status: result.ok ? 'success' : 'failed',
      httpStatus: result.httpStatus,
      durationMs: result.durationMs,
      error: result.error,
      attemptedAt: now,
    });

    if (result.ok) {
      await outbox.markDelivered(scope, ids, clock.now());
      return 'delivered';
    }
    for (const event of events) {
      const attempts = event.attempts + 1;
      await outbox.recordFailure(scope, event.id, {
        attempts,
        nextAttemptAt: nextAttemptAfter(attempts, clock.now()),
        lastError: result.error ?? 'Falha',
      });
    }
    return 'failed';
  }

  return async function dispatchDue(): Promise<DispatchSummary> {
    const summary = { delivered: 0, failed: 0, skipped: 0 };
    for (;;) {
      const events = await outbox.claimDue(clock.now(), LOCK_MS, BATCH);
      for (const group of groupBySite(events)) summary[await dispatchSite(group)] += group.length;
      if (events.length < BATCH) return summary;
    }
  };
}
