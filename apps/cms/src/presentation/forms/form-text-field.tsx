'use client';

import { useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { Input, Textarea } from '@/presentation/ui';
import { errorAt } from './field-errors';
import { FieldShell } from './field-shell';

type FormTextFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  type?: 'text' | 'email' | 'tel' | 'url' | 'color';
};

/** Text input bound to the surrounding FormProvider by path. */
export function FormTextField<T extends FieldValues>(props: FormTextFieldProps<T>) {
  const { name, label, hint, placeholder, multiline, type = 'text' } = props;
  const { register, formState } = useFormContext<T>();
  const error = errorAt(formState.errors, name);
  return (
    <FieldShell id={name} label={label} hint={hint} error={error}>
      {(describedBy) => {
        const control = { id: name, placeholder, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy };
        return multiline ? (
          <Textarea {...control} {...register(name)} />
        ) : (
          <Input type={type} {...control} {...register(name)} />
        );
      }}
    </FieldShell>
  );
}
