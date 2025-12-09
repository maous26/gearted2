import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

// Types pour les événements Socket.IO
interface SocketNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  createdAt: string;
}

interface PaymentSuccessEvent {
  role: 'BUYER' | 'SELLER';
  transactionId: string;
  productTitle: string;
  amount: number;
  message: string;
}

interface TransactionUpdateEvent {
  transactionId: string;
  status: string;
  trackingNumber?: string;
  updatedAt: string;
  message?: string;
}

interface ProductUpdateEvent {
  productId: string;
  status: string;
  message?: string;
}

interface CacheInvalidateEvent {
  keys: string[];
}

interface MessageEvent {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
  sender: {
    id: string;
    username: string;
    avatar?: string | null;
  };
}

interface TypingEvent {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

interface UseSocketReturn {
  isConnected: boolean;
  socket: Socket | null;
  onNotification: (callback: (notification: SocketNotification) => void) => () => void;
  onPaymentSuccess: (callback: (event: PaymentSuccessEvent) => void) => () => void;
  onTransactionUpdate: (callback: (event: TransactionUpdateEvent) => void) => () => void;
  onProductUpdate: (callback: (event: ProductUpdateEvent) => void) => () => void;
  onMessage: (callback: (message: MessageEvent) => void) => () => void;
  onTyping: (callback: (event: TypingEvent) => void) => () => void;
  joinTransaction: (transactionId: string) => void;
  leaveTransaction: (transactionId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
}

// URL du backend Socket.IO
const getSocketUrl = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  // Remove /api suffix if present
  return apiUrl.replace(/\/api$/, '');
};

/**
 * Hook pour gérer la connexion Socket.IO
 * Se connecte automatiquement quand l'utilisateur est authentifié
 */
export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Connexion Socket.IO
  useEffect(() => {
    // Ne se connecter que si authentifié
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        console.log('[Socket.IO] Disconnecting - user not authenticated');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Créer la connexion
    const socketUrl = getSocketUrl();
    console.log('[Socket.IO] Connecting to:', socketUrl);

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Event handlers
    socket.on('connect', () => {
      console.log('[Socket.IO] Connected! Socket ID:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error.message);
      setIsConnected(false);
    });

    // Gestion automatique de l'invalidation du cache
    socket.on('cache:invalidate', (event: CacheInvalidateEvent) => {
      console.log('[Socket.IO] Cache invalidation received:', event.keys);
      event.keys.forEach((key) => {
        // Invalider toutes les queries qui commencent par cette clé
        // Ex: 'products' invalide 'products', 'products-infinite', 'featured-products', etc.
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey[0];
            return typeof queryKey === 'string' && queryKey.includes(key);
          }
        });
      });
    });

    // Pong pour le heartbeat
    socket.on('pong', (data) => {
      console.log('[Socket.IO] Pong received:', data);
    });

    // Cleanup
    return () => {
      console.log('[Socket.IO] Cleaning up connection');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, queryClient]);

  // Callback pour s'abonner aux notifications
  const onNotification = useCallback(
    (callback: (notification: SocketNotification) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      const handler = (notification: SocketNotification) => {
        console.log('[Socket.IO] Notification received:', notification.title);
        callback(notification);
      };

      socket.on('notification:new', handler);
      return () => {
        socket.off('notification:new', handler);
      };
    },
    []
  );

  // Callback pour les paiements réussis
  const onPaymentSuccess = useCallback(
    (callback: (event: PaymentSuccessEvent) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      const handler = (event: PaymentSuccessEvent) => {
        console.log('[Socket.IO] Payment success:', event.productTitle);
        callback(event);
      };

      socket.on('payment:success', handler);
      return () => {
        socket.off('payment:success', handler);
      };
    },
    []
  );

  // Callback pour les mises à jour de transaction
  const onTransactionUpdate = useCallback(
    (callback: (event: TransactionUpdateEvent) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      const handler = (event: TransactionUpdateEvent) => {
        console.log('[Socket.IO] Transaction update:', event.transactionId, event.status);
        callback(event);
      };

      socket.on('transaction:updated', handler);
      return () => {
        socket.off('transaction:updated', handler);
      };
    },
    []
  );

  // Callback pour les mises à jour de produit
  const onProductUpdate = useCallback(
    (callback: (event: ProductUpdateEvent) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      const handler = (event: ProductUpdateEvent) => {
        console.log('[Socket.IO] Product update:', event.productId, event.status);
        callback(event);
      };

      socket.on('product:updated', handler);
      return () => {
        socket.off('product:updated', handler);
      };
    },
    []
  );

  // Rejoindre une room de transaction
  const joinTransaction = useCallback((transactionId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('join:transaction', transactionId);
      console.log('[Socket.IO] Joined transaction room:', transactionId);
    }
  }, []);

  // Quitter une room de transaction
  const leaveTransaction = useCallback((transactionId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('leave:transaction', transactionId);
      console.log('[Socket.IO] Left transaction room:', transactionId);
    }
  }, []);

  // Rejoindre une conversation pour les messages en temps réel
  const joinConversation = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('join:conversation', conversationId);
      console.log('[Socket.IO] Joined conversation room:', conversationId);
    }
  }, []);

  // Quitter une conversation
  const leaveConversation = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('leave:conversation', conversationId);
      console.log('[Socket.IO] Left conversation room:', conversationId);
    }
  }, []);

  // Callback pour les nouveaux messages
  const onMessage = useCallback(
    (callback: (message: MessageEvent) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      const handler = (message: MessageEvent) => {
        console.log('[Socket.IO] Message received:', message.content.substring(0, 30));
        callback(message);
      };

      socket.on('message:new', handler);
      return () => {
        socket.off('message:new', handler);
      };
    },
    []
  );

  // Callback pour les événements de frappe
  const onTyping = useCallback(
    (callback: (event: TypingEvent) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      const handler = (event: TypingEvent) => {
        callback(event);
      };

      socket.on('message:typing', handler);
      return () => {
        socket.off('message:typing', handler);
      };
    },
    []
  );

  // Envoyer un événement "en train de taper"
  const sendTypingStart = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('typing:start', conversationId);
    }
  }, []);

  // Envoyer un événement "a arrêté de taper"
  const sendTypingStop = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('typing:stop', conversationId);
    }
  }, []);

  return {
    isConnected,
    socket: socketRef.current,
    onNotification,
    onPaymentSuccess,
    onTransactionUpdate,
    onProductUpdate,
    onMessage,
    onTyping,
    joinTransaction,
    leaveTransaction,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
  };
}

export default useSocket;
