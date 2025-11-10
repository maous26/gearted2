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
        console.log('[UserProvider] Loaded user profile:', {
          username: parsedUser.username,
          avatar: parsedUser.avatar ? 'YES' : 'NO',
          teamName: parsedUser.teamName
        });
      } else {
        console.log('[UserProvider] No stored profile found');
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
      console.log('[UserProvider] Saved user profile:', {
        username: userProfile.username,
        avatar: userProfile.avatar ? 'YES' : 'NO',
        teamName: userProfile.teamName
      });
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
      // Crée un profil de base si inexistant afin de permettre la première saisie
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
        bio: updates.bio
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
        console.log('[UserProvider] Logout: profile reloaded from storage and kept in state');
      } else {
        setUser(null);
        console.log('[UserProvider] Logout: no stored profile found');
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
