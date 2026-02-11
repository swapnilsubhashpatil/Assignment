import type { Context, Next } from "hono";

export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  c.set("requestId", requestId);
  
  console.log(`[${requestId}] ${c.req.method} ${c.req.url} - Started`);
  
  await next();
  
  const duration = Date.now() - start;
  console.log(
    `[${requestId}] ${c.req.method} ${c.req.url} - ${c.res.status} (${duration}ms)`
  );
};
