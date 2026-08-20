import "server-only";
import { RateLimitError } from "./errors";

/**
 * Rate limiter abstraction. The default implementation is an in-memory
 * sliding window, which is correct per server instance and sufficient for
 * the MVP; swap in a Redis-backed implementation behind the same interface
 * for multi-instance deployments.
 */
export interface RateLimiter {
  /** Returns true if the action is allowed for this key. */
  check(key: string, limit: number, windowMs: number): boolean;
}

class InMemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, number[]>();
  private lastSweep = Date.now();

  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    this.sweep(now);
    const windowStart = now - windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter((t) => t > windowStart);
    if (timestamps.length >= limit) {
      this.hits.set(key, timestamps);
      return false;
    }
    timestamps.push(now);
    this.hits.set(key, timestamps);
    return true;
  }

  private sweep(now: number): void {
    // Periodically drop stale keys so the map cannot grow unbounded.
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    const cutoff = now - 60 * 60_000;
    for (const [key, timestamps] of this.hits) {
      const live = timestamps.filter((t) => t > cutoff);
      if (live.length === 0) this.hits.delete(key);
      else this.hits.set(key, live);
    }
  }
}

const globalForLimiter = globalThis as unknown as { rateLimiter?: RateLimiter };
export const rateLimiter: RateLimiter = (globalForLimiter.rateLimiter ??= new InMemoryRateLimiter());

export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 15 * 60_000 },
  register: { limit: 5, windowMs: 60 * 60_000 },
  contribution: { limit: 20, windowMs: 60 * 60_000 },
  flag: { limit: 15, windowMs: 60 * 60_000 },
  search: { limit: 120, windowMs: 60_000 },
  upload: { limit: 10, windowMs: 60 * 60_000 },
} as const;

export function enforceRateLimit(
  action: keyof typeof RATE_LIMITS,
  key: string,
): void {
  const { limit, windowMs } = RATE_LIMITS[action];
  if (!rateLimiter.check(`${action}:${key}`, limit, windowMs)) {
    throw new RateLimitError();
  }
}
