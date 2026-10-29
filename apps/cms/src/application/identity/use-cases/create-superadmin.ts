import { EmailAlreadyInUseError, type UserId, type UserRepository } from '@/domain/identity';
import type { UserAccounts } from '../ports';
import { createSuperadminSchema, type CreateSuperadminInput } from '../schemas/create-superadmin.schema';

export type CreateSuperadminDeps = Readonly<{ users: UserRepository; accounts: UserAccounts }>;

/** Bootstrap only: called from the CLI script, never from an HTTP route. */
export function makeCreateSuperadmin({ users, accounts }: CreateSuperadminDeps) {
  return async function createSuperadmin(input: CreateSuperadminInput): Promise<UserId> {
    const data = createSuperadminSchema.parse(input);
    if (await users.findByEmail(data.email)) throw new EmailAlreadyInUseError();
    return accounts.register({ ...data, isSuperadmin: true });
  };
}
