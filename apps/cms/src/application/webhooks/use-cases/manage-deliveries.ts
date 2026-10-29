import { authorizeSite } from '@/application/sites';
import type { Actor } from '@/domain/identity';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import type { OutboxEventType, OutboxRepository, WebhookDeliveryRepository } from '@/domain/webhooks';
import type { Clock } from '@/shared/clock';
import { siteRevalidatedEvent } from '../events';
import { webhookSiteRefSchema, type WebhookSiteRef } from '../schemas/webhook-url.schema';

export type ManageDeliveriesDeps = Readonly<{
  sites: SiteRepository;
  outbox: OutboxRepository;
  deliveries: WebhookDeliveryRepository;
  clock: Clock;
}>;

export type DeliverySummary = Readonly<{
  id: string;
  eventTypes: readonly OutboxEventType[];
  status: 'success' | 'failed';
  httpStatus: number | null;
  durationMs: number;
  error: string | null;
  attemptedAt: Date;
}>;

export type WebhookOverview = Readonly<{
  webhookUrl: string | null;
  hasSecret: boolean;
  failedEvents: number;
  deliveries: readonly DeliverySummary[];
}>;

const RECENT_DELIVERIES = 50;

export function makeGetWebhookOverview({ sites, outbox, deliveries }: Omit<ManageDeliveriesDeps, 'clock'>) {
  return async function getWebhookOverview(actor: Actor, input: WebhookSiteRef): Promise<WebhookOverview> {
    const site = await authorizeSite(sites, actor, webhookSiteRefSchema.parse(input));
    const scope = scopeOf(site);
    const [failed, recent] = await Promise.all([outbox.listFailed(scope), deliveries.listRecent(scope, RECENT_DELIVERIES)]);
    return {
      webhookUrl: site.webhookUrl,
      hasSecret: site.webhookSecretEnc !== null,
      failedEvents: failed.length,
      deliveries: recent.map(({ id, eventTypes, status, httpStatus, durationMs, error, attemptedAt }) => ({
        id,
        eventTypes,
        status,
        httpStatus,
        durationMs,
        error,
        attemptedAt,
      })),
    };
  };
}

/** "Reenviar": failed events go back to the queue with fresh attempts. Returns how many. */
export function makeRetryFailed({ sites, outbox, clock }: Omit<ManageDeliveriesDeps, 'deliveries'>) {
  return async function retryFailed(actor: Actor, input: WebhookSiteRef): Promise<number> {
    const site = await authorizeSite(sites, actor, webhookSiteRefSchema.parse(input));
    return outbox.retryFailed(scopeOf(site), clock.now());
  };
}

/** "Revalidar site inteiro": queues an event carrying only the site-wide tag. */
export function makeRevalidateSite({ sites, outbox, clock }: Omit<ManageDeliveriesDeps, 'deliveries'>) {
  return async function revalidateSite(actor: Actor, input: WebhookSiteRef): Promise<void> {
    const site = await authorizeSite(sites, actor, webhookSiteRefSchema.parse(input));
    await outbox.add(scopeOf(site), siteRevalidatedEvent(scopeOf(site), clock.now()));
  };
}
