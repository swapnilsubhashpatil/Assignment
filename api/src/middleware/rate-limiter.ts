import type { Context, Next } from "hono";

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 100;

const ipRequests = new Map<string, { count: number; startTime: number }>();

export const rateLimiter = async (c: Context, next: Next) => {
  const ip = c.req.header("x-forwarded-for") || "unknown";

  const currentTime = Date.now();
  const record = ipRequests.get(ip);

  if (!record) {
    ipRequests.set(ip, { count: 1, startTime: currentTime });
  } else {
    if (currentTime - record.startTime > RATE_LIMIT_WINDOW) {
      // Reset window
      ipRequests.set(ip, { count: 1, startTime: currentTime });
    } else {
      if (record.count >= MAX_REQUESTS) {
        return c.json(
          { success: false, error: { message: "Rate limit exceeded" } },
          429,
        );
      }
      record.count++;
    }
  }

  await next();
};
