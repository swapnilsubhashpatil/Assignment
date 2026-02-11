import React, { useState, useRef, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { ChevronDown, Loader2 } from "lucide-react";

export const UserSelector: React.FC = () => {
  const { currentUser, setCurrentUser, availableUsers, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserSelect = (userId: string) => {
    setCurrentUser(userId);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border border-black bg-gray-50">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-black bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#E16259] flex items-center justify-center text-white font-bold text-sm">
          {currentUser.name.charAt(0)}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-bold text-black">{currentUser.name}</div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-black shadow-lg z-50">
          {availableUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                user.id === currentUser.id ? "bg-[#E16259]/5" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  user.id === currentUser.id ? "bg-[#E16259]" : "bg-gray-400"
                }`}
              >
                {user.name.charAt(0)}
              </div>
              <div className="text-left flex-1">
                <div
                  className={`text-sm font-bold ${
                    user.id === currentUser.id ? "text-[#E16259]" : "text-black"
                  }`}
                >
                  {user.name}
                </div>
              </div>
              {user.id === currentUser.id && (
                <div className="w-2 h-2 rounded-full bg-[#E16259]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
