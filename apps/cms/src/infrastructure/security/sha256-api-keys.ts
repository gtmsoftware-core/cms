import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { ApiKeys } from '@/application/sites';

const KEY_PREFIX = 'cms_live_';
/** Characters kept in the database so the operator can recognize a key ("cms_live_AbC12xY"). */
const VISIBLE_LENGTH = KEY_PREFIX.length + 7;

const sha256 = (value: string) => createHash('sha256').update(value).digest();

export function createSha256ApiKeys(): ApiKeys {
  return {
    issue() {
      const key = `${KEY_PREFIX}${randomBytes(30).toString('base64url')}`;
      return { key, credential: { hash: sha256(key).toString('hex'), prefix: key.slice(0, VISIBLE_LENGTH) } };
    },
    matches(key, credential) {
      const expected = Buffer.from(credential.hash, 'hex');
      const actual = sha256(key);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    },
  };
}
