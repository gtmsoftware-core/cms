'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';

type HeadingFieldsProps = { index: number; label?: string; placeholder?: string };

/** Section title plus the words shown in the accent color. */
export function HeadingFields({ index, label = 'Título da seção', placeholder }: HeadingFieldsProps) {
  const base = `blocks.${index}` as const;
  return (
    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
      <FormTextField<Page> name={`${base}.heading`} label={label} placeholder={placeholder} />
      <FormTextField<Page>
        name={`${base}.highlight`}
        label="Destaque no título"
        hint="Opcional. Palavras do título que ficam coloridas."
      />
    </div>
  );
}
