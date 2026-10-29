'use client';

import { useController, useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { errorAt, hasErrorAt } from '@/presentation/forms';
import { Input, Label } from '@/presentation/ui';

type TagsFieldProps<T extends FieldValues> = { name: Path<T>; label: string; hint?: string };

const toList = (text: string) => text.split(',').map((tag) => tag.trim()).filter(Boolean);
const toText = (value: unknown) => (Array.isArray(value) ? value.filter((tag) => typeof tag === 'string').join(', ') : '');

/** A list of short labels typed in one input, separated by commas. */
export function TagsField<T extends FieldValues>({ name, label, hint }: TagsFieldProps<T>) {
  const { control, formState } = useFormContext<T>();
  const { field } = useController({ control, name });
  const error = errorAt(formState.errors, name) ?? (hasErrorAt(formState.errors, name) ? 'Use até 40 caracteres por item.' : undefined);

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        defaultValue={toText(field.value)}
        aria-invalid={Boolean(error)}
        onBlur={(event) => {
          field.onChange(toList(event.target.value));
          field.onBlur();
        }}
      />
      {hint && !error && <p className="text-muted-foreground text-sm">{hint}</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
