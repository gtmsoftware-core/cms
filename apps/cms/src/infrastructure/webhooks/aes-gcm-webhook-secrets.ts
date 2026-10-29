import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { WebhookSecrets } from '@/application/webhooks';

const VERSION = 'v1';

/**
 * Webhook secrets: generated here, stored encrypted with AES-256-GCM (format `v1:<iv>:<tag>:<ciphertext>`,
 * base64url). The 32-byte key comes from WEBHOOK_ENCRYPTION_KEY.
 */
export function createAesGcmWebhookSecrets(encryptionKey: Buffer): WebhookSecrets {
  if (encryptionKey.length !== 32) throw new Error('WEBHOOK_ENCRYPTION_KEY must decode to 32 bytes');

  return {
    generate: () => `whsec_${randomBytes(32).toString('base64url')}`,
    encrypt(secret) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
      const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
      const parts = [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url'));
      return [VERSION, ...parts].join(':');
    },
    decrypt(encrypted) {
      const [version, iv, tag, ciphertext] = encrypted.split(':');
      if (version !== VERSION || !iv || !tag || !ciphertext) throw new Error('Unsupported encrypted secret format');
      const decipher = createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(iv, 'base64url'));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
    },
  };
}
