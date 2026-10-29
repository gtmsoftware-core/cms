import { z } from 'zod';
import { pageSchema, siteSettingsSchema } from './content-types';

/*
 * Response bodies of the Content Delivery API (/api/v1). The CMS validates every response with these
 * schemas before sending it, and the client validates again on arrival.
 */

export const API_VERSION = 'v1';

export const pageSummarySchema = z.object({
  slug: pageSchema.shape.slug,
  title: pageSchema.shape.title,
  updatedAt: z.iso.datetime(),
});

export type PageSummary = z.infer<typeof pageSummarySchema>;

export const pageListResponseSchema = z.object({ pages: z.array(pageSummarySchema) });

export type PageListResponse = z.infer<typeof pageListResponseSchema>;

export const pageResponseSchema = z.object({ page: pageSchema, updatedAt: z.iso.datetime() });

export type PageResponse = z.infer<typeof pageResponseSchema>;

export const settingsResponseSchema = z.object({ settings: siteSettingsSchema, updatedAt: z.iso.datetime() });

export type SettingsResponse = z.infer<typeof settingsResponseSchema>;

export const errorResponseSchema = z.object({ error: z.enum(['unauthorized', 'not_found', 'rate_limited']) });

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
