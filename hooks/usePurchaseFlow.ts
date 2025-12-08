import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import api from '../services/api';
import { transactionKeys } from './useTransactions';

interface PurchaseFlowState {
  isPolling: boolean;
  isConfirmed: boolean;
  error: string | null;
  transactionId: string | null;
}

interface TransactionStatusResponse {
  success: boolean;
  transaction?: {
    id: string;
    status: string;
    paymentIntentId: string;
  };
  error?: string;
}

/**
 * Hook pour gérer le flux d'achat complet avec polling et invalidation de cache
 *
 * Ce hook résout le problème de race condition entre:
 * 1. Le paiement Stripe qui réussit côté frontend
 * 2. Le webhook Stripe qui met à jour la transaction en backend
 *
 * Il poll le statut de la transaction jusqu'à confirmation, puis invalide les caches.
 */
export const usePurchaseFlow = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<PurchaseFlowState>({
    isPolling: false,
    isConfirmed: false,
    error: null,
    transactionId: null,
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  const MAX_ATTEMPTS = 15; // 30 secondes max (15 * 2s)

  /**
   * Invalide tous les caches pertinents après un achat réussi
   */
  const invalidateAllCaches = useCallback((productId?: string) => {
    // Transactions
    queryClient.invalidateQueries({ queryKey: transactionKeys.all });

    // Produits (pour que l'annonce soit marquée comme vendue)
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
    queryClient.invalidateQueries({ queryKey: ['featured-products'] });

    // Produit spécifique si on a l'ID
    if (productId) {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    }

    // Profil utilisateur (peut inclure des stats)
    queryClient.invalidateQueries({ queryKey: ['user'] });

    console.log('[PurchaseFlow] All caches invalidated');
  }, [queryClient]);

  /**
   * Démarre le polling pour attendre la confirmation du webhook
   */
  const startPolling = useCallback(async (
    paymentIntentId: string,
    productId: string,
    onConfirmed?: (transactionId: string) => void,
    onTimeout?: () => void
  ) => {
    setState(prev => ({
      ...prev,
      isPolling: true,
      isConfirmed: false,
      error: null,
    }));
    attemptCountRef.current = 0;

    const poll = async () => {
      attemptCountRef.current++;
      console.log(`[PurchaseFlow] Polling attempt ${attemptCountRef.current}/${MAX_ATTEMPTS}`);

      try {
        // Récupérer le statut de la transaction via le paymentIntentId
        const response = await api.get<TransactionStatusResponse>(
          `/api/transactions/by-payment-intent/${paymentIntentId}`
        );

        if (response.success && response.transaction) {
          const { status, id } = response.transaction;

          console.log(`[PurchaseFlow] Transaction status: ${status}`);

          if (status === 'SUCCEEDED') {
            // Transaction confirmée!
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }

            setState(prev => ({
              ...prev,
              isPolling: false,
              isConfirmed: true,
              transactionId: id,
            }));

            // Invalider les caches
            invalidateAllCaches(productId);

            // Callback de succès
            onConfirmed?.(id);
            return;
          }

          if (status === 'FAILED' || status === 'CANCELLED') {
            // Transaction échouée
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }

            setState(prev => ({
              ...prev,
              isPolling: false,
              error: `Transaction ${status.toLowerCase()}`,
            }));
            return;
          }
        }
      } catch (error: any) {
        console.warn('[PurchaseFlow] Polling error:', error.message);
        // Ne pas arrêter le polling sur une erreur temporaire
      }

      // Vérifier le timeout
      if (attemptCountRef.current >= MAX_ATTEMPTS) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        setState(prev => ({
          ...prev,
          isPolling: false,
          error: 'Timeout: la confirmation prend trop de temps',
        }));

        // Invalider quand même les caches au cas où
        invalidateAllCaches(productId);
        onTimeout?.();
      }
    };

    // Premier appel immédiat
    await poll();

    // Si pas encore confirmé après le premier appel, continuer à poll
    // On utilise attemptCountRef car state peut ne pas être mis à jour immédiatement
    if (attemptCountRef.current < MAX_ATTEMPTS && pollingRef.current === null) {
      pollingRef.current = setInterval(poll, 2000);
    }
  }, [invalidateAllCaches]);

  /**
   * Arrête le polling manuellement
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setState(prev => ({ ...prev, isPolling: false }));
  }, []);

  /**
   * Réinitialise l'état du hook
   */
  const reset = useCallback(() => {
    stopPolling();
    setState({
      isPolling: false,
      isConfirmed: false,
      error: null,
      transactionId: null,
    });
    attemptCountRef.current = 0;
  }, [stopPolling]);

  /**
   * Méthode simplifiée: invalide immédiatement sans polling
   * Utile quand on ne veut pas attendre la confirmation
   */
  const invalidateNow = useCallback((productId?: string) => {
    invalidateAllCaches(productId);
  }, [invalidateAllCaches]);

  return {
    ...state,
    startPolling,
    stopPolling,
    reset,
    invalidateNow,
    invalidateAllCaches,
  };
};
