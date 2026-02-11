import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 3001;

const server = serve({
    fetch: app.fetch,
    port,
});

server.on("listening", () => {
    console.log(`Server is running on port ${port}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
        console.error(
            `\n❌ Port ${port} is already in use.\n` +
            `   Kill the other process or set a different PORT in your .env file.\n` +
            `   On Windows: npx kill-port ${port}\n`,
        );
    } else {
        console.error("Server error:", err);
    }
    process.exit(1);
});
