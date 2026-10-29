import { z } from 'zod';

const siteRef = { tenantId: z.string().min(1), siteId: z.string().min(1) };

export const altSchema = z.string().trim().max(200, 'Use no máximo 200 caracteres.');

/** Form fields of an upload. The file bytes are checked by the domain (type by content, size). */
export const uploadMediaSchema = z.object({
  ...siteRef,
  alt: altSchema,
  filename: z.string().trim().min(1).max(255),
});

export type UploadMediaFields = z.input<typeof uploadMediaSchema>;

export type UploadMediaInput = UploadMediaFields & Readonly<{ bytes: Uint8Array<ArrayBuffer> }>;

export const mediaRefSchema = z.object({ ...siteRef, mediaId: z.string().min(1) });

export type MediaRef = z.input<typeof mediaRefSchema>;

export const mediaSiteRefSchema = z.object(siteRef);

export type MediaSiteRef = z.input<typeof mediaSiteRefSchema>;
