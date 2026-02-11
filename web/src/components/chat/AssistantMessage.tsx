import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AssistantMessageProps {
  content?: string;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
}) => {
  const hasContent = content && content.trim().length > 0;

  return (
    <div className="flex w-full justify-start mb-6">
      <div className="max-w-[85%] px-6 py-4 border border-black bg-white">

{hasContent ? (
          <div className="prose prose-sm max-w-none font-mono prose-headings:text-black prose-strong:text-black prose-strong:font-bold prose-em:italic prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 prose-li:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#E16259]">
            <div className="w-2 h-2 rounded-full bg-[#E16259] animate-pulse" />
            <span className="text-xs uppercase tracking-widest">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
};
