'use client';

import type { CreatePageInput, SiteRef } from '@/application/content';
import { createPageSchema } from '@/application/content/schemas/page.schema';
import { FormStatus, TextField, useActionForm, type FormAction } from '@/presentation/forms';
import { Button } from '@/presentation/ui';

type CreatePageFormProps = { site: SiteRef; action: FormAction<CreatePageInput> };

export function CreatePageForm({ site, action }: CreatePageFormProps) {
  const defaults = { ...site, title: '', slug: '' };
  const { form, state, pending, onSubmit } = useActionForm(createPageSchema, action, defaults);
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <TextField label="Título da página" error={errors.title?.message} {...form.register('title')} />
      <TextField
        label="Endereço"
        hint='Aparece no link da página. Ex.: "servicos" vira seusite.com.br/servicos. Use "inicio" para a página inicial.'
        error={errors.slug?.message}
        {...form.register('slug')}
      />
      <FormStatus state={state} />
      <Button type="submit" disabled={pending}>
        Criar página
      </Button>
    </form>
  );
}
