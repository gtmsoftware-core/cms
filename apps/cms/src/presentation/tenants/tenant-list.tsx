import Link from 'next/link';
import type { TenantSummary } from '@/application/tenants';

export function TenantList({ tenants }: { tenants: readonly TenantSummary[] }) {
  if (tenants.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum cliente cadastrado.</p>;
  }
  return (
    <ul className="divide-y">
      {tenants.map((tenant) => (
        <li key={tenant.id}>
          <Link href={`/${tenant.slug}`} className="hover:bg-accent flex justify-between rounded-md px-2 py-3 text-sm">
            <span className="font-medium">{tenant.name}</span>
            <span className="text-muted-foreground">{tenant.slug}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
