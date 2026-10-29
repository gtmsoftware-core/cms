import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { PASSWORD_MIN_LENGTH } from '@/application/identity/schemas/credentials';
import { tables, type Database } from '@/infrastructure/db';
import { newId } from '@/shared/ids';

export type AuthOptions = Readonly<{ db: Database; secret: string; baseURL: string }>;

const ID_PREFIXES: Readonly<Record<string, string>> = {
  user: 'usr',
  session: 'ses',
  account: 'acc',
  verification: 'ver',
};

export function createAuth({ db, secret, baseURL }: AuthOptions) {
  return betterAuth({
    secret,
    baseURL,
    database: drizzleAdapter(db, {
      provider: 'pg',
      usePlural: true,
      schema: {
        users: tables.users,
        sessions: tables.sessions,
        accounts: tables.accounts,
        verifications: tables.verifications,
      },
    }),
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: PASSWORD_MIN_LENGTH },
    user: {
      additionalFields: { isSuperadmin: { type: 'boolean', defaultValue: false, input: false } },
    },
    advanced: {
      database: { generateId: ({ model }) => newId(ID_PREFIXES[model] ?? model) },
    },
    // nextCookies must be the last plugin so server actions can set the session cookie.
    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
