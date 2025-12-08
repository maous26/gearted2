import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import userService, { UpdateProfileData, UserProfile } from '../services/user';
import TokenManager from '../services/storage';

// Query keys centralisées pour le profil
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

/**
 * Hook pour récupérer le profil utilisateur avec cache React Query
 * Synchronise avec le UserProvider Context
 */
export const useUserProfile = (options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const profile = await userService.getProfile();
      return profile;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - le profil change rarement
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
    retry: 1,
    enabled: options?.enabled ?? true,
  });
};

/**
 * Hook avec vérification d'authentification
 */
export const useUserProfileWithAuth = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      // Vérifier si l'utilisateur est authentifié
      const hasToken = await TokenManager.hasValidToken();
      if (!hasToken) {
        throw new Error('Not authenticated');
      }
      const profile = await userService.getProfile();
      return profile;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false, // Pas de retry si non authentifié
  });
};

/**
 * Hook pour mettre à jour le profil avec invalidation automatique
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      return await userService.updateProfile(data);
    },
    onSuccess: (updatedProfile) => {
      // Mettre à jour le cache immédiatement avec les nouvelles données
      queryClient.setQueryData(userKeys.profile(), updatedProfile);
    },
    onError: () => {
      // En cas d'erreur, invalider pour forcer un refetch
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
};

/**
 * Hook utilitaire pour invalider le profil
 */
export const useInvalidateProfile = () => {
  const queryClient = useQueryClient();

  return {
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
    clear: () => {
      queryClient.removeQueries({ queryKey: userKeys.all });
    },
  };
};
