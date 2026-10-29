'use client';

import { useState, useTransition } from 'react';
import type { PageDetail, VersionedContentRef } from '@/application/content';
import { FormStatus } from '@/presentation/forms';
import { Button } from '@/presentation/ui';
import { idleState, type ActionState } from '@/shared/action-state';

export type StatusTransition = 'publish' | 'unpublish';

export type PageStatusActionsProps = {
  target: VersionedContentRef;
  status: PageDetail['status'];
  hasUnsavedChanges: boolean;
  statusAction: (transition: StatusTransition, input: VersionedContentRef) => Promise<ActionState>;
  deleteAction: (input: VersionedContentRef) => Promise<ActionState>;
};

export function PageStatusActions({ target, status, hasUnsavedChanges, statusAction, deleteAction }: PageStatusActionsProps) {
  const [state, setState] = useState<ActionState>(idleState);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionState>) => startTransition(async () => setState(await action()));
  const transition: StatusTransition = status === 'published' ? 'unpublish' : 'publish';

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={transition === 'publish' ? 'default' : 'outline'}
          disabled={pending || hasUnsavedChanges}
          onClick={() => run(() => statusAction(transition, target))}
        >
          {transition === 'publish' ? 'Publicar' : 'Despublicar'}
        </Button>
        {confirmingDelete ? (
          <>
            <Button type="button" variant="destructive" disabled={pending} onClick={() => run(() => deleteAction(target))}>
              Confirmar exclusão
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmingDelete(true)}>
            Excluir página
          </Button>
        )}
      </div>
      {hasUnsavedChanges && <p className="text-muted-foreground text-sm">Salve as alterações antes de publicar ou despublicar.</p>}
      <FormStatus state={state} />
    </div>
  );
}
