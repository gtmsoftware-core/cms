'use client';

import type { SetWebhookUrlInput } from '@/application/webhooks';
import { setWebhookUrlSchema } from '@/application/webhooks/schemas/webhook-url.schema';
import { FormStatus, TextField, useActionForm, type FormAction } from '@/presentation/forms';
import { Button } from '@/presentation/ui';

type WebhookUrlFormProps = { site: { tenantId: string; siteId: string }; webhookUrl: string | null; action: FormAction<SetWebhookUrlInput> };

export function WebhookUrlForm({ site, webhookUrl, action }: WebhookUrlFormProps) {
  const defaults = { ...site, webhookUrl: webhookUrl ?? '' };
  const { form, state, pending, onSubmit } = useActionForm(setWebhookUrlSchema, action, defaults, { keepValues: true });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <TextField
        label="Endereço do webhook"
        placeholder="https://seusite.com.br/api/revalidate"
        hint="Rota de revalidação do site. Deixe em branco para não enviar avisos."
        error={form.formState.errors.webhookUrl?.message}
        {...form.register('webhookUrl')}
      />
      <FormStatus state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">
        Salvar endereço
      </Button>
    </form>
  );
}
