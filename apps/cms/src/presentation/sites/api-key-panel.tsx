'use client';

import { OneTimeSecretPanel, type IssuedSecretState } from './one-time-secret-panel';

type ApiKeyPanelProps = { currentPrefix: string | null; action: () => Promise<IssuedSecretState> };

/** Read key of the Content Delivery API. Only its prefix is known after issuing. */
export function ApiKeyPanel({ currentPrefix, action }: ApiKeyPanelProps) {
  const current = currentPrefix && (
    <>
      Chave de leitura atual: <code className="bg-muted rounded px-1">{currentPrefix}…</code>
    </>
  );
  return <OneTimeSecretPanel current={current || null} emptyText="Este site ainda não tem chave de leitura." action={action} />;
}
