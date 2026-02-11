import React, { useEffect, useState } from "react";

const THINKING_WORDS = [
  "Analyzing...",
  "Processing...",
  "Thinking...",
  "Searching...",
  "Retrieving...",
  "Computing...",
];

export const ThinkingLoader: React.FC = () => {
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % THINKING_WORDS.length);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm font-mono text-gray-500">
      <div className="flex gap-1">
        <span
          className="w-2 h-2 bg-black animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 bg-black animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 bg-black animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span>{THINKING_WORDS[currentWord]}</span>
    </div>
  );
};
