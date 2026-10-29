'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { ItemList } from '../fields/item-list';
import { newTitledItem } from './block-catalog';

export function FeaturesBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  return (
    <ItemList<Page, `${typeof base}.items`> name={`${base}.items`} itemLabel="Diferencial" addLabel="Adicionar diferencial" newItem={newTitledItem}>
      {(item) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormTextField<Page> name={`${base}.items.${item}.title`} label="Título" placeholder="Ex.: Entrega rápida" />
          <FormTextField<Page> name={`${base}.items.${item}.text`} label="Texto curto" />
        </div>
      )}
    </ItemList>
  );
}
