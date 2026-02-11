import React, { useEffect, useState } from "react";

export const ThinkingLoader: React.FC = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "") return ".";
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return "";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-[#E16259]">
      <div className="w-2 h-2 rounded-full bg-[#E16259] animate-pulse" />
      <span className="text-xs uppercase tracking-widest font-bold">
        Thinking{dots}
      </span>
    </div>
  );
};
