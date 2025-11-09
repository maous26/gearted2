import React, { createContext, ReactNode, useContext, useState } from "react";

export interface UserProfile {
  id: string;
  username: string;
  teamName: string;
  avatar: string | null;
  email: string;
}

interface UserContextValue {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logout: () => void;
  isOnboarded: boolean;
  completeOnboarding: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updates });
    } else {
      // Crée un profil de base si inexistante afin de permettre la première saisie
      const newUser: UserProfile = {
        id: 'local-' + Date.now().toString(),
        username: updates.username || 'NouvelUtilisateur',
        teamName: updates.teamName || 'Sans équipe',
        avatar: updates.avatar ?? null,
        email: updates.email || ''
      };
      setUser(newUser);
    }
  };

  const logout = () => {
    setUser(null);
    setIsOnboarded(false);
  };

  const completeOnboarding = () => {
    setIsOnboarded(true);
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateProfile, logout, isOnboarded, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
