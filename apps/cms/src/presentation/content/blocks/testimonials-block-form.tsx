'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';
import { ItemList } from '../fields/item-list';
import { newTestimonial } from './block-catalog';

export function TestimonialsBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  return (
    <div className="grid gap-4">
      <HeadingFields index={index} placeholder="Ex.: O que dizem nossos clientes" />
      <ItemList<Page, `${typeof base}.items`> name={`${base}.items`} itemLabel="Depoimento" addLabel="Adicionar depoimento" newItem={newTestimonial}>
        {(item) => (
          <>
            <FormTextField<Page> name={`${base}.items.${item}.quote`} label="Depoimento" multiline />
            <FormTextField<Page> name={`${base}.items.${item}.author`} label="Nome de quem escreveu" />
            <FormTextField<Page> name={`${base}.items.${item}.role`} label="Complemento" hint="Opcional. Ex.: Cliente desde 2020" />
          </>
        )}
      </ItemList>
    </div>
  );
}
