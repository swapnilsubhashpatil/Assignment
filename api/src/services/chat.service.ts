import { prisma } from "../db/client.js";
import { generateText } from "ai";
import { google, GEMINI_MODEL } from "../lib/ai.js";

export class ChatService {
  private readonly MAX_TOKENS = 8000;
  private readonly RECENT_MESSAGES_TO_KEEP = 10;

  async getConversation(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  async listConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
  }

  async createConversation(userId: string, title?: string) {
    return prisma.conversation.create({
      data: {
        userId,
        title: title || "New Conversation",
      },
      include: { messages: true },
    });
  }

  async deleteConversation(id: string) {
    return prisma.conversation.delete({
      where: { id },
    });
  }

  async saveUserMessage(conversationId: string, content: string) {
    return prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content,
        tokenCount: content.length / 4,
      },
    });
  }

  async saveAssistantMessage(
    conversationId: string,
    content: string,
    agentType?: string,
  ) {
    return prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content,
        agentType,
        tokenCount: content.length / 4,
      },
    });
  }

  async getConversationTokenCount(conversationId: string): Promise<number> {
    const result = await prisma.message.aggregate({
      where: { conversationId },
      _sum: { tokenCount: true },
    });
    return result._sum.tokenCount || 0;
  }

  async needsCompaction(conversationId: string): Promise<boolean> {
    const tokenCount = await this.getConversationTokenCount(conversationId);
    return tokenCount > this.MAX_TOKENS;
  }

  private async summarizeMessages(messages: any[]): Promise<string> {
    const conversationText = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    try {
      const { text } = await generateText({
        model: google(GEMINI_MODEL),
        prompt: `Summarize the following conversation concisely:\n\n${conversationText}`,
      });
      return text;
    } catch {
      return `Previous conversation: ${conversationText.slice(0, 200)}...`;
    }
  }

  async compactConversation(conversationId: string): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation || conversation.messages.length <= this.RECENT_MESSAGES_TO_KEEP) {
      return;
    }

    const allMessages = conversation.messages;
    const totalMessages = allMessages.length;

    // Split messages: old messages to summarize, recent to keep
    const oldMessages = allMessages.slice(
      0,
      totalMessages - this.RECENT_MESSAGES_TO_KEEP,
    );
    const recentMessages = allMessages.slice(-this.RECENT_MESSAGES_TO_KEEP);



    // Generate summary of old messages
    const summary = await this.summarizeMessages(oldMessages);

    await prisma.message.deleteMany({
      where: {
        id: { in: oldMessages.map((m) => m.id) },
      },
    });

    const summaryCreatedAt = new Date(recentMessages[0].createdAt);
    summaryCreatedAt.setSeconds(summaryCreatedAt.getSeconds() - 1);

    await prisma.message.create({
      data: {
        conversationId,
        role: "system",
        content: `[Summary] ${summary}`,
        tokenCount: summary.length / 4,
        createdAt: summaryCreatedAt,
      },
    });
  }

  async getConversationWithCompaction(conversationId: string) {
    if (await this.needsCompaction(conversationId)) {
      await this.compactConversation(conversationId);
    }
    return this.getConversation(conversationId);
  }
}

export const chatService = new ChatService();
