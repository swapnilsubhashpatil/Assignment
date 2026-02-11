import React, { useState, KeyboardEvent } from "react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-3 p-4 bg-white border-t border-black">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-1 min-h-[60px] max-h-[200px] px-4 py-3 border border-black resize-none focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 font-mono text-sm"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="px-6 py-3 bg-black text-white border border-black hover:bg-[#E16259] hover:border-[#E16259] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm uppercase tracking-wider"
      >
        Send
      </button>
    </div>
  );
};
