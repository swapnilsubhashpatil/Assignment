import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock must be before imports
vi.mock("../db/client.js", () => ({
  prisma: {
    conversation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ text: "Summary of conversation" }),
}));

import { ChatService } from "../services/chat.service";
import { prisma } from "../db/client.js";

const mockPrisma = prisma as any;

describe("ChatService", () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
    vi.clearAllMocks();
  });

  describe("Context Compaction", () => {
    it("should detect when compaction is needed", async () => {
      mockPrisma.message.aggregate.mockResolvedValue({
        _sum: { tokenCount: 9000 }, // Exceeds 8000 limit
      });

      const needsCompaction = await chatService.needsCompaction("conv-123");

      expect(needsCompaction).toBe(true);
    });

    it("should not compact when under token limit", async () => {
      mockPrisma.message.aggregate.mockResolvedValue({
        _sum: { tokenCount: 5000 }, // Under 8000 limit
      });

      const needsCompaction = await chatService.needsCompaction("conv-123");

      expect(needsCompaction).toBe(false);
    });

    it("should compact old messages into summary", async () => {
      const mockConversation = {
        id: "conv-123",
        messages: Array.from({ length: 15 }, (_, i) => ({
          id: `msg-${i}`,
          role: i % 2 === 0 ? "user" : "assistant",
          content: `Message ${i} content`,
          createdAt: new Date(Date.now() - i * 1000),
        })),
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.message.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.message.create.mockResolvedValue({ id: "summary-msg" });

      await chatService.compactConversation("conv-123");

      // Should delete first 5 messages (keeping last 10)
      expect(mockPrisma.message.deleteMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: expect.arrayContaining(["msg-0", "msg-1", "msg-2", "msg-3", "msg-4"]),
          },
        },
      });

      // Should create summary message
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          conversationId: "conv-123",
          role: "system",
          content: expect.stringContaining("[Summary]"),
        }),
      });
    });

    it("should not compact conversations with 10 or fewer messages", async () => {
      const mockConversation = {
        id: "conv-123",
        messages: Array.from({ length: 10 }, (_, i) => ({
          id: `msg-${i}`,
          role: "user",
          content: "Short message",
        })),
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await chatService.compactConversation("conv-123");

      expect(mockPrisma.message.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.message.create).not.toHaveBeenCalled();
    });
  });

  describe("Token Counting", () => {
    it("should calculate total token count for conversation", async () => {
      mockPrisma.message.aggregate.mockResolvedValue({
        _sum: { tokenCount: 1500 },
      });

      const count = await chatService.getConversationTokenCount("conv-123");

      expect(count).toBe(1500);
      expect(mockPrisma.message.aggregate).toHaveBeenCalledWith({
        where: { conversationId: "conv-123" },
        _sum: { tokenCount: true },
      });
    });

    it("should return 0 when no messages", async () => {
      mockPrisma.message.aggregate.mockResolvedValue({
        _sum: { tokenCount: null },
      });

      const count = await chatService.getConversationTokenCount("conv-123");

      expect(count).toBe(0);
    });
  });

  describe("Conversation CRUD", () => {
    it("should create conversation with title", async () => {
      const mockConversation = {
        id: "conv-123",
        userId: "user_1",
        title: "Order help",
        messages: [],
      };

      mockPrisma.conversation.create.mockResolvedValue(mockConversation);

      const result = await chatService.createConversation("user_1", "Order help");

      expect(result).toEqual(mockConversation);
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          userId: "user_1",
          title: "Order help",
        },
        include: { messages: true },
      });
    });

    it("should save user message with token count", async () => {
      const content = "Hello, I need help with my order";
      mockPrisma.message.create.mockResolvedValue({ id: "msg-123" });

      await chatService.saveUserMessage("conv-123", content);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-123",
          role: "user",
          content,
          tokenCount: content.length / 4,
        },
      });
    });

    it("should save assistant message with agent type", async () => {
      mockPrisma.message.create.mockResolvedValue({ id: "msg-124" });

      await chatService.saveAssistantMessage("conv-123", "Your order is shipped", "order");

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-123",
          role: "assistant",
          content: "Your order is shipped",
          agentType: "order",
          tokenCount: expect.any(Number),
        },
      });
    });
  });
});
