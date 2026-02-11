import { Hono } from "hono";
import { chatController } from "../controllers/chat.controller.js";

export const chatRoutes = new Hono();

chatRoutes.post("/messages", chatController.sendMessage);
chatRoutes.get("/conversations/:id", chatController.getConversation);
chatRoutes.get("/conversations/:id/stats", chatController.getConversationStats);
chatRoutes.get("/conversations", chatController.listConversations);
chatRoutes.delete("/conversations/:id", chatController.deleteConversation);
