import type { Context, Next } from "hono";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimiter(maxRequests: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    // Use userId from body or IP as identifier
    const body = await c.req.json().catch(() => ({}));
    const identifier = body.userId || c.req.header("x-forwarded-for") || "anonymous";
    const key = `${c.req.path}:${identifier}`;
    
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      // Increment count
      entry.count++;
      
      if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        c.header("Retry-After", String(retryAfter));
        return c.json(
          {
            error: "Rate limit exceeded",
            retryAfter,
            limit: maxRequests,
            window: `${windowMs / 1000}s`,
          },
          429
        );
      }
    }
    
    // Add rate limit headers
    const currentEntry = rateLimitStore.get(key)!;
    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Remaining", String(Math.max(0, maxRequests - currentEntry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(currentEntry.resetTime / 1000)));
    
    await next();
  };
}
