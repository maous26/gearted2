import { router } from "expo-router";
import React, { useState } from "react";
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
import { THEMES } from "../../themes";

// Mock data pour les conversations
const MOCK_CONVERSATIONS = [
  {
    id: "1",
    otherUser: {
      name: "AirsoftPro92",
      avatar: "https://via.placeholder.com/50/4B5D3A/FFFFFF?text=AP",
      rating: 4.8
    },
    productTitle: "AK-74 Kalashnikov Réplique",
    lastMessage: "Oui, elle est toujours disponible !",
    timestamp: "Il y a 5 min",
    unread: 2
  },
  {
    id: "2",
    otherUser: {
      name: "TacticalGear",
      avatar: "https://via.placeholder.com/50/8B4513/FFFFFF?text=TG",
      rating: 4.9
    },
    productTitle: "Red Dot Sight - EOTech 552",
    lastMessage: "Je peux vous faire 40€",
    timestamp: "Il y a 2h",
    unread: 0
  },
  {
    id: "3",
    otherUser: {
      name: "MilSimStore",
      avatar: "https://via.placeholder.com/50/556B2F/FFFFFF?text=MS",
      rating: 4.7
    },
    productTitle: "Gilet Tactique MultiCam",
    lastMessage: "Envoi prévu demain",
    timestamp: "Hier",
    unread: 0
  }
];

export default function MessagesScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [searchText, setSearchText] = useState("");

  const filteredConversations = MOCK_CONVERSATIONS.filter(conv =>
    searchText === "" ||
    conv.otherUser.name.toLowerCase().includes(searchText.toLowerCase()) ||
    conv.productTitle.toLowerCase().includes(searchText.toLowerCase())
  );

  const ConversationCard = ({ conversation }: { conversation: typeof MOCK_CONVERSATIONS[0] }) => (
    <View style={{
      backgroundColor: t.cardBg,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: t.border
    }}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8
        }}
        onPress={() => {
          router.push({
            pathname: '/chat/[id]',
            params: { id: conversation.id }
          });
        }}
      >
      {/* Avatar */}
      <View style={{ position: 'relative', marginRight: 12 }}>
        <Image
          source={{ uri: conversation.otherUser.avatar }}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: t.primaryBtn
          }}
        />
        {conversation.unread > 0 && (
          <View style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: '#FF6B6B',
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
              {conversation.unread}
            </Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
            {conversation.otherUser.name}
          </Text>
          <Text style={{ fontSize: 12, color: t.muted }}>
            {conversation.timestamp}
          </Text>
        </View>
        
        <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }} numberOfLines={1}>
          {conversation.productTitle}
        </Text>
        
        <Text
          style={{
            fontSize: 14,
            color: conversation.unread > 0 ? t.heading : t.muted,
            fontWeight: conversation.unread > 0 ? '600' : '400'
          }}
          numberOfLines={1}
        >
          {conversation.lastMessage}
        </Text>
      </View>

      {/* Rating */}
      <View style={{ marginLeft: 8 }}>
        <Text style={{ fontSize: 12, color: '#FFD700' }}>
          ⭐ {conversation.otherUser.rating}
        </Text>
      </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={{
        backgroundColor: t.navBg + 'CC',
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        paddingHorizontal: 16,
        paddingVertical: 16
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: t.heading,
          textAlign: 'center'
        }}>
          Messages
        </Text>
      </View>

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
            style={{
              flex: 1,
              fontSize: 16,
              color: t.heading
            }}
            placeholder="Rechercher une conversation..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={t.muted}
          />
          <Text style={{ fontSize: 16 }}>🔍</Text>
        </View>
      </View>

      {/* Conversations List */}
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
            <Text style={{
              fontSize: 18,
              color: t.muted,
              textAlign: 'center',
              marginBottom: 8
            }}>
              Aucune conversation
            </Text>
            <Text style={{
              fontSize: 14,
              color: t.muted,
              textAlign: 'center'
            }}>
              Contactez un vendeur pour démarrer une discussion
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
