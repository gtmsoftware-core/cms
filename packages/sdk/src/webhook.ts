import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { CONTENT_TYPES } from './content-types';

/** Events that change what the public sees, plus the connection test. */
export const WEBHOOK_EVENT_TYPES = [
  'content.published',
  'content.updated',
  'content.unpublished',
  'content.deleted',
  'site.settings.updated',
  'site.revalidated',
  'media.deleted',
  'ping',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export const WEBHOOK_HEADERS = {
  event: 'x-cms-event',
  deliveryId: 'x-cms-delivery-id',
  timestamp: 'x-cms-timestamp',
  signature: 'x-cms-signature',
} as const;

/** Requests older or newer than this are rejected (replay protection). */
export const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

export const webhookEventSchema = z.object({
  type: z.enum(WEBHOOK_EVENT_TYPES),
  contentType: z.enum(CONTENT_TYPES).optional(),
  id: z.string().optional(),
  slug: z.string().optional(),
});

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

export const webhookPayloadSchema = z.object({
  deliveryId: z.string().min(1),
  siteId: z.string().min(1),
  occurredAt: z.iso.datetime(),
  events: z.array(webhookEventSchema).min(1),
  tags: z.array(z.string().min(1).max(256)).max(128),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

/** `v1=<hex(HMAC_SHA256(secret, "<timestamp>.<rawBody>"))>`, always over the raw body. */
export function signWebhook(secret: string, timestamp: number, rawBody: string): string {
  const digest = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return `v1=${digest}`;
}

export type VerifyWebhookInput = Readonly<{
  secret: string;
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  /** Seconds since epoch; defaults to the current time. */
  now?: number;
}>;

export type VerifyWebhookResult = Readonly<{ ok: true } | { ok: false; reason: 'missing' | 'expired' | 'mismatch' }>;

export function verifyWebhookSignature({ secret, rawBody, timestamp, signature, now }: VerifyWebhookInput): VerifyWebhookResult {
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return { ok: false, reason: 'missing' };

  const current = now ?? Math.floor(Date.now() / 1000);
  if (Math.abs(current - Number(timestamp)) > WEBHOOK_TOLERANCE_SECONDS) return { ok: false, reason: 'expired' };

  const expected = Buffer.from(signWebhook(secret, Number(timestamp), rawBody));
  const actual = Buffer.from(signature);
  const matches = expected.length === actual.length && timingSafeEqual(expected, actual);
  return matches ? { ok: true } : { ok: false, reason: 'mismatch' };
}
