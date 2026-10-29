'use server';

import { refresh } from 'next/cache';
import type { MediaRef, MediaSiteRef } from '@/application/media';
import { getContainer } from '@/composition/container';
import type { ActionState } from '@/shared/action-state';
import { runAction } from '../../../../_server/errors';
import { requireActor } from '../../../../_server/session';
import { scheduleWebhookDispatch } from '../../../../_server/webhook-dispatch';

/** Bound to the site on the server; the form sends the file and its description. */
export async function uploadMediaAction(ref: MediaSiteRef, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { status: 'error', message: 'Escolha um arquivo de imagem.' };
  return runAction(async () => {
    await (await getContainer()).uploadMedia(actor, {
      ...ref,
      alt: String(formData.get('alt') ?? ''),
      filename: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    refresh();
    return `Imagem "${file.name}" enviada.`;
  });
}

export async function deleteMediaAction(input: MediaRef): Promise<ActionState> {
  const actor = await requireActor();
  return runAction(async () => {
    await (await getContainer()).deleteMedia(actor, input);
    refresh();
    scheduleWebhookDispatch();
    return 'Imagem excluída.';
  });
}
