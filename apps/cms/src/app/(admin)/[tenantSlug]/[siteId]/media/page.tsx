import Link from 'next/link';
import { getContainer } from '@/composition/container';
import { MediaGrid, MediaUploadForm } from '@/presentation/media';
import { Section } from '@/presentation/shell';
import { orNotFound } from '../../../../_server/errors';
import { requireActor } from '../../../../_server/session';
import { deleteMediaAction, uploadMediaAction } from './actions';

export default async function MediaPage({ params }: PageProps<'/[tenantSlug]/[siteId]/media'>) {
  const { tenantSlug, siteId } = await params;
  const actor = await requireActor();
  const container = await getContainer();

  const tenant = await orNotFound(container.getTenantBySlug(actor, tenantSlug));
  const site = await orNotFound(container.getSite(actor, tenant.id, siteId));
  const ref = { tenantId: tenant.id, siteId: site.id };
  const media = await container.listMedia(actor, ref);

  async function deleteOne(mediaId: string) {
    'use server';
    return deleteMediaAction({ ...ref, mediaId });
  }

  return (
    <>
      <Link href={`/${tenant.slug}/${site.id}`} className="text-muted-foreground text-sm hover:underline">
        ← {site.name}
      </Link>
      <h1 className="text-2xl font-semibold">Mídia</h1>
      <Section title="Enviar imagem">
        <MediaUploadForm action={uploadMediaAction.bind(null, ref)} />
      </Section>
      <Section title="Biblioteca" description="Use estas imagens nas páginas e nas configurações do site.">
        <MediaGrid media={media} deleteAction={deleteOne} />
      </Section>
    </>
  );
}
