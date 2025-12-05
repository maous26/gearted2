import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useUser } from "../../components/UserProvider";
import api from "../../services/api";
import notificationService from "../../services/notifications";
import { THEMES } from "../../themes";
import { filterMessageContent, getBlockedContentWarning } from "../../utils/contentFilter";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isMine: boolean;
  isSystem?: boolean;
  isRead?: boolean;
}

// Structure pour afficher les messages groupés
interface DisplayItem {
  type: 'date' | 'message';
  date?: string;
  message?: Message;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

const HUGO_AVATAR = 'https://ui-avatars.com/api/?name=Hugo+Gearted&background=4B5D3A&color=fff&size=100';

// Formater la date pour les séparateurs
const formatDateSeparator = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) {
    return "Aujourd'hui";
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return "Hier";
  } else {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }
};

export default function ChatScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const params = useLocalSearchParams();
  const { user } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ username: string; avatar: string } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const conversationId = params.id as string;
  const isHugoChat = conversationId === 'gearted-welcome' || conversationId.startsWith('hugo-');

  // Récupération des infos du vendeur depuis les params ou l'API
  const sellerName = isHugoChat
    ? "Hugo de Gearted"
    : otherUser?.username || (params.sellerName as string) || (params.otherUsername as string) || "";
  const sellerAvatar = isHugoChat
    ? HUGO_AVATAR
    : otherUser?.avatar || (params.sellerAvatar as string) || (params.otherAvatar as string) || "";

  // Message Hugo basé sur les params ou le message par défaut
  const hugoMessageContent = params.hugoMessage as string || "Bienvenue sur Gearted ! 🎯 Je suis Hugo, fondateur de la plateforme. N'hésitez pas à me contacter si vous avez des questions.";

  // Grouper les messages par date et par expéditeur consécutif
  const displayItems = useMemo((): DisplayItem[] => {
    const items: DisplayItem[] = [];
    let lastDate = '';
    let lastSenderId = '';

    messages.forEach((msg, index) => {
      const msgDate = formatDateSeparator(msg.timestamp);

      // Ajouter un séparateur de date si nouvelle journée
      if (msgDate !== lastDate) {
        items.push({ type: 'date', date: msgDate });
        lastDate = msgDate;
        lastSenderId = ''; // Reset pour nouveau groupe
      }

      // Déterminer si c'est le premier/dernier d'un groupe
      const isFirstInGroup = msg.senderId !== lastSenderId;
      const nextMsg = messages[index + 1];
      const isLastInGroup = !nextMsg ||
        nextMsg.senderId !== msg.senderId ||
        formatDateSeparator(nextMsg.timestamp) !== msgDate;

      items.push({
        type: 'message',
        message: msg,
        isFirstInGroup,
        isLastInGroup
      });

      lastSenderId = msg.senderId;
    });

    return items;
  }, [messages]);

  useEffect(() => {
    // Chat spécial Hugo - messages locaux (pas d'appel API)
    if (isHugoChat) {
      const hugoMsg: Message = {
        id: conversationId,
        text: hugoMessageContent,
        senderId: 'hugo-gearted',
        timestamp: new Date(),
        isMine: false,
        isSystem: true
      };
      setMessages([hugoMsg]);
      return;
    }

    if (!conversationId || !user?.id) return;

    const fetchConversation = async () => {
      try {
        // Récupérer les infos de la conversation pour avoir le nom du vendeur
        const convData = await api.get<any>(`/api/messages/conversations/${conversationId}`);
        if (convData?.participants) {
          const other = convData.participants.find((p: any) => p.id !== user.id);
          if (other) {
            setOtherUser({
              username: other.username || other.firstName || 'Utilisateur',
              avatar: other.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(other.username || 'U')}&background=4B5D3A&color=fff`
            });
          }
        }
      } catch (error) {
        console.error("[chat] Failed to load conversation info", error);
      }
    };

    const fetchMessages = async () => {
      try {
        const data = await api.get<any[]>(`/api/messages/conversations/${conversationId}/messages`);
        const mapped: Message[] = (data || []).map((m) => ({
          id: m.id,
          text: m.content,
          senderId: m.senderId,
          timestamp: new Date(m.sentAt),
          isMine: m.senderId === user.id,
          isRead: m.isRead
        }));
        setMessages(mapped);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } catch (error) {
        console.error("[chat] Failed to load messages", error);
      }
    };

    const markNotificationsAsRead = async () => {
      try {
        const { notifications } = await notificationService.getNotifications();
        const conversationNotifications = notifications.filter(
          (n) => n.type === 'MESSAGE' &&
                 n.data?.conversationId === conversationId &&
                 !n.isRead
        );
        for (const notification of conversationNotifications) {
          await notificationService.markAsRead(notification.id);
        }
      } catch (error) {
        console.error("[chat] Failed to mark notifications as read", error);
      }
    };

    fetchConversation();
    fetchMessages();
    markNotificationsAsRead();
  }, [conversationId, user?.id, isHugoChat]);

  const sendMessage = async () => {
    if (inputText.trim() === "") return;
    if (sending) return;

    // Chat Hugo - réponse automatique
    if (isHugoChat) {
      const userMsg: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        senderId: user?.id || 'user',
        timestamp: new Date(),
        isMine: true
      };
      setMessages(prev => [...prev, userMsg]);
      setInputText("");

      setTimeout(() => {
        const hugoResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "Merci pour votre message ! 📩 Notre équipe vous répondra dans les plus brefs délais. En attendant, n'hésitez pas à consulter notre FAQ ou à explorer les annonces.",
          senderId: 'hugo-gearted',
          timestamp: new Date(),
          isMine: false,
          isSystem: true
        };
        setMessages(prev => [...prev, hugoResponse]);
      }, 1000);

      return;
    }

    // Filter message content for phone numbers and emails
    const filterResult = filterMessageContent(inputText);

    if (!filterResult.isAllowed) {
      Alert.alert(
        "Message bloqué",
        getBlockedContentWarning(filterResult.violations),
        [{ text: "Compris", style: "cancel" }]
      );
      return;
    }

    if (!user?.id) {
      Alert.alert("Connexion requise", "Vous devez être connecté pour envoyer un message.");
      return;
    }

    setSending(true);

    try {
      const response = await api.post<any>(`/api/messages/conversations/${conversationId}/messages`, {
        senderId: user.id,
        content: inputText.trim(),
      });

      const newMessage: Message = {
        id: response.id || Date.now().toString(),
        text: response.content || inputText.trim(),
        senderId: response.senderId || user.id,
        timestamp: new Date(response.sentAt || new Date()),
        isMine: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      setInputText("");

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("[chat] Failed to send message", error);
      Alert.alert("Erreur", "Impossible d'envoyer le message. Veuillez réessayer plus tard.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Composant séparateur de date
  const DateSeparator = ({ date }: { date: string }) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
      paddingHorizontal: 16
    }}>
      <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
      <Text style={{
        paddingHorizontal: 12,
        fontSize: 12,
        color: t.muted,
        fontWeight: '500'
      }}>
        {date}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
    </View>
  );

  // Composant bulle de message optimisé pour le groupage
  const MessageBubble = ({
    message,
    isFirstInGroup,
    isLastInGroup
  }: {
    message: Message;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
  }) => {
    const getBubbleStyle = () => {
      if (message.isMine) {
        return {
          backgroundColor: '#4B5D3A',
          textColor: '#FFFFFF',
          timeColor: 'rgba(255,255,255,0.7)',
        };
      } else if (message.isSystem) {
        return {
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF',
          timeColor: 'rgba(255,255,255,0.7)',
        };
      } else {
        return {
          backgroundColor: theme === 'night' ? '#2D2D2D' : '#F3F4F6',
          textColor: t.heading,
          timeColor: t.muted,
        };
      }
    };

    const bubbleStyle = getBubbleStyle();
    const showAvatar = !message.isMine && isLastInGroup;
    const avatarPlaceholder = !message.isMine && !isLastInGroup;

    return (
      <View style={{
        flexDirection: message.isMine ? 'row-reverse' : 'row',
        marginBottom: isLastInGroup ? 8 : 2,
        paddingHorizontal: 16,
        alignItems: 'flex-end'
      }}>
        {/* Avatar ou espace réservé */}
        {!message.isMine && (
          <View style={{ width: 32, marginRight: 8 }}>
            {showAvatar ? (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: message.isSystem ? '#3B82F6' : t.primaryBtn
              }}>
                <Image
                  source={{ uri: sellerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName || 'U')}&background=4B5D3A&color=fff` }}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            ) : avatarPlaceholder ? (
              <View style={{ width: 32, height: 32 }} />
            ) : null}
          </View>
        )}

        <View style={{
          maxWidth: '75%',
          backgroundColor: bubbleStyle.backgroundColor,
          paddingHorizontal: 14,
          paddingVertical: 10,
          // Coins arrondis dynamiques selon position dans le groupe
          borderTopLeftRadius: message.isMine ? 18 : (isFirstInGroup ? 18 : 6),
          borderTopRightRadius: message.isMine ? (isFirstInGroup ? 18 : 6) : 18,
          borderBottomLeftRadius: message.isMine ? 18 : (isLastInGroup ? 18 : 6),
          borderBottomRightRadius: message.isMine ? (isLastInGroup ? 18 : 6) : 18,
        }}>
          <Text style={{
            fontSize: 16,
            color: bubbleStyle.textColor,
            lineHeight: 22
          }}>
            {message.text}
          </Text>

          {/* Heure + indicateur de lecture (seulement sur le dernier message du groupe) */}
          {isLastInGroup && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginTop: 4
            }}>
              <Text style={{
                fontSize: 11,
                color: bubbleStyle.timeColor,
              }}>
                {formatTime(message.timestamp)}
              </Text>
              {/* Indicateur de lecture pour mes messages */}
              {message.isMine && (
                <Text style={{
                  fontSize: 12,
                  color: bubbleStyle.timeColor,
                  marginLeft: 4
                }}>
                  {message.isRead ? '✓✓' : '✓'}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Espace pour aligner mes messages */}
        {message.isMine && <View style={{ width: 8 }} />}
      </View>
    );
  };

  const renderItem = ({ item }: { item: DisplayItem }) => {
    if (item.type === 'date') {
      return <DateSeparator date={item.date!} />;
    }
    return (
      <MessageBubble
        message={item.message!}
        isFirstInGroup={item.isFirstInGroup!}
        isLastInGroup={item.isLastInGroup!}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      {/* Header - Design épuré sans badge */}
      <View style={{
        backgroundColor: t.navBg,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12, padding: 4 }}
        >
          <Text style={{ fontSize: 24, color: t.primaryBtn }}>←</Text>
        </TouchableOpacity>

        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          marginRight: 12,
          overflow: 'hidden',
          backgroundColor: t.primaryBtn
        }}>
          <Image
            source={{ uri: sellerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName || 'U')}&background=4B5D3A&color=fff` }}
            style={{ width: '100%', height: '100%' }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: t.heading }}>
            {sellerName || 'Conversation'}
          </Text>
        </View>

        <TouchableOpacity style={{ padding: 8 }}>
          <Text style={{ fontSize: 20, color: t.muted }}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={displayItems}
        keyExtractor={(item) => item.type === 'date' ? `date-${item.date}` : item.message!.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListHeaderComponent={() => (
          <View style={{
            marginHorizontal: 16,
            marginVertical: 12,
            backgroundColor: theme === 'night' ? 'rgba(255, 243, 205, 0.1)' : '#FFF3CD',
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: theme === 'night' ? 'rgba(255, 193, 7, 0.3)' : '#FFC107'
          }}>
            <Text style={{
              fontSize: 13,
              color: theme === 'night' ? '#FFC107' : '#856404',
              textAlign: 'center',
              lineHeight: 18
            }}>
              🔒 Vos échanges sont sécurisés. Ne partagez jamais vos coordonnées personnelles.
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
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'flex-end'
        }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: t.cardBg,
              borderRadius: 24,
              paddingHorizontal: 18,
              paddingVertical: 12,
              fontSize: 16,
              color: t.heading,
              borderWidth: 1,
              borderColor: t.border,
              marginRight: 10,
              maxHeight: 100
            }}
            placeholder="Écrire un message..."
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
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center'
            }}
            disabled={!inputText.trim() || sending}
          >
            <Text style={{ fontSize: 18, color: '#FFF' }}>
              {sending ? '⏳' : '➤'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
