import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildContainer, type ContainerOverrides } from '@/composition/container';
import { createDatabase } from '@/infrastructure/db';

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

export async function createTestContainer(overrides: ContainerOverrides = {}) {
  const db = await createDatabase({ migrationsFolder });
  const config = {
    authSecret: 'test-secret-with-at-least-32-characters',
    baseURL: 'http://localhost',
    webhookEncryptionKey: randomBytes(32),
    cronSecret: 'test-cron-secret-with-at-least-32-chars',
    media: { kind: 'local' as const, dir: mkdtempSync(path.join(tmpdir(), 'cms-media-')) },
  };
  const container = buildContainer(db, config, overrides);
  return { db, container, mediaDir: config.media.dir };
}
