import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

interface UserConnection {
  socketId: string;
  userId: string;
  username: string;
  connectedAt: Date;
}

class SocketService {
  private io: Server | null = null;
  private userConnections: Map<string, UserConnection[]> = new Map(); // userId -> connections (allows multiple devices)

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // En production, restreindre aux domaines autorisés
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    });

    // Middleware d'authentification
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          console.log('[Socket.IO] Connection attempt without token');
          return next(new Error('Authentication required'));
        }

        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token as string, jwtSecret) as { userId: string; username?: string };

        socket.userId = decoded.userId;
        socket.username = decoded.username || 'Unknown';

        console.log(`[Socket.IO] Authenticated user: ${socket.userId} (${socket.username})`);
        next();
      } catch (error) {
        console.error('[Socket.IO] Authentication failed:', error);
        next(new Error('Invalid token'));
      }
    });

    // Gestion des connexions
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`[Socket.IO] User connected: ${socket.userId} (socket: ${socket.id})`);

      // Ajouter la connexion
      if (socket.userId) {
        this.addConnection(socket.userId, socket.id, socket.username || 'Unknown');

        // Rejoindre une room personnelle pour les notifications ciblées
        socket.join(`user:${socket.userId}`);
      }

      // Event: Client demande à rejoindre une transaction room
      socket.on('join:transaction', (transactionId: string) => {
        if (transactionId) {
          socket.join(`transaction:${transactionId}`);
          console.log(`[Socket.IO] User ${socket.userId} joined transaction:${transactionId}`);
        }
      });

      // Event: Client quitte une transaction room
      socket.on('leave:transaction', (transactionId: string) => {
        if (transactionId) {
          socket.leave(`transaction:${transactionId}`);
          console.log(`[Socket.IO] User ${socket.userId} left transaction:${transactionId}`);
        }
      });

      // Event: Client rejoint une conversation pour les messages en temps réel
      socket.on('join:conversation', (conversationId: string) => {
        if (conversationId) {
          socket.join(`conversation:${conversationId}`);
          console.log(`[Socket.IO] User ${socket.userId} joined conversation:${conversationId}`);
        }
      });

      // Event: Client quitte une conversation
      socket.on('leave:conversation', (conversationId: string) => {
        if (conversationId) {
          socket.leave(`conversation:${conversationId}`);
          console.log(`[Socket.IO] User ${socket.userId} left conversation:${conversationId}`);
        }
      });

      // Event: Utilisateur est en train de taper
      socket.on('typing:start', (conversationId: string) => {
        if (conversationId && socket.userId) {
          socket.to(`conversation:${conversationId}`).emit('message:typing', {
            conversationId,
            userId: socket.userId,
            username: socket.username,
            isTyping: true
          });
        }
      });

      // Event: Utilisateur a arrêté de taper
      socket.on('typing:stop', (conversationId: string) => {
        if (conversationId && socket.userId) {
          socket.to(`conversation:${conversationId}`).emit('message:typing', {
            conversationId,
            userId: socket.userId,
            username: socket.username,
            isTyping: false
          });
        }
      });

      // Event: Ping pour garder la connexion active
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Event: Déconnexion
      socket.on('disconnect', (reason) => {
        console.log(`[Socket.IO] User disconnected: ${socket.userId} (reason: ${reason})`);
        if (socket.userId) {
          this.removeConnection(socket.userId, socket.id);
        }
      });
    });

    console.log('[Socket.IO] Server initialized');
    return this.io;
  }

  /**
   * Ajouter une connexion utilisateur
   */
  private addConnection(userId: string, socketId: string, username: string): void {
    const connections = this.userConnections.get(userId) || [];
    connections.push({
      socketId,
      userId,
      username,
      connectedAt: new Date()
    });
    this.userConnections.set(userId, connections);
    console.log(`[Socket.IO] User ${userId} now has ${connections.length} active connection(s)`);
  }

  /**
   * Supprimer une connexion utilisateur
   */
  private removeConnection(userId: string, socketId: string): void {
    const connections = this.userConnections.get(userId) || [];
    const filtered = connections.filter(c => c.socketId !== socketId);

    if (filtered.length > 0) {
      this.userConnections.set(userId, filtered);
    } else {
      this.userConnections.delete(userId);
    }
    console.log(`[Socket.IO] User ${userId} now has ${filtered.length} active connection(s)`);
  }

  /**
   * Vérifier si un utilisateur est connecté
   */
  isUserOnline(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  /**
   * Obtenir le nombre d'utilisateurs connectés
   */
  getOnlineUsersCount(): number {
    return this.userConnections.size;
  }

  /**
   * Obtenir l'instance Socket.IO
   */
  getIO(): Server | null {
    return this.io;
  }

  // ==================== EVENTS ÉMISSION ====================

  /**
   * Envoyer une notification à un utilisateur spécifique
   */
  sendNotification(userId: string, notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    data?: any;
    createdAt: string;
  }): void {
    if (!this.io) return;

    console.log(`[Socket.IO] Sending notification to user ${userId}:`, notification.title);
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Notifier une mise à jour de transaction
   */
  sendTransactionUpdate(transactionId: string, update: {
    status: string;
    trackingNumber?: string;
    updatedAt: string;
    message?: string;
  }): void {
    if (!this.io) return;

    console.log(`[Socket.IO] Sending transaction update for ${transactionId}:`, update.status);
    this.io.to(`transaction:${transactionId}`).emit('transaction:updated', {
      transactionId,
      ...update
    });
  }

  /**
   * Notifier l'acheteur et le vendeur d'une nouvelle transaction
   */
  sendNewTransaction(buyerId: string, sellerId: string, transaction: {
    id: string;
    productId: string;
    productTitle: string;
    amount: number;
    status: string;
  }): void {
    if (!this.io) return;

    // Notifier l'acheteur
    this.io.to(`user:${buyerId}`).emit('transaction:new', {
      role: 'BUYER',
      ...transaction
    });

    // Notifier le vendeur
    this.io.to(`user:${sellerId}`).emit('transaction:new', {
      role: 'SELLER',
      ...transaction
    });

    console.log(`[Socket.IO] New transaction notified to buyer ${buyerId} and seller ${sellerId}`);
  }

  /**
   * Notifier un paiement réussi
   */
  sendPaymentSuccess(buyerId: string, sellerId: string, data: {
    transactionId: string;
    productTitle: string;
    amount: number;
  }): void {
    if (!this.io) return;

    // Notifier l'acheteur
    this.io.to(`user:${buyerId}`).emit('payment:success', {
      role: 'BUYER',
      message: `Votre achat de "${data.productTitle}" a été confirmé !`,
      ...data
    });

    // Notifier le vendeur
    this.io.to(`user:${sellerId}`).emit('payment:success', {
      role: 'SELLER',
      message: `Nouvelle vente ! "${data.productTitle}" a été vendu.`,
      ...data
    });

    console.log(`[Socket.IO] Payment success notified`);
  }

  /**
   * Notifier que le produit a été mis à jour (ex: vendu)
   */
  sendProductUpdate(productId: string, update: {
    status: string;
    message?: string;
  }): void {
    if (!this.io) return;

    // Broadcast à tous les utilisateurs qui regardent ce produit
    this.io.emit('product:updated', {
      productId,
      ...update
    });
  }

  /**
   * Invalider le cache côté client pour un type de données
   */
  invalidateCache(userId: string, cacheKeys: string[]): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('cache:invalidate', { keys: cacheKeys });
    console.log(`[Socket.IO] Cache invalidation sent to ${userId}:`, cacheKeys);
  }

  /**
   * Broadcast une invalidation de cache à tous les utilisateurs
   */
  broadcastCacheInvalidation(cacheKeys: string[]): void {
    if (!this.io) return;

    this.io.emit('cache:invalidate', { keys: cacheKeys });
    console.log(`[Socket.IO] Global cache invalidation:`, cacheKeys);
  }

  // ==================== MESSAGING EVENTS ====================

  /**
   * Envoyer un nouveau message en temps réel
   */
  sendMessage(conversationId: string, message: {
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
  }): void {
    if (!this.io) return;

    console.log(`[Socket.IO] Sending message to conversation ${conversationId}`);

    // Envoyer à la room de la conversation
    this.io.to(`conversation:${conversationId}`).emit('message:new', message);
  }

  /**
   * Notifier qu'un utilisateur est en train de taper
   */
  sendTypingStatus(conversationId: string, userId: string, username: string, isTyping: boolean): void {
    if (!this.io) return;

    this.io.to(`conversation:${conversationId}`).emit('message:typing', {
      conversationId,
      userId,
      username,
      isTyping
    });
  }

  /**
   * Notifier que les messages ont été lus
   */
  sendMessagesRead(conversationId: string, userId: string, messageIds: string[]): void {
    if (!this.io) return;

    this.io.to(`conversation:${conversationId}`).emit('message:read', {
      conversationId,
      userId,
      messageIds
    });
  }
}

// Singleton
export const socketService = new SocketService();
export default socketService;
