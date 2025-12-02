import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
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

// Hook pour mettre à jour un produit
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Product>;
    }) => {
      const response = await api.put<Product>(`/api/products/${id}`, data);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
    },
  });
};

// Hook pour supprimer un produit
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// Hook pour les favoris
export const useFavorites = () => {
  const setFavoritesInStore = useProductsStore(state => state.toggleFavorite); // not used directly
  const store = useProductsStore.getState();
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await api.get<{ productIds: string[] }>('/api/favorites');
      // Sync Zustand store (replace instead of toggle)
      useProductsStore.setState({ favorites: response.productIds });
      return response.productIds;
    },
    staleTime: 30_000,
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
