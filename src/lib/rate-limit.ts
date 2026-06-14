// src/lib/rate-limit.ts
/**
 * Simple in-memory rate limiter.
 *
 * Usage:
 * ```ts
 * const { success, remaining, resetTime } = rateLimit(userId);
 * if (!success) {
 *   // handle 429 Too Many Requests
 * }
 * ```
 *
 * The limiter tracks request counts per identifier (e.g., user ID or IP) in a
 * module‑level `Map`. Each entry stores the current count and the timestamp when
 * the window resets. The window length and maximum allowed requests can be
 * customised via the `options` argument. Defaults are 1 minute (`60000ms`) and
 * 10 requests.
 *
 * Cleanup of stale entries is performed lazily on each call – if an entry's
 * `resetTime` is in the past it is removed before the new request is counted.
 * This avoids the need for `setInterval`, making the utility safe for serverless
 * and edge runtimes.
 *
 * When `process.env.NODE_ENV === 'test'` the limiter is disabled and always
 * returns a successful result. This prevents flaky tests caused by rate‑limit
 * state.
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the current window resets */
  resetTime: number;
}

export interface RateLimitOptions {
  /** Length of the rate‑limit window in milliseconds (default: 60000) */
  windowMs?: number;
  /** Maximum number of allowed requests per window (default: 10) */
  max?: number;
}

// Internal store: identifier -> { count, resetTime }
const store = new Map<
  string,
  { count: number; resetTime: number }
>();

export function rateLimit(
  identifier: string,
  opts: RateLimitOptions = {}
): RateLimitResult {
  // Bypass rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return {
      success: true,
      remaining: Number.MAX_SAFE_INTEGER,
      resetTime: Date.now() + (opts.windowMs ?? 60000),
    };
  }

  const windowMs = opts.windowMs ?? 60000; // 1 minute default
  const max = opts.max ?? 10;
  const now = Date.now();

  // Clean up stale entry for this identifier if needed
  const existing = store.get(identifier);
  if (existing && existing.resetTime <= now) {
    store.delete(identifier);
  }

  // Retrieve (or create) the entry after possible cleanup
  const entry = store.get(identifier) ?? { count: 0, resetTime: now + windowMs };

  if (entry.count >= max) {
    // Rate limit exceeded – do not increment count
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Within limit – increment count
  entry.count += 1;
  // Ensure resetTime is set (in case we just created the entry)
  entry.resetTime = entry.resetTime ?? now + windowMs;
  store.set(identifier, entry);

  return {
    success: true,
    remaining: max - entry.count,
    resetTime: entry.resetTime,
  };
}
