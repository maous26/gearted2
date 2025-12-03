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
import RelayPointMap from '../components/RelayPointMapSimple';
import { useTheme } from '../components/ThemeProvider';
import api from '../services/api';
import { HugoTransactionMessage, useMessagesStore } from '../stores/messagesStore';
import { THEMES } from '../themes';

interface ShippingRate {
  rateId: string;
  provider: string;
  servicelevel?: {
    name?: string;
    token?: string;
  };
  servicelevelName?: string;
  amount: string;
  currency: string;
  estimatedDays: number;
}

interface SelectedRelayPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
}

// Mondial Relay only - No Colissimo/Chronopost - Force rebuild v2
export default function BuyerChooseShippingScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addHugoMessage, hasHugoMessage } = useMessagesStore();

  const transactionId = params.transactionId as string;
  const productTitle = params.productTitle as string;
  const sellerName = params.sellerName as string;

  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [dimensions, setDimensions] = useState<{
    length: number;
    width: number;
    height: number;
    weight: number;
  } | null>(null);
  const [showRelayMap, setShowRelayMap] = useState(false);
  const [selectedRelayPoint, setSelectedRelayPoint] = useState<SelectedRelayPoint | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await api.post<{
        success: boolean;
        rates: ShippingRate[];
      }>(`/api/shipping/rates/${transactionId}`);

      setRates(response.rates || []);
    } catch (error: any) {
      console.error('Failed to get shipping rates:', error);
      Alert.alert('Erreur', error.message || 'Impossible de récupérer les tarifs');
    } finally {
      setLoading(false);
    }
  };

  const generateLabel = async () => {
    if (!selectedRate) {
      Alert.alert('Erreur', 'Veuillez sélectionner un mode de livraison');
      return;
    }

    console.log('[BuyerShipping] START generateLabel - transactionId:', transactionId, 'rateId:', selectedRate);

    const isMondialRelayPointRelais = selectedRate === 'mondial-relay-standard';

    if (isMondialRelayPointRelais && !selectedRelayPoint) {
      // Pour Mondial Relay Point Relais, ouvrir la carte pour sélectionner un point
      setShowRelayMap(true);
      return;
    }

    try {
      setCreatingLabel(true);
      console.log('[BuyerShipping] Calling API /api/shipping/label/' + transactionId);

      const response = await api.post<{
        success: boolean;
        label: any;
        transaction: any;
      }>(`/api/shipping/label/${transactionId}`, {
        rateId: selectedRate,
        ...(selectedRelayPoint && { relayPointId: selectedRelayPoint.id }),
      });

      console.log('[BuyerShipping] Label created successfully:', response);

      // Envoyer notification Hugo au vendeur (LABEL_GENERATED)
      // Note: Le vendeur verra cette notif quand il ouvrira ses ventes
      // La notification sera envoyée par orders.tsx lors du chargement

      // Notification pour l'acheteur: Shipping Ready
      if (!hasHugoMessage(transactionId, 'SHIPPING_READY')) {
        const hugoMsg: HugoTransactionMessage = {
          id: `hugo-SHIPPING_READY-${transactionId}`,
          type: 'SHIPPING_READY',
          transactionId,
          productTitle: productTitle || 'Produit',
          otherPartyName: sellerName || 'Vendeur',
          trackingNumber: response.transaction?.trackingNumber || response.label?.tracking_number,
          createdAt: new Date().toISOString(),
          forRole: 'BUYER'
        };
        await addHugoMessage(hugoMsg);
      }

      Alert.alert(
        'Succès',
        'Étiquette créée avec succès! Le vendeur peut maintenant expédier votre colis.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('[BuyerShipping] Failed to generate label:', error);
      console.error('[BuyerShipping] Error response:', error.response?.data);
      Alert.alert('Erreur', error.message || 'Impossible de créer l\'étiquette');
    } finally {
      setCreatingLabel(false);
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
          Choisir la livraison
        </Text>
        <View style={{ width: 40 }} />
      </View>

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
            Vendeur: {sellerName}
          </Text>
        </View>

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
              Le vendeur a défini les dimensions du colis. Choisissez votre mode de livraison préféré.
            </Text>
          </View>
        </View>

        {/* Tarifs disponibles */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={t.primaryBtn} />
            <Text style={{ marginTop: 16, fontSize: 14, color: t.muted }}>
              Récupération des tarifs...
            </Text>
          </View>
        ) : rates.length > 0 ? (
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 16 }}>
              Modes de livraison disponibles
            </Text>

            {rates.map((rate) => (
              <TouchableOpacity
                key={rate.rateId}
                onPress={() => {
                  setSelectedRate(rate.rateId);
                  // Reset relay point si on change de mode
                  if (rate.rateId !== 'mondial-relay-standard') {
                    setSelectedRelayPoint(null);
                  }
                }}
                style={{
                  backgroundColor: selectedRate === rate.rateId ? t.sectionLight : t.rootBg,
                  borderWidth: 2,
                  borderColor: selectedRate === rate.rateId ? t.primaryBtn : t.border,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons 
                        name={rate.rateId === 'mondial-relay-standard' ? 'location' : 'home'} 
                        size={18} 
                        color={t.primaryBtn} 
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
                        {rate.provider}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: t.muted, marginTop: 4, marginLeft: 26 }}>
                      {rate.servicelevel?.name || rate.servicelevelName || 'Service standard'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 26 }}>
                      <Ionicons name="time-outline" size={14} color={t.muted} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 12, color: t.muted }}>
                        Livraison estimée: <Text style={{ fontWeight: '600' }}>{(() => {
                          const deliveryDate = new Date();
                          deliveryDate.setDate(deliveryDate.getDate() + rate.estimatedDays);
                          return deliveryDate.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          });
                        })()}</Text> ({rate.estimatedDays} jour{rate.estimatedDays > 1 ? 's' : ''})
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: t.primaryBtn }}>
                    {rate.amount} {rate.currency}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Afficher le point relais sélectionné */}
            {selectedRate === 'mondial-relay-standard' && selectedRelayPoint && (
              <View
                style={{
                  backgroundColor: t.sectionLight,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: t.primaryBtn,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Ionicons name="checkmark-circle" size={20} color={t.primaryBtn} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.heading }}>
                      Point Relais sélectionné
                    </Text>
                    <Text style={{ fontSize: 14, color: t.heading, marginTop: 4 }}>
                      {selectedRelayPoint.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
                      {selectedRelayPoint.address}
                    </Text>
                    <Text style={{ fontSize: 12, color: t.muted }}>
                      {selectedRelayPoint.postalCode} {selectedRelayPoint.city}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowRelayMap(true)}>
                    <Text style={{ fontSize: 12, color: t.primaryBtn, fontWeight: '600' }}>
                      Changer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={generateLabel}
              disabled={!selectedRate || creatingLabel}
              style={{
                backgroundColor: selectedRate ? t.primaryBtn : t.muted,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 8,
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {creatingLabel ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons 
                    name={selectedRate === 'mondial-relay-standard' && !selectedRelayPoint ? 'map' : 'checkmark-circle'} 
                    size={20} 
                    color="#FFF" 
                    style={{ marginRight: 8 }} 
                  />
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
                    {selectedRate === 'mondial-relay-standard' && !selectedRelayPoint 
                      ? 'Choisir un point relais' 
                      : 'Générer l\'étiquette'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: t.cardBg,
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: t.border,
            }}
          >
            <Ionicons name="cube-outline" size={48} color={t.muted} />
            <Text style={{ fontSize: 16, color: t.heading, fontWeight: '600', marginTop: 16 }}>
              En attente des dimensions
            </Text>
            <Text style={{ fontSize: 14, color: t.muted, textAlign: 'center', marginTop: 8 }}>
              Le vendeur n'a pas encore défini les dimensions du colis.
            </Text>
          </View>
        )}

        {/* Note */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Text style={{ fontSize: 12, color: t.muted, textAlign: 'center', lineHeight: 18 }}>
            Une fois l'étiquette générée, le vendeur recevra une notification pour expédier votre colis.
          </Text>
        </View>
      </ScrollView>

      {/* Carte des points relais */}
      <RelayPointMap
        visible={showRelayMap}
        onClose={() => setShowRelayMap(false)}
        onSelectPoint={(point) => {
          setSelectedRelayPoint({
            id: point.id,
            name: point.name,
            address: point.address,
            city: point.city,
            postalCode: point.postalCode,
          });
          setShowRelayMap(false);
        }}
      />
    </SafeAreaView>
  );
}
