import { client } from "../../lib/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HonoClient = any;
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";

import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useUser } from "../../contexts/UserContext";
import { ThinkingLoader } from "./ThinkingLoader";

type ConversationMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type ConversationResponse = {
  messages: ConversationMessage[];
  agentType?: string;
};

const API_URL = "";

type ChatWindowProps = {
  conversationId: string | null;
  onNewMessage?: () => void;
  onConversationCreated?: (id: string) => void;
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  onNewMessage,
  onConversationCreated,
}) => {
  const { currentUser } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [thinkingText, setThinkingText] = useState<string>("");

  const [internalConversationId, setInternalConversationId] = useState<string | null>(conversationId);
  
  // Sync with prop
  useEffect(() => {
    setInternalConversationId(conversationId);
  }, [conversationId]);

  const { messages, isLoading, setMessages, append, data } = useChat({
    api: `${API_URL}/api/chat/messages`,
    body: {
      conversationId: internalConversationId,
      userId: currentUser.id,
    },
    onResponse: (response) => {
      // Capture conversation ID from header for new conversations
      const newConvId = response.headers.get("X-Conversation-Id");
      if (newConvId && !internalConversationId) {
        setInternalConversationId(newConvId);
        onConversationCreated?.(newConvId);
      }
      onNewMessage?.();
    },
    onFinish: () => {
      setThinkingText("");
      onNewMessage?.();
    },
    onError: () => {
      setThinkingText("");
    },
  });

  useEffect(() => {
    if (data && data.length > 0) {
      for (let i = data.length - 1; i >= 0; i--) {
        const item = data[i];
        if (typeof item === "string" && item.startsWith("")) {
          setThinkingText(item);
          break;
        }
      }
    }
  }, [data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, thinkingText]);

  useEffect(() => {
    if (internalConversationId) {
      (client as HonoClient).api.chat.conversations[":id"]
        .$get({
          param: { id: internalConversationId },
          query: { userId: currentUser.id },
        })
        .then(async (res: Response) => {
          if (res.ok) {
            const data = (await res.json()) as ConversationResponse;
            if (data?.messages) {
              setMessages(
                data.messages.map((m: ConversationMessage) => ({
                  id: m.id,
                  role: m.role as "user" | "assistant" | "system" | "data",
                  content: m.content,
                  createdAt: new Date(m.createdAt),
                })),
              );
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      setMessages([]);
      setThinkingText("");
    };
  }, [internalConversationId, setMessages]);

  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;
  const isStreamingResponse =
    isLoading &&
    lastMessage?.role === "assistant" &&
    lastMessage?.content?.trim().length > 0;
  const isThinking = isLoading && !isStreamingResponse;

  return (
    <div className="flex flex-col h-full bg-white font-mono overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
            <p className="text-6xl mb-4">👋</p>
            <p className="text-lg">How can I help you today?</p>
          </div>
        )}

        {messages
          .filter(
            (m) =>
              !(
                m.role === "assistant" &&
                m.content.trim().length === 0 &&
                isLoading
              ),
          )
          .map((m) => (
            <div key={m.id}>
              {m.role === "user" ? (
                <MessageBubble role="user" content={m.content} />
              ) : (
                <MessageBubble role="assistant" content={m.content} />
              )}
            </div>
          ))}

        {isThinking && (
          <div className="flex w-full justify-start mb-6">
            <div className="max-w-[85%] px-6 py-4 border border-black bg-white">
              <ThinkingLoader />

              {thinkingText && (
                <div className="mt-3 text-xs text-gray-500 font-mono border-l-2 border-[#E16259] pl-3">
                  {thinkingText}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex-none border-t border-black bg-white">
        <MessageInput
          onSend={function (message: string): void {
            void append({ role: "user", content: message });
          }}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};
