import { APIError } from 'better-auth/api';
import { headers } from 'next/headers';
import type { Authenticator } from '@/application/identity';
import type { UserId } from '@/domain/identity';
import type { Auth } from './better-auth';

export function createBetterAuthAuthenticator(auth: Auth): Authenticator {
  return {
    async signIn(email, password) {
      try {
        await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
        return true;
      } catch (error) {
        if (error instanceof APIError) return false;
        throw error;
      }
    },
    async signOut() {
      await auth.api.signOut({ headers: await headers() });
    },
    async currentUserId() {
      const session = await auth.api.getSession({ headers: await headers() });
      return session ? (session.user.id as UserId) : null;
    },
  };
}
