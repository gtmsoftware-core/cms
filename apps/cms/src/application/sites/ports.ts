import type { ApiKeyCredential } from '@/domain/sites';

export type IssuedApiKey = Readonly<{ key: string; credential: ApiKeyCredential }>;

/** Creates and checks site API keys. Only the hash and a readable prefix are ever stored. */
export interface ApiKeys {
  issue(): IssuedApiKey;
  /** Constant-time comparison of a presented key against the stored hash. */
  matches(key: string, credential: ApiKeyCredential): boolean;
}
