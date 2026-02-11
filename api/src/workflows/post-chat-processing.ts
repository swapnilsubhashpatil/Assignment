import { prisma } from "../db/client.js";
import { chatService } from "../services/chat.service.js";

interface WorkflowInput {
  conversationId: string;
  agentType: string;
  userId: string;
}

export async function postChatProcessing(input: WorkflowInput) {
  const { conversationId, agentType, userId } = input;

  console.log(`[Workflow] Processing chat for conversation ${conversationId}`);

  try {
    // Update conversation with agent type
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        agentType,
        metadata: {
          lastProcessedAt: new Date().toISOString(),
          lastAgent: agentType,
        },
      },
    });

    // Check if conversation needs compaction
    const needsCompaction = await chatService.needsCompaction(conversationId);
    if (needsCompaction) {
      console.log(`[Workflow] Compacting conversation ${conversationId}`);
      await chatService.compactConversation(conversationId);
    }

    // Log analytics
    const conversation = await chatService.getConversation(conversationId);
    if (conversation) {
      console.log(`[Workflow] Conversation stats:`, {
        messageCount: conversation.messages.length,
        agentType,
        userId,
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[Workflow] Error:`, error);
    return { success: false, error: String(error) };
  }
}
