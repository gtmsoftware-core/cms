'use client';

import { useState, useTransition } from 'react';
import { FormStatus } from '@/presentation/forms';
import { Button } from '@/presentation/ui';
import { idleState, type ActionState } from '@/shared/action-state';

type Action = () => Promise<ActionState>;

type WebhookActionsProps = {
  failedEvents: number;
  retryAction: Action;
  revalidateAction: Action;
  /** Only for the operator, when the webhook is configured. */
  testAction?: Action;
};

export function WebhookActions({ failedEvents, retryAction, revalidateAction, testAction }: WebhookActionsProps) {
  const [state, setState] = useState<ActionState>(idleState);
  const [pending, startTransition] = useTransition();
  const run = (action: Action) => startTransition(async () => setState(await action()));

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {testAction && (
          <Button type="button" variant="outline" disabled={pending} onClick={() => run(testAction)}>
            Testar conexão
          </Button>
        )}
        <Button type="button" variant="outline" disabled={pending} onClick={() => run(revalidateAction)}>
          Revalidar site inteiro
        </Button>
        {failedEvents > 0 && (
          <Button type="button" disabled={pending} onClick={() => run(retryAction)}>
            Reenviar {failedEvents} {failedEvents === 1 ? 'aviso falho' : 'avisos falhos'}
          </Button>
        )}
      </div>
      <FormStatus state={state} />
    </div>
  );
}
