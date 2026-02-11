import React, { createContext, useContext, useState, useCallback } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

const USERS: User[] = [
  { id: "user_1", name: "John Doe", email: "john@example.com" },
  { id: "user_2", name: "Jane Smith", email: "jane@example.com" },
];

type UserContextType = {
  currentUser: User;
  setUser: (userId: string) => void;
  availableUsers: User[];
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]);

  const setUser = useCallback((userId: string) => {
    const user = USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setUser,
        availableUsers: USERS,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
