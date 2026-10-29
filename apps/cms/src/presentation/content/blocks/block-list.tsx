'use client';

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { Page } from '@/application/content';
import { BLOCK_TYPES } from '@/application/content/schemas/page.schema';
import { FormTextField } from '@/presentation/forms';
import { Button } from '@/presentation/ui';
import { BLOCK_LABELS, newBlock } from './block-catalog';
import { BlockForm } from './block-form';

export function BlockList() {
  const { control } = useFormContext<Page>();
  // keyName keeps the block's own `id` intact in the rendered fields.
  const { fields, append, remove, move } = useFieldArray({ control, name: 'blocks', keyName: 'key' });

  return (
    <div className="grid gap-4">
      {fields.length === 0 && (
        <p className="text-muted-foreground text-sm">A página ainda não tem blocos. Escolha um abaixo para começar.</p>
      )}
      {fields.map((block, index) => (
        <section key={block.key} className="bg-card grid gap-4 rounded-lg border p-4" aria-label={BLOCK_LABELS[block.type]}>
          <header className="flex items-center justify-between gap-2">
            <h3 className="font-medium">
              {index + 1}. {BLOCK_LABELS[block.type]}
            </h3>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Mover bloco para cima" disabled={index === 0} onClick={() => move(index, index - 1)}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Mover bloco para baixo" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>
                <ArrowDown />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Remover bloco" onClick={() => remove(index)}>
                <Trash2 />
              </Button>
            </div>
          </header>
          <BlockForm type={block.type} index={index} />
          <FormTextField<Page>
            name={`blocks.${index}.menuLabel`}
            label="Mostrar no menu como"
            hint="Opcional. Ex.: Produtos. A seção aparece no menu do site e o link rola até ela."
          />
        </section>
      ))}
      <div className="grid gap-2">
        <p className="text-sm font-medium">Adicionar bloco</p>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((type) => (
            <Button key={type} type="button" variant="outline" size="sm" onClick={() => append(newBlock(type))}>
              {BLOCK_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
