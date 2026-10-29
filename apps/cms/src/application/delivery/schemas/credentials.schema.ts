import { z } from 'zod';

/** Format of keys produced by the ApiKeys adapter. Anything else is rejected before any lookup. */
export const API_KEY_PATTERN = /^cms_live_[A-Za-z0-9_-]{32,64}$/;

/** Values taken from the request: the site id in the path and the `Authorization: Bearer` header. */
export const deliveryCredentialsSchema = z.object({
  siteId: z.string().min(1).max(64),
  authorization: z
    .string()
    .startsWith('Bearer ')
    .transform((header) => header.slice('Bearer '.length).trim())
    .pipe(z.string().regex(API_KEY_PATTERN)),
});

export type DeliveryCredentialsInput = z.input<typeof deliveryCredentialsSchema>;
