import { z } from 'zod';

const R2_KEYS = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL'] as const;

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PGLITE_DATA_DIR: z.string().min(1).default('.data/pglite'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET precisa de pelo menos 32 caracteres.'),
  BETTER_AUTH_URL: z.url(),
  /** 32 bytes in base64 (`openssl rand -base64 32`). Encrypts webhook secrets at rest. */
  WEBHOOK_ENCRYPTION_KEY: z
    .string()
    .refine((value) => Buffer.from(value, 'base64').length === 32, 'WEBHOOK_ENCRYPTION_KEY precisa ter 32 bytes em base64.'),
  /** Bearer token required by /api/cron/webhooks. */
  CRON_SECRET: z.string().min(32, 'CRON_SECRET precisa de pelo menos 32 caracteres.'),
  /** Local media folder, used while R2 is not configured. */
  MEDIA_LOCAL_DIR: z.string().min(1).default('.data/media'),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  R2_PUBLIC_URL: z.url().optional(),
});

/** R2 is all or nothing: a half-configured bucket would silently fall back to the local disk. */
const envSchema = baseSchema.superRefine((env, ctx) => {
  const present = R2_KEYS.filter((key) => env[key] !== undefined);
  if (present.length > 0 && present.length < R2_KEYS.length) {
    const missing = R2_KEYS.filter((key) => env[key] === undefined);
    ctx.addIssue({ code: 'custom', message: `Configure todas as variáveis do R2. Faltam: ${missing.join(', ')}.` });
  }
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Variáveis de ambiente inválidas:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
