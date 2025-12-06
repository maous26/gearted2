import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import { Ionicons } from '@expo/vector-icons';
import { useMessagesStore, getHugoMessageContent, TransactionThread } from '../stores/messagesStore';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TransactionThreadScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const params = useLocalSearchParams();

  const transactionId = params.transactionId as string;

  const {
    getTransactionThreads,
    markTransactionThreadAsRead,
  } = useMessagesStore();

  // Trouver le thread de cette transaction
  const threads = getTransactionThreads();
  const thread = threads.find(t => t.transactionId === transactionId);

  // Marquer comme lu au montage
  useEffect(() => {
    if (transactionId) {
      markTransactionThreadAsRead(transactionId);
    }
  }, [transactionId]);

  if (!thread) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
        <StatusBar style={theme === 'night' ? 'light' : 'dark'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
          <Text style={{ fontSize: 18, color: t.heading, textAlign: 'center' }}>
            Transaction introuvable
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 20, padding: 12, backgroundColor: t.primaryBtn, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const navigateToOrders = () => {
    router.push({
      pathname: '/orders' as any,
      params: {
        tab: thread.forRole === 'SELLER' ? 'sales' : 'purchases',
        transactionId: thread.transactionId,
      },
    });
  };

  const navigateToProduct = () => {
    if (thread.productId) {
      router.push(`/product/${thread.productId}` as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      <StatusBar style={theme === 'night' ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          backgroundColor: t.cardBg,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={t.heading} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading }} numberOfLines={1}>
            {thread.productTitle}
          </Text>
          <Text style={{ fontSize: 13, color: t.muted }}>
            {thread.forRole === 'SELLER' ? 'Vente à' : 'Achat de'} {thread.otherPartyName}
          </Text>
        </View>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#3B82F6',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>🤖</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Info Card */}
        <View
          style={{
            backgroundColor: t.cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: t.heading, marginBottom: 8 }}>
            📋 Informations de la transaction
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: t.muted }}>Role</Text>
            <Text style={{ fontSize: 13, color: t.heading, fontWeight: '500' }}>
              {thread.forRole === 'SELLER' ? '💼 Vendeur' : '🛒 Acheteur'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: t.muted }}>Etapes completees</Text>
            <Text style={{ fontSize: 13, color: t.heading, fontWeight: '500' }}>
              {thread.messages.length}
            </Text>
          </View>
        </View>

        {/* Timeline des messages */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: t.heading, marginBottom: 12 }}>
          📜 Historique
        </Text>

        {thread.messages.map((msg, index) => {
          const content = getHugoMessageContent(msg);
          const isLast = index === thread.messages.length - 1;

          return (
            <View key={msg.id} style={{ flexDirection: 'row', marginBottom: isLast ? 0 : 16 }}>
              {/* Timeline line */}
              <View style={{ width: 24, alignItems: 'center' }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: t.primaryBtn,
                  }}
                />
                {!isLast && (
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      backgroundColor: t.border,
                      marginTop: 4,
                    }}
                  />
                )}
              </View>

              {/* Message content */}
              <View
                style={{
                  flex: 1,
                  marginLeft: 12,
                  backgroundColor: t.cardBg,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>{content.emoji}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: t.heading, flex: 1 }}>
                    {content.title}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: t.muted, lineHeight: 20, marginBottom: 8 }}>
                  {content.content}
                </Text>
                <Text style={{ fontSize: 11, color: t.muted }}>
                  {formatDate(msg.createdAt)}
                </Text>

                {/* Lien vers le suivi si tracking number */}
                {msg.trackingNumber && (
                  <TouchableOpacity
                    onPress={() => {
                      // Ouvrir le lien de suivi Mondial Relay ou autre
                      const trackingUrl = `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${msg.trackingNumber}`;
                      Linking.openURL(trackingUrl);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 8,
                      padding: 8,
                      backgroundColor: t.primaryBtn + '15',
                      borderRadius: 8,
                    }}
                  >
                    <Ionicons name="location-outline" size={16} color={t.primaryBtn} />
                    <Text style={{ fontSize: 13, color: t.primaryBtn, marginLeft: 6, fontWeight: '500' }}>
                      Suivre le colis : {msg.trackingNumber}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Actions */}
      <View
        style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: t.border,
          backgroundColor: t.cardBg,
        }}
      >
        <TouchableOpacity
          onPress={navigateToOrders}
          style={{
            backgroundColor: t.primaryBtn,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Ionicons name="receipt-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
            {thread.forRole === 'SELLER' ? 'Voir mes ventes' : 'Voir mes achats'}
          </Text>
        </TouchableOpacity>

        {thread.productId && (
          <TouchableOpacity
            onPress={navigateToProduct}
            style={{
              backgroundColor: t.cardBg,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: t.border,
            }}
          >
            <Ionicons name="eye-outline" size={18} color={t.heading} style={{ marginRight: 8 }} />
            <Text style={{ color: t.heading, fontWeight: '500', fontSize: 14 }}>
              Voir l'annonce
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
