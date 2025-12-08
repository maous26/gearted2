import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const UNREAD_MESSAGES_KEY = '@gearted_unread_messages';
const DELETED_MESSAGES_KEY = '@gearted_deleted_messages';
const HUGO_MESSAGES_KEY = '@gearted_hugo_transaction_messages';

export type HugoMessageType =
  | 'SALE_COMPLETED'           // Vendeur: quelqu'un a acheté
  | 'PURCHASE_COMPLETED'       // Acheteur: achat confirmé
  | 'LABEL_GENERATED'          // Vendeur: acheteur a généré l'étiquette
  | 'SHIPPING_READY'           // Les deux: colis prêt à expédier
  | 'TRANSACTION_CANCELLED';   // Les deux: transaction annulée

export interface HugoTransactionMessage {
  id: string;
  type: HugoMessageType;
  transactionId: string;
  productId?: string;
  productTitle: string;
  productPrice?: number;
  otherPartyName: string; // Nom de l'autre partie (acheteur ou vendeur)
  trackingNumber?: string;
  createdAt: string;
  forRole: 'BUYER' | 'SELLER';
}

// Groupe tous les messages d'une transaction ensemble
export interface TransactionThread {
  transactionId: string;
  productId?: string;
  productTitle: string;
  otherPartyName: string;
  forRole: 'BUYER' | 'SELLER';
  messages: HugoTransactionMessage[];
  lastMessageAt: string;
  hasUnread: boolean;
}

