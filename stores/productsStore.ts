import { create } from 'zustand';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  location: string;
  seller: string;
  sellerId: string;
  rating: number;
  images: string[];
  featured: boolean;
  createdAt: string;
  handDelivery?: boolean; // Remise en main propre disponible
}

export interface ProductFilters {
  search?: string;
  category?: string | null;
  priceMin?: number;
  priceMax?: number;
  condition?: string[];
  location?: string;
  sortBy?: 'recent' | 'price_low' | 'price_high' | 'rating' | 'distance';
}

interface ProductsStore {
  products: Product[];
  favorites: string[];
  filters: ProductFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProducts: (products: Product[]) => void;
  setFilters: (filters: ProductFilters) => void;
  resetFilters: () => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearError: () => void;
}

const initialFilters: ProductFilters = {
  search: '',
  category: null,
  priceMin: undefined,
  priceMax: undefined,
  condition: [],
  location: undefined,
  sortBy: 'recent',
};

export const useProductsStore = create<ProductsStore>((set, get) => ({
  products: [],
  favorites: [],
  filters: initialFilters,
  isLoading: false,
  error: null,

  setProducts: (products) => set({ products }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: initialFilters }),

  toggleFavorite: (productId) =>
    set((state) => {
      const favorites = state.favorites.includes(productId)
        ? state.favorites.filter((id) => id !== productId)
        : [...state.favorites, productId];
      return { favorites };
    }),

  isFavorite: (productId) => get().favorites.includes(productId),

  clearError: () => set({ error: null }),
}));
