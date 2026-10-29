import { z } from 'zod';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** HTTPS only; plain HTTP is accepted for local development hosts. */
export const webhookUrlSchema = z
  .string()
  .trim()
  .max(2048, 'Use no máximo 2048 caracteres.')
  .refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return url.protocol === 'https:' || (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname));
  }, 'Informe um endereço completo com https://, por exemplo https://seusite.com.br/api/revalidate.');

export const setWebhookUrlSchema = z.object({
  tenantId: z.string().min(1),
  siteId: z.string().min(1),
  webhookUrl: z.union([z.literal(''), webhookUrlSchema]),
});

export type SetWebhookUrlInput = z.input<typeof setWebhookUrlSchema>;

export const webhookSiteRefSchema = z.object({ tenantId: z.string().min(1), siteId: z.string().min(1) });

export type WebhookSiteRef = z.input<typeof webhookSiteRefSchema>;
