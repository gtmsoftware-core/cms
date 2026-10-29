'use client';

import type { ReactNode } from 'react';
import { useController, useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { errorAt } from '@/presentation/forms';
import { Input, Label } from '@/presentation/ui';
import { readGroup, toOptionalGroup } from './optional-group';

export type GroupInput<K extends string> = Readonly<{ key: K; label: string; placeholder?: string }>;

type GroupFieldProps<T extends FieldValues, K extends string> = {
  name: Path<T>;
  legend: string;
  hint?: string;
  inputs: readonly GroupInput<K>[];
  /** Extra control that fills the whole group at once (e.g. the media picker). */
  filler?: (apply: (values: Record<K, string>) => void) => ReactNode;
};

/**
 * Optional group of text inputs (an image or a link). Leaving every input empty stores null,
 * so the editor never has to toggle the group on or off.
 */
export function GroupField<T extends FieldValues, K extends string>(props: GroupFieldProps<T, K>) {
  const { name, legend, hint, inputs, filler } = props;
  const { control, formState } = useFormContext<T>();
  const { field } = useController({ control, name });
  const keys = inputs.map((input) => input.key);
  const values = readGroup(field.value, keys);

  return (
    <fieldset className="grid gap-3 rounded-md border p-3">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
      {filler?.((next) => field.onChange(toOptionalGroup(next)))}
      {inputs.map(({ key, label, placeholder }) => {
        const id = `${name}.${key}`;
        const error = errorAt(formState.errors, id);
        return (
          <div key={key} className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
              id={id}
              value={values[key]}
              placeholder={placeholder}
              aria-invalid={Boolean(error)}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(toOptionalGroup({ ...values, [key]: event.target.value }))}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );
      })}
    </fieldset>
  );
}
