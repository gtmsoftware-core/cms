'use client';

import type { FieldValues, Path } from 'react-hook-form';
import { MediaPicker } from '@/presentation/media';
import { GroupField, type GroupInput } from './group-field';

const IMAGE_INPUTS: readonly GroupInput<'url' | 'alt'>[] = [
  { key: 'url', label: 'Endereço da imagem', placeholder: 'https://...' },
  { key: 'alt', label: 'Descrição da imagem', placeholder: 'Ex.: Recepção da clínica' },
];

const LINK_INPUTS: readonly GroupInput<'label' | 'href'>[] = [
  { key: 'label', label: 'Texto do botão', placeholder: 'Ex.: Agende pelo WhatsApp' },
  { key: 'href', label: 'Endereço do link', placeholder: '#whatsapp, /contato ou https://...' },
];

type OptionalFieldProps<T extends FieldValues> = { name: Path<T>; legend: string };

export function ImageField<T extends FieldValues>({ name, legend }: OptionalFieldProps<T>) {
  return (
    <GroupField<T, 'url' | 'alt'>
      name={name}
      legend={legend}
      hint="Opcional. Escolha da biblioteca ou cole um endereço. Deixe em branco para não usar imagem."
      inputs={IMAGE_INPUTS}
      filler={(apply) => <MediaPicker onSelect={(media) => apply({ url: media.url, alt: media.alt })} />}
    />
  );
}

export function LinkField<T extends FieldValues>({ name, legend }: OptionalFieldProps<T>) {
  return (
    <GroupField<T, 'label' | 'href'>
      name={name}
      legend={legend}
      hint="Opcional. Use #whatsapp para abrir o WhatsApp das configurações. Deixe em branco para não mostrar o botão."
      inputs={LINK_INPUTS}
    />
  );
}
