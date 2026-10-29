'use client';

import { useFormContext } from 'react-hook-form';
import type { Page } from '@/application/content';
import { MediaPicker } from '@/presentation/media';
import { FormTextField } from '@/presentation/forms';
import { HeadingFields } from '../fields/heading-fields';
import { ItemList } from '../fields/item-list';
import { newImage } from './block-catalog';

export function GalleryBlockForm({ index }: { index: number }) {
  const base = `blocks.${index}` as const;
  const { setValue } = useFormContext<Page>();
  return (
    <div className="grid gap-4">
      <HeadingFields index={index} />
      <ItemList<Page, `${typeof base}.images`> name={`${base}.images`} itemLabel="Foto" addLabel="Adicionar foto" newItem={newImage}>
        {(item) => (
          <>
            <MediaPicker
              onSelect={(media) =>
                setValue(`${base}.images.${item}`, { url: media.url, alt: media.alt }, { shouldDirty: true, shouldValidate: true })
              }
            />
            <FormTextField<Page> name={`${base}.images.${item}.url`} label="Endereço da imagem" placeholder="https://..." />
            <FormTextField<Page> name={`${base}.images.${item}.alt`} label="Descrição da imagem" />
          </>
        )}
      </ItemList>
    </div>
  );
}
