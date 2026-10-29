'use client';

import type { Page } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';
import { ImageField, LinkField } from '../fields/media-fields';
import { TagsField } from '../fields/tags-field';

export function AboutBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  return (
    <div className="grid gap-4">
      <FormTextField<Page> name={`${base}.eyebrow`} label="Chamada acima do título" hint="Opcional. Ex.: Direcionamento certo" />
      <HeadingFields index={index} label="Título" />
      <FormTextField<Page> name={`${base}.text`} label="Texto" hint="Deixe uma linha em branco para separar parágrafos." multiline />
      <ImageField<Page> name={`${base}.image`} legend="Foto" />
      <TagsField<Page> name={`${base}.tags`} label="Tópicos" hint="Separe por vírgulas. Ex.: Dica do dia, Evolução, Exercícios" />
      <LinkField<Page> name={`${base}.link`} legend="Link" />
    </div>
  );
}
