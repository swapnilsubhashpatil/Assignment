import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/logger.js";
import chatRoutes from "./routes/chat.routes.js";
import healthRoutes from "./routes/health.routes.js";
import agentRoutes from "./routes/agent.routes.js";

// Create Hono app
const app = new Hono();

// Global middleware
app.use(requestLogger);
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// Health check endpoint
app.route("/health", healthRoutes);

// API routes
app.route("/api/chat", chatRoutes);
app.route("/api/agents", agentRoutes);

// Apply error handler
app.onError(errorHandler);

export default app;
