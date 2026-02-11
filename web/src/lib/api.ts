import { hc } from "hono/client";
import type { AppType } from "@repo/api/src/app";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Create Hono RPC client
export const client = hc<AppType>(API_URL);

// Helper for streaming chat
export async function* streamChat(
  message: string,
  conversationId: string | null,
  userId: string
) {
  const response = await fetch(`${API_URL}/api/chat/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
      conversationId,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

// Types for API responses
export interface Conversation {
  id: string;
  title: string;
  userId: string;
  agentType: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentType: string | null;
  createdAt: string;
}
