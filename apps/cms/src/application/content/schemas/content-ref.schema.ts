import { z } from 'zod';

export const siteRefSchema = z.object({ tenantId: z.string().min(1), siteId: z.string().min(1) });

export type SiteRef = z.input<typeof siteRefSchema>;

export const contentRefSchema = siteRefSchema.extend({ contentId: z.string().min(1) });

export type ContentRef = z.input<typeof contentRefSchema>;

/** Version the editor loaded; a stale one means someone else saved in between. */
export const versionSchema = z.number().int().nonnegative();

export const versionedRefSchema = contentRefSchema.extend({ version: versionSchema });

export type VersionedContentRef = z.input<typeof versionedRefSchema>;
