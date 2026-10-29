import Link from 'next/link';
import { getContainer } from '@/composition/container';
import { CreatePageForm, PageList } from '@/presentation/content';
import { Section } from '@/presentation/shell';
import { ApiKeyPanel } from '@/presentation/sites';
import { buttonVariants } from '@/presentation/ui';
import { orNotFound } from '../../../_server/errors';
import { requireActor } from '../../../_server/session';
import { createPageAction, issueApiKeyAction } from './actions';

export default async function SitePage({ params }: PageProps<'/[tenantSlug]/[siteId]'>) {
  const { tenantSlug, siteId } = await params;
  const actor = await requireActor();
  const container = await getContainer();

  const tenant = await orNotFound(container.getTenantBySlug(actor, tenantSlug));
  const site = await orNotFound(container.getSite(actor, tenant.id, siteId));
  const ref = { tenantId: tenant.id, siteId: site.id };
  const pages = await container.listPages(actor, ref);
  const basePath = `/${tenant.slug}/${site.id}`;

  return (
    <>
      <Link href={`/${tenant.slug}`} className="text-muted-foreground text-sm hover:underline">
        ← {tenant.name}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{site.name}</h1>
          <p className="text-muted-foreground text-sm">{site.primaryDomain ?? 'Sem domínio configurado'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`${basePath}/media`} className={buttonVariants({ variant: 'outline' })}>
            Mídia
          </Link>
          <Link href={`${basePath}/webhooks`} className={buttonVariants({ variant: 'outline' })}>
            Atualização do site
          </Link>
          <Link href={`${basePath}/settings`} className={buttonVariants({ variant: 'outline' })}>
            Configurações do site
          </Link>
        </div>
      </div>
      <Section title="Páginas">
        <PageList basePath={basePath} pages={pages} />
      </Section>
      <Section title="Nova página">
        <CreatePageForm site={ref} action={createPageAction.bind(null, tenant.slug)} />
      </Section>
      {actor.isSuperadmin && (
        <Section title="Integração com o site" description="Variáveis de ambiente para o projeto do site (por exemplo, na Vercel).">
          <ApiKeyPanel currentPrefix={site.apiKeyPrefix} action={issueApiKeyAction.bind(null, tenant.slug, site.id)} />
        </Section>
      )}
    </>
  );
}
