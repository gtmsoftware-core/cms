/** Missing, malformed or wrong API key, or a key of another site. Always answered with the same 401. */
export class InvalidApiKeyError extends Error {
  override readonly name = 'InvalidApiKeyError';
  constructor() {
    super('Invalid API key');
  }
}

export class DeliveryRateLimitedError extends Error {
  override readonly name = 'DeliveryRateLimitedError';
  constructor() {
    super('Too many requests');
  }
}

/** The resource does not exist or is not published. */
export class DeliveryNotFoundError extends Error {
  override readonly name = 'DeliveryNotFoundError';
  constructor() {
    super('Not found');
  }
}
