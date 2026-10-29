import type { RateLimiter } from '@/application/identity';
import type { Clock } from '@/shared/clock';

export type RateLimitOptions = Readonly<{ limit: number; windowMs: number; clock: Clock }>;

/** Fixed-window limiter kept in process memory. Enough for a single-instance deployment. */
export function createInMemoryRateLimiter({ limit, windowMs, clock }: RateLimitOptions): RateLimiter {
  const windows = new Map<string, { startedAt: number; count: number }>();

  return {
    attempt(key) {
      const now = clock.now().getTime();
      const current = windows.get(key);
      if (!current || now - current.startedAt >= windowMs) {
        windows.set(key, { startedAt: now, count: 1 });
        return true;
      }
      current.count += 1;
      return current.count <= limit;
    },
  };
}
