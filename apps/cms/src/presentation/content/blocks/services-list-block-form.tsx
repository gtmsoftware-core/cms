'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';
import { ItemList } from '../fields/item-list';
import { newService } from './block-catalog';

export function ServicesListBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  return (
    <div className="grid gap-4">
      <HeadingFields index={index} placeholder="Ex.: Nossos serviços" />
      <ItemList<Page, `${typeof base}.items`> name={`${base}.items`} itemLabel="Serviço" addLabel="Adicionar serviço" newItem={newService}>
        {(item) => (
          <>
            <FormTextField<Page> name={`${base}.items.${item}.title`} label="Nome" />
            <FormTextField<Page> name={`${base}.items.${item}.description`} label="Descrição" multiline />
            <FormTextField<Page> name={`${base}.items.${item}.price`} label="Preço" hint="Opcional. Ex.: A partir de R$ 150" />
          </>
        )}
      </ItemList>
    </div>
  );
}
