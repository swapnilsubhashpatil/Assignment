import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof HTTPException) {
      return c.json(
        { success: false, error: { message: err.message, code: err.status } },
        err.status,
      );
    }

    if (err instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: { message: "Validation Error", details: err.errors },
        },
        400,
      );
    }

    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err instanceof Error
          ? err.message
          : "Internal Server Error";

    return c.json({ success: false, error: { message } }, 500);
  }
};
