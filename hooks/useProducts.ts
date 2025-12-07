import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import api from '../services/api';
import TokenManager from '../services/storage';
import { Product, ProductFilters, useProductsStore } from '../stores/productsStore';

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}



// Hook pour récupérer les produits
export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await api.get<ProductsResponse>('/api/products', filters);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour infinite scroll
export const useInfiniteProducts = (filters?: ProductFilters) => {
  return useInfiniteQuery({
    queryKey: ['products-infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get<ProductsResponse>('/api/products', {
        ...filters,
        page: pageParam,
        limit: 20,
      });
      return response;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
};

// Hook pour un produit spécifique
export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await api.get<Product>(`/api/products/${productId}`);
      return response;
    },
    enabled: !!productId,
  });
};

// Hook pour créer un produit
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: FormData) => {
      const response = await api.upload<Product>('/api/products', productData);
      return response;
    },
    onSuccess: () => {
      // Invalider le cache des produits pour recharger la liste
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// Hook pour mettre à jour un produit (vendeur uniquement)
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Product> & {
        parcelLength?: number;
        parcelWidth?: number;
        parcelHeight?: number;
        parcelWeight?: number;
      };
    }) => {
      const response = await api.put<Product>(`/api/products/${id}`, data);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
    },
  });
};

// Hook pour supprimer un produit (vendeur uniquement, avant achat)
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.delete<{ success: boolean; message: string }>(`/api/products/${productId}`);
      return response;
    },
    onSuccess: (_data, productId) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.removeQueries({ queryKey: ['product', productId] });
    },
  });
};

// Hook pour les favoris - only fetch if user is authenticated
export const useFavorites = () => {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await api.get<{ productIds: string[] }>('/api/favorites');
      // Sync Zustand store (replace instead of toggle)
      useProductsStore.setState({ favorites: response.productIds });
      return response.productIds;
    },
    staleTime: 30_000,
    enabled: false, // Disabled by default, use useFavoritesWithAuth instead
    retry: false,
  });
};

// Hook pour les favoris avec vérification d'authentification
export const useFavoritesWithAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    TokenManager.hasValidToken().then(setIsAuthenticated);
  }, []);

  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await api.get<{ productIds: string[] }>('/api/favorites');
      useProductsStore.setState({ favorites: response.productIds });
      return response.productIds;
    },
    staleTime: 30_000,
    enabled: isAuthenticated,
    retry: false,
  });
};

// Hook pour toggle favorite
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      await api.post(`/api/favorites/${productId}/toggle`);
    },
    onMutate: async (productId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites']);

      // Optimistically update
      queryClient.setQueryData<string[]>(['favorites'], (old = []) => {
        return old.includes(productId)
          ? old.filter((id) => id !== productId)
          : [...old, productId];
      });
      // Mirror optimistic update into Zustand store
      useProductsStore.setState((state) => ({
        favorites: state.favorites.includes(productId)
          ? state.favorites.filter(id => id !== productId)
          : [...state.favorites, productId]
      }));

      return { previousFavorites };
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
        useProductsStore.setState({ favorites: context.previousFavorites });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

// Hook pour les statistiques de catégories
export const useCategoryStats = () => {
  return useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => {
      const response = await api.get<{ categories: Array<{ category: string; count: number }> }>('/api/products/stats/categories');
      return response.categories;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour les produits à la une (boosted ou random)
interface FeaturedProductsResponse {
  products: Product[];
  boostEnabled: boolean;
  total: number;
}

export const useFeaturedProducts = (limit: number = 6) => {
  return useQuery({
    queryKey: ['featured-products', limit],
    queryFn: async () => {
      const response = await api.get<FeaturedProductsResponse>('/api/products/featured', { limit });
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - plus court car random
  });
};

// Hook pour les paramètres publics de la plateforme
interface PublicSettings {
  boost: {
    enabled: boolean;
    showLatestSection: boolean;
  };
}

export const usePublicSettings = () => {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const response = await api.get<PublicSettings>('/api/settings/public');
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
