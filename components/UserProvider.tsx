import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import TokenManager from '../services/storage';
import { queryClient } from './QueryProvider';

const USER_STORAGE_KEY = '@gearted_user_profile';

export interface UserProfile {
  id: string;
  username: string;
  teamName: string;
  avatar: string | null;
  email: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  phone?: string;
  bio?: string;
  provider?: string;
  role?: string;
  badge?: string;
  badges?: string[]; // Tous les badges Discord de l'utilisateur
}

interface UserContextValue {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logout: () => void;
  isOnboarded: boolean;
  completeOnboarding: () => void;
  isLoaded: boolean;
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
        // Profil chargé depuis le stockage local
      } else {
  // Aucun profil trouvé dans le stockage
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
      // Profil sauvegardé dans le stockage local
    } catch (error) {
      console.error('[UserProvider] Error saving user profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    let updatedUser: UserProfile;
    // Toujours préserver toutes les propriétés existantes
    if (user) {
      updatedUser = {
        id: updates.id ?? user.id,
        username: updates.username ?? user.username,
        teamName: updates.teamName ?? user.teamName,
        avatar: updates.avatar !== undefined ? updates.avatar : user.avatar,
        email: updates.email ?? user.email,
        firstName: updates.firstName !== undefined ? updates.firstName : user.firstName,
        lastName: updates.lastName !== undefined ? updates.lastName : user.lastName,
        location: updates.location !== undefined ? updates.location : user.location,
        phone: updates.phone !== undefined ? updates.phone : user.phone,
        bio: updates.bio !== undefined ? updates.bio : user.bio,
        provider: updates.provider !== undefined ? updates.provider : user.provider,
        role: updates.role !== undefined ? updates.role : user.role,
        badge: updates.badge !== undefined ? updates.badge : user.badge,
        badges: updates.badges !== undefined ? updates.badges : user.badges
      };
      setUser(updatedUser);
    } else {
      updatedUser = {
        id: updates.id || 'local-' + Date.now().toString(),
        username: updates.username || 'NouvelUtilisateur',
        teamName: updates.teamName || 'Sans équipe',
        avatar: updates.avatar ?? null,
        email: updates.email || '',
        firstName: updates.firstName,
        lastName: updates.lastName,
        location: updates.location,
        phone: updates.phone,
        bio: updates.bio,
        provider: updates.provider,
        role: updates.role,
        badge: updates.badge,
        badges: updates.badges
      };
      setUser(updatedUser);
    }
    // Persist to AsyncStorage
    await saveUserProfile(updatedUser);
  };

  const logout = async () => {
    // Déconnexion : supprimer les tokens et vider le profil
    console.log('[UserProvider] Starting logout process...');

    try {
      // 1. Clear React Query cache first to prevent stale authenticated requests
      queryClient.clear();
      console.log('[UserProvider] Query cache cleared');

      // 2. Supprimer les tokens JWT (SecureStore)
      await TokenManager.clearTokens();
      console.log('[UserProvider] SecureStore tokens cleared');

      // 3. Supprimer aussi authToken et userData de AsyncStorage (utilisé par login.tsx)
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      console.log('[UserProvider] AsyncStorage auth data cleared');

      // 4. Supprimer le profil du stockage local
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      console.log('[UserProvider] User profile removed from storage');

      // 5. Clear state AFTER storage is cleared
      setIsOnboarded(false);
      setUser(null);
      console.log('[UserProvider] State cleared - logout complete');
    } catch (error) {
      console.error('[UserProvider] Error during logout:', error);
      // Still clear state even if storage operations fail
      setIsOnboarded(false);
      setUser(null);
    }
  };

  const completeOnboarding = () => {
    setIsOnboarded(true);
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateProfile, logout, isOnboarded, completeOnboarding, isLoaded }}>
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
