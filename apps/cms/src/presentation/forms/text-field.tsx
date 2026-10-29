import type { ComponentProps } from 'react';
import { Input } from '@/presentation/ui';
import { FieldShell } from './field-shell';

type TextFieldProps = ComponentProps<typeof Input> & {
  name: string;
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, ...input }: TextFieldProps) {
  const id = input.id ?? input.name;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      {(describedBy) => <Input id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...input} />}
    </FieldShell>
  );
}
