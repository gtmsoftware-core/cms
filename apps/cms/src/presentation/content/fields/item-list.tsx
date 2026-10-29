'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useFieldArray, useFormContext, type FieldArray, type FieldArrayPath, type FieldValues } from 'react-hook-form';
import { arrayErrorAt } from '@/presentation/forms';
import { Button } from '@/presentation/ui';

type ItemListProps<T extends FieldValues, N extends FieldArrayPath<T>> = {
  name: N;
  itemLabel: string;
  addLabel: string;
  newItem: () => FieldArray<T, N>;
  children: (index: number) => ReactNode;
};

/** Repeatable items (services, questions, photos...) with add, remove and reorder. */
export function ItemList<T extends FieldValues, N extends FieldArrayPath<T>>(props: ItemListProps<T, N>) {
  const { name, itemLabel, addLabel, newItem, children } = props;
  const { control, formState } = useFormContext<T>();
  const { fields, append, remove, move } = useFieldArray<T, N>({ control, name });
  const error = arrayErrorAt(formState.errors, name);

  return (
    <div className="grid gap-3">
      {fields.map((field, index) => (
        <div key={field.id} className="grid gap-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {itemLabel} {index + 1}
            </span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Mover para cima" disabled={index === 0} onClick={() => move(index, index - 1)}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Mover para baixo" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>
                <ArrowDown />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${itemLabel.toLowerCase()}`} onClick={() => remove(index)}>
                <Trash2 />
              </Button>
            </div>
          </div>
          {children(index)}
        </div>
      ))}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => append(newItem())}>
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}
