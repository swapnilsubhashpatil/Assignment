import type { Context } from "hono";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { chatService } from "../services/chat.service.js";
import { routerAgent } from "../agents/router.agent.js";
import { agentService } from "../services/agent.service.js";
import type { CoreMessage } from "ai";
import { start } from "workflow/api";
import { postChatProcessing } from "../workflows/post-chat-processing.js";

async function validateUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: { userId: true, name: true }
  });
  return user;
}

export const chatController = {
  sendMessage: async (c: Context) => {
    const schema = z
      .object({
        conversationId: z.string().nullable().optional(),
        content: z.string().min(1).optional(),
        input: z.string().min(1).optional(),
        messages: z
          .array(
            z.object({
              role: z.string(),
              content: z.string().min(1),
            }),
          )
          .optional(),
        userId: z.string().default("user_1"),
      })
      .refine((data) => data.content || data.input || data.messages?.length, {
        message: "Message content is required",
        path: ["content"],
      });

    const body = await c.req.json();
    const { conversationId, content, input, messages, userId } =
      schema.parse(body);
    const messageContent =
      content ?? input ?? messages?.slice(-1)[0]?.content ?? "";

    const user = await validateUser(userId);
    if (!user) {
      return c.json({ error: "Invalid user" }, 400);
    }

    let currentConversationId = conversationId;
    let conversation;

    if (!conversationId) {
      const title = messageContent.slice(0, 30);
      conversation = await chatService.createConversation(userId, title);
      currentConversationId = conversation.id;
      conversation.messages = [];
    } else {
      currentConversationId = conversationId;
      conversation = await chatService.getConversationWithCompaction(currentConversationId);
      if (!conversation) {
        return c.json({ error: "Conversation not found" }, 404);
      }
      if (conversation.userId !== userId) {
        return c.json({ error: "Unauthorized" }, 403);
      }
    }

    await chatService.saveUserMessage(currentConversationId!, messageContent);

    const history: CoreMessage[] = conversation.messages.map((m: any) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    history.push({ role: "user", content: messageContent });

    const routingContext = history.slice(-6);
    const { agent, reasoning } = await routerAgent.classify(routingContext);

    const response = await agentService.execute(
      agent,
      history,
      currentConversationId!,
      userId,
      reasoning,
    );

    response.headers.set("X-Agent-Type", agent);
    response.headers.set("X-Reasoning", reasoning.replace(/\n/g, " "));

    start(postChatProcessing, [currentConversationId!, agent, userId]).catch(() => {});

    return response;
  },

  getConversation: async (c: Context) => {
    const id = c.req.param("id");
    const userId = c.req.query("userId") || "user_1";
    
    const user = await validateUser(userId);
    if (!user) {
      return c.json({ error: "Invalid user" }, 400);
    }
    
    const conversation = await chatService.getConversation(id);
    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }
    
    if (conversation.userId !== userId) {
      return c.json({ error: "Unauthorized" }, 403);
    }
    
    return c.json(conversation);
  },

  listConversations: async (c: Context) => {
    try {
      const userId = c.req.query("userId") || "user_1";
      
      const user = await validateUser(userId);
      if (!user) {
        return c.json({ error: "Invalid user" }, 400);
      }
      
      const conversations = await chatService.listConversations(userId);
      return c.json({ conversations });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list conversations";
      return c.json({ error: message }, 500);
    }
  },

  deleteConversation: async (c: Context) => {
    const id = c.req.param("id");
    const userId = c.req.query("userId") || "user_1";
    
    try {
      const user = await validateUser(userId);
      if (!user) {
        return c.json({ error: "Invalid user" }, 400);
      }
      
      const conversation = await chatService.getConversation(id);
      if (!conversation) {
        return c.json({ error: "Conversation not found" }, 404);
      }
      
      if (conversation.userId !== userId) {
        return c.json({ error: "Unauthorized" }, 403);
      }
      
      await chatService.deleteConversation(id);
      return c.json({ success: true });
    } catch {
      return c.json({ error: "Failed to delete" }, 500);
    }
  },

  getConversationStats: async (c: Context) => {
    const id = c.req.param("id");
    const userId = c.req.query("userId") || "user_1";
    
    try {
      const user = await validateUser(userId);
      if (!user) {
        return c.json({ error: "Invalid user" }, 400);
      }
      
      const conversation = await chatService.getConversation(id);
      if (!conversation) {
        return c.json({ error: "Conversation not found" }, 404);
      }
      
      if (conversation.userId !== userId) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      const tokenCount = await chatService.getConversationTokenCount(id);
      const needsCompaction = await chatService.needsCompaction(id);

      return c.json({
        conversationId: id,
        messageCount: conversation.messages.length,
        totalTokens: tokenCount,
        needsCompaction,
        maxTokens: 8000,
        systemMessages: conversation.messages.filter(
          (m: any) => m.role === "system",
        ).length,
      });
    } catch (e) {
      return c.json({ error: "Failed to get stats" }, 500);
    }
  },
};
