const store = new Map<string, number[]>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const timestamps = store.get(identifier) ?? [];
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= config.maxRequests) {
    const oldestInWindow = recent[0];
    const retryAfter = Math.ceil((oldestInWindow + config.windowMs - now) / 1000);
    store.set(identifier, recent);
    return { allowed: false, retryAfter };
  }

  recent.push(now);
  store.set(identifier, recent);
  return { allowed: true };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of store.entries()) {
    const recent = timestamps.filter((t) => t > now - 900000);
    if (recent.length === 0) {
      store.delete(key);
    } else {
      store.set(key, recent);
    }
  }
}, 300000);

export const RATE_LIMITS = {
  auth: { windowMs: 900000, maxRequests: 10 },       // 10 per 15min
  signup: { windowMs: 900000, maxRequests: 5 },       // 5 per 15min
  upload: { windowMs: 3600000, maxRequests: 20 },     // 20 per hour
  api: { windowMs: 60000, maxRequests: 100 },         // 100 per min
} as const;
