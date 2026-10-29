import { scopeOf, type SiteId, type SiteRepository, type SiteScope } from '@/domain/sites';
import type { RateLimiter } from '@/application/identity';
import type { ApiKeys } from '@/application/sites';
import { DeliveryRateLimitedError, InvalidApiKeyError } from './errors';
import { deliveryCredentialsSchema, type DeliveryCredentialsInput } from './schemas/credentials.schema';

export type AuthenticateDeps = Readonly<{ sites: SiteRepository; apiKeys: ApiKeys; rateLimiter: RateLimiter }>;

/**
 * Resolves the scope a request may read. The key only opens the site in the path: a key of site X
 * presented for site Y fails here, before any content query.
 */
export function makeAuthenticateSite({ sites, apiKeys, rateLimiter }: AuthenticateDeps) {
  return async function authenticateSite(input: DeliveryCredentialsInput): Promise<SiteScope> {
    const parsed = deliveryCredentialsSchema.safeParse(input);
    if (!parsed.success) throw new InvalidApiKeyError();
    const { siteId, authorization: key } = parsed.data;

    if (!rateLimiter.attempt(`delivery:${siteId}`)) throw new DeliveryRateLimitedError();

    const site = await sites.findForApiKey(siteId as SiteId);
    if (!site?.apiKey || site.status !== 'active' || !apiKeys.matches(key, site.apiKey)) {
      throw new InvalidApiKeyError();
    }
    return scopeOf(site);
  };
}
