'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';
import { LinkField } from '../fields/media-fields';

export function CtaBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  return (
    <div className="grid gap-4">
      <HeadingFields index={index} label="Título" placeholder="Ex.: Entregamos em toda a região" />
      <FormTextField<Page> name={`${base}.text`} label="Texto de apoio" multiline />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextField<Page> name={`${base}.button.label`} label="Texto do botão" />
        <FormTextField<Page> name={`${base}.button.href`} label="Endereço do link" placeholder="#whatsapp, /contato ou https://..." />
      </div>
      <LinkField<Page> name={`${base}.secondaryButton`} legend="Segundo botão" />
    </div>
  );
}
