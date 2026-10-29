'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';
import { ImageField, LinkField } from '../fields/media-fields';

export function HeroBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  return (
    <div className="grid gap-4">
      <FormTextField<Page> name={`${base}.eyebrow`} label="Selo acima do título" hint="Opcional. Ex.: Natuba · Paraíba" />
      <HeadingFields index={index} label="Título" />
      <FormTextField<Page> name={`${base}.subheading`} label="Texto de apoio" multiline />
      <ImageField<Page> name={`${base}.image`} legend="Imagem (logo ou foto)" />
      <div className="grid gap-4 md:grid-cols-2">
        <LinkField<Page> name={`${base}.button`} legend="Botão principal" />
        <LinkField<Page> name={`${base}.secondaryButton`} legend="Botão secundário" />
      </div>
    </div>
  );
}
