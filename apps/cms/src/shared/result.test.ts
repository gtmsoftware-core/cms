import { describe, expect, it } from 'vitest';
import { err, ok, type Result } from './result';

describe('Result', () => {
  it('narrows on ok', () => {
    const result: Result<number, string> = ok(1);
    expect(result.ok && result.value).toBe(1);
  });

  it('narrows on err', () => {
    const result: Result<number, string> = err('falhou');
    expect(!result.ok && result.error).toBe('falhou');
  });
});
