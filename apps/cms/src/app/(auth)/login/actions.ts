'use server';

import { redirect } from 'next/navigation';
import type { SignInInput } from '@/application/identity';
import { getContainer } from '@/composition/container';
import type { ActionState } from '@/shared/action-state';
import { toErrorState } from '../../_server/errors';

export async function signInAction(input: SignInInput): Promise<ActionState> {
  try {
    await (await getContainer()).signIn(input);
  } catch (error) {
    return toErrorState(error);
  }
  redirect('/');
}
