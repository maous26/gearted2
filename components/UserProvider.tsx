import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

const USER_STORAGE_KEY = '@gearted_user_profile';

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
  const [isLoaded, setIsLoaded] = useState(false);

  // Load user profile from AsyncStorage on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('[UserProvider] Loaded user profile:', parsedUser.username);
      }
    } catch (error) {
      console.error('[UserProvider] Error loading user profile:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveUserProfile = async (userProfile: UserProfile) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
      console.log('[UserProvider] Saved user profile:', userProfile.username);
    } catch (error) {
      console.error('[UserProvider] Error saving user profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    let updatedUser: UserProfile;
    
    if (user) {
      updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    } else {
      // Crée un profil de base si inexistante afin de permettre la première saisie
      updatedUser = {
        id: 'local-' + Date.now().toString(),
        username: updates.username || 'NouvelUtilisateur',
        teamName: updates.teamName || 'Sans équipe',
        avatar: updates.avatar ?? null,
        email: updates.email || ''
      };
      setUser(updatedUser);
    }
    
    // Persist to AsyncStorage
    await saveUserProfile(updatedUser);
  };

  const logout = async () => {
    setUser(null);
    setIsOnboarded(false);
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      console.log('[UserProvider] User profile cleared');
    } catch (error) {
      console.error('[UserProvider] Error clearing user profile:', error);
    }
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
