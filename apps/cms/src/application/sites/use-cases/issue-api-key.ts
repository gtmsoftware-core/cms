import { assertSuperadmin, type Actor } from '@/domain/identity';
import { SiteNotFoundError, withApiKey, type SiteId, type SiteRepository } from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';
import type { ApiKeys } from '../ports';
import { issueApiKeySchema, type IssueApiKeyInput } from '../schemas/issue-api-key.schema';

export type IssueApiKeyDeps = Readonly<{ sites: SiteRepository; apiKeys: ApiKeys }>;

export type IssuedSiteKey = Readonly<{ siteId: string; apiKey: string }>;

/** Creates (or rotates) the site's read API key. The plain key is returned once and never stored. */
export function makeIssueApiKey({ sites, apiKeys }: IssueApiKeyDeps) {
  return async function issueApiKey(actor: Actor, input: IssueApiKeyInput): Promise<IssuedSiteKey> {
    const data = issueApiKeySchema.parse(input);
    assertSuperadmin(actor);

    const scope = { tenantId: data.tenantId as TenantId, siteId: data.siteId as SiteId };
    const site = await sites.findById(scope);
    if (!site) throw new SiteNotFoundError();

    const { key, credential } = apiKeys.issue();
    await sites.save(scope, withApiKey(site, credential));
    return { siteId: site.id, apiKey: key };
  };
}
