'use client';

import { useState } from 'react';
import type { MediaSummary } from '@/application/media';
import { Button } from '@/presentation/ui';
import { useMediaLibrary } from './media-library-context';
import { MediaThumbnail } from './media-thumbnail';

type MediaPickerProps = { onSelect: (media: MediaSummary) => void };

/** "Escolher da biblioteca": picks an uploaded image and fills address and description. */
export function MediaPicker({ onSelect }: MediaPickerProps) {
  const media = useMediaLibrary();
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => setOpen(!open)}>
        {open ? 'Fechar biblioteca' : 'Escolher da biblioteca'}
      </Button>
      {open &&
        (media.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma imagem na biblioteca. Envie imagens em “Mídia”, na página do site.</p>
        ) : (
          <ul className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5" aria-label="Biblioteca de imagens">
            {media.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="focus-visible:ring-ring w-full rounded-md focus-visible:ring-2 focus-visible:outline-none"
                  aria-label={`Usar ${item.alt || item.filename}`}
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <MediaThumbnail media={item} />
                </button>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