// Regroupe les messages Hugo par transaction
export function groupMessagesByTransaction(
  messages: HugoTransactionMessage[],
  readMessageIds: string[],
  deletedMessageIds: string[]
): TransactionThread[] {
  const threads: Record<string, TransactionThread> = {};

  for (const msg of messages) {
    const threadId = msg.transactionId;
    const msgId = `hugo-${msg.type}-${msg.transactionId}`;

    // Ignorer les messages supprimés
    if (deletedMessageIds.includes(msgId)) continue;

    if (!threads[threadId]) {
      threads[threadId] = {
        transactionId: msg.transactionId,
        productId: msg.productId,
        productTitle: msg.productTitle,
        otherPartyName: msg.otherPartyName,
        forRole: msg.forRole,
        messages: [],
        lastMessageAt: msg.createdAt,
        hasUnread: false,
      };
    }

    threads[threadId].messages.push(msg);

    // Vérifier si non lu
    if (!readMessageIds.includes(msgId)) {
      threads[threadId].hasUnread = true;
    }

    // Mettre à jour la date du dernier message
    if (new Date(msg.createdAt) > new Date(threads[threadId].lastMessageAt)) {
      threads[threadId].lastMessageAt = msg.createdAt;
    }
  }

  // Trier les messages dans chaque thread par date (du plus ancien au plus récent)
  Object.values(threads).forEach(thread => {
    thread.messages.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });

  // Retourner triés par dernier message (plus récent en premier)
  return Object.values(threads).sort((a, b) =>
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

// Génère le contenu du message Hugo selon le type
export function getHugoMessageContent(msg: HugoTransactionMessage): { emoji: string; title: string; content: string } {
  switch (msg.type) {
    case 'SALE_COMPLETED':
      return {
        emoji: '🎉',
        title: 'Nouvelle vente !',
        content: `Félicitations ! ${msg.otherPartyName} a acheté "${msg.productTitle}" pour ${msg.productPrice?.toFixed(2) || ''}€. Préparez votre colis et attendez que l'acheteur génère l'étiquette d'expédition.`
      };
    case 'PURCHASE_COMPLETED':
      return {
        emoji: '✅',
        title: 'Achat confirmé !',
        content: `Votre achat de "${msg.productTitle}" a été confirmé ! Rendez-vous dans "Mes transactions" pour renseigner votre adresse et générer l'étiquette d'expédition.`
      };
    case 'LABEL_GENERATED':
      return {
        emoji: '🏷️',
        title: 'Étiquette générée !',
        content: `${msg.otherPartyName} a généré l'étiquette d'expédition pour "${msg.productTitle}". Numéro de suivi : ${msg.trackingNumber || 'En attente'}. Préparez votre colis pour l'expédition !`
      };
    case 'SHIPPING_READY':
      return {
        emoji: '🚚',
        title: 'Expédition en cours !',
        content: `Le colis "${msg.productTitle}" est prêt à être expédié ! Numéro de suivi : ${msg.trackingNumber || 'N/A'}. Suivez votre colis dans "Mes transactions".`
      };
    case 'TRANSACTION_CANCELLED':
      return {
        emoji: '❌',
        title: 'Transaction annulée',
        content: `La transaction pour "${msg.productTitle}" a été annulée. ${msg.forRole === 'BUYER' ? 'Vous serez remboursé sous 5-10 jours ouvrés.' : 'Le produit a été remis en vente.'}`
      };
    default:
      return {
        emoji: '📩',
        title: 'Notification',
        content: `Mise à jour concernant "${msg.productTitle}".`
      };
  }
}

interface MessagesStore {
  readMessageIds: string[];
  deletedMessageIds: string[];
  hugoMessages: HugoTransactionMessage[];
  unreadCount: number;

  // Actions
  loadFromStorage: () => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  markTransactionThreadAsRead: (transactionId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  deleteTransactionThread: (transactionId: string) => Promise<void>;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: (conversationIds: string[]) => void;
  addHugoMessage: (message: HugoTransactionMessage) => Promise<void>;
  getHugoMessages: () => HugoTransactionMessage[];
  getTransactionThreads: () => TransactionThread[];
  hasHugoMessage: (transactionId: string, type: HugoMessageType) => boolean;
  cleanDuplicates: () => Promise<number>;
  clearAllHugoMessages: () => Promise<void>;
  resetAllNotifications: () => Promise<void>;
  restoreWelcomeMessage: () => Promise<void>;
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  readMessageIds: [],
  deletedMessageIds: [],
  hugoMessages: [],
  unreadCount: 0,

  loadFromStorage: async () => {
    try {
      const [readJson, deletedJson, hugoJson] = await Promise.all([
        AsyncStorage.getItem(UNREAD_MESSAGES_KEY),
        AsyncStorage.getItem(DELETED_MESSAGES_KEY),
        AsyncStorage.getItem(HUGO_MESSAGES_KEY)
      ]);

      const readIds = readJson ? JSON.parse(readJson) : [];
      const deletedIds = deletedJson ? JSON.parse(deletedJson) : [];
      let hugoMsgs = hugoJson ? JSON.parse(hugoJson) : [];

      // Nettoyer les doublons (même transactionId + type)
      const seen = new Set<string>();
      const cleanedHugoMsgs = hugoMsgs.filter((msg: HugoTransactionMessage) => {
        const key = `${msg.type}-${msg.transactionId}`;
        if (seen.has(key)) {
          return false; // Doublon, on l'ignore
        }
        seen.add(key);
        return true;
      });

      // Si on a nettoyé des doublons, sauvegarder
      if (cleanedHugoMsgs.length !== hugoMsgs.length) {
        console.log(`[MessagesStore] Cleaned ${hugoMsgs.length - cleanedHugoMsgs.length} duplicate Hugo messages`);
        await AsyncStorage.setItem(HUGO_MESSAGES_KEY, JSON.stringify(cleanedHugoMsgs));
      }

      // Calculer le unreadCount initial basé sur les données chargées
      const hugoRead = readIds.includes('gearted-welcome');
      const hugoDeleted = deletedIds.includes('gearted-welcome');
      let initialUnreadCount = (!hugoRead && !hugoDeleted) ? 1 : 0;

      // Compter les messages Hugo de transaction non lus
      cleanedHugoMsgs.forEach((msg: HugoTransactionMessage) => {
        const msgId = `hugo-${msg.type}-${msg.transactionId}`;
        if (!readIds.includes(msgId) && !deletedIds.includes(msgId)) {
          initialUnreadCount++;
        }
      });

      console.log(`[MessagesStore] Loaded from storage - readIds: ${readIds.length}, unreadCount: ${initialUnreadCount}`);

      set({
        readMessageIds: readIds,
        deletedMessageIds: deletedIds,
        hugoMessages: cleanedHugoMsgs,
        unreadCount: initialUnreadCount
      });
    } catch (e) {
      console.warn('Failed to load messages from storage', e);
    }
  },

  markAsRead: async (conversationId: string) => {
    const { readMessageIds, deletedMessageIds, hugoMessages, unreadCount } = get();

    // Si déjà lu, ne rien faire
    if (readMessageIds.includes(conversationId)) {
      console.log(`[MessagesStore] Already read: ${conversationId}`);
      return;
    }

    console.log(`[MessagesStore] Marking as read: ${conversationId}, current unread: ${unreadCount}`);

    const newReadIds = [...readMessageIds, conversationId];

    // Calculer le nouveau compteur immédiatement
    // Compter Hugo welcome
    const hugoRead = newReadIds.includes('gearted-welcome');
    const hugoDeleted = deletedMessageIds.includes('gearted-welcome');
    let newUnreadCount = (!hugoRead && !hugoDeleted) ? 1 : 0;

    // Compter les messages Hugo de transaction non lus
    hugoMessages.forEach((msg: HugoTransactionMessage) => {
      const msgId = `hugo-${msg.type}-${msg.transactionId}`;
      if (!newReadIds.includes(msgId) && !deletedMessageIds.includes(msgId)) {
        newUnreadCount++;
      }
    });

    // Note: Pour les conversations API, on ne peut pas les compter ici car on n'a pas la liste
    // On va donc juste décrémenter de 1 si c'est une conversation non-Hugo
    const isHugoMessage = conversationId === 'gearted-welcome' || conversationId.startsWith('hugo-');
    if (!isHugoMessage && unreadCount > newUnreadCount) {
      // C'est une conversation API, ajuster en conséquence
      newUnreadCount = Math.max(0, unreadCount - 1);
    }

    console.log(`[MessagesStore] New unread count: ${newUnreadCount}`);

    // Mettre à jour le state en une seule fois
    set({
      readMessageIds: newReadIds,
      unreadCount: newUnreadCount
    });

    try {
      await AsyncStorage.setItem(UNREAD_MESSAGES_KEY, JSON.stringify(newReadIds));
    } catch (e) {
      console.warn('Failed to save read messages', e);
    }
  },

  deleteConversation: async (conversationId: string) => {
    const { deletedMessageIds, readMessageIds } = get();
    if (deletedMessageIds.includes(conversationId)) return;
    
    const newDeletedIds = [...deletedMessageIds, conversationId];
    const newReadIds = readMessageIds.includes(conversationId) 
      ? readMessageIds 
      : [...readMessageIds, conversationId];
    
    set({ 
      deletedMessageIds: newDeletedIds,
      readMessageIds: newReadIds
    });
    
    try {
      await Promise.all([
        AsyncStorage.setItem(DELETED_MESSAGES_KEY, JSON.stringify(newDeletedIds)),
        AsyncStorage.setItem(UNREAD_MESSAGES_KEY, JSON.stringify(newReadIds))
      ]);
    } catch (e) {
      console.warn('Failed to save deleted messages', e);
    }
    
    // Recalculer le compteur
    const { unreadCount } = get();
    if (unreadCount > 0 && !readMessageIds.includes(conversationId)) {
      set({ unreadCount: unreadCount - 1 });
    }
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },

  refreshUnreadCount: (conversationIds: string[]) => {
    const { readMessageIds, deletedMessageIds, hugoMessages } = get();
    
    // Compter Hugo welcome
    const hugoRead = readMessageIds.includes('gearted-welcome');
    const hugoDeleted = deletedMessageIds.includes('gearted-welcome');
    let unread = (!hugoRead && !hugoDeleted) ? 1 : 0;
    
    // Compter les messages Hugo de transaction non lus
    hugoMessages.forEach((msg: HugoTransactionMessage) => {
      const msgId = `hugo-${msg.type}-${msg.transactionId}`;
      if (!readMessageIds.includes(msgId) && !deletedMessageIds.includes(msgId)) {
        unread++;
      }
    });
    
    // Compter les conversations non lues et non supprimées
    conversationIds.forEach(id => {
      if (!readMessageIds.includes(id) && !deletedMessageIds.includes(id)) {
        unread++;
      }
    });
    
    set({ unreadCount: unread });
  },

  addHugoMessage: async (message: HugoTransactionMessage) => {
    const { hugoMessages } = get();
    
    // Vérifier si ce message existe déjà (même transaction + même type)
    const exists = hugoMessages.some((m: HugoTransactionMessage) => 
      m.transactionId === message.transactionId && m.type === message.type
    );
    
    if (exists) {
      console.log(`[MessagesStore] Hugo message already exists: ${message.type} for ${message.transactionId}`);
      return;
    }
    
    console.log(`[MessagesStore] Adding new Hugo message: ${message.type} for ${message.transactionId}`);
    const newMessages = [message, ...hugoMessages];
    set({ hugoMessages: newMessages });
    
    try {
      await AsyncStorage.setItem(HUGO_MESSAGES_KEY, JSON.stringify(newMessages));
    } catch (e) {
      console.warn('Failed to save Hugo messages', e);
    }
    
    // Incrémenter le compteur de non-lus
    const { unreadCount } = get();
    set({ unreadCount: unreadCount + 1 });
  },

  getHugoMessages: () => {
    return get().hugoMessages;
  },

  getTransactionThreads: () => {
    const { hugoMessages, readMessageIds, deletedMessageIds } = get();
    return groupMessagesByTransaction(hugoMessages, readMessageIds, deletedMessageIds);
  },

  markTransactionThreadAsRead: async (transactionId: string) => {
    const { hugoMessages, readMessageIds } = get();

    // Trouver tous les messages de cette transaction
    const messagesInThread = hugoMessages.filter(m => m.transactionId === transactionId);
    const newReadIds = [...readMessageIds];
    let markedCount = 0;

    for (const msg of messagesInThread) {
      const msgId = `hugo-${msg.type}-${msg.transactionId}`;
      if (!newReadIds.includes(msgId)) {
        newReadIds.push(msgId);
        markedCount++;
      }
    }

    if (markedCount > 0) {
      set({ readMessageIds: newReadIds });
      try {
        await AsyncStorage.setItem(UNREAD_MESSAGES_KEY, JSON.stringify(newReadIds));
      } catch (e) {
        console.warn('Failed to save read messages', e);
      }

      // Décrémenter le compteur
      const { unreadCount } = get();
      set({ unreadCount: Math.max(0, unreadCount - markedCount) });
    }
  },

  deleteTransactionThread: async (transactionId: string) => {
    const { hugoMessages, deletedMessageIds, readMessageIds } = get();

    // Trouver tous les messages de cette transaction
    const messagesInThread = hugoMessages.filter(m => m.transactionId === transactionId);
    const newDeletedIds = [...deletedMessageIds];
    const newReadIds = [...readMessageIds];
    let deletedCount = 0;

    for (const msg of messagesInThread) {
      const msgId = `hugo-${msg.type}-${msg.transactionId}`;
      if (!newDeletedIds.includes(msgId)) {
        newDeletedIds.push(msgId);
        if (!newReadIds.includes(msgId)) {
          newReadIds.push(msgId);
          deletedCount++;
        }
      }
    }

    set({ deletedMessageIds: newDeletedIds, readMessageIds: newReadIds });

    try {
      await Promise.all([
        AsyncStorage.setItem(DELETED_MESSAGES_KEY, JSON.stringify(newDeletedIds)),
        AsyncStorage.setItem(UNREAD_MESSAGES_KEY, JSON.stringify(newReadIds))
      ]);
    } catch (e) {
      console.warn('Failed to save deleted messages', e);
    }

    // Décrémenter le compteur
    const { unreadCount } = get();
    if (deletedCount > 0) {
      set({ unreadCount: Math.max(0, unreadCount - deletedCount) });
    }
  },

  hasHugoMessage: (transactionId: string, type: HugoMessageType) => {
    const { hugoMessages } = get();
    const exists = hugoMessages.some((m: HugoTransactionMessage) => 
      m.transactionId === transactionId && m.type === type
    );
    console.log(`[MessagesStore] hasHugoMessage check: ${type} for ${transactionId} = ${exists}`);
    return exists;
  },
  
  // Fonction pour nettoyer tous les doublons existants
  cleanDuplicates: async () => {
    const { hugoMessages } = get();
    const seen = new Set<string>();
    const cleanedMessages = hugoMessages.filter((msg: HugoTransactionMessage) => {
      const key = `${msg.type}-${msg.transactionId}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    if (cleanedMessages.length !== hugoMessages.length) {
      console.log(`[MessagesStore] Cleaned ${hugoMessages.length - cleanedMessages.length} duplicates`);
      set({ hugoMessages: cleanedMessages });
      await AsyncStorage.setItem(HUGO_MESSAGES_KEY, JSON.stringify(cleanedMessages));
    }
    
    return cleanedMessages.length;
  },
  
  // Fonction pour réinitialiser complètement les messages Hugo
  clearAllHugoMessages: async () => {
    set({ hugoMessages: [] });
    await AsyncStorage.removeItem(HUGO_MESSAGES_KEY);
    console.log('[MessagesStore] All Hugo messages cleared');
  },

  // Réinitialiser complètement les notifications (pour debug)
  resetAllNotifications: async () => {
    set({
      readMessageIds: [],
      deletedMessageIds: [],
      hugoMessages: [],
      unreadCount: 1 // 1 pour le message de bienvenue
    });
    await Promise.all([
      AsyncStorage.removeItem(UNREAD_MESSAGES_KEY),
      AsyncStorage.removeItem(DELETED_MESSAGES_KEY),
      AsyncStorage.removeItem(HUGO_MESSAGES_KEY)
    ]);
    console.log('[MessagesStore] All notifications reset');
  },

  // Restaurer le message de bienvenue s'il a été supprimé
  // NOTE: Cette fonction n'est plus appelée automatiquement pour éviter de réinitialiser le badge
  restoreWelcomeMessage: async () => {
    const { deletedMessageIds, readMessageIds, hugoMessages } = get();
    const newDeletedIds = deletedMessageIds.filter(id => id !== 'gearted-welcome');
    // Conserver le statut "lu" pour éviter que le badge réapparaisse
    // Ne pas supprimer 'gearted-welcome' de readMessageIds

    // Calculer le nouveau unreadCount correctement
    let newUnreadCount = 0;

    // Le message de bienvenue: non lu seulement s'il n'a jamais été lu
    if (!readMessageIds.includes('gearted-welcome')) {
      newUnreadCount = 1;
    }

    // Compter les messages Hugo de transaction non lus
    hugoMessages.forEach((msg: HugoTransactionMessage) => {
      const msgId = `hugo-${msg.type}-${msg.transactionId}`;
      if (!readMessageIds.includes(msgId) && !newDeletedIds.includes(msgId)) {
        newUnreadCount++;
      }
    });

    set({
      deletedMessageIds: newDeletedIds,
      unreadCount: newUnreadCount
    });

    await AsyncStorage.setItem(DELETED_MESSAGES_KEY, JSON.stringify(newDeletedIds));
    console.log('[MessagesStore] Welcome message restored, unreadCount:', newUnreadCount);
  }
}));

export default useMessagesStore;
