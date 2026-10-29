import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do cliente.').max(100, 'Use no máximo 100 caracteres.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Informe o identificador.')
    .max(63, 'Use no máximo 63 caracteres.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens.'),
});

export type CreateTenantInput = z.input<typeof createTenantSchema>;
