import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error-handler.js";

// Create Hono app
const app = new Hono();

// Global middleware
app.use(logger());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "customer-support-api",
  });
});

// Apply error handler
app.onError(errorHandler);

export default app;
