'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';
import { ItemList } from '../fields/item-list';
import { newTitledItem } from './block-catalog';

export function NumberedCardsBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  return (
    <div className="grid gap-4">
      <HeadingFields index={index} placeholder="Ex.: Escolha pelo objetivo" />
      <FormTextField<Page> name={`${base}.intro`} label="Texto de apoio" multiline />
      <ItemList<Page, `${typeof base}.items`> name={`${base}.items`} itemLabel="Cartão" addLabel="Adicionar cartão" newItem={newTitledItem}>
        {(item) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField<Page> name={`${base}.items.${item}.title`} label="Título" />
            <FormTextField<Page> name={`${base}.items.${item}.text`} label="Texto curto" />
          </div>
        )}
      </ItemList>
      <p className="text-muted-foreground text-sm">A numeração (01, 02...) é feita automaticamente.</p>
    </div>
  );
}
