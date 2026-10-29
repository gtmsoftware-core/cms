import Link from 'next/link';
import { getContainer } from '@/composition/container';
import { Section } from '@/presentation/shell';
import { OneTimeSecretPanel } from '@/presentation/sites';
import { DeliveryLog, WebhookActions, WebhookUrlForm } from '@/presentation/webhooks';
import { orNotFound } from '../../../../_server/errors';
import { requireActor } from '../../../../_server/session';
import {
  retryFailedAction,
  revalidateSiteAction,
  rotateWebhookSecretAction,
  setWebhookUrlAction,
  testConnectionAction,
} from './actions';

export default async function WebhooksPage({ params }: PageProps<'/[tenantSlug]/[siteId]/webhooks'>) {
  const { tenantSlug, siteId } = await params;
  const actor = await requireActor();
  const container = await getContainer();

  const tenant = await orNotFound(container.getTenantBySlug(actor, tenantSlug));
  const site = await orNotFound(container.getSite(actor, tenant.id, siteId));
  const ref = { tenantId: tenant.id, siteId: site.id };
  const overview = await container.getWebhookOverview(actor, ref);
  const configured = overview.webhookUrl !== null && overview.hasSecret;

  return (
    <>
      <Link href={`/${tenant.slug}/${site.id}`} className="text-muted-foreground text-sm hover:underline">
        ← {site.name}
      </Link>
      <h1 className="text-2xl font-semibold">Atualização do site</h1>
      <p className="text-muted-foreground text-sm">
        A cada publicação, o CMS avisa o site para atualizar as páginas afetadas.
        {!configured && ' O aviso ainda não está configurado para este site.'}
      </p>
      {actor.isSuperadmin && (
        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Endereço do webhook">
            <WebhookUrlForm site={ref} webhookUrl={overview.webhookUrl} action={setWebhookUrlAction} />
          </Section>
          <Section title="Segredo do webhook" description="Assina cada aviso. Cole no projeto do site.">
            <OneTimeSecretPanel
              current={overview.hasSecret ? 'Segredo configurado.' : null}
              emptyText="Este site ainda não tem segredo de webhook."
              action={rotateWebhookSecretAction.bind(null, ref)}
            />
          </Section>
        </div>
      )}
      <Section title="Ações">
        <WebhookActions
          failedEvents={overview.failedEvents}
          retryAction={retryFailedAction.bind(null, ref)}
          revalidateAction={revalidateSiteAction.bind(null, ref)}
          testAction={actor.isSuperadmin && configured ? testConnectionAction.bind(null, ref) : undefined}
        />
      </Section>
      <Section title="Histórico de avisos" description="Os 50 envios mais recentes.">
        <DeliveryLog deliveries={overview.deliveries} />
      </Section>
    </>
  );
}
