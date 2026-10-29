import type { TenantId } from '@/domain/tenants';
import type { Brand } from '@/shared/ids';

export type SiteId = Brand<string, 'SiteId'>;

export type SiteScope = Readonly<{ tenantId: TenantId; siteId: SiteId }>;

export type SiteStatus = 'active' | 'archived';

/** What is stored for a site's read API key: never the key itself. */
export type ApiKeyCredential = Readonly<{ hash: string; prefix: string }>;

export type Site = Readonly<{
  id: SiteId;
  tenantId: TenantId;
  name: string;
  primaryDomain: string | null;
  status: SiteStatus;
  apiKey: ApiKeyCredential | null;
  /** Where the CMS posts revalidation webhooks (the site's /api/revalidate). */
  webhookUrl: string | null;
  /** Webhook signing secret, encrypted at rest (AES-256-GCM). Never stored in plain text. */
  webhookSecretEnc: string | null;
  createdAt: Date;
}>;

export const scopeOf = (site: Site): SiteScope => ({ tenantId: site.tenantId, siteId: site.id });

/** Issuing a new key replaces the previous one, which stops working at once. */
export const withApiKey = (site: Site, apiKey: ApiKeyCredential): Site => ({ ...site, apiKey });

export const withWebhookUrl = (site: Site, webhookUrl: string | null): Site => ({ ...site, webhookUrl });

export const withWebhookSecret = (site: Site, webhookSecretEnc: string): Site => ({ ...site, webhookSecretEnc });
