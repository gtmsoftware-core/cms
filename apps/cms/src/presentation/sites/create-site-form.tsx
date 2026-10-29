'use client';

import { createSiteSchema } from '@/application/sites/schemas/create-site.schema';
import type { CreateSiteInput } from '@/application/sites';
import { FormStatus, TextField, useActionForm, type FormAction } from '@/presentation/forms';
import { Button } from '@/presentation/ui';

type CreateSiteFormProps = { tenantId: string; action: FormAction<CreateSiteInput> };

export function CreateSiteForm({ tenantId, action }: CreateSiteFormProps) {
  const defaults = { tenantId, name: '', primaryDomain: '' };
  const { form, state, pending, onSubmit } = useActionForm(createSiteSchema, action, defaults);
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <TextField label="Nome do site" error={errors.name?.message} {...form.register('name')} />
      <TextField
        label="Domínio principal"
        hint="Opcional. Ex.: clinicasorriso.com.br"
        error={errors.primaryDomain?.message}
        {...form.register('primaryDomain')}
      />
      <FormStatus state={state} />
      <Button type="submit" disabled={pending}>
        Criar site
      </Button>
    </form>
  );
}
