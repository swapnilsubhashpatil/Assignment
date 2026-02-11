import React from "react";
import { useUser } from "../contexts/UserContext";

export const UserSelector: React.FC = () => {
  const { currentUser, setUser, availableUsers } = useUser();

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 uppercase tracking-wider">
        User:
      </span>
      <select
        value={currentUser.id}
        onChange={(e) => setUser(e.target.value)}
        className="px-3 py-1.5 border border-black text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black bg-white"
      >
        {availableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
  );
};
