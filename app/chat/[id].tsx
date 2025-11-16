import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../components/ThemeProvider";
import { THEMES } from "../../themes";
import { filterMessageContent, getBlockedContentWarning } from "../../utils/contentFilter";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isMine: boolean;
}

// Mock data pour une conversation
const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    text: "Bonjour, est-ce que cet article est toujours disponible ?",
    senderId: "me",
    timestamp: new Date(Date.now() - 3600000),
    isMine: true
  },
  {
    id: "2",
    text: "Oui, elle est toujours disponible ! Vous êtes intéressé ?",
    senderId: "other",
    timestamp: new Date(Date.now() - 3000000),
    isMine: false
  },
  {
    id: "3",
    text: "Oui tout à fait ! Quel est le mode de livraison ?",
    senderId: "me",
    timestamp: new Date(Date.now() - 2400000),
    isMine: true
  },
  {
    id: "4",
    text: "Je peux vous l'envoyer en Colissimo ou remise en main propre sur Paris",
    senderId: "other",
    timestamp: new Date(Date.now() - 1800000),
    isMine: false
  }
];

const MOCK_OTHER_USER = {
  name: "AirsoftPro92",
  avatar: "https://via.placeholder.com/40/4B5D3A/FFFFFF?text=AP",
  rating: 4.8
};

export default function ChatScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const params = useLocalSearchParams();
  
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Récupération des infos du vendeur depuis les params
  const sellerName = (params.sellerName as string) || MOCK_OTHER_USER.name;
  const sellerAvatar = (params.sellerAvatar as string) || MOCK_OTHER_USER.avatar;

  useEffect(() => {
    // Auto-scroll vers le bas lors du chargement
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const sendMessage = () => {
    if (inputText.trim() === "") return;
    if (sending) return;

    // Filter message content for phone numbers and emails
    const filterResult = filterMessageContent(inputText);
    
    if (!filterResult.isAllowed) {
      Alert.alert(
        "Message bloqué",
        getBlockedContentWarning(filterResult.violations),
        [
          {
            text: "Compris",
            style: "cancel"
          }
        ]
      );
      return;
    }

    setSending(true);

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      senderId: "me",
      timestamp: new Date(),
      isMine: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText("");

    // Auto-scroll après envoi
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
      setSending(false);
    }, 100);

    // Simulation d'une réponse après 2 secondes
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Merci pour votre message ! Je vous réponds dans quelques instants.",
        senderId: "other",
        timestamp: new Date(),
        isMine: false
      };
      setMessages(prev => [...prev, responseMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <View style={{
      flexDirection: message.isMine ? 'row-reverse' : 'row',
      marginBottom: 12,
      paddingHorizontal: 16,
      alignItems: 'flex-end'
    }}>
      {!message.isMine && (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          marginRight: 8,
          overflow: 'hidden',
          backgroundColor: t.primaryBtn
        }}>
          <Image
            source={{ uri: sellerAvatar }}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      )}
      
      <View style={{
        maxWidth: '70%',
        backgroundColor: message.isMine ? t.primaryBtn : t.cardBg,
        borderRadius: 16,
        padding: 12,
        borderWidth: message.isMine ? 0 : 1,
        borderColor: t.border
      }}>
        <Text style={{
          fontSize: 16,
          color: message.isMine ? '#FFFFFF' : t.heading,
          marginBottom: 4
        }}>
          {message.text}
        </Text>
        <Text style={{
          fontSize: 11,
          color: message.isMine ? 'rgba(255,255,255,0.7)' : t.muted,
          textAlign: 'right'
        }}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={{
        backgroundColor: t.navBg + 'CC',
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Text style={{ fontSize: 24, color: t.primaryBtn }}>←</Text>
        </TouchableOpacity>

        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          marginRight: 12,
          overflow: 'hidden',
          backgroundColor: t.primaryBtn
        }}>
          <Image
            source={{ uri: sellerAvatar }}
            style={{ width: '100%', height: '100%' }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
            {sellerName}
          </Text>
          <Text style={{ fontSize: 12, color: t.muted }}>
            ⭐ {MOCK_OTHER_USER.rating} · En ligne
          </Text>
        </View>

        <TouchableOpacity style={{ padding: 8 }}>
          <Text style={{ fontSize: 20 }}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ paddingVertical: 16 }}
        ListHeaderComponent={() => (
          <View style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: '#FFF3CD',
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: '#FFC107'
          }}>
            <Text style={{
              fontSize: 13,
              color: '#856404',
              textAlign: 'center',
              lineHeight: 18,
              fontWeight: '500'
            }}>
              ⚠️ Ne partagez jamais votre numéro de téléphone ou email. 
              Toutes les conversations doivent se faire via la messagerie Gearted.
            </Text>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={{
          backgroundColor: t.navBg,
          borderTopWidth: 1,
          borderTopColor: t.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: t.cardBg,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 16,
              color: t.heading,
              borderWidth: 1,
              borderColor: t.border,
              marginRight: 8
            }}
            placeholder="Votre message..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={t.muted}
            multiline
            maxLength={500}
            editable={!sending}
          />

          <TouchableOpacity
            onPress={sendMessage}
            style={{
              backgroundColor: inputText.trim() && !sending ? t.primaryBtn : t.border,
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center'
            }}
            disabled={!inputText.trim() || sending}
          >
            <Text style={{ fontSize: 20 }}>
              {sending ? '⏳' : '➤'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}