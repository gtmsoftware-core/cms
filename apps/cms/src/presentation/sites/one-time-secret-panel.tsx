'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { FormStatus } from '@/presentation/forms';
import { Button } from '@/presentation/ui';

export type IssuedSecretState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'issued'; envBlock: string }>
  | Readonly<{ status: 'error'; message: string }>;

export type OneTimeSecretPanelProps = {
  /** Description of the current secret, or null when none exists yet. */
  current: ReactNode | null;
  emptyText: string;
  action: () => Promise<IssuedSecretState>;
};

/** Issues or rotates a secret that is shown once, inside an environment block ready to paste. */
export function OneTimeSecretPanel({ current, emptyText, action }: OneTimeSecretPanelProps) {
  const [state, setState] = useState<IssuedSecretState>({ status: 'idle' });
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const exists = current !== null;

  const issue = () =>
    startTransition(async () => {
      setConfirming(false);
      setCopied(false);
      setState(await action());
    });

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  return (
    <div className="grid gap-4 text-sm">
      <p>{current ?? emptyText}</p>
      {state.status === 'issued' && (
        <div className="grid gap-2">
          <p className="font-medium">Copie agora: o valor não será mostrado de novo.</p>
          <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">{state.envBlock}</pre>
          <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => copy(state.envBlock)}>
            {copied ? 'Copiado' : 'Copiar variáveis'}
          </Button>
        </div>
      )}
      {state.status === 'error' && <FormStatus state={state} />}
      {exists && !confirming ? (
        <Button type="button" variant="outline" className="justify-self-start" onClick={() => setConfirming(true)}>
          Gerar novo valor
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {exists && <span className="text-destructive">O valor atual deixará de funcionar.</span>}
          <Button type="button" disabled={pending} onClick={issue}>
            {exists ? 'Confirmar' : 'Gerar'}
          </Button>
          {exists && (
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
