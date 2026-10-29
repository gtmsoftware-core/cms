/**
 * Applies the Drizzle migrations to the Postgres database in DATABASE_URL.
 * Usage: pnpm --filter cms db:migrate (runs on every deploy, before `next build`).
 * PGlite needs no step: it migrates itself on startup.
 */
import path from 'node:path';
import { z } from 'zod';
import { migratePostgres } from '@/infrastructure/db';

const { DATABASE_URL } = z.object({ DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }) }).parse(process.env);

await migratePostgres(DATABASE_URL, path.resolve('drizzle'));
console.log('Migrations aplicadas.');
