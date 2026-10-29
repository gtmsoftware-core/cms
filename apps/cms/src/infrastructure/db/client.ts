import { mkdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { drizzle, type PgliteDatabase, type PgliteQueryResultHKT } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from './schema';

export type Database = PgliteDatabase<typeof schema>;

/** The database or an open transaction: repositories work on either, so a unit of work can bind them. */
export type Executor = PgDatabase<PgliteQueryResultHKT, typeof schema>;

export type DatabaseOptions = Readonly<{
  /** Directory for PGlite files. Omit for an in-memory database (tests). */
  dataDir?: string;
  migrationsFolder: string;
}>;

export async function createDatabase({ dataDir, migrationsFolder }: DatabaseOptions): Promise<Database> {
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder });
  return db;
}
