import type { UserId } from '@/domain/identity';

export type NewAccount = Readonly<{ email: string; name: string; password: string; isSuperadmin: boolean }>;

/** Creates login credentials. Implemented by the auth library adapter. */
export interface UserAccounts {
  register(account: NewAccount): Promise<UserId>;
}

/** Session handling for the current request. */
export interface Authenticator {
  signIn(email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  currentUserId(): Promise<UserId | null>;
}

/** Limits repeated attempts for a key (e.g. login by e-mail). Returns false when the limit is exceeded. */
export interface RateLimiter {
  attempt(key: string): boolean;
}
