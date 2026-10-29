'use server';

import { refresh } from 'next/cache';
import type { AddMemberInput } from '@/application/identity';
import type { CreateSiteInput } from '@/application/sites';
import { getContainer } from '@/composition/container';
import type { ActionState } from '@/shared/action-state';
import { runAction } from '../../_server/errors';
import { requireActor } from '../../_server/session';

export async function createSiteAction(input: CreateSiteInput): Promise<ActionState> {
  const actor = await requireActor();
  return runAction(async () => {
    const site = await (await getContainer()).createSite(actor, input);
    refresh();
    return `Site "${site.name}" criado.`;
  });
}

export async function addMemberAction(input: AddMemberInput): Promise<ActionState> {
  const actor = await requireActor();
  return runAction(async () => {
    const member = await (await getContainer()).addMember(actor, input);
    refresh();
    return `${member.name} agora tem acesso.`;
  });
}
