import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
import { UserBadge } from "../../components/UserBadge";
import { THEMES } from "../../themes";

import { useUser } from '../../components/UserProvider';
import api from '../../services/api';

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
  const [searchText, setSearchText] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    api
      .get<Conversation[]>('/api/messages/conversations')
      .then((data) => {
        setConversations(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err) => {
        console.warn('[MessagesScreen] Failed to load conversations:', err);
        if ((err as any)?.response?.status === 401) {
          setError("Vous devez être connecté pour voir vos messages.");
        } else {
          setError("Impossible de charger les conversations. Veuillez réessayer plus tard.");
        }
        setConversations([]);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filteredConversations = conversations.filter(conv => {
    if (!user?.id) return false;
    const other = conv.participants?.find((u: User) => u.id !== user.id);
    return (
      searchText === "" ||
      (other?.username || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (conv.productTitle || "").toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const ConversationCard = ({ conversation }: { conversation: Conversation }) => {
    if (!user?.id) return null;
    const other = conversation.participants?.find((u: User) => u.id !== user.id);
    const lastMsg = conversation.messages?.[0];
    return (
      <View style={{
        backgroundColor: t.cardBg,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: t.border
      }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          onPress={() => {
            router.push({ pathname: '/chat/[id]', params: { id: conversation.id } });
          }}
        >
          {/* Avatar */}
          <View style={{ position: 'relative', marginRight: 12 }}>
            <Image
              source={{ uri: other?.avatar || 'https://via.placeholder.com/50/888/fff?text=U' }}
              style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: t.primaryBtn }}
            />
            {/* Unread badge: TODO - backend unread count */}
          </View>
          {/* Contenu */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
                  {other?.username || 'Utilisateur'}
                </Text>
                <UserBadge role={other?.role} badge={other?.badge} size="small" />
              </View>
              <Text style={{ fontSize: 12, color: t.muted }}>
                {lastMsg ? formatTimestamp(lastMsg.sentAt) : ''}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }} numberOfLines={1}>
              {conversation.productTitle || ''}
            </Text>
            <Text
              style={{ fontSize: 14, color: t.heading, fontWeight: '400' }}
              numberOfLines={1}
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
