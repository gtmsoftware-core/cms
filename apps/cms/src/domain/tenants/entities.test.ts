import { describe, expect, it } from 'vitest';
import { parseSlug } from './entities';
import { InvalidSlugError } from './errors';

describe('parseSlug', () => {
  it.each(['clinica', 'oficina-do-ze', 'loja2'])('accepts "%s"', (value) => {
    expect(parseSlug(value)).toEqual({ ok: true, value });
  });

  it.each(['', 'Maiuscula', 'com espaco', '-inicio', 'fim-', 'duplo--hifen', 'a'.repeat(64)])('rejects "%s"', (value) => {
    const result = parseSlug(value);
    expect(!result.ok && result.error).toBeInstanceOf(InvalidSlugError);
  });
});
