import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import transactionService, { Transaction } from '../services/transactions';

// Query keys centralisées pour les transactions
export const transactionKeys = {
  all: ['transactions'] as const,
  purchases: () => [...transactionKeys.all, 'purchases'] as const,
  sales: () => [...transactionKeys.all, 'sales'] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer mes achats (en tant qu'acheteur)
 * Utilise React Query pour le cache automatique
 */
export const useMyPurchases = () => {
  return useQuery({
    queryKey: transactionKeys.purchases(),
    queryFn: async () => {
      const purchases = await transactionService.getMyPurchases();
      return purchases;
    },
    staleTime: 30_000, // 30 secondes - les transactions changent souvent
    gcTime: 5 * 60 * 1000, // 5 minutes en cache
    retry: 2,
  });
};

/**
 * Hook pour récupérer mes ventes (en tant que vendeur)
 * Utilise React Query pour le cache automatique
 */
export const useMySales = () => {
  return useQuery({
    queryKey: transactionKeys.sales(),
    queryFn: async () => {
      const sales = await transactionService.getMySales();
      return sales;
    },
    staleTime: 30_000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes en cache
    retry: 2,
  });
};

/**
 * Hook pour récupérer les détails d'une transaction
 */
export const useTransactionDetails = (transactionId: string) => {
  return useQuery({
    queryKey: transactionKeys.detail(transactionId),
    queryFn: async () => {
      const transaction = await transactionService.getTransactionDetails(transactionId);
      return transaction;
    },
    enabled: !!transactionId,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook pour annuler une transaction avec invalidation automatique du cache
 */
export const useCancelTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, reason }: { transactionId: string; reason?: string }) => {
      return await transactionService.cancelTransaction(transactionId, reason);
    },
    onSuccess: (data, variables) => {
      // Invalider toutes les queries de transactions
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });

      // Invalider aussi les produits car le produit est remis en vente
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });

      // Si on a le productId, invalider aussi la query spécifique
      if (data.productId) {
        queryClient.invalidateQueries({ queryKey: ['product', data.productId] });
      }
    },
  });
};

/**
 * Hook utilitaire pour invalider toutes les transactions
 * Utilisé après un achat réussi
 */
export const useInvalidateTransactions = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
    invalidatePurchases: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.purchases() });
    },
    invalidateSales: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.sales() });
    },
  };
};

/**
 * Hook pour polling du statut d'une transaction
 * Utilisé après un paiement pour attendre la confirmation webhook
 */
export const useTransactionStatusPolling = (
  transactionId: string | null,
  options: {
    enabled?: boolean;
    onSuccess?: (transaction: Transaction) => void;
    targetStatus?: string;
  } = {}
) => {
  const { enabled = true, onSuccess, targetStatus = 'SUCCEEDED' } = options;

  return useQuery({
    queryKey: ['transaction-status', transactionId],
    queryFn: async () => {
      if (!transactionId) throw new Error('No transaction ID');
      const transaction = await transactionService.getTransactionDetails(transactionId);
      return transaction;
    },
    enabled: enabled && !!transactionId,
    refetchInterval: (query) => {
      // Arrêter le polling si on a atteint le statut cible
      const data = query.state.data;
      if (data?.status === targetStatus || data?.status === 'FAILED' || data?.status === 'CANCELLED') {
        return false;
      }
      // Polling toutes les 2 secondes
      return 2000;
    },
    refetchIntervalInBackground: false,
    staleTime: 0, // Toujours refetch
    gcTime: 0, // Pas de cache pour le polling
  });
};
