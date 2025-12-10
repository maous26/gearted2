import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useConditionalStripe } from '../components/StripeWrapper';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function BoostPaymentScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useConditionalStripe();

  const productId = params.productId as string;
  const productTitle = params.productTitle as string;
  const boostType = (params.boostType as string) || 'BOOST_7D';

  const [loading, setLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const boostInfo = {
    BOOST_24H: { price: 1.99, duration: '24 heures' },
    BOOST_7D: { price: 4.99, duration: '7 jours' },
  };

  const selectedBoost = boostInfo[boostType as keyof typeof boostInfo] || boostInfo.BOOST_7D;

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);

      // Créer le PaymentIntent pour le boost
      const response = await api.post<{
        success: boolean;
        clientSecret: string;
        paymentIntentId: string;
        amount: number;
      }>('/api/premium/boost', {
        productId,
        boostType,
        isNewProduct: true,
      });

      if (!response.clientSecret) {
        throw new Error('Erreur lors de la création du paiement');
      }

      // Initialiser le PaymentSheet
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: response.clientSecret,
        merchantDisplayName: 'Gearted',
        style: theme === 'night' ? 'alwaysDark' : 'alwaysLight',
      });

      if (error) {
        console.error('PaymentSheet init error:', error);
        throw new Error(error.message);
      }

      setPaymentReady(true);
    } catch (error: any) {
      console.error('Failed to initialize payment:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible d\'initialiser le paiement',
        [
          {
            text: 'Continuer sans boost',
            onPress: () => router.replace(`/product/${productId}`),
          },
          {
            text: 'Réessayer',
            onPress: initializePayment,
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentReady) return;

    try {
      setLoading(true);

      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          // L'utilisateur a annulé
          return;
        }
        throw new Error(error.message);
      }

      // Paiement réussi !
      Alert.alert(
        'Boost activé !',
        `Votre annonce "${productTitle}" est maintenant mise en avant pour ${selectedBoost.duration}.`,
        [
          {
            text: 'Voir mon annonce',
            onPress: () => router.replace(`/product/${productId}`),
          },
        ]
      );
    } catch (error: any) {
      console.error('Payment failed:', error);
      Alert.alert('Erreur de paiement', error.message || 'Le paiement a échoué');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Continuer sans boost ?',
      'Votre annonce a été publiée mais ne sera pas mise en avant.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          onPress: () => router.replace(`/product/${productId}`),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      <StatusBar style={theme === 'night' ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}
      >
        <TouchableOpacity onPress={handleSkip} style={{ padding: 8 }}>
          <Ionicons name="close" size={24} color={t.heading} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading }}>
          Booster mon annonce
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Success Icon */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#4CAF50' + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: t.heading, textAlign: 'center' }}>
            Annonce publiée !
          </Text>
          <Text style={{ fontSize: 14, color: t.muted, textAlign: 'center', marginTop: 8 }}>
            "{productTitle}"
          </Text>
        </View>

        {/* Boost Offer */}
        <View
          style={{
            backgroundColor: '#FFB800' + '15',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 2,
            borderColor: '#FFB800',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>🚀</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#B8860B' }}>
              Boostez votre annonce !
            </Text>
          </View>

          <Text style={{ fontSize: 14, color: '#8B6914', lineHeight: 22, marginBottom: 16 }}>
            Une annonce boostée apparaît en priorité dans "À la une" et en tête des résultats de recherche.
            Vendez jusqu'à 3x plus vite !
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 14, color: '#8B6914' }}>Durée</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#B8860B' }}>
                {selectedBoost.duration}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 14, color: '#8B6914' }}>Prix</Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#B8860B' }}>
                {selectedBoost.price.toFixed(2)} €
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 16 }}>
            Avantages du boost :
          </Text>

          {[
            { icon: 'star', text: 'Apparition dans "À la une"' },
            { icon: 'search', text: 'Priorité dans les résultats de recherche' },
            { icon: 'eye', text: 'Visibilité maximale auprès des acheteurs' },
            { icon: 'trending-up', text: 'Jusqu\'à 3x plus de vues' },
          ].map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: t.primaryBtn + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name={item.icon as any} size={16} color={t.primaryBtn} />
              </View>
              <Text style={{ fontSize: 14, color: t.heading, flex: 1 }}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View
        style={{
          padding: 20,
          borderTopWidth: 1,
          borderTopColor: t.border,
          backgroundColor: t.cardBg,
        }}
      >
        <TouchableOpacity
          onPress={handlePayment}
          disabled={loading || !paymentReady}
          style={{
            backgroundColor: '#FFB800',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 12,
            opacity: loading || !paymentReady ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1a1a1a" />
          ) : (
            <Text style={{ color: '#1a1a1a', fontWeight: '700', fontSize: 16 }}>
              Payer {selectedBoost.price.toFixed(2)} € et booster
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          style={{
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: t.muted, fontSize: 14 }}>
            Continuer sans boost
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
