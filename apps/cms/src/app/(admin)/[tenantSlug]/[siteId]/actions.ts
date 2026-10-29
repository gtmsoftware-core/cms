'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CreatePageInput } from '@/application/content';
import type { IssuedSecretState } from '@/presentation/sites';
import { getContainer } from '@/composition/container';
import type { ActionState } from '@/shared/action-state';
import { toErrorState } from '../../../_server/errors';
import { requireActor } from '../../../_server/session';

/** Bound to the tenant slug on the server; the tenant is resolved again with access checks. */
export async function createPageAction(tenantSlug: string, input: CreatePageInput): Promise<ActionState> {
  const actor = await requireActor();
  const container = await getContainer();
  let editorPath: string;
  try {
    const tenant = await container.getTenantBySlug(actor, tenantSlug);
    const page = await container.createPage(actor, { ...input, tenantId: tenant.id });
    editorPath = `/${tenant.slug}/${input.siteId}/pages/${page.id}`;
  } catch (error) {
    return toErrorState(error);
  }
  redirect(editorPath);
}

/** Bound to tenant slug and site id on the server. The plain key only travels in this response. */
export async function issueApiKeyAction(tenantSlug: string, siteId: string): Promise<IssuedSecretState> {
  const actor = await requireActor();
  const container = await getContainer();
  try {
    const tenant = await container.getTenantBySlug(actor, tenantSlug);
    const issued = await container.issueApiKey(actor, { tenantId: tenant.id, siteId });
    refresh();
    const envBlock = [
      `CMS_URL=${container.publicUrl}`,
      `CMS_SITE_ID=${issued.siteId}`,
      `CMS_API_KEY=${issued.apiKey}`,
    ].join('\n');
    return { status: 'issued', envBlock };
  } catch (error) {
    const state = toErrorState(error);
    return state.status === 'error' ? state : { status: 'idle' };
  }
}
