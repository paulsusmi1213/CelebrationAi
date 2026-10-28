import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-Memory fallback sliding window rate limiter for environments without Redis
class MemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public check(identifier: string): RateLimitResult {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    
    // Purge expired timestamps
    const activeTimestamps = timestamps.filter(ts => now - ts < this.windowMs);

    if (activeTimestamps.length >= this.maxRequests) {
      const oldest = activeTimestamps[0];
      const reset = Math.ceil((oldest + this.windowMs - now) / 1000);
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset
      };
    }

    activeTimestamps.push(now);
    this.requests.set(identifier, activeTimestamps);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - activeTimestamps.length,
      reset: Math.ceil(this.windowMs / 1000)
    };
  }
}

const memoryLimiter = new MemoryRateLimiter(15, 60 * 1000); // 15 requests per minute

let upstashRatelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  upstashRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(15, '1 m'),
    analytics: true,
  });
}

/**
 * Checks rate limits per IP or authenticated User ID.
 * Returns { success, limit, remaining, reset }.
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  if (upstashRatelimit) {
    try {
      const res = await upstashRatelimit.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset
      };
    } catch (err) {
      console.warn("Upstash Redis unreachable, falling back to in-memory rate limiter:", err);
    }
  }

  return memoryLimiter.check(identifier);
}

