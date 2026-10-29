import { describe, expect, it } from 'vitest';
import { MAX_ATTEMPTS, nextAttemptAfter } from './entities';

const now = new Date('2026-10-28T14:00:00.000Z');
const minutesLater = (date: Date | null) => (date ? (date.getTime() - now.getTime()) / 60_000 : null);

describe('nextAttemptAfter', () => {
  it('backs off exponentially: 30 s, 2 min, 10 min, 1 h, then 6 h', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((attempts) => minutesLater(nextAttemptAfter(attempts, now)))).toEqual([
      0.5, 2, 10, 60, 360, 360, 360,
    ]);
  });

  it(`gives up after ${MAX_ATTEMPTS} attempts`, () => {
    expect(nextAttemptAfter(MAX_ATTEMPTS, now)).toBeNull();
  });
});
