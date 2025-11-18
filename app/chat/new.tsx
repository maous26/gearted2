import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
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
import { THEMES } from "../../themes";

export default function NewChatScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const { user } = useUser();
  const params = useLocalSearchParams();
  
  // Récupération des paramètres du produit et vendeur
  const sellerId = params.sellerId as string | undefined;
  const sellerName = (params.sellerName as string) || "Vendeur";
  const sellerAvatar = params.sellerAvatar as string | undefined;
  const productId = params.productId as string | undefined;
  const productTitle = params.productTitle as string | undefined;
  const offerType = (params.offerType as string) || undefined; // 'trade' ou undefined
  
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Préremplir le message si c'est une proposition d'échange
  React.useEffect(() => {
    if (offerType === 'trade' && productTitle) {
      setMessage(`Bonjour, je suis intéressé(e) pour échanger "${productTitle}". Pouvons-nous discuter ?`);
    }
  }, [offerType, productTitle]);

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("Erreur", "Veuillez écrire un message");
      return;
    }

    if (!user?.id) {
      Alert.alert("Connexion requise", "Vous devez être connecté pour envoyer un message.");
      return;
    }

    if (!sellerId) {
      Alert.alert("Erreur", "Impossible d'identifier le vendeur.");
      return;
    }

    setSending(true);
    
    try {
      // 1) Créer (ou ouvrir) une conversation côté backend avec les 2 participants
      const conversation = await api.post<any>("/api/messages/conversations", {
        participantIds: [user.id, sellerId], // Acheteur ET vendeur
      });

      const conversationId = conversation?.id;
      if (!conversationId) {
        throw new Error("Conversation non créée");
      }

      // 2) Envoyer le premier message
      await api.post<any>(`/api/messages/conversations/${conversationId}/messages`, {
        senderId: user.id,
        content: message.trim(),
      });

      setMessage("");

      Alert.alert(
        "Message envoyé ✓",
        "Votre message a été envoyé au vendeur !",
        [
          {
            text: "Voir la conversation",
            onPress: () => {
              router.replace({
                pathname: "/chat/[id]",
                params: { 
                  id: conversationId,
                  sellerName,
                  sellerAvatar
                }
              });
            }
          }
        ]
      );
    } catch (err) {
      console.error("[chat] Failed to send first message", err);
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer le message pour le moment. Veuillez réessayer plus tard."
      );
    } finally {
      setSending(false);
    }
  };

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

        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: t.heading
          }}>
            Contacter {sellerName}
          </Text>
          {productTitle && (
            <Text style={{ fontSize: 12, color: t.muted }} numberOfLines={1}>
              À propos: {productTitle}
            </Text>
          )}
        </View>
      </View>

      {/* Product Info Card */}
      {productTitle && (
        <View style={{
          backgroundColor: t.cardBg,
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: t.border,
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 8,
            backgroundColor: t.sectionLight,
            marginRight: 12,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 24 }}>📦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: t.muted, marginBottom: 2 }}>
              Produit concerné
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: t.heading }} numberOfLines={2}>
              {productTitle}
            </Text>
          </View>
        </View>
      )}

      {/* Seller Info */}
      <View style={{
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 12
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: t.primaryBtn,
            marginRight: 12,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            {sellerAvatar ? (
              <Image source={{ uri: sellerAvatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text style={{ fontSize: 24 }}>👤</Text>
            )}
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
              {sellerName}
            </Text>
            <Text style={{ fontSize: 12, color: t.muted }}>
              Répond généralement sous 24h
            </Text>
          </View>
        </View>
      </View>

      {/* Message Input Area */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: t.heading,
            marginBottom: 8
          }}>
            Votre message
          </Text>
          
          <TextInput
            style={{
              backgroundColor: t.cardBg,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: t.heading,
              borderWidth: 1,
              borderColor: t.border,
              minHeight: 120,
              textAlignVertical: 'top'
            }}
            placeholder="Bonjour, je suis intéressé par votre article..."
            value={message}
            onChangeText={setMessage}
            placeholderTextColor={t.muted}
            multiline
            maxLength={500}
          />
          
          <Text style={{ fontSize: 12, color: t.muted, marginTop: 4, textAlign: 'right' }}>
            {message.length}/500
          </Text>

          {/* Safety Warning */}
          <View style={{
            backgroundColor: '#FFF3CD',
            borderRadius: 8,
            padding: 12,
            marginTop: 16,
            borderWidth: 1,
            borderColor: '#FFC107'
          }}>
            <Text style={{
              fontSize: 12,
              color: '#856404',
              textAlign: 'center',
              lineHeight: 16
            }}>
              ⚠️ Ne partagez jamais vos coordonnées (téléphone, email) dans les messages
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <View style={{
          backgroundColor: t.navBg,
          borderTopWidth: 1,
          borderTopColor: t.border,
          paddingHorizontal: 16,
          paddingVertical: 12
        }}>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || sending}
            style={{
              backgroundColor: message.trim() && !sending ? t.primaryBtn : t.border,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>
              {sending ? '⏳' : '📤'}
            </Text>
            <Text style={{
              color: message.trim() && !sending ? t.white : t.muted,
              fontSize: 16,
              fontWeight: '600'
            }}>
              {sending ? 'Envoi en cours...' : 'Envoyer le message'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}