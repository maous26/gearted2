import api from './api';

export interface Manufacturer {
  id: string;
  name: string;
  slug: string;
  country?: string;
  description?: string;
  logo?: string;
  popularity: number;
}

export interface WeaponType {
  value: string;
  label: string;
}

export interface CompatiblePart {
  name: string;
  manufacturer: string;
  compatibility: string;
  price: string;
  partId: string;
  requiresModification?: boolean;
  notes?: string;
}

export interface CompatibilityResult {
  manufacturer: string;
  weaponType: string;
  weaponModel?: string;
  hasSpecificModel: boolean;
  compatibility: Record<string, CompatiblePart[]>;
}

export interface SearchItem {
  id: string;
  type: 'weapon' | 'part';
  name: string;
  manufacturer: string;
  reference: string;
}

export interface VerifiedCompatibility {
  compatible: boolean;
  verified: boolean;
  score?: number;
  requiresModification?: boolean;
  notes?: string;
  warning?: string;
  message?: string;
  recommendation?: string;
}

export const compatibilityApi = {
  // Get top manufacturers
  async getManufacturers(): Promise<Manufacturer[]> {
    try {
      const response = await api.get<Manufacturer[]>('/api/compatibility/manufacturers');
      return response;
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      return [];
    }
  },

  // Get weapon types
  async getWeaponTypes(): Promise<WeaponType[]> {
    try {
      const response = await api.get<WeaponType[]>('/api/compatibility/weapon-types');
      return response;
    } catch (error) {
      console.error('Error fetching weapon types:', error);
      return [];
    }
  },

  // Check compatibility
  async checkCompatibility(
    manufacturerName: string,
    weaponType: string
  ): Promise<CompatibilityResult | null> {
    try {
      const response = await api.get<CompatibilityResult>('/api/compatibility/check', {
        manufacturerName,
        weaponType,
      });
      return response;
    } catch (error) {
      console.error('Error checking compatibility:', error);
      return null;
    }
  },

  // Search items by query
  async searchItems(query: string): Promise<SearchItem[]> {
    try {
      const response = await api.get<SearchItem[]>('/api/search/items', { query });
      return response;
    } catch (error) {
      console.error('Error searching items:', error);
      return [];
    }
  },

  // Check verified compatibility between two items
  async checkItemCompatibility(
    item1Id: string,
    item2Id: string
  ): Promise<VerifiedCompatibility | null> {
    try {
      const response = await api.get<VerifiedCompatibility>(
        `/api/search/compatibility/${item1Id}/${item2Id}`
      );
      return response;
    } catch (error) {
      console.error('Error checking item compatibility:', error);
      return null;
    }
  },
};
