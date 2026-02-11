import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MessageBubbleProps = {
  role: "user" | "assistant" | "system";
  content: string;
  agentType?: string;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  agentType: _agentType,
}) => {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
          max-w-[85%] px-6 py-4 border text-sm
          ${
            isUser
              ? "bg-black text-white border-black"
              : "bg-white text-black border-black"
          }
        `}
      >


        {isUser ? (
          <div className="whitespace-pre-wrap leading-relaxed font-mono">
            {content}
          </div>
        ) : (
          <div className="prose prose-sm max-w-none font-mono prose-headings:text-black prose-strong:text-black prose-strong:font-bold prose-em:italic prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 prose-li:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
