import { Hono } from "hono";
import { prisma } from "../db/client.js";

const router = new Hono();

router.get("/", async (c) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        api: "running",
      },
    });
  } catch (error) {
    return c.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "disconnected",
        api: "running",
      },
      error: error instanceof Error ? error.message : "Database connection failed",
    }, 503);
  }
});

export default router;
