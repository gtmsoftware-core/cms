import type { DeliverySummary } from '@/application/webhooks';
import { Badge } from '@/presentation/ui';

const EVENT_LABELS: Readonly<Record<string, string>> = {
  'content.published': 'Página publicada',
  'content.updated': 'Página atualizada',
  'content.unpublished': 'Página despublicada',
  'content.deleted': 'Página excluída',
  'site.settings.updated': 'Configurações',
  'site.revalidated': 'Site inteiro',
  'media.deleted': 'Mídia excluída',
  ping: 'Teste de conexão',
};

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Sao_Paulo' });

function describe(types: readonly string[]): string {
  const labels = [...new Set(types.map((type) => EVENT_LABELS[type] ?? type))];
  return labels.join(', ');
}

export function DeliveryLog({ deliveries }: { deliveries: readonly DeliverySummary[] }) {
  if (deliveries.length === 0) return <p className="text-muted-foreground text-sm">Nenhum aviso enviado ainda.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">Quando</th>
            <th className="py-2 pr-4 font-medium">O que mudou</th>
            <th className="py-2 pr-4 font-medium">Resultado</th>
            <th className="py-2 font-medium">Tempo</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {deliveries.map((delivery) => (
            <tr key={delivery.id}>
              <td className="py-2 pr-4 whitespace-nowrap">{dateFormat.format(delivery.attemptedAt)}</td>
              <td className="py-2 pr-4">{describe(delivery.eventTypes)}</td>
              <td className="py-2 pr-4">
                {delivery.status === 'success' ? (
                  <Badge>Entregue ({delivery.httpStatus})</Badge>
                ) : (
                  <Badge variant="secondary" className="text-destructive">
                    Falhou: {delivery.error ?? `HTTP ${delivery.httpStatus}`}
                  </Badge>
                )}
              </td>
              <td className="py-2 whitespace-nowrap">{delivery.durationMs} ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
