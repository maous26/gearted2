import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../components/ThemeProvider';
import api from '../services/api';
import { THEMES } from '../themes';

interface TransactionDetails {
  id: string;
  shippingRateId: string | null;
  selectedShippingRate: string | null;
  shippingAddress: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    zip: string;
    country: string;
  } | null;
  selectedRelayPoint: {
    id: string;
    name: string;
    address: string;
    city: string;
    postalCode: string;
  } | null;
  buyer: {
    username: string;
  };
  product: {
    title: string;
    shippingCategory: string;
  };
}

export default function SellerGenerateLabelScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const params = useLocalSearchParams();

  const transactionId = params.transactionId as string;
  const productTitle = params.productTitle as string;
  const buyerName = params.buyerName as string;

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);

  useEffect(() => {
    loadTransactionDetails();
  }, []);

  const loadTransactionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get<{
        success: boolean;
        transaction: TransactionDetails;
      }>(`/api/transactions/${transactionId}`);

      if (response.success && response.transaction) {
        setTransaction(response.transaction);
      }
    } catch (error: any) {
      console.error('[SellerLabel] Failed to load transaction:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la commande');
    } finally {
      setLoading(false);
    }
  };

  const generateLabel = async () => {
    if (!transaction) return;

    const rateId = transaction.shippingRateId || transaction.selectedShippingRate;
    if (!rateId) {
      Alert.alert('Erreur', 'Aucun mode de livraison sélectionné par l\'acheteur');
      return;
    }

    try {
      setGenerating(true);
      console.log('[SellerLabel] Generating label for transaction:', transactionId, 'rateId:', rateId);

      const response = await api.post<{
        success: boolean;
        label: {
          trackingNumber: string;
          labelUrl: string;
          carrier: string;
        };
        transaction: any;
      }>(`/api/shipping/label/${transactionId}`, {
        rateId,
        ...(transaction.selectedRelayPoint && {
          relayPointId: transaction.selectedRelayPoint.id,
        }),
      });

      console.log('[SellerLabel] Label generated successfully:', response);

      // Redirect to shipping label screen to show QR code and PDF
      router.replace({
        pathname: '/shipping-label' as any,
        params: {
          trackingNumber: response.label.trackingNumber,
          productTitle: productTitle,
          carrier: response.label.carrier || 'Transporteur',
        },
      });
    } catch (error: any) {
      console.error('[SellerLabel] Failed to generate label:', error);
      Alert.alert('Erreur', error.message || 'Impossible de générer l\'étiquette');
    } finally {
      setGenerating(false);
    }
  };

  const getShippingMethodName = (rateId: string | null) => {
    if (!rateId) return 'Non sélectionné';
    switch (rateId) {
      case 'mondial-relay-standard':
        return 'Mondial Relay - Point Relais';
      case 'mondial-relay-domicile':
        return 'Mondial Relay - Domicile';
      case 'colissimo-standard':
        return 'Colissimo - Standard';
      default:
        return rateId;
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
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={t.heading} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: t.heading }}>
          Expédier le colis
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={t.primaryBtn} />
          <Text style={{ marginTop: 16, color: t.muted }}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Info commande */}
          <View
            style={{
              backgroundColor: t.cardBg,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: t.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 8 }}>
              {productTitle}
            </Text>
            <Text style={{ fontSize: 14, color: t.muted }}>
              Acheteur: {buyerName}
            </Text>
            {transaction?.product?.shippingCategory && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Ionicons name="cube-outline" size={16} color={t.primaryBtn} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, color: t.primaryBtn }}>
                  Catégorie: {transaction.product.shippingCategory}
                </Text>
              </View>
            )}
          </View>

          {/* Mode de livraison */}
          <View
            style={{
              backgroundColor: t.cardBg,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: t.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 12 }}>
              Mode de livraison
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="car-outline" size={20} color={t.primaryBtn} style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 15, color: t.heading }}>
                {getShippingMethodName(transaction?.shippingRateId || transaction?.selectedShippingRate || null)}
              </Text>
            </View>

            {/* Point relais si applicable */}
            {transaction?.selectedRelayPoint && (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: t.sectionLight,
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="location" size={16} color={t.primaryBtn} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: t.heading }}>
                    Point Relais
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: t.heading }}>
                  {transaction.selectedRelayPoint.name}
                </Text>
                <Text style={{ fontSize: 12, color: t.muted }}>
                  {transaction.selectedRelayPoint.address}
                </Text>
                <Text style={{ fontSize: 12, color: t.muted }}>
                  {transaction.selectedRelayPoint.postalCode} {transaction.selectedRelayPoint.city}
                </Text>
              </View>
            )}
          </View>

          {/* Adresse de livraison */}
          {transaction?.shippingAddress && (
            <View
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 12 }}>
                Adresse de livraison
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="home-outline" size={20} color={t.muted} style={{ marginRight: 10, marginTop: 2 }} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: t.heading }}>
                    {transaction.shippingAddress.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: t.muted, marginTop: 2 }}>
                    {transaction.shippingAddress.street1}
                  </Text>
                  {transaction.shippingAddress.street2 && (
                    <Text style={{ fontSize: 13, color: t.muted }}>
                      {transaction.shippingAddress.street2}
                    </Text>
                  )}
                  <Text style={{ fontSize: 13, color: t.muted }}>
                    {transaction.shippingAddress.zip} {transaction.shippingAddress.city}
                  </Text>
                  <Text style={{ fontSize: 13, color: t.muted }}>
                    {transaction.shippingAddress.country}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Instructions */}
          <View
            style={{
              backgroundColor: t.sectionLight,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <Ionicons name="information-circle" size={24} color={t.primaryBtn} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: t.heading, lineHeight: 20 }}>
                En cliquant sur "Générer l'étiquette", une étiquette d'expédition sera créée.{'\n\n'}
                Vous pourrez ensuite imprimer l'étiquette et déposer le colis au point de dépôt.
              </Text>
            </View>
          </View>

          {/* Bouton générer */}
          <TouchableOpacity
            onPress={generateLabel}
            disabled={generating || !transaction?.shippingAddress}
            style={{
              backgroundColor: transaction?.shippingAddress ? t.primaryBtn : t.muted,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="print-outline" size={22} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
                  Générer l'étiquette d'expédition
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!transaction?.shippingAddress && (
            <Text style={{ fontSize: 12, color: '#FF9800', textAlign: 'center', marginTop: 12 }}>
              ⚠️ L'acheteur n'a pas encore renseigné son adresse de livraison
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
