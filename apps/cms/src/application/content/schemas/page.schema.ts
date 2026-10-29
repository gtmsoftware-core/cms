import { BLOCK_TYPES, emptyRichText, pageSchema, richTextSchema, slugSchema } from '@gtmsoftware-core/cms-sdk';
import type { z } from 'zod';
import { contentRefSchema, siteRefSchema, versionSchema } from './content-ref.schema';

/** Re-exported for the editor forms, which may only import application schemas. */
export { BLOCK_TYPES, emptyRichText, pageSchema, richTextSchema };

export const createPageSchema = siteRefSchema.extend({
  title: pageSchema.shape.title,
  slug: slugSchema,
});

export type CreatePageInput = z.input<typeof createPageSchema>;

export const savePageSchema = contentRefSchema.extend({ version: versionSchema, page: pageSchema });

export type SavePageInput = z.input<typeof savePageSchema>;
