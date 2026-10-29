'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { MediaSummary } from '@/application/media';

const MediaLibraryContext = createContext<readonly MediaSummary[]>([]);

/** Makes the site's images available to every image field of a form, however deep. */
export function MediaLibraryProvider({ media, children }: { media: readonly MediaSummary[]; children: ReactNode }) {
  return <MediaLibraryContext value={media}>{children}</MediaLibraryContext>;
}

export const useMediaLibrary = () => useContext(MediaLibraryContext);
