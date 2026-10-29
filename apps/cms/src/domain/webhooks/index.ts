export {
  MAX_ATTEMPTS,
  createOutboxEvent,
  nextAttemptAfter,
  statusOf,
  type NewOutboxEvent,
  type OutboxEvent,
  type OutboxEventId,
  type OutboxEventStatus,
  type OutboxEventType,
  type OutboxPayload,
  type WebhookDelivery,
  type WebhookDeliveryId,
} from './entities';
export type { OutboxRepository, WebhookDeliveryRepository } from './repository';
