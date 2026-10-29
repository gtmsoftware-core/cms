import { webhookPayloadSchema, type WebhookEvent } from '@gtmsoftware-core/cms-sdk';
import type { Site } from '@/domain/sites';
import type { OutboxEvent, WebhookDeliveryId } from '@/domain/webhooks';
import { newId } from '@/shared/ids';
import type { OutgoingWebhook, WebhookSecrets, WebhookTarget } from './ports';

/** Next.js accepts at most 128 tags per fetch; past that, revalidating the whole site is equivalent. */
const MAX_TAGS = 128;

export function targetOf(site: Site, secrets: WebhookSecrets): WebhookTarget | null {
  if (!site.webhookUrl || !site.webhookSecretEnc) return null;
  return { url: site.webhookUrl, secret: secrets.decrypt(site.webhookSecretEnc) };
}

export const toWebhookEvent = ({ type, payload }: Pick<OutboxEvent, 'type' | 'payload'>): WebhookEvent => ({
  type,
  ...(payload.contentType && { contentType: payload.contentType }),
  ...(payload.id && { id: payload.id }),
  ...(payload.slug && { slug: payload.slug }),
});

/** One request for many events: the union of their tags, validated against the SDK contract. */
export function buildWebhook(
  siteId: string,
  events: readonly Pick<OutboxEvent, 'type' | 'payload'>[],
  now: Date,
): OutgoingWebhook & { deliveryId: WebhookDeliveryId } {
  const deliveryId = newId('dlv') as WebhookDeliveryId;
  const union = [...new Set(events.flatMap((event) => event.payload.tags))];
  const payload = webhookPayloadSchema.parse({
    deliveryId,
    siteId,
    occurredAt: now.toISOString(),
    events: events.map(toWebhookEvent),
    tags: union.length > MAX_TAGS ? ['cms:site'] : union,
  });
  const types = new Set(events.map((event) => event.type));
  const eventType = types.size === 1 ? [...types][0] ?? 'batch' : 'batch';
  return { id: deliveryId, deliveryId, eventType, rawBody: JSON.stringify(payload) };
}
