import { Context, Next } from "hono";

export const requestLogger = async (c: Context, next: Next) => {
  await next();
};
