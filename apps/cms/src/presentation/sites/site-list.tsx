import Link from 'next/link';
import type { SiteSummary } from '@/application/sites';

type SiteListProps = { tenantSlug: string; sites: readonly SiteSummary[] };

export function SiteList({ tenantSlug, sites }: SiteListProps) {
  if (sites.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum site cadastrado.</p>;
  }
  return (
    <ul className="divide-y">
      {sites.map((site) => (
        <li key={site.id}>
          <Link
            href={`/${tenantSlug}/${site.id}`}
            className="hover:bg-accent flex justify-between rounded-md px-2 py-3 text-sm"
          >
            <span className="font-medium">{site.name}</span>
            <span className="text-muted-foreground">{site.primaryDomain ?? 'sem domínio'}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
