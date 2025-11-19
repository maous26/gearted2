import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

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
        provider: updates.provider !== undefined ? updates.provider : user.provider
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
        provider: updates.provider
      };
      setUser(updatedUser);
    }
    // Persist to AsyncStorage
    await saveUserProfile(updatedUser);
  };

  const logout = async () => {
    // Déconnexion : on vide le state MAIS on recharge immédiatement depuis AsyncStorage
    // Cela permet de garder les infos du profil affichées même après déconnexion
    setIsOnboarded(false);
    
    try {
      // Recharger le profil depuis le stockage pour le garder affiché
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
  // Profil rechargé après déconnexion
      } else {
        setUser(null);
  // Aucun profil trouvé après déconnexion
      }
    } catch (error) {
      console.error('[UserProvider] Error reloading profile after logout:', error);
      setUser(null);
    }
    
    // Note: Les tokens JWT sont supprimés par TokenManager.clearTokens()
    // Le profil reste visible mais l'utilisateur devra se reconnecter pour accéder à l'app
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
