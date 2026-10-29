/**
 * Creates the operator account (superadmin).
 * Usage: SUPERADMIN_PASSWORD='...' pnpm --filter cms superadmin:create --email voce@exemplo.com --name "Seu nome"
 * The password comes from an environment variable so it does not land in the shell history.
 * Stop `pnpm dev` first: PGlite allows only one process per data directory.
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
