import { assertSuperadmin, type Actor } from '@/domain/identity';
import {
  SiteNotFoundError,
  withWebhookSecret,
  withWebhookUrl,
  type SiteId,
  type SiteRepository,
  type SiteScope,
} from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';
import type { WebhookSecrets } from '../ports';
import {
  setWebhookUrlSchema,
  webhookSiteRefSchema,
  type SetWebhookUrlInput,
  type WebhookSiteRef,
} from '../schemas/webhook-url.schema';

export type ConfigureWebhookDeps = Readonly<{ sites: SiteRepository; secrets: WebhookSecrets }>;

async function loadAsOperator(sites: SiteRepository, actor: Actor, ref: { tenantId: string; siteId: string }) {
  assertSuperadmin(actor);
  const scope: SiteScope = { tenantId: ref.tenantId as TenantId, siteId: ref.siteId as SiteId };
  const site = await sites.findById(scope);
  if (!site) throw new SiteNotFoundError();
  return { scope, site };
}

export function makeSetWebhookUrl({ sites }: Pick<ConfigureWebhookDeps, 'sites'>) {
  return async function setWebhookUrl(actor: Actor, input: SetWebhookUrlInput): Promise<void> {
    const { webhookUrl, ...ref } = setWebhookUrlSchema.parse(input);
    const { scope, site } = await loadAsOperator(sites, actor, ref);
    await sites.save(scope, withWebhookUrl(site, webhookUrl || null));
  };
}

/** Creates or rotates the signing secret. The plain value is returned once and stored only encrypted. */
export function makeRotateWebhookSecret({ sites, secrets }: ConfigureWebhookDeps) {
  return async function rotateWebhookSecret(actor: Actor, input: WebhookSiteRef): Promise<string> {
    const { scope, site } = await loadAsOperator(sites, actor, webhookSiteRefSchema.parse(input));
    const secret = secrets.generate();
    await sites.save(scope, withWebhookSecret(site, secrets.encrypt(secret)));
    return secret;
  };
}

export { loadAsOperator };
