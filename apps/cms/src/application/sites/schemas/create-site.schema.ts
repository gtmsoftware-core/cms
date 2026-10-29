import { z } from 'zod';

const HOSTNAME = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export const createSiteSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().trim().min(2, 'Informe o nome do site.').max(100, 'Use no máximo 100 caracteres.'),
  primaryDomain: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => value === '' || HOSTNAME.test(value), 'Informe um domínio como "exemplo.com.br".'),
});

export type CreateSiteInput = z.input<typeof createSiteSchema>;
