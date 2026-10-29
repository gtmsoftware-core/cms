import { describe, expect, it } from 'vitest';
import { EmailAlreadyInUseError } from '@/domain/identity';
import { createTestContainer } from './database';

describe('identity (PGlite + Better Auth)', () => {
  it('creates a superadmin with prefixed id and blocks duplicates', async () => {
    const { container } = await createTestContainer();
    const input = { email: 'Root@CMS.dev', name: 'Root', password: 'senha-do-root-123' };

    expect(await container.createSuperadmin(input)).toMatch(/^usr_/);
    await expect(container.createSuperadmin(input)).rejects.toThrow(EmailAlreadyInUseError);
  });
});
