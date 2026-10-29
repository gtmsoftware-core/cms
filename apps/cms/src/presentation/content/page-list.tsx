import Link from 'next/link';
import type { PageSummary } from '@/application/content';
import { StatusBadge } from './status-badge';

type PageListProps = { basePath: string; pages: readonly PageSummary[] };

export function PageList({ basePath, pages }: PageListProps) {
  if (pages.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma página criada.</p>;
  }
  return (
    <ul className="divide-y">
      {pages.map((page) => (
        <li key={page.id}>
          <Link href={`${basePath}/pages/${page.id}`} className="hover:bg-accent flex items-center justify-between gap-4 rounded-md px-2 py-3 text-sm">
            <span>
              <span className="font-medium">{page.title}</span>
              <span className="text-muted-foreground ml-2">/{page.slug}</span>
            </span>
            <StatusBadge status={page.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
