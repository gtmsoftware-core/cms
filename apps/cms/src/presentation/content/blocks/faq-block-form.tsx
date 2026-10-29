'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';
import { ItemList } from '../fields/item-list';
import { newQuestion } from './block-catalog';

export function FaqBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  return (
    <div className="grid gap-4">
      <HeadingFields index={index} placeholder="Ex.: Dúvidas frequentes" />
      <ItemList<Page, `${typeof base}.items`> name={`${base}.items`} itemLabel="Pergunta" addLabel="Adicionar pergunta" newItem={newQuestion}>
        {(item) => (
          <>
            <FormTextField<Page> name={`${base}.items.${item}.question`} label="Pergunta" />
            <FormTextField<Page> name={`${base}.items.${item}.answer`} label="Resposta" multiline />
          </>
        )}
      </ItemList>
    </div>
  );
}
