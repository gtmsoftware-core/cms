export type WebhookTarget = Readonly<{ url: string; secret: string }>;

export type OutgoingWebhook = Readonly<{
  id: string;
  /** Value of the X-CMS-Event header. */
  eventType: string;
  /** Exact bytes that are signed and sent. */
  rawBody: string;
}>;

export type WebhookResult = Readonly<{
  ok: boolean;
  httpStatus: number | null;
  durationMs: number;
  /** Short summary for the delivery log; never contains secrets or bodies. */
  error: string | null;
}>;

export interface WebhookSender {
  send(target: WebhookTarget, delivery: OutgoingWebhook): Promise<WebhookResult>;
}

/** Generates webhook secrets and keeps them encrypted at rest. */
export interface WebhookSecrets {
  generate(): string;
  encrypt(secret: string): string;
  decrypt(encrypted: string): string;
}
