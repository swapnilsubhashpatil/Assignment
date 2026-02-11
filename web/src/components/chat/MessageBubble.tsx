import React from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
}) => {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full mb-6 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] px-6 py-4 border border-black ${
          isUser ? "bg-[#E16259] text-white" : "bg-white text-black"
        }`}
      >
        <div className="text-xs uppercase tracking-wider opacity-70 mb-2">
          {isUser ? "You" : "Assistant"}
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
      </div>
    </div>
  );
};
