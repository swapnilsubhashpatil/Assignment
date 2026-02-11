import { useState, useCallback } from "react";
import { ConversationList } from "./components/sidebar/ConversationList";
import { ChatWindow } from "./components/chat/ChatWindow";
import { UserProvider } from "./contexts/UserContext";
import { UserSelector } from "./components/UserSelector";

function AppContent() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewMessage = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleConversationCreated = useCallback((id: string) => {
    setSelectedConversationId(id);
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="flex h-screen bg-white overflow-hidden font-mono text-sm">
      <ConversationList
        selectedId={selectedConversationId || ""}
        onSelect={(id) => setSelectedConversationId(id || null)}
        refreshKey={refreshKey}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex-none flex items-center justify-between px-6 py-3 border-b border-black bg-white">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-tighter text-black">
              Customer Support
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Multi-Agent AI System
            </p>
          </div>
          <UserSelector />
        </header>
        <div className="flex-1 min-h-0">
          <ChatWindow
            conversationId={selectedConversationId}
            onNewMessage={handleNewMessage}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
