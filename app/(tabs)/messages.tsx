import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../components/ThemeProvider";
import { THEMES } from "../../themes";

import { useUser } from '../../components/UserProvider';
import api from '../../services/api';
import { useMessagesStore } from '../../stores/messagesStore';

type User = {
  id: string;
  username: string;
  avatar?: string;
  role?: string;
  badge?: string;
};

type Message = {
  id: string;
  content: string;
  sentAt: string;
  senderId: string;
};

type Conversation = {
  id: string;
  participants: User[];
  messages?: Message[];
  productTitle?: string;
  isSystemMessage?: boolean;
};

// Message de bienvenue de Hugo de Gearted
const WELCOME_MESSAGE: Conversation = {
  id: 'gearted-welcome',
  participants: [
    {
      id: 'hugo-gearted',
      username: 'Hugo de Gearted',
      avatar: 'https://ui-avatars.com/api/?name=Hugo+Gearted&background=4B5D3A&color=fff&size=100',
      role: 'ADMIN',
      badge: 'admin'
    }
  ],
  messages: [
    {
      id: 'welcome-msg-1',
      content: "Bienvenue sur Gearted ! 🎯 Je suis Hugo, fondateur de la plateforme. N'hésitez pas à me contacter si vous avez des questions. Bonnes ventes !",
      sentAt: new Date().toISOString(),
      senderId: 'hugo-gearted'
    }
  ],
  isSystemMessage: true
};

function formatTimestamp(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  return date.toLocaleDateString();
}

