import React, { useState } from "react";

type MessageInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled,
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-black p-4 bg-white"
    >
      <div className="flex border border-black">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ENTER COMMAND..."
          className="flex-1 px-4 py-3 focus:outline-none bg-white text-black font-mono text-sm placeholder:text-black/50"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-[#E16259] text-white px-6 py-3 font-bold tracking-widest hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-l border-black text-xs"
        >
          Send
        </button>
      </div>
    </form>
  );
};
