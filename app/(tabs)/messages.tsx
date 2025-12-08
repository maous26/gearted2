import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
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
import {
  useMessagesStore,
  TransactionThread,
  getHugoMessageContent
} from '../../stores/messagesStore';

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
      content: "Bienvenue sur Gearted ! 🎯 Je suis Hugo, fondateur de la plateforme. N'hesitez pas a me contacter si vous avez des questions. Bonnes ventes !",
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
  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  return date.toLocaleDateString('fr-FR');
}

export default function MessagesScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const { user } = useUser();
  const {
    deletedMessageIds,
    readMessageIds,
    unreadCount,
    loadFromStorage,
    markAsRead,
    deleteConversation: deleteFromStore,
    deleteTransactionThread,
    getTransactionThreads,
    cleanDuplicates,
    refreshUnreadCount,
    resetAllNotifications
  } = useMessagesStore();

  const [searchText, setSearchText] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Charger les donnees du store au demarrage et nettoyer les doublons
  useEffect(() => {
    const init = async () => {
      await loadFromStorage();
      await cleanDuplicates();
      // Le message de bienvenue n'est plus restauré automatiquement
      // pour éviter que le badge réapparaisse après lecture
    };
    init();
  }, []);

  // Recuperer les threads de transaction regroupes
  const transactionThreads = getTransactionThreads();

  // Fonction pour regrouper les conversations par interlocuteur
  const groupConversationsByUser = (convs: Conversation[], currentUserId: string): Conversation[] => {
    const grouped: Record<string, Conversation> = {};

    for (const conv of convs) {
      if (conv.isSystemMessage) continue;

      const other = conv.participants?.find((u: User) => u.id !== currentUserId);
      if (!other) continue;

      const otherUserId = other.id;

      if (grouped[otherUserId]) {
        const existingLastMsg = grouped[otherUserId].messages?.[0];
        const newLastMsg = conv.messages?.[0];

        if (newLastMsg && existingLastMsg) {
          const existingDate = new Date(existingLastMsg.sentAt).getTime();
          const newDate = new Date(newLastMsg.sentAt).getTime();

          if (newDate > existingDate) {
            const existingConvIds = (grouped[otherUserId] as any).allConversationIds || [grouped[otherUserId].id];
            grouped[otherUserId] = { ...conv };
            (grouped[otherUserId] as any).allConversationIds = [...existingConvIds, conv.id];
          } else {
            (grouped[otherUserId] as any).allConversationIds = [
              ...((grouped[otherUserId] as any).allConversationIds || [grouped[otherUserId].id]),
              conv.id
            ];
          }
        }
      } else {
        grouped[otherUserId] = conv;
        (grouped[otherUserId] as any).allConversationIds = [conv.id];
      }
    }

    return Object.values(grouped);
  };

  // Fonction pour charger les conversations
  const loadConversations = useCallback(async (showLoading = true) => {
    if (!user?.id) {
      setConversations([WELCOME_MESSAGE]);
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const data = await api.get<Conversation[]>('/api/messages/conversations');
      const apiConversations = Array.isArray(data) ? data : [];
      const groupedConversations = groupConversationsByUser(apiConversations, user.id);
      groupedConversations.sort((a, b) => {
        const dateA = a.messages?.[0]?.sentAt ? new Date(a.messages[0].sentAt).getTime() : 0;
        const dateB = b.messages?.[0]?.sentAt ? new Date(b.messages[0].sentAt).getTime() : 0;
        return dateB - dateA;
      });
      setConversations([WELCOME_MESSAGE, ...groupedConversations]);
      setError('');
    } catch (err) {
      console.warn('[MessagesScreen] Failed to load conversations:', err);
      if ((err as any)?.response?.status === 401) {
        setError("Vous devez etre connecte pour voir vos messages.");
      } else {
        setError("Impossible de charger les conversations.");
      }
      setConversations([WELCOME_MESSAGE]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Charger les conversations au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations(false);
    setRefreshing(false);
  }, [loadConversations]);

  const deleteConversation = (conversationId: string) => {
    Alert.alert(
      "Supprimer la conversation",
      "Voulez-vous vraiment supprimer cette conversation ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteFromStore(conversationId)
        }
      ]
    );
  };

  const deleteThread = (transactionId: string) => {
    Alert.alert(
      "Supprimer le fil",
      "Voulez-vous vraiment supprimer ce fil de transaction ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteTransactionThread(transactionId)
        }
      ]
    );
  };

  // Filtrer les conversations (exclure les supprimees)
  const filteredConversations = conversations
    .filter(conv => !deletedMessageIds.includes(conv.id))
    .filter(conv => {
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

  // Filtrer les threads de transaction par recherche
  const filteredThreads = transactionThreads.filter(thread => {
    if (searchText === "") return true;
    const q = searchText.toLowerCase();
    return thread.productTitle.toLowerCase().includes(q) ||
      thread.otherPartyName.toLowerCase().includes(q);
  });

  // Card pour un fil de transaction
  const TransactionThreadCard = ({ thread }: { thread: TransactionThread }) => {
    const lastMessage = thread.messages[thread.messages.length - 1];
    const lastContent = lastMessage ? getHugoMessageContent(lastMessage) : null;

    return (
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: '/transaction-thread' as any,
            params: { transactionId: thread.transactionId }
          });
        }}
        onLongPress={() => deleteThread(thread.transactionId)}
        style={{
          backgroundColor: t.cardBg,
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: thread.hasUnread ? '#3B82F6' : t.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Avatar Hugo */}
          <View style={{ position: 'relative', marginRight: 12 }}>
            <Image
              source={{ uri: 'https://ui-avatars.com/api/?name=Hugo+Gearted&background=3B82F6&color=fff&size=100' }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
            {/* Badge non lu */}
            {thread.hasUnread && (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: '#3B82F6',
                  borderWidth: 2,
                  borderColor: t.cardBg,
                }}
              />
            )}
          </View>

          {/* Contenu */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: thread.hasUnread ? '700' : '600',
                  color: t.heading,
                  flex: 1
                }}
                numberOfLines={1}
              >
                {thread.productTitle}
              </Text>
              <Text style={{ fontSize: 11, color: t.muted }}>
                {formatTimestamp(thread.lastMessageAt)}
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: t.muted, marginBottom: 4 }}>
              {thread.forRole === 'SELLER' ? '💼 Vente a' : '🛒 Achat de'} {thread.otherPartyName}
            </Text>

            {lastContent && (
              <Text
                style={{
                  fontSize: 13,
                  color: thread.hasUnread ? t.heading : t.muted,
                  fontWeight: thread.hasUnread ? '500' : 'normal'
                }}
                numberOfLines={1}
              >
                {lastContent.emoji} {lastContent.title}
              </Text>
            )}

            {/* Badge nombre de messages */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <View
                style={{
                  backgroundColor: t.primaryBtn + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 11, color: t.primaryBtn, fontWeight: '500' }}>
                  {thread.messages.length} etape{thread.messages.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Chevron */}
          <Text style={{ fontSize: 18, color: t.muted, marginLeft: 8 }}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Card pour une conversation normale
  const ConversationCard = ({ conversation }: { conversation: Conversation }) => {
    const isSystem = conversation.isSystemMessage;
    const other = isSystem
      ? conversation.participants?.[0]
      : conversation.participants?.find((u: User) => u.id !== user?.id);
    const lastMsg = conversation.messages?.[0];
    const isRead = readMessageIds.includes(conversation.id);

    const handlePress = async () => {
      // Marquer comme lu immédiatement
      await markAsRead(conversation.id);

      // Naviguer si ce n'est pas un message système
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
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={() => deleteConversation(conversation.id)}
        style={{
          backgroundColor: t.cardBg,
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          borderWidth: !isRead ? 2 : 1,
          borderColor: !isRead ? '#3B82F6' : (isSystem ? t.primaryBtn : t.border),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Avatar */}
          <View style={{ position: 'relative', marginRight: 12 }}>
            <Image
              source={{ uri: other?.avatar || 'https://via.placeholder.com/50/888/fff?text=U' }}
              style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: t.primaryBtn }}
            />
            {/* Badge non lu */}
            {!isRead && (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: '#3B82F6',
                  borderWidth: 2,
                  borderColor: t.cardBg,
                }}
              />
            )}
          </View>

          {/* Contenu */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: !isRead ? '700' : '600',
                  color: t.heading,
                  flex: 1
                }}
                numberOfLines={1}
              >
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
              style={{
                fontSize: 14,
                color: !isRead ? t.heading : t.muted,
                fontWeight: !isRead ? '500' : 'normal'
              }}
              numberOfLines={2}
            >
              {lastMsg ? lastMsg.content : 'Nouvelle conversation'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
          💡 Appui long pour supprimer • Point bleu = non lu
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
          <ActivityIndicator size="large" color={t.primaryBtn} />
          <Text style={{ fontSize: 16, color: t.muted, marginTop: 12 }}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={t.primaryBtn}
            />
          }
        >
          {/* Section: Transactions */}
          {filteredThreads.length > 0 && (
            <>
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.muted, marginBottom: 12, marginTop: 8 }}>
                📦 SUIVI DE TRANSACTIONS
              </Text>
              {filteredThreads.map((thread) => (
                <TransactionThreadCard key={thread.transactionId} thread={thread} />
              ))}
            </>
          )}

          {/* Section: Conversations */}
          {filteredConversations.length > 0 && (
            <>
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.muted, marginBottom: 12, marginTop: 16 }}>
                💬 CONVERSATIONS
              </Text>
              {filteredConversations.map((conversation) => (
                <ConversationCard key={conversation.id} conversation={conversation} />
              ))}
            </>
          )}

          {/* Empty state */}
          {filteredConversations.length === 0 && filteredThreads.length === 0 && (
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
                Contactez un vendeur pour demarrer une discussion
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
