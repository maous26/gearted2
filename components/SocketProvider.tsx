import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../hooks/useSocket';

interface SocketContextType {
  isConnected: boolean;
  joinTransaction: (transactionId: string) => void;
  leaveTransaction: (transactionId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  joinTransaction: () => {},
  leaveTransaction: () => {},
});

export const useSocketContext = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Provider Socket.IO qui gère la connexion globale
 * et réagit aux événements en temps réel
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const queryClient = useQueryClient();
  const {
    isConnected,
    onNotification,
    onPaymentSuccess,
    onProductUpdate,
    joinTransaction,
    leaveTransaction,
  } = useSocket();

  // Écouter les nouvelles notifications
  useEffect(() => {
    const unsubscribe = onNotification((notification) => {
      console.log('[SocketProvider] New notification:', notification.title);

      // Invalider le cache des notifications pour forcer un refresh
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Afficher une alerte si l'app est au premier plan (optionnel)
      // On peut aussi utiliser une toast library plus élégante
      if (Platform.OS !== 'web') {
        // Pour mobile, on pourrait utiliser une notification locale
        // Pour l'instant, on se contente de logger
        console.log('[SocketProvider] Would show local notification:', notification.title);
      }
    });

    return unsubscribe;
  }, [onNotification, queryClient]);

  // Écouter les paiements réussis
  useEffect(() => {
    const unsubscribe = onPaymentSuccess((event) => {
      console.log('[SocketProvider] Payment success event:', event);

      // Invalider tous les caches pertinents
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Afficher une notification de succès
      if (event.role === 'BUYER') {
        Alert.alert(
          '✅ Achat confirmé !',
          event.message || `Votre achat de "${event.productTitle}" a été confirmé.`,
          [{ text: 'OK' }]
        );
      } else if (event.role === 'SELLER') {
        Alert.alert(
          '🎉 Nouvelle vente !',
          event.message || `"${event.productTitle}" a été vendu !`,
          [{ text: 'Voir mes ventes' }]
        );
      }
    });

    return unsubscribe;
  }, [onPaymentSuccess, queryClient]);

  // Écouter les mises à jour de produit
  useEffect(() => {
    const unsubscribe = onProductUpdate((event) => {
      console.log('[SocketProvider] Product update:', event);

      // Invalider le cache du produit spécifique
      queryClient.invalidateQueries({ queryKey: ['product', event.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
    });

    return unsubscribe;
  }, [onProductUpdate, queryClient]);

  // Log connection status
  useEffect(() => {
    console.log('[SocketProvider] Connection status:', isConnected ? 'Connected' : 'Disconnected');
  }, [isConnected]);

  return (
    <SocketContext.Provider value={{ isConnected, joinTransaction, leaveTransaction }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketProvider;
