import { defineConfig } from 'tsup';

/** Builds the published package: ESM + type declarations, one file per public entry point. */
export default defineConfig({
  entry: { index: 'src/index.ts', 'next/index': 'src/next/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'es2023',
  external: ['next', 'zod'],
});
