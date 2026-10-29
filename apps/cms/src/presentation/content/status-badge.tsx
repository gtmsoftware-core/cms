import type { PageSummary } from '@/application/content';
import { Badge } from '@/presentation/ui';

export function StatusBadge({ status }: { status: PageSummary['status'] }) {
  return status === 'published' ? <Badge>Publicada</Badge> : <Badge variant="secondary">Rascunho</Badge>;
}
