import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const UNREAD_MESSAGES_KEY = '@gearted_unread_messages';
const DELETED_MESSAGES_KEY = '@gearted_deleted_messages';

interface MessagesStore {
  readMessageIds: string[];
  deletedMessageIds: string[];
  unreadCount: number;
  
  // Actions
  loadFromStorage: () => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: (conversationIds: string[]) => void;
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  readMessageIds: [],
  deletedMessageIds: [],
  unreadCount: 0,

  loadFromStorage: async () => {
    try {
      const [readJson, deletedJson] = await Promise.all([
        AsyncStorage.getItem(UNREAD_MESSAGES_KEY),
        AsyncStorage.getItem(DELETED_MESSAGES_KEY)
      ]);
      
      const readIds = readJson ? JSON.parse(readJson) : [];
      const deletedIds = deletedJson ? JSON.parse(deletedJson) : [];
      
      set({ readMessageIds: readIds, deletedMessageIds: deletedIds });
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
    const { readMessageIds, deletedMessageIds } = get();
    
    // Compter Hugo
    const hugoRead = readMessageIds.includes('gearted-welcome');
    const hugoDeleted = deletedMessageIds.includes('gearted-welcome');
    let unread = (!hugoRead && !hugoDeleted) ? 1 : 0;
    
    // Compter les conversations non lues et non supprimées
    conversationIds.forEach(id => {
      if (!readMessageIds.includes(id) && !deletedMessageIds.includes(id)) {
        unread++;
      }
    });
    
    set({ unreadCount: unread });
  }
}));

export default useMessagesStore;
