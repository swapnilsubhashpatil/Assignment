import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { chatRoutes } from "./routes/chat.routes.js";
import { agentRoutes } from "./routes/agent.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { rateLimiter } from "./middleware/rate-limiter.js";

export const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["X-Agent-Type", "X-Reasoning", "X-Conversation-Id"],
    maxAge: 600,
  }),
);
app.use("*", errorHandler);
app.use("*", rateLimiter);

app.route("/api/chat", chatRoutes);
app.route("/api/agents", agentRoutes);
app.route("/api/users", userRoutes);
app.route("/api/health", healthRoutes);

export default app;
export type AppType = typeof app;
