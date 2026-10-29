import Link from 'next/link';
import { getContainer } from '@/composition/container';
import { PageEditor } from '@/presentation/content';
import { orNotFound } from '../../../../../_server/errors';
import { requireActor } from '../../../../../_server/session';
import { changePageStatusAction, deletePageAction, savePageAction } from './actions';

export default async function EditPagePage({ params }: PageProps<'/[tenantSlug]/[siteId]/pages/[contentId]'>) {
  const { tenantSlug, siteId, contentId } = await params;
  const actor = await requireActor();
  const container = await getContainer();

  const tenant = await orNotFound(container.getTenantBySlug(actor, tenantSlug));
  const target = { tenantId: tenant.id, siteId, contentId };
  const site = await orNotFound(container.getSite(actor, tenant.id, siteId));
  const [detail, media] = await Promise.all([
    orNotFound(container.getPage(actor, target)),
    container.listMedia(actor, { tenantId: tenant.id, siteId }),
  ]);
  const sitePath = `/${tenant.slug}/${site.id}`;

  return (
    <>
      <Link href={sitePath} className="text-muted-foreground text-sm hover:underline">
        ← {site.name}
      </Link>
      <h1 className="text-2xl font-semibold">{detail.page.title}</h1>
      <PageEditor
        target={target}
        detail={detail}
        media={media}
        saveAction={savePageAction}
        statusAction={changePageStatusAction}
        deleteAction={deletePageAction.bind(null, tenant.slug)}
      />
    </>
  );
}
