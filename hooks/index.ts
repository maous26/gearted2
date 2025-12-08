/**
 * Hooks centralisés pour Gearted
 *
 * Ce fichier exporte tous les hooks React Query et utilitaires
 * pour faciliter l'importation et maintenir la cohérence.
 */

// Hooks pour les produits
export {
  useCategoryStats,
  useCreateProduct,
  useDeleteProduct,
  useFavorites,
  useFavoritesWithAuth,
  useFeaturedProducts,
  useInfiniteProducts,
  useProduct,
  useProducts,
  usePublicSettings,
  useToggleFavorite,
  useUpdateProduct
} from './useProducts';

// Hooks pour les transactions
export {
  transactionKeys,
  useCancelTransaction,
  useInvalidateTransactions,
  useMyPurchases,
  useMySales,
  useTransactionDetails,
  useTransactionStatusPolling
} from './useTransactions';

// Hooks pour le profil utilisateur
export {
  useInvalidateProfile,
  userKeys,
  useUpdateProfile,
  useUserProfile,
  useUserProfileWithAuth
} from './useUserProfile';

// Hook pour le flux d'achat
export { usePurchaseFlow } from './usePurchaseFlow';
