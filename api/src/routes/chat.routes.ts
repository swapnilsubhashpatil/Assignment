import { Hono } from "hono";
import { chatController } from "../controllers/chat.controller.js";
import { rateLimiter } from "../middleware/rate-limiter.js";

const router = new Hono();

// Rate limit: 30 messages per minute
router.post("/messages", rateLimiter(30, 60000), chatController.sendMessage);

// Conversation management
router.get("/conversations", chatController.listConversations);
router.get("/conversations/:id", chatController.getConversation);
router.delete("/conversations/:id", chatController.deleteConversation);
router.get("/conversations/:id/stats", chatController.getConversationStats);

export default router;
