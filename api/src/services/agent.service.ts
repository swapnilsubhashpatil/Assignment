import { streamText, createDataStreamResponse, type CoreMessage } from "ai";
import { google, GEMINI_MODEL } from "../lib/ai.js";
import {
  SUPPORT_PROMPT,
  ORDER_PROMPT,
  BILLING_PROMPT,
} from "../agents/prompts/index.js";
import {
  createQueryConversationHistoryTool,
  createFetchOrderDetailsTool,
  createCheckDeliveryStatusTool,
  createGetInvoiceDetailsTool,
  createCheckRefundStatusTool,
} from "../agents/tools/index.js";
import { chatService } from "./chat.service.js";

export class AgentService {
  getAgentConfig(agentType: string, userId: string) {
    const supportTools = {
      queryConversationHistory: createQueryConversationHistoryTool(userId),
    };

    const orderTools = {
      fetchOrderDetails: createFetchOrderDetailsTool(userId),
      checkDeliveryStatus: createCheckDeliveryStatusTool(userId),
    };

    const billingTools = {
      getInvoiceDetails: createGetInvoiceDetailsTool(userId),
      checkRefundStatus: createCheckRefundStatusTool(userId),
    };

    switch (agentType) {
      case "support":
        return {
          system: SUPPORT_PROMPT,
          tools: supportTools,
        };
      case "order":
        return {
          system: ORDER_PROMPT,
          tools: orderTools,
        };
      case "billing":
        return {
          system: BILLING_PROMPT,
          tools: billingTools,
        };
      default:
        return {
          system: SUPPORT_PROMPT,
          tools: supportTools,
        };
    }
  }

  async execute(
    agentType: string,
    messages: CoreMessage[],
    conversationId: string,
    userId: string,
    reasoning?: string,
  ) {
    const config = this.getAgentConfig(agentType, userId);

    return createDataStreamResponse({
      execute: async (dataStream) => {
        if (reasoning) {
          dataStream.writeData(`${reasoning}\n\n`);
        }

        const result = streamText({
          model: google(GEMINI_MODEL),
          system: config.system,
          messages,
          tools: config.tools,
          maxSteps: 5, // Allow multi-step tool calls
          onStepFinish: async () => {},
          onFinish: async ({ text }) => {
            await chatService.saveAssistantMessage(
              conversationId,
              text,
              agentType,
            );
          },
        });

        // Pipe the text stream to the data stream
        result.mergeIntoDataStream(dataStream);
      },
      onError: () => "Stream error occurred",
    });
  }
}

export const agentService = new AgentService();
