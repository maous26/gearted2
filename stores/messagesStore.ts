import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const UNREAD_MESSAGES_KEY = '@gearted_unread_messages';
const DELETED_MESSAGES_KEY = '@gearted_deleted_messages';
const HUGO_MESSAGES_KEY = '@gearted_hugo_transaction_messages';

export type HugoMessageType = 
  | 'SALE_COMPLETED'           // Vendeur: quelqu'un a acheté
  | 'PURCHASE_COMPLETED'       // Acheteur: achat confirmé
  | 'DIMENSIONS_SET'           // Acheteur: vendeur a saisi les dimensions
  | 'LABEL_GENERATED'          // Vendeur: acheteur a généré l'étiquette
  | 'SHIPPING_READY'           // Les deux: colis prêt à expédier
  | 'TRANSACTION_CANCELLED';   // Les deux: transaction annulée

export interface HugoTransactionMessage {
  id: string;
  type: HugoMessageType;
  transactionId: string;
  productTitle: string;
  productPrice?: number;
  otherPartyName: string; // Nom de l'autre partie (acheteur ou vendeur)
  trackingNumber?: string;
  createdAt: string;
  forRole: 'BUYER' | 'SELLER';
}

// Génère le contenu du message Hugo selon le type
export function getHugoMessageContent(msg: HugoTransactionMessage): { emoji: string; title: string; content: string } {
  switch (msg.type) {
    case 'SALE_COMPLETED':
      return {
        emoji: '🎉',
        title: 'Nouvelle vente !',
        content: `Félicitations ! ${msg.otherPartyName} a acheté "${msg.productTitle}" pour ${msg.productPrice?.toFixed(2) || ''}€. Rendez-vous dans "Mes transactions" pour renseigner les dimensions du colis.`
      };
    case 'PURCHASE_COMPLETED':
      return {
        emoji: '✅',
        title: 'Achat confirmé !',
        content: `Votre achat de "${msg.productTitle}" a été confirmé ! Le vendeur ${msg.otherPartyName} va maintenant préparer votre colis et renseigner ses dimensions.`
      };
    case 'DIMENSIONS_SET':
      return {
        emoji: '📦',
        title: 'Colis prêt !',
        content: `Bonne nouvelle ! ${msg.otherPartyName} a renseigné les dimensions du colis pour "${msg.productTitle}". Vous pouvez maintenant générer votre étiquette d'expédition dans "Mes transactions".`
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
  deleteConversation: (conversationId: string) => Promise<void>;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: (conversationIds: string[]) => void;
  addHugoMessage: (message: HugoTransactionMessage) => Promise<void>;
  getHugoMessages: () => HugoTransactionMessage[];
  hasHugoMessage: (transactionId: string, type: HugoMessageType) => boolean;
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
      const hugoMsgs = hugoJson ? JSON.parse(hugoJson) : [];
      
      set({ 
        readMessageIds: readIds, 
        deletedMessageIds: deletedIds,
        hugoMessages: hugoMsgs
      });
    } catch (e) {
      console.warn('Failed to load messages from storage', e);
    }
  },

  markAsRead: async (conversationId: string) => {
    const { readMessageIds } = get();
    if (readMessageIds.includes(conversationId)) return;
    
    const newReadIds = [...readMessageIds, conversationId];
    set({ readMessageIds: newReadIds });
    
    try {
      await AsyncStorage.setItem(UNREAD_MESSAGES_KEY, JSON.stringify(newReadIds));
    } catch (e) {
      console.warn('Failed to save read messages', e);
    }
    
    // Recalculer le compteur
    const { deletedMessageIds, unreadCount } = get();
    if (unreadCount > 0) {
      set({ unreadCount: unreadCount - 1 });
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
    const msgId = `hugo-${message.type}-${message.transactionId}`;
    if (hugoMessages.some((m: HugoTransactionMessage) => 
      m.transactionId === message.transactionId && m.type === message.type
    )) {
      return;
    }
    
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

  hasHugoMessage: (transactionId: string, type: HugoMessageType) => {
    const { hugoMessages } = get();
    return hugoMessages.some((m: HugoTransactionMessage) => 
      m.transactionId === transactionId && m.type === type
    );
  }
}));

export default useMessagesStore;
