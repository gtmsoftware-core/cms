'use client';

import { signInSchema } from '@/application/identity/schemas/sign-in.schema';
import { FormStatus, TextField, useActionForm, type FormAction } from '@/presentation/forms';
import { Button } from '@/presentation/ui';
import type { SignInInput } from '@/application/identity';

export function LoginForm({ action }: { action: FormAction<SignInInput> }) {
  const { form, state, pending, onSubmit } = useActionForm(signInSchema, action, { email: '', password: '' });
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <TextField label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...form.register('email')} />
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <FormStatus state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
