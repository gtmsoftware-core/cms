/** The site has no webhook URL or secret yet. */
export class WebhookNotConfiguredError extends Error {
  override readonly name = 'WebhookNotConfiguredError';
  constructor() {
    super('Webhook not configured');
  }
}
