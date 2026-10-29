import type { SiteScope } from '@/domain/sites';
import type { Brand } from '@/shared/ids';

export type OutboxEventId = Brand<string, 'OutboxEventId'>;
export type WebhookDeliveryId = Brand<string, 'WebhookDeliveryId'>;

/** Mirrors the SDK webhook event types; the domain does not import the SDK. */
export type OutboxEventType =
  | 'content.published'
  | 'content.updated'
  | 'content.unpublished'
  | 'content.deleted'
  | 'site.settings.updated'
  | 'site.revalidated'
  | 'media.deleted'
  | 'ping';

export type OutboxPayload = Readonly<{
  contentType?: 'page' | 'site-settings';
  id?: string;
  slug?: string;
  /** Cache tags the site must revalidate, computed with the SDK's tagsFor when the event is recorded. */
  tags: readonly string[];
}>;

export type OutboxEvent = Readonly<{
  id: OutboxEventId;
  tenantId: SiteScope['tenantId'];
  siteId: SiteScope['siteId'];
  type: OutboxEventType;
  payload: OutboxPayload;
  createdAt: Date;
  processedAt: Date | null;
  attempts: number;
  /** Null when delivered or when every attempt failed. */
  nextAttemptAt: Date | null;
  lastError: string | null;
}>;

export type OutboxEventStatus = 'pending' | 'delivered' | 'failed';

export function statusOf(event: OutboxEvent): OutboxEventStatus {
  if (event.processedAt) return 'delivered';
  return event.nextAttemptAt ? 'pending' : 'failed';
}

export const MAX_ATTEMPTS = 8;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
/** Wait after the 1st, 2nd... failed attempt. The last value repeats until MAX_ATTEMPTS. */
const RETRY_DELAYS_MS = [30 * SECOND, 2 * MINUTE, 10 * MINUTE, HOUR, 6 * HOUR] as const;

/** When to try again after `attempts` failed attempts, or null when the event is given up as failed. */
export function nextAttemptAfter(attempts: number, now: Date): Date | null {
  if (attempts >= MAX_ATTEMPTS) return null;
  const delay = RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length) - 1] ?? RETRY_DELAYS_MS[0];
  return new Date(now.getTime() + delay);
}

export type NewOutboxEvent = Readonly<{
  id: OutboxEventId;
  scope: SiteScope;
  type: OutboxEventType;
  payload: OutboxPayload;
  now: Date;
}>;

export function createOutboxEvent({ id, scope, type, payload, now }: NewOutboxEvent): OutboxEvent {
  return {
    id,
    tenantId: scope.tenantId,
    siteId: scope.siteId,
    type,
    payload,
    createdAt: now,
    processedAt: null,
    attempts: 0,
    nextAttemptAt: now,
    lastError: null,
  };
}

export type WebhookDelivery = Readonly<{
  id: WebhookDeliveryId;
  tenantId: SiteScope['tenantId'];
  siteId: SiteScope['siteId'];
  eventIds: readonly OutboxEventId[];
  eventTypes: readonly OutboxEventType[];
  status: 'success' | 'failed';
  httpStatus: number | null;
  durationMs: number;
  error: string | null;
  attemptedAt: Date;
}>;
