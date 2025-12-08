// Catégories d'expédition pour Mondial Relay
export type ShippingCategoryId = 'CAT_1' | 'CAT_2' | 'CAT_3' | 'CAT_4' | 'CAT_5' | 'CAT_VOLUMINEUX';

export interface ShippingCategory {
  id: ShippingCategoryId;
  name: string;
  description: string;
  weightRange: string;
  minWeight: number; // en grammes
  maxWeight: number; // en grammes
  icon: string;
  examples: string[];
  requiresDimensions: boolean;
  // Dimensions par défaut pour le calcul Mondial Relay (en cm)
  defaultDimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export const SHIPPING_CATEGORIES: ShippingCategory[] = [
  {
    id: 'CAT_1',
    name: 'Airsoft léger',
    description: 'Petit colis léger',
    weightRange: '< 1 kg',
    minWeight: 0,
    maxWeight: 1000,
    icon: '📦',
    examples: ['Pistolet compact', 'Chargeurs', 'Accessoires légers', 'Red dot'],
    requiresDimensions: false,
    defaultDimensions: { length: 30, width: 20, height: 10 }
  },
  {
    id: 'CAT_2',
    name: 'Standard',
    description: 'Colis de taille moyenne',
    weightRange: '1 à 2,5 kg',
    minWeight: 1000,
    maxWeight: 2500,
    icon: '📦',
    examples: ['Pistolet standard', 'SMG compact', 'Gilet tactique', 'Masque'],
    requiresDimensions: false,
    defaultDimensions: { length: 40, width: 25, height: 15 }
  },
  {
    id: 'CAT_3',
    name: 'Standard+ / Fusils',
    description: 'Colis moyen à grand',
    weightRange: '2,5 à 4 kg',
    minWeight: 2500,
    maxWeight: 4000,
    icon: '🔫',
    examples: ['AEG standard', 'M4/AK', 'Fusil d\'assaut', 'Réplique complète'],
    requiresDimensions: false,
    defaultDimensions: { length: 90, width: 30, height: 12 }
  },
  {
    id: 'CAT_4',
    name: 'Lourd / Sniper',
    description: 'Colis lourd ou long',
    weightRange: '4 à 8 kg',
    minWeight: 4000,
    maxWeight: 8000,
    icon: '🎯',
    examples: ['Sniper', 'Réplique longue', 'LMG', 'Kit avec accessoires'],
    requiresDimensions: false,
    defaultDimensions: { length: 120, width: 30, height: 15 }
  },
  {
    id: 'CAT_5',
    name: 'Kit / Bundle',
    description: 'Gros colis ou kit complet',
    weightRange: '8 à 15 kg',
    minWeight: 8000,
    maxWeight: 15000,
    icon: '🎒',
    examples: ['Kit complet', 'Bundle multi-répliques', 'Équipement full set'],
    requiresDimensions: false,
    defaultDimensions: { length: 100, width: 50, height: 40 }
  },
  {
    id: 'CAT_VOLUMINEUX',
    name: 'Colis volumineux',
    description: 'Dimensions personnalisées',
    weightRange: 'Variable',
    minWeight: 0,
    maxWeight: 30000,
    icon: '📐',
    examples: ['Colis hors normes', 'Équipement encombrant'],
    requiresDimensions: true,
    defaultDimensions: undefined // Doit être renseigné par le vendeur
  }
];

// Helper pour obtenir une catégorie par ID
export function getShippingCategory(id: ShippingCategoryId): ShippingCategory | undefined {
  return SHIPPING_CATEGORIES.find(cat => cat.id === id);
}

// Helper pour obtenir le nom de la catégorie
export function getShippingCategoryName(id: ShippingCategoryId): string {
  const cat = getShippingCategory(id);
  return cat ? `${cat.icon} ${cat.name}` : 'Non défini';
}

// Helper pour valider le poids selon la catégorie
export function validateWeightForCategory(categoryId: ShippingCategoryId, weightInGrams: number): boolean {
  const cat = getShippingCategory(categoryId);
  if (!cat) return false;
  return weightInGrams >= cat.minWeight && weightInGrams <= cat.maxWeight;
}
