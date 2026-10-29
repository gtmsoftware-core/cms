'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { ImageField } from '../fields/media-fields';

export function PageFields() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextField<Page> name="title" label="Título da página" />
        <FormTextField<Page> name="slug" label="Endereço" hint="Letras minúsculas, números e hífens." />
      </div>
      <details className="rounded-md border p-3">
        <summary className="cursor-pointer text-sm font-medium">Aparência no Google e nas redes sociais</summary>
        <div className="mt-4 grid gap-4">
          <FormTextField<Page> name="seo.title" label="Título para o Google" hint="Opcional. Até 70 caracteres. Se vazio, usa o título da página." />
          <FormTextField<Page> name="seo.description" label="Descrição para o Google" hint="Opcional. Até 160 caracteres." multiline />
          <ImageField<Page> name="seo.image" legend="Imagem ao compartilhar" />
        </div>
      </details>
    </div>
  );
}
