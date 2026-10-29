'use server';

import { refresh } from 'next/cache';
import type { SetWebhookUrlInput } from '@/application/webhooks';
import { getContainer } from '@/composition/container';
import type { IssuedSecretState } from '@/presentation/sites';
import type { ActionState } from '@/shared/action-state';
import { runAction, toErrorState } from '../../../../_server/errors';
import { requireActor } from '../../../../_server/session';
import { scheduleWebhookDispatch } from '../../../../_server/webhook-dispatch';

type SiteRef = { tenantId: string; siteId: string };

export async function setWebhookUrlAction(input: SetWebhookUrlInput): Promise<ActionState> {
  const actor = await requireActor();
  return runAction(async () => {
    await (await getContainer()).setWebhookUrl(actor, input);
    refresh();
    return 'Endereço salvo.';
  });
}

/** Bound to the site on the server. The plain secret only travels in this response. */
export async function rotateWebhookSecretAction(ref: SiteRef): Promise<IssuedSecretState> {
  const actor = await requireActor();
  try {
    const secret = await (await getContainer()).rotateWebhookSecret(actor, ref);
    refresh();
    return { status: 'issued', envBlock: `CMS_WEBHOOK_SECRET=${secret}` };
  } catch (error) {
    const state = toErrorState(error);
    return state.status === 'error' ? state : { status: 'idle' };
  }
}

export async function testConnectionAction(ref: SiteRef): Promise<ActionState> {
  const actor = await requireActor();
  try {
    const result = await (await getContainer()).testConnection(actor, ref);
    refresh();
    return result.ok
      ? { status: 'success', message: `Conexão funcionando: o site respondeu em ${result.durationMs} ms.` }
      : { status: 'error', message: `O site não confirmou o aviso (${result.error}). Confira o endereço e o CMS_WEBHOOK_SECRET.` };
  } catch (error) {
    return toErrorState(error);
  }
}

export async function retryFailedAction(ref: SiteRef): Promise<ActionState> {
  const actor = await requireActor();
  return runAction(async () => {
    const count = await (await getContainer()).retryFailed(actor, ref);
    scheduleWebhookDispatch();
    refresh();
    return count === 0 ? 'Não há avisos falhos.' : 'Avisos reenviados. O resultado aparece no histórico em instantes.';
  });
}

export async function revalidateSiteAction(ref: SiteRef): Promise<ActionState> {
  const actor = await requireActor();
  return runAction(async () => {
    await (await getContainer()).revalidateSite(actor, ref);
    scheduleWebhookDispatch();
    return 'Pedido enviado: o site inteiro será atualizado em instantes.';
  });
}
