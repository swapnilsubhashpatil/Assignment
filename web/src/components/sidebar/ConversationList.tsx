import React, { useEffect, useState } from "react";
import { client } from "../../lib/api";
import { useUser } from "../../contexts/UserContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HonoClient = any;

type Conversation = {
  id: string;
  title: string | null;
  updatedAt: string;
};

export const ConversationList: React.FC<{
  onSelect: (id: string) => void;
  selectedId?: string;
  refreshKey?: number;
}> = ({ onSelect, selectedId, refreshKey }) => {
  const { currentUser } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await (client as HonoClient).api.chat.conversations.$get({
          query: { userId: currentUser.id },
        });
        if (res.ok) {
          const data = (await res.json()) as { conversations: Conversation[] };
          setConversations(data.conversations);
        }
      } catch {}
    }
    load();
  }, [refreshKey, currentUser.id]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-black w-80">
      <div className="p-4 border-b border-black flex justify-between items-center bg-white">
        <h2 className="font-bold text-lg tracking-tight uppercase">Chats</h2>
        <button
          onClick={() => onSelect("")}
          className="px-3 py-1 text-xs font-bold uppercase border border-black hover:bg-black hover:text-white transition-all"
          title="New Chat"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <div className="p-4 text-center text-gray-400 text-xs">
            No conversations yet.
            <br />
            Start a new chat!
          </div>
        )}

        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left px-4 py-4 border-b border-black transition-colors group ${
              selectedId === c.id
                ? "bg-[#E16259] text-white"
                : "hover:bg-black hover:text-white text-black"
            }`}
          >
            <div className={`font-bold truncate uppercase text-xs mb-1`}>
              {c.title || "UNTITLED CONVERSATION"}
            </div>
            <div
              className={`text-[10px] uppercase tracking-widest ${
                selectedId === c.id
                  ? "text-white/80"
                  : "text-black/40 group-hover:text-white/80"
              }`}
            >
              {new Date(c.updatedAt).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
