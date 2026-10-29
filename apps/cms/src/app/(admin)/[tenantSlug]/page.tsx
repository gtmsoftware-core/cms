import { getContainer } from '@/composition/container';
import { AddMemberForm, MemberList } from '@/presentation/identity';
import { Section } from '@/presentation/shell';
import { CreateSiteForm, SiteList } from '@/presentation/sites';
import { orNotFound } from '../../_server/errors';
import { requireActor } from '../../_server/session';
import { addMemberAction, createSiteAction } from './actions';

export default async function TenantPage({ params }: PageProps<'/[tenantSlug]'>) {
  const { tenantSlug } = await params;
  const actor = await requireActor();
  const container = await getContainer();

  const tenant = await orNotFound(container.getTenantBySlug(actor, tenantSlug));
  const [sites, members] = await Promise.all([
    container.listSites(actor, tenant.id),
    container.listMembers(actor, tenant.id),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold">{tenant.name}</h1>
      <Section title="Sites">
        <SiteList tenantSlug={tenant.slug} sites={sites} />
      </Section>
      <Section title="Pessoas com acesso">
        <MemberList members={members} />
      </Section>
      {actor.isSuperadmin && (
        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Novo site">
            <CreateSiteForm tenantId={tenant.id} action={createSiteAction} />
          </Section>
          <Section title="Dar acesso a uma pessoa">
            <AddMemberForm tenantId={tenant.id} action={addMemberAction} />
          </Section>
        </div>
      )}
    </>
  );
}
