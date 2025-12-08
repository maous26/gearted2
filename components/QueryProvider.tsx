import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

/**
 * Configuration optimisée du cache React Query pour Gearted
 *
 * Stratégie de cache par type de données:
 *
 * 1. PRODUITS (products, products-infinite, featured-products)
 *    - staleTime: 5 minutes (les produits changent modérément)
 *    - Invalidés après: achat, suppression, modification
 *
 * 2. TRANSACTIONS (transactions, purchases, sales)
 *    - staleTime: 30 secondes (changent souvent après achat/webhook)
 *    - Invalidés après: achat, annulation, génération étiquette
 *
 * 3. FAVORIS (favorites)
 *    - staleTime: 30 secondes (utilisateur peut modifier fréquemment)
 *    - Mises à jour optimistes pour UX instantanée
 *
 * 4. PROFIL UTILISATEUR (user, profile)
 *    - staleTime: 2 minutes (change rarement)
 *    - Invalidé après: mise à jour profil
 *
 * 5. SETTINGS (public-settings, category-stats)
 *    - staleTime: 5 minutes (change rarement)
 */

// Configuration du QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes par défaut
      gcTime: 10 * 60 * 1000, // 10 minutes en cache (remplace cacheTime)
      refetchOnWindowFocus: false, // Pas de refetch sur focus (React Native)
      refetchOnReconnect: true, // Refetch quand la connexion revient
      refetchOnMount: true, // Refetch si données stale au montage
    },
    mutations: {
      retry: 1,
      // Les mutations n'utilisent pas de cache
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
