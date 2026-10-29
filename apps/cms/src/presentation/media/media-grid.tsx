'use client';

import { useState, useTransition } from 'react';
import type { MediaSummary } from '@/application/media';
import { FormStatus } from '@/presentation/forms';
import { Button } from '@/presentation/ui';
import { idleState, type ActionState } from '@/shared/action-state';
import { formatBytes } from './format';
import { MediaThumbnail } from './media-thumbnail';

type MediaGridProps = { media: readonly MediaSummary[]; deleteAction: (mediaId: string) => Promise<ActionState> };

export function MediaGrid({ media, deleteAction }: MediaGridProps) {
  const [state, setState] = useState<ActionState>(idleState);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (id: string) =>
    startTransition(async () => {
      setConfirming(null);
      setState(await deleteAction(id));
    });

  const copy = async (item: MediaSummary) => {
    await navigator.clipboard.writeText(item.url);
    setCopied(item.id);
  };

  if (media.length === 0) {
    return (
      <div className="grid gap-4">
        <FormStatus state={state} />
        <p className="text-muted-foreground text-sm">Nenhuma imagem enviada ainda.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <FormStatus state={state} />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((item) => (
          <li key={item.id} className="grid content-start gap-2 text-sm">
            <MediaThumbnail media={item} />
            <span className="truncate font-medium" title={item.filename}>
              {item.filename}
            </span>
            <span className="text-muted-foreground">
              {formatBytes(item.size)}
              {!item.alt && ' · sem descrição'}
            </span>
            <div className="flex flex-wrap gap-1">
              <Button type="button" variant="outline" size="xs" onClick={() => copy(item)}>
                {copied === item.id ? 'Copiado' : 'Copiar endereço'}
              </Button>
              {confirming === item.id ? (
                <Button type="button" variant="destructive" size="xs" disabled={pending} onClick={() => remove(item.id)}>
                  Confirmar exclusão
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="xs" className="text-destructive" onClick={() => setConfirming(item.id)}>
                  Excluir
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-sm">
        Excluir uma imagem tira ela das páginas onde estiver em uso. O site é atualizado em seguida.
      </p>
    </div>
  );
}
