import type { UserAccounts } from '@/application/identity';
import type { UserId } from '@/domain/identity';
import type { Auth } from './better-auth';

/**
 * Public sign-up is disabled, so accounts are created through Better Auth's internal adapter,
 * the same path its own sign-up route uses (hash, create user, link credential account).
 */
export function createBetterAuthUserAccounts(auth: Auth): UserAccounts {
  return {
    async register({ email, name, password, isSuperadmin }) {
      const ctx = await auth.$context;
      const hash = await ctx.password.hash(password);
      const user = await ctx.internalAdapter.createUser(
        { email, name, emailVerified: false, isSuperadmin },
        { method: 'email-password' },
      );
      await ctx.internalAdapter.linkAccount({ userId: user.id, providerId: 'credential', accountId: user.id, password: hash });
      return user.id as UserId;
    },
  };
}
