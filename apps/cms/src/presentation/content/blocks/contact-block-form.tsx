'use client';

import { useFormContext } from 'react-hook-form';
import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';

export function ContactBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  const { register } = useFormContext<Page>();
  return (
    <div className="grid gap-4">
      <HeadingFields index={index} />
      <FormTextField<Page> name={`${base}.text`} label="Texto" multiline />
      <p className="text-muted-foreground text-sm">Telefone, WhatsApp, e-mail e endereço vêm das configurações do site.</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4" {...register(`${base}.showMap`)} />
        Mostrar mapa com o endereço
      </label>
    </div>
  );
}
