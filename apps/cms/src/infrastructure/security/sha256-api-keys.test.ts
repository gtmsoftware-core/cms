import { describe, expect, it } from 'vitest';
import { API_KEY_PATTERN } from '@/application/delivery';
import { createSha256ApiKeys } from './sha256-api-keys';

describe('sha256 API keys', () => {
  const apiKeys = createSha256ApiKeys();

  it('issues keys in the accepted format and stores only hash and prefix', () => {
    const { key, credential } = apiKeys.issue();
    expect(key).toMatch(API_KEY_PATTERN);
    expect(credential.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(credential.hash).not.toContain(key);
    expect(key.startsWith(credential.prefix)).toBe(true);
    expect(credential.prefix.length).toBeLessThan(key.length / 2);
  });

  it('matches only the issued key', () => {
    const first = apiKeys.issue();
    const second = apiKeys.issue();
    expect(apiKeys.matches(first.key, first.credential)).toBe(true);
    expect(apiKeys.matches(second.key, first.credential)).toBe(false);
  });
});
