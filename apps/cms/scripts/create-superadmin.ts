/**
 * Creates the operator account (superadmin).
 * Usage: SUPERADMIN_PASSWORD='...' pnpm --filter cms superadmin:create --email voce@exemplo.com --name "Seu nome"
 * The password comes from an environment variable so it does not land in the shell history.
 * With PGlite, stop `pnpm dev` first: it allows only one process per data directory.
 * With DATABASE_URL set, the account is created in that Postgres database.
 */
import { parseArgs } from 'node:util';
import { getContainer } from '@/composition/container';

const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' } } });

const container = await getContainer();
const userId = await container.createSuperadmin({
  email: values.email ?? '',
  name: values.name ?? '',
  password: process.env.SUPERADMIN_PASSWORD ?? '',
});
console.log(`Superadmin criado: ${userId}`);
// PGlite keeps the event loop alive; end the process explicitly.
process.exit(0);
