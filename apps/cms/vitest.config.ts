import { fileURLToPath } from 'node:url';
import { defineProject } from 'vitest/config';

export default defineProject({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    name: 'cms',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // Integration tests start PGlite and hash passwords; under parallel load they exceed the 5s default.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
