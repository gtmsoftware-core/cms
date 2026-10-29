import { mkdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { migrate as migratePostgresJs } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';

/** Driver-agnostic handle: PGlite in development and tests, Postgres (Neon) in production. */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** The database or an open transaction: repositories work on either, so a unit of work can bind them. */
export type Executor = Database;

export type PgliteOptions = Readonly<{
  /** Directory for PGlite files. Omit for an in-memory database (tests). */
  dataDir?: string;
  migrationsFolder: string;
}>;

export async function createPgliteDatabase({ dataDir, migrationsFolder }: PgliteOptions): Promise<Database> {
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  const db = drizzlePglite({ client, schema });
  await migratePglite(db, { migrationsFolder });
  return db;
}

/**
 * Connects to a Postgres server. Migrations do not run here: concurrent serverless
 * cold starts would race, so they run once per deploy (`pnpm db:migrate`).
 */
export function createPostgresDatabase(url: string): Database {
  // prepare: false keeps the client compatible with transaction-mode poolers (Neon, Supabase).
  const client = postgres(url, { prepare: false });
  return drizzlePostgres({ client, schema });
}

export async function migratePostgres(url: string, migrationsFolder: string): Promise<void> {
  const client = postgres(url, { prepare: false, max: 1 });
  try {
    await migratePostgresJs(drizzlePostgres({ client }), { migrationsFolder });
  } finally {
    await client.end();
  }
}
