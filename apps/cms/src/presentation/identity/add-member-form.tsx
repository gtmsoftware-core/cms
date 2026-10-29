'use client';

import { Controller } from 'react-hook-form';
import { addMemberSchema } from '@/application/identity/schemas/add-member.schema';
import type { AddMemberInput } from '@/application/identity';
import { FormStatus, TextField, useActionForm, type FormAction } from '@/presentation/forms';
import { Button } from '@/presentation/ui';
import { RoleSelect } from './role-select';

type AddMemberFormProps = { tenantId: string; action: FormAction<AddMemberInput> };

export function AddMemberForm({ tenantId, action }: AddMemberFormProps) {
  const defaults = { tenantId, email: '', name: '', role: 'editor', password: '' } as const;
  const { form, state, pending, onSubmit } = useActionForm(addMemberSchema, action, defaults);
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <TextField label="Nome" autoComplete="off" error={errors.name?.message} {...form.register('name')} />
      <TextField label="E-mail" type="email" autoComplete="off" error={errors.email?.message} {...form.register('email')} />
      <TextField
        label="Senha inicial"
        type="password"
        autoComplete="new-password"
        hint="Obrigatória só se a pessoa ainda não tiver conta."
        error={errors.password?.message}
        {...form.register('password')}
      />
      <Controller
        control={form.control}
        name="role"
        render={({ field }) => <RoleSelect value={field.value} onChange={field.onChange} />}
      />
      <FormStatus state={state} />
      <Button type="submit" disabled={pending}>
        Adicionar pessoa
      </Button>
    </form>
  );
}
