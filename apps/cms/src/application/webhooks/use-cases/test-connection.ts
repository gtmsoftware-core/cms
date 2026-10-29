import type { Actor } from '@/domain/identity';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import type { WebhookDeliveryRepository } from '@/domain/webhooks';
import type { Clock } from '@/shared/clock';
import { buildWebhook, targetOf } from '../delivery';
import { WebhookNotConfiguredError } from '../errors';
import type { WebhookResult, WebhookSecrets, WebhookSender } from '../ports';
import { webhookSiteRefSchema, type WebhookSiteRef } from '../schemas/webhook-url.schema';
import { loadAsOperator } from './configure-webhook';

export type TestConnectionDeps = Readonly<{
  sites: SiteRepository;
  deliveries: WebhookDeliveryRepository;
  secrets: WebhookSecrets;
  sender: WebhookSender;
  clock: Clock;
}>;

/** "Testar conexão": sends a `ping` right away and logs it. Nothing changes on the site, so no outbox. */
export function makeTestConnection({ sites, deliveries, secrets, sender, clock }: TestConnectionDeps) {
  return async function testConnection(actor: Actor, input: WebhookSiteRef): Promise<WebhookResult> {
    const { site } = await loadAsOperator(sites, actor, webhookSiteRefSchema.parse(input));
    const target = targetOf(site, secrets);
    if (!target) throw new WebhookNotConfiguredError();

    const now = clock.now();
    const webhook = buildWebhook(site.id, [{ type: 'ping', payload: { tags: [] } }], now);
    const result = await sender.send(target, webhook);
    await deliveries.add(scopeOf(site), {
      id: webhook.deliveryId,
      tenantId: site.tenantId,
      siteId: site.id,
      eventIds: [],
      eventTypes: ['ping'],
      status: result.ok ? 'success' : 'failed',
      httpStatus: result.httpStatus,
      durationMs: result.durationMs,
      error: result.error,
      attemptedAt: now,
    });
    return result;
  };
}
