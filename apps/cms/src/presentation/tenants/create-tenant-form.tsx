'use client';

import { createTenantSchema } from '@/application/tenants/schemas/create-tenant.schema';
import type { CreateTenantInput } from '@/application/tenants';
import { FormStatus, TextField, useActionForm, type FormAction } from '@/presentation/forms';
import { Button } from '@/presentation/ui';

export function CreateTenantForm({ action }: { action: FormAction<CreateTenantInput> }) {
  const { form, state, pending, onSubmit } = useActionForm(createTenantSchema, action, { name: '', slug: '' });
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <TextField label="Nome do cliente" error={errors.name?.message} {...form.register('name')} />
      <TextField
        label="Identificador"
        hint="Aparece no endereço do painel. Ex.: clinica-sorriso"
        error={errors.slug?.message}
        {...form.register('slug')}
      />
      <FormStatus state={state} />
      <Button type="submit" disabled={pending}>
        Criar cliente
      </Button>
    </form>
  );
}
