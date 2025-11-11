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

// Mock data fallback when backend is unavailable
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    title: "AK-74 Kalashnikov Réplique",
    price: 289.99,
    condition: "Excellent",
    location: "Paris, 75001",
    seller: "AirsoftPro92",
    sellerId: "mock-user-1",
    rating: 4.8,
    images: ["https://via.placeholder.com/200x150/4B5D3A/FFFFFF?text=AK-74"],
    category: "repliques",
    featured: true,
    description: "Réplique AEG en excellent état, peu utilisée",
    createdAt: new Date().toISOString()
  },
  {
    id: "2", 
    title: "Red Dot Sight - EOTech 552",
    price: 45.50,
    condition: "Très bon",
    location: "Lyon, 69000",
    seller: "TacticalGear",
    sellerId: "mock-user-2",
    rating: 4.9,
    images: ["https://via.placeholder.com/200x150/8B4513/FFFFFF?text=Red+Dot"],
    category: "optiques",
    featured: false,
    description: "Viseur holographique réplique EOTech",
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    title: "Gilet Tactique MultiCam",
    price: 120.00,
    condition: "Neuf",
    location: "Marseille, 13000", 
    seller: "MilSimStore",
    sellerId: "mock-user-3",
    rating: 4.7,
    images: ["https://via.placeholder.com/200x150/556B2F/FFFFFF?text=Gilet"],
    category: "equipement",
    featured: true,
    description: "Gilet plate carrier MultiCam neuf, jamais utilisé",
    createdAt: new Date().toISOString()
  },
  {
    id: "4",
    title: "Billes 0.25g Bio (5000pcs)",
    price: 18.99,
    condition: "Neuf",
    location: "Toulouse, 31000",
    seller: "BioBB_Shop",
    sellerId: "mock-user-4",
    rating: 4.6,
    images: ["https://via.placeholder.com/200x150/2F4F4F/FFFFFF?text=Billes"],
    category: "munitions",
    featured: false,
    description: "Billes biodégradables 0.25g, sachet de 5000",
    createdAt: new Date().toISOString()
  },
  {
    id: "5",
    title: "M4A1 Custom Build",
    price: 450.00,
    condition: "Excellent",
    location: "Nice, 06000",
    seller: "CustomBuilds",
    sellerId: "mock-user-5",
    rating: 5.0,
    images: ["https://via.placeholder.com/200x150/4B5D3A/FFFFFF?text=M4A1"],
    category: "repliques", 
    featured: true,
    description: "M4A1 custom avec upgrades internes",
    createdAt: new Date().toISOString()
  },
  {
    id: "6",
    title: "Chargeur M4 120 billes",
    price: 12.50,
    condition: "Bon",
    location: "Bordeaux, 33000",
    seller: "PartsPro",
    sellerId: "mock-user-6",
    rating: 4.4,
    images: ["https://via.placeholder.com/200x150/696969/FFFFFF?text=Chargeur"],
    category: "pieces",
    featured: false,
    description: "Chargeur mid-cap 120 billes pour M4",
    createdAt: new Date().toISOString()
  }
];

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
      try {
        const response = await api.get<ProductsResponse>('/api/products', {
          ...filters,
          page: pageParam,
          limit: 20,
        });
        return response;
      } catch (error) {
        // Fallback to mock data when backend is unavailable
        console.log('[useInfiniteProducts] Backend unavailable, using mock data');
        let filteredProducts = [...MOCK_PRODUCTS];
        
        // Apply category filter
        if (filters?.category) {
          filteredProducts = filteredProducts.filter(p => p.category === filters.category);
        }
        
        // Apply search filter
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          filteredProducts = filteredProducts.filter(p => 
            p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower)
          );
        }
        
        return {
          products: filteredProducts,
          total: filteredProducts.length,
          page: pageParam,
          limit: 20,
          hasMore: false
        };
      }
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
export type FavoritesResponse = {
  productIds: string[];
  products: Product[];
};

export const useFavorites = () => {
  return useQuery<FavoritesResponse>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await api.get<FavoritesResponse>('/api/favorites');
      useProductsStore.setState({ favorites: response.productIds });
      return response;
    },
    staleTime: 30_000,
  });
};

// Hook pour toggle favorite
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.post<FavoritesResponse>(`/api/favorites/${productId}/toggle`);
      return response;
    },
    onMutate: async (productId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<FavoritesResponse>(['favorites']);

      // Simple optimistic update for the IDs only (backend will send full products)
      const isCurrentlyFavorite = previousFavorites?.productIds.includes(productId) ?? false;
      const nextProductIds = isCurrentlyFavorite
        ? previousFavorites?.productIds.filter((id) => id !== productId) ?? []
        : [...(previousFavorites?.productIds ?? []), productId];

      queryClient.setQueryData<FavoritesResponse>(['favorites'], {
        productIds: nextProductIds,
        products: previousFavorites?.products ?? [],
      });

      // Mirror optimistic update into Zustand store
      useProductsStore.setState({ favorites: nextProductIds });

      return { previousFavorites };
    },
    onSuccess: (data) => {
      // Update with real data from backend (includes full product details)
      queryClient.setQueryData<FavoritesResponse>(['favorites'], data);
      useProductsStore.setState({ favorites: data.productIds });
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
        useProductsStore.setState({ favorites: context.previousFavorites.productIds });
      }
    },
    onSettled: () => {
      // Refetch to ensure we have the latest data
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
