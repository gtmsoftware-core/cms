import { signWebhook, WEBHOOK_HEADERS } from '@gtmsoftware-core/cms-sdk';
import type { WebhookSender } from '@/application/webhooks';
import type { Clock } from '@/shared/clock';

const TIMEOUT_MS = 10_000;

/** Posts a signed webhook. Any 2xx is success; errors are summarized without request or response bodies. */
export function createFetchWebhookSender(clock: Clock): WebhookSender {
  return {
    async send(target, delivery) {
      const timestamp = Math.floor(clock.now().getTime() / 1000);
      const started = performance.now();
      try {
        const response = await fetch(target.url, {
          method: 'POST',
          body: delivery.rawBody,
          redirect: 'manual',
          signal: AbortSignal.timeout(TIMEOUT_MS),
          headers: {
            'content-type': 'application/json',
            'user-agent': 'gtmsoftware-cms-webhook',
            [WEBHOOK_HEADERS.event]: delivery.eventType,
            [WEBHOOK_HEADERS.deliveryId]: delivery.id,
            [WEBHOOK_HEADERS.timestamp]: String(timestamp),
            [WEBHOOK_HEADERS.signature]: signWebhook(target.secret, timestamp, delivery.rawBody),
          },
        });
        const durationMs = Math.round(performance.now() - started);
        return response.ok
          ? { ok: true, httpStatus: response.status, durationMs, error: null }
          : { ok: false, httpStatus: response.status, durationMs, error: `HTTP ${response.status}` };
      } catch (error) {
        const reason = error instanceof Error && error.name === 'TimeoutError' ? 'Tempo esgotado' : 'Falha de conexão';
        return { ok: false, httpStatus: null, durationMs: Math.round(performance.now() - started), error: reason };
      }
    },
  };
}
