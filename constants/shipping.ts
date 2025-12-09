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
    name: 'Petit accessoire',
    description: 'Max 1 kg',
    weightRange: '< 1 kg',
    minWeight: 0,
    maxWeight: 1000,
    icon: '📦',
    examples: ['Chargeurs', 'Red dot', 'Grip', 'Petits accessoires'],
    requiresDimensions: false,
    defaultDimensions: { length: 30, width: 20, height: 10 }
  },
  {
    id: 'CAT_2',
    name: 'Pistolet / Accessoire moyen',
    description: 'Max 2,5 kg',
    weightRange: '1 à 2,5 kg',
    minWeight: 1000,
    maxWeight: 2500,
    icon: '🔫',
    examples: ['Pistolet', 'Masque', 'Gilet', 'SMG compact'],
    requiresDimensions: false,
    defaultDimensions: { length: 40, width: 25, height: 15 }
  },
  {
    id: 'CAT_3',
    name: 'Réplique standard',
    description: 'Max 4 kg',
    weightRange: '2,5 à 4 kg',
    minWeight: 2500,
    maxWeight: 4000,
    icon: '🎯',
    examples: ['M4', 'AK', 'AEG standard', 'Fusil d\'assaut'],
    requiresDimensions: false,
    defaultDimensions: { length: 90, width: 30, height: 12 }
  },
  {
    id: 'CAT_4',
    name: 'Réplique longue / Sniper',
    description: 'Max 8 kg',
    weightRange: '4 à 8 kg',
    minWeight: 4000,
    maxWeight: 8000,
    icon: '🎯',
    examples: ['Sniper', 'LMG', 'Réplique longue'],
    requiresDimensions: false,
    defaultDimensions: { length: 120, width: 30, height: 15 }
  },
  {
    id: 'CAT_5',
    name: 'Kit complet / Bundle',
    description: 'Max 15 kg',
    weightRange: '8 à 15 kg',
    minWeight: 8000,
    maxWeight: 15000,
    icon: '🎒',
    examples: ['Kit complet', 'Bundle multi-répliques', 'Full set'],
    requiresDimensions: false,
    defaultDimensions: { length: 100, width: 50, height: 40 }
  },
  {
    id: 'CAT_VOLUMINEUX',
    name: 'Colis volumineux',
    description: 'Max 30 kg - Dimensions à préciser',
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
