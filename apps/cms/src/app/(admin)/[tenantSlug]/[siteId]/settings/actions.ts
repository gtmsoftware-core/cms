'use server';

import { refresh } from 'next/cache';
import type { SaveSiteSettingsInput } from '@/application/content';
import { getContainer } from '@/composition/container';
import type { ActionState } from '@/shared/action-state';
import { runAction } from '../../../../_server/errors';
import { requireActor } from '../../../../_server/session';
import { scheduleWebhookDispatch } from '../../../../_server/webhook-dispatch';

export async function saveSiteSettingsAction(input: SaveSiteSettingsInput): Promise<ActionState> {
  const actor = await requireActor();
  return runAction(async () => {
    await (await getContainer()).saveSiteSettings(actor, input);
    refresh();
    scheduleWebhookDispatch();
    return 'Configurações salvas e publicadas no site.';
  });
}
