'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';
import { ItemList } from '../fields/item-list';
import { ImageField } from '../fields/media-fields';
import { newProduct } from './block-catalog';

export function ProductsBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  return (
    <div className="grid gap-4">
      <HeadingFields index={index} placeholder="Ex.: Mais pedidos" />
      <FormTextField<Page>
        name={`${base}.buttonLabel`}
        label="Texto do botão de cada produto"
        hint="O botão abre o WhatsApp com o nome do produto na mensagem."
      />
      <ItemList<Page, `${typeof base}.items`> name={`${base}.items`} itemLabel="Produto" addLabel="Adicionar produto" newItem={newProduct}>
        {(item) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormTextField<Page> name={`${base}.items.${item}.name`} label="Nome" />
              <FormTextField<Page> name={`${base}.items.${item}.category`} label="Categoria" placeholder="Ex.: Proteína" />
              <FormTextField<Page> name={`${base}.items.${item}.tag`} label="Etiqueta" placeholder="Ex.: Mais vendido" />
              <FormTextField<Page> name={`${base}.items.${item}.price`} label="Preço" hint="Opcional. Ex.: R$ 129,90" />
            </div>
            <ImageField<Page> name={`${base}.items.${item}.image`} legend="Foto do produto" />
          </>
        )}
      </ItemList>
    </div>
  );
}
