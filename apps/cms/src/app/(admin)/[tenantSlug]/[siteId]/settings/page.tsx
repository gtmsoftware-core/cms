import Link from 'next/link';
import { getContainer } from '@/composition/container';
import { SiteSettingsForm } from '@/presentation/content';
import { orNotFound } from '../../../../_server/errors';
import { requireActor } from '../../../../_server/session';
import { saveSiteSettingsAction } from './actions';

export default async function SiteSettingsPage({ params }: PageProps<'/[tenantSlug]/[siteId]/settings'>) {
  const { tenantSlug, siteId } = await params;
  const actor = await requireActor();
  const container = await getContainer();

  const tenant = await orNotFound(container.getTenantBySlug(actor, tenantSlug));
  const site = await orNotFound(container.getSite(actor, tenant.id, siteId));
  const ref = { tenantId: tenant.id, siteId: site.id };
  const [detail, media] = await Promise.all([container.getSiteSettings(actor, ref), container.listMedia(actor, ref)]);

  return (
    <>
      <Link href={`/${tenant.slug}/${site.id}`} className="text-muted-foreground text-sm hover:underline">
        ← {site.name}
      </Link>
      <h1 className="text-2xl font-semibold">Configurações do site</h1>
      <SiteSettingsForm site={ref} detail={detail} media={media} action={saveSiteSettingsAction} />
    </>
  );
}
