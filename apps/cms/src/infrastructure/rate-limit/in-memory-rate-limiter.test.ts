import { describe, expect, it } from 'vitest';
import { createInMemoryRateLimiter } from './in-memory-rate-limiter';

describe('createInMemoryRateLimiter', () => {
  it('blocks after the limit and resets after the window', () => {
    let now = 0;
    const limiter = createInMemoryRateLimiter({ limit: 2, windowMs: 1000, clock: { now: () => new Date(now) } });

    expect([limiter.attempt('a'), limiter.attempt('a'), limiter.attempt('a')]).toEqual([true, true, false]);
    expect(limiter.attempt('b')).toBe(true);

    now = 1000;
    expect(limiter.attempt('a')).toBe(true);
  });
});