export default function MessagesScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const { user } = useUser();
  const { 
    deletedMessageIds, 
    loadFromStorage, 
    markAsRead, 
    deleteConversation: deleteFromStore,
    hugoMessages,
    cleanDuplicates
  } = useMessagesStore();
  
  const [searchText, setSearchText] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Charger les données du store au démarrage et nettoyer les doublons
  useEffect(() => {
    const init = async () => {
      await loadFromStorage();
      await cleanDuplicates();
    };
    init();
  }, []);

  // Importer la fonction de génération de contenu
  const { getHugoMessageContent } = require('../../stores/messagesStore');

  // Générer les conversations Hugo pour les transactions
  const hugoTransactionConversations: Conversation[] = hugoMessages.map((msg: any) => {
    const content = getHugoMessageContent(msg);
    return {
      id: `hugo-${msg.type}-${msg.transactionId}`,
      participants: [
        {
          id: 'hugo-gearted',
          username: 'Hugo de Gearted',
          avatar: 'https://ui-avatars.com/api/?name=Hugo+Gearted&background=3B82F6&color=fff&size=100',
          role: 'ADMIN',
          badge: 'admin'
        }
      ],
      messages: [
        {
          id: `msg-${msg.type}-${msg.transactionId}`,
          content: `${content.emoji} ${content.title}\n\n${content.content}`,
          sentAt: msg.createdAt,
          senderId: 'hugo-gearted'
        }
      ],
      isSystemMessage: true
    };
  });

  useEffect(() => {
    if (!user?.id) {
      // Même sans utilisateur, afficher le message de bienvenue (si non supprimé)
      setConversations([WELCOME_MESSAGE, ...hugoTransactionConversations]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<Conversation[]>('/api/messages/conversations')
      .then((data) => {
        const apiConversations = Array.isArray(data) ? data : [];
        // Ajouter le message de bienvenue de Hugo en premier, puis les notifications, puis les conversations API
        setConversations([WELCOME_MESSAGE, ...hugoTransactionConversations, ...apiConversations]);
        setError('');
      })
      .catch((err) => {
        console.warn('[MessagesScreen] Failed to load conversations:', err);
        if ((err as any)?.response?.status === 401) {
          setError("Vous devez être connecté pour voir vos messages.");
          // Même en cas d'erreur d'auth, afficher le message de bienvenue
          setConversations([WELCOME_MESSAGE, ...hugoTransactionConversations]);
        } else {
          setError("Impossible de charger les conversations. Veuillez réessayer plus tard.");
          setConversations([WELCOME_MESSAGE, ...hugoTransactionConversations]);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id, hugoMessages]);

  // Supprimer une conversation (avec confirmation)
  const deleteConversation = (conversationId: string) => {
    Alert.alert(
      "Supprimer la conversation",
      "Voulez-vous vraiment supprimer cette conversation ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            deleteFromStore(conversationId);
          }
        }
      ]
    );
  };

  // Filtrer les conversations (exclure les supprimées)
  const filteredConversations = conversations
    .filter(conv => !deletedMessageIds.includes(conv.id))
    .filter(conv => {
      // Pour le message de bienvenue, toujours l'afficher
      if (conv.isSystemMessage) {
        return searchText === "" || 
          conv.participants?.[0]?.username?.toLowerCase().includes(searchText.toLowerCase());
      }
      
      if (!user?.id) return false;
      const other = conv.participants?.find((u: User) => u.id !== user.id);
      return (
        searchText === "" ||
        (other?.username || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (conv.productTitle || "").toLowerCase().includes(searchText.toLowerCase())
      );
    });

  const ConversationCard = ({ conversation }: { conversation: Conversation }) => {
    // Pour les messages système, utiliser le premier participant
    const isSystem = conversation.isSystemMessage;
    const other = isSystem 
      ? conversation.participants?.[0] 
      : conversation.participants?.find((u: User) => u.id !== user?.id);
    const lastMsg = conversation.messages?.[0];
    
    return (
      <View style={{
        backgroundColor: isSystem ? t.cardBg : t.cardBg,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isSystem ? t.primaryBtn : t.border,
        ...(isSystem && { borderWidth: 2 })
      }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          onPress={async () => {
            // Marquer comme lu
            await markAsRead(conversation.id);
            // Ouvrir le chat seulement si ce n'est pas une notification Hugo
            // Les notifications Hugo (isSystemMessage) ne doivent pas ouvrir de chat
            if (!conversation.isSystemMessage) {
              router.push({
                pathname: '/chat/[id]',
                params: {
                  id: conversation.id,
                  otherUsername: other?.username || '',
                  otherAvatar: other?.avatar || ''
                }
              });
            }
          }}
          onLongPress={() => {
            // Appui long pour supprimer
            deleteConversation(conversation.id);
          }}
        >
          {/* Avatar */}
          <View style={{ position: 'relative', marginRight: 12 }}>
            <Image
              source={{ uri: other?.avatar || 'https://via.placeholder.com/50/888/fff?text=U' }}
              style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: t.primaryBtn }}
            />
          </View>
          {/* Contenu */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, flex: 1 }} numberOfLines={1}>
                {other?.username || 'Utilisateur'}
              </Text>
              <Text style={{ fontSize: 12, color: t.muted }}>
                {lastMsg ? formatTimestamp(lastMsg.sentAt) : ''}
              </Text>
            </View>
            {conversation.productTitle ? (
              <Text style={{ fontSize: 13, color: t.muted, marginBottom: 4 }} numberOfLines={1}>
                {conversation.productTitle}
              </Text>
            ) : null}
            <Text
              style={{ fontSize: 14, color: t.muted }}
              numberOfLines={2}
            >
              {lastMsg ? lastMsg.content : 'Nouvelle conversation'}
            </Text>
          </View>
          {/* Rating: TODO - backend rating */}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{
          backgroundColor: t.cardBg,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: t.border,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <TextInput
            style={{ flex: 1, fontSize: 16, color: t.heading }}
            placeholder="Rechercher une conversation..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={t.muted}
          />
          <Text style={{ fontSize: 16 }}>🔍</Text>
        </View>
      </View>
      {/* Hint for deletion */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <Text style={{ fontSize: 12, color: t.muted, textAlign: 'center' }}>
          💡 Appui long sur une conversation pour la supprimer
        </Text>
      </View>
      {/* Error message */}
      {error ? (
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Text style={{ color: '#DC2626', fontSize: 16 }}>{error}</Text>
        </View>
      ) : null}
      {/* Loading indicator */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, color: t.muted }}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        >
          {filteredConversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} />
          ))}
          {filteredConversations.length === 0 && (
            <View style={{
              backgroundColor: t.cardBg,
              borderRadius: 12,
              padding: 32,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: t.border,
              marginTop: 32
            }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
              <Text style={{ fontSize: 18, color: t.muted, textAlign: 'center', marginBottom: 8 }}>
                Aucune conversation
              </Text>
              <Text style={{ fontSize: 14, color: t.muted, textAlign: 'center' }}>
                Contactez un vendeur pour démarrer une discussion
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
