import { redirect } from 'next/navigation';
import { getContainer } from '@/composition/container';
import { Section } from '@/presentation/shell';
import { CreateTenantForm, TenantList } from '@/presentation/tenants';
import { requireActor } from '../_server/session';
import { createTenantAction } from './actions';

export default async function HomePage() {
  const actor = await requireActor();
  const tenants = await (await getContainer()).listTenants(actor);

  const [onlyTenant] = tenants;
  if (!actor.isSuperadmin && tenants.length === 1 && onlyTenant) redirect(`/${onlyTenant.slug}`);

  return (
    <>
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <Section title="Seus clientes">
        <TenantList tenants={tenants} />
      </Section>
      {actor.isSuperadmin && (
        <Section title="Novo cliente" description="Cadastre um negócio para depois criar os sites dele.">
          <CreateTenantForm action={createTenantAction} />
        </Section>
      )}
    </>
  );
}
