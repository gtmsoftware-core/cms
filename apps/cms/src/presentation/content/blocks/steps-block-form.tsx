'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';
import { ItemList } from '../fields/item-list';
import { newTitledItem } from './block-catalog';

export function StepsBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  return (
    <div className="grid gap-4">
      <HeadingFields index={index} placeholder="Ex.: Comprar é simples" />
      <ItemList<Page, `${typeof base}.items`> name={`${base}.items`} itemLabel="Passo" addLabel="Adicionar passo" newItem={newTitledItem}>
        {(item) => (
          <>
            <FormTextField<Page> name={`${base}.items.${item}.title`} label="Título" />
            <FormTextField<Page> name={`${base}.items.${item}.text`} label="Explicação" multiline />
          </>
        )}
      </ItemList>
    </div>
  );
}
