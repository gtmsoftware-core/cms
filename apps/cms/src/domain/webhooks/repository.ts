import type { SiteScope } from '@/domain/sites';
import type { OutboxEvent, OutboxEventId, WebhookDelivery } from './entities';

export interface OutboxRepository {
  add(scope: SiteScope, event: OutboxEvent): Promise<void>;
  /**
   * System-wide by design: the dispatcher serves every site. Each returned event carries its own scope,
   * and is locked for `lockMs` so concurrent dispatchers never send it twice.
   */
  claimDue(now: Date, lockMs: number, limit: number): Promise<OutboxEvent[]>;
  markDelivered(scope: SiteScope, ids: readonly OutboxEventId[], at: Date): Promise<void>;
  recordFailure(
    scope: SiteScope,
    id: OutboxEventId,
    failure: Readonly<{ attempts: number; nextAttemptAt: Date | null; lastError: string }>,
  ): Promise<void>;
  listFailed(scope: SiteScope): Promise<OutboxEvent[]>;
  /** Puts failed events back in the queue with a fresh attempt counter. */
  retryFailed(scope: SiteScope, now: Date): Promise<number>;
}

export interface WebhookDeliveryRepository {
  add(scope: SiteScope, delivery: WebhookDelivery): Promise<void>;
  listRecent(scope: SiteScope, limit: number): Promise<WebhookDelivery[]>;
}
