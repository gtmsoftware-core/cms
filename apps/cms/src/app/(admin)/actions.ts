'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CreateTenantInput } from '@/application/tenants';
import { getContainer } from '@/composition/container';
import type { ActionState } from '@/shared/action-state';
import { runAction } from '../_server/errors';
import { requireActor } from '../_server/session';

export async function createTenantAction(input: CreateTenantInput): Promise<ActionState> {
  const actor = await requireActor();
  return runAction(async () => {
    const tenant = await (await getContainer()).createTenant(actor, input);
    refresh();
    return `Cliente "${tenant.name}" criado.`;
  });
}

export async function signOutAction(): Promise<void> {
  await (await getContainer()).signOut();
  redirect('/login');
}
