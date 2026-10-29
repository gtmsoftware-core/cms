'use client';

import type { Page } from '@/application/content';
import { RichTextField } from '../fields/rich-text-field';

export function RichTextBlockForm({ index }: { index: number }) {
  return <RichTextField<Page> name={`blocks.${index}.content`} label="Texto" />;
}
