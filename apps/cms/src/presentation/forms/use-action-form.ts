import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm, type DefaultValues, type FieldValues } from 'react-hook-form';
import type { z } from 'zod';
import { idleState, type ActionState } from '@/shared/action-state';

/** Server action received by props. Schemas are idempotent, so validated values are valid input again. */
export type FormAction<TInput> = (input: TInput) => Promise<ActionState>;

export type ActionFormOptions = Readonly<{
  /** Editing forms keep the saved values (and clear the dirty state) instead of going back to the defaults. */
  keepValues?: boolean;
}>;

export function useActionForm<TInput extends FieldValues, TOutput extends FieldValues>(
  schema: z.ZodType<TOutput, TInput>,
  action: FormAction<TOutput>,
  defaultValues: DefaultValues<TInput>,
  { keepValues = false }: ActionFormOptions = {},
) {
  const form = useForm<TInput, unknown, TOutput>({ resolver: zodResolver(schema), defaultValues });
  const [state, setState] = useState<ActionState>(idleState);
  const [pending, startTransition] = useTransition();

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await action(values);
      setState(result);
      if (result.status !== 'success') return;
      if (keepValues) form.reset(form.getValues());
      else form.reset();
    }),
  );

  return { form, state, pending, onSubmit };
}
