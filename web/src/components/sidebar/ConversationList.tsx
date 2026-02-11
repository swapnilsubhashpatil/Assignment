import React, { useEffect, useState } from "react";
import { client } from "../../lib/api";
import { useUser } from "../../contexts/UserContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HonoClient = any;

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  agentType: string | null;
}

interface ConversationListProps {
  selectedId: string;
  onSelect: (id: string | null) => void;
  refreshKey?: number;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  selectedId,
  onSelect,
  refreshKey = 0,
}) => {
  const { currentUser } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    (client as HonoClient).api.chat.conversations
      .$get({ query: { userId: currentUser.id } })
      .then(async (res: Response) => {
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === "object" && "conversations" in data) {
            setConversations(
              (data.conversations as Conversation[]).sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime(),
              ),
            );
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [currentUser.id, refreshKey]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;

    try {
      const res = await (client as HonoClient).api.chat.conversations[":id"].$delete({
        param: { id },
        query: { userId: currentUser.id },
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (selectedId === id) {
          onSelect(null);
        }
      }
    } catch {
      // Silently handle error
    }
  };

  const getAgentBadge = (agentType: string | null) => {
    const colors: Record<string, string> = {
      support: "bg-blue-100 text-blue-800",
      order: "bg-green-100 text-green-800",
      billing: "bg-purple-100 text-purple-800",
    };
    return (
      agentType && (
        <span
          className={`text-[10px] px-1.5 py-0.5 uppercase ${colors[agentType] || "bg-gray-100"}`}
        >
          {agentType}
        </span>
      )
    );
  };

  return (
    <div className="w-80 border-r border-black bg-white flex flex-col h-full">
      <div className="p-4 border-b border-black flex-none">
        <button
          onClick={() => onSelect(null)}
          className="w-full px-4 py-3 bg-black text-white hover:bg-[#E16259] transition-colors font-mono text-sm uppercase tracking-wider"
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-400 font-mono text-sm">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400 font-mono text-sm">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                selectedId === conv.id
                  ? "bg-black text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm truncate">{conv.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getAgentBadge(conv.agentType)}
                    <span
                      className={`text-xs ${
                        selectedId === conv.id ? "text-gray-300" : "text-gray-400"
                      }`}
                    >
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs ${
                    selectedId === conv.id
                      ? "text-white hover:text-[#E16259]"
                      : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
