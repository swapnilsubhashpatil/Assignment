import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { client } from "../lib/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HonoClient = any;

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  stats?: {
    orderCount: number;
    conversationCount: number;
  };
}

interface UserContextType {
  currentUser: User;
  setCurrentUser: (userId: string) => void;
  availableUsers: User[];
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  id: "user_1",
  name: "Loading...",
  email: "",
  role: "",
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        const res = await (client as HonoClient).api.users.$get();
        
        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }
        
        const data = await res.json() as { users: User[] };
        setAvailableUsers(data.users);
        
        const savedUserId = localStorage.getItem("selectedUserId");
        const savedUser = data.users.find((u) => u.id === savedUserId);
        
        if (savedUser) {
          setCurrentUserState(savedUser);
        } else if (data.users.length > 0) {
          setCurrentUserState(data.users[0]);
          localStorage.setItem("selectedUserId", data.users[0].id);
        }
      } catch {
        setError("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  const setCurrentUser = useCallback((userId: string) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUserState(user);
      localStorage.setItem("selectedUserId", userId);
      window.location.reload();
    }
  }, [availableUsers]);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        isLoading,
        error,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
