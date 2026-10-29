import type { Site } from '@/domain/sites';

export type SiteSummary = Readonly<{
  id: string;
  tenantId: string;
  name: string;
  primaryDomain: string | null;
  status: Site['status'];
  /** Readable start of the current API key, or null when none was issued. */
  apiKeyPrefix: string | null;
}>;

export const toSiteSummary = (site: Site): SiteSummary => ({
  id: site.id,
  tenantId: site.tenantId,
  name: site.name,
  primaryDomain: site.primaryDomain,
  status: site.status,
  apiKeyPrefix: site.apiKey?.prefix ?? null,
});
