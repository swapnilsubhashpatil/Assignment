import { prisma } from "../db/client.js";
import { chatService } from "../services/chat.service.js";

export async function postChatProcessing(
    conversationId: string,
    agentType: string,
    userId: string,
) {
    "use workflow";

    await updateMetadata(conversationId, agentType);
    await checkAndCompact(conversationId);
    await logAnalytics(conversationId, agentType, userId);

    return { conversationId, status: "processed" };
}

async function updateMetadata(conversationId: string, agentType: string) {
    "use step";
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { agentType },
    });
}

async function checkAndCompact(conversationId: string) {
    "use step";
    if (await chatService.needsCompaction(conversationId)) {
        await chatService.compactConversation(conversationId);
    }
}

async function logAnalytics(
    _conversationId: string,
    _agentType: string,
    _userId: string,
) {
    "use step";
    void _conversationId;
    void _agentType;
    void _userId;
}
