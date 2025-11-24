import AsyncStorage from '@react-native-async-storage/async-storage';
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
  sellerRole?: string; // Discord role
  sellerBadges?: string[]; // Discord badges
  rating: number;
  images: string[];
  featured: boolean;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
  handDelivery?: boolean; // Remise en main propre disponible
}

const PRODUCTS_STORAGE_KEY = '@gearted_products';
const FAVORITES_STORAGE_KEY = '@gearted_favorites';

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
  addProduct: (product: Product) => void;
  setFilters: (filters: ProductFilters) => void;
  resetFilters: () => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearError: () => void;
  loadFromStorage: () => Promise<void>;
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

  setProducts: async (products) => {
    set({ products });
    try {
      await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving products:', error);
    }
  },

  addProduct: async (product) => {
    const products = [...get().products, product];
    set({ products });
    try {
      await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving product:', error);
    }
  },

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: initialFilters }),

  toggleFavorite: async (productId) => {
    const state = get();
    const favorites = state.favorites.includes(productId)
      ? state.favorites.filter((id) => id !== productId)
      : [...state.favorites, productId];
    set({ favorites });
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  },

  isFavorite: (productId) => get().favorites.includes(productId),

  clearError: () => set({ error: null }),

  loadFromStorage: async () => {
    try {
      const [productsData, favoritesData] = await Promise.all([
        AsyncStorage.getItem(PRODUCTS_STORAGE_KEY),
        AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
      ]);
      
      if (productsData) {
        const products = JSON.parse(productsData);
        set({ products });
      }
      
      if (favoritesData) {
        const favorites = JSON.parse(favoritesData);
        set({ favorites });
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  },
}));
