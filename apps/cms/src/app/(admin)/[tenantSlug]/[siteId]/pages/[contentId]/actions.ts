'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SavePageInput, VersionedContentRef } from '@/application/content';
import { getContainer } from '@/composition/container';
import type { StatusTransition } from '@/presentation/content';
import type { ActionState } from '@/shared/action-state';
import { runAction, toErrorState } from '../../../../../_server/errors';
import { requireActor } from '../../../../../_server/session';
import { scheduleWebhookDispatch } from '../../../../../_server/webhook-dispatch';

export async function savePageAction(input: SavePageInput): Promise<ActionState> {
  const actor = await requireActor();
  return runAction(async () => {
    const saved = await (await getContainer()).savePage(actor, input);
    refresh();
    scheduleWebhookDispatch();
    return saved.status === 'published' ? 'Alterações salvas e publicadas no site.' : 'Rascunho salvo.';
  });
}

export async function changePageStatusAction(
  transition: StatusTransition,
  input: VersionedContentRef,
): Promise<ActionState> {
  const actor = await requireActor();
  return runAction(async () => {
    await (await getContainer()).changePageStatus(actor, transition, input);
    refresh();
    scheduleWebhookDispatch();
    return transition === 'publish' ? 'Página publicada.' : 'Página despublicada. Ela não aparece mais no site.';
  });
}

/** Bound to the tenant slug on the server; returns to the site's page list after deleting. */
export async function deletePageAction(tenantSlug: string, input: VersionedContentRef): Promise<ActionState> {
  const actor = await requireActor();
  const container = await getContainer();
  let sitePath: string;
  try {
    const tenant = await container.getTenantBySlug(actor, tenantSlug);
    await container.deletePage(actor, { ...input, tenantId: tenant.id });
    scheduleWebhookDispatch();
    sitePath = `/${tenant.slug}/${input.siteId}`;
  } catch (error) {
    return toErrorState(error);
  }
  redirect(sitePath);
}
