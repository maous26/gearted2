import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../components/ThemeProvider';
import { THEMES } from '../../themes';
import api from '../../services/api';

interface Shipment {
  id: string;
  orderNumber: string;
  productId: string;
  trackingNumber: string;
  labelUrl: string;
  trackingStatus: string;
  status: string;
  carrier: string;
  serviceLevelToken: string;
  estimatedDays: number;
  amount: number;
  currency: string;
  fromAddress: string;
  toAddress: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface TrackingEvent {
  status: string;
  status_date: string;
  status_details: string;
  location?: {
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

interface TrackingInfo {
  tracking_status: {
    status: string;
    status_details: string;
    status_date: string;
  };
  tracking_history: TrackingEvent[];
  eta?: string;
}

export default function ShipmentTrackingScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const params = useLocalSearchParams();
  const shipmentId = String(params.id || '');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);

  useEffect(() => {
    loadShipment();
  }, [shipmentId]);

  const loadShipment = async () => {
    try {
      const response = await api.get(`/shipments/${shipmentId}/track`);
      setShipment(response.data.shipment);
      setTracking(response.data.tracking);
    } catch (error: any) {
      console.error('[ShipmentTracking] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadShipment();
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: '#FFA500',
      PAID: '#4CAF50',
      LABEL_CREATED: '#2196F3',
      IN_TRANSIT: '#FF9800',
      OUT_FOR_DELIVERY: '#9C27B0',
      DELIVERED: '#4CAF50',
      FAILED: '#F44336',
      RETURNED: '#F44336',
      CANCELLED: '#9E9E9E',
    };
    return statusMap[status] || t.muted;
  };

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, string> = {
      PENDING: '⏳',
      PAID: '💳',
      LABEL_CREATED: '📝',
      IN_TRANSIT: '🚚',
      OUT_FOR_DELIVERY: '🏃',
      DELIVERED: '✅',
      FAILED: '❌',
      RETURNED: '↩️',
      CANCELLED: '🚫',
    };
    return iconMap[status] || '📦';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      PENDING: 'En attente',
      PAID: 'Payé',
      LABEL_CREATED: 'Étiquette créée',
      IN_TRANSIT: 'En transit',
      OUT_FOR_DELIVERY: 'En cours de livraison',
      DELIVERED: 'Livré',
      FAILED: 'Échec',
      RETURNED: 'Retourné',
      CANCELLED: 'Annulé',
    };
    return labelMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={t.primaryBtn} />
          <Text style={{ color: t.muted, marginTop: 16 }}>
            Chargement du suivi...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!shipment) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
          <Text style={{ fontSize: 18, color: t.heading, fontWeight: '600', marginBottom: 8 }}>
            Expédition introuvable
          </Text>
          <Text style={{ fontSize: 14, color: t.muted, textAlign: 'center' }}>
            Impossible de charger les informations de suivi
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: t.primaryBtn,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 12,
              marginTop: 24,
            }}
            onPress={() => router.back()}
          >
            <Text style={{ color: t.white, fontWeight: '600' }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fromAddr = JSON.parse(shipment.fromAddress);
  const toAddr = JSON.parse(shipment.toAddress);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: t.navBg + 'CC',
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 24, color: t.primaryBtn }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: t.heading, flex: 1 }}>
          Suivi de colis
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primaryBtn} />
        }
      >
        {/* Status Card */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              backgroundColor: t.cardBg,
              borderRadius: 16,
              padding: 20,
              borderWidth: 2,
              borderColor: getStatusColor(shipment.status),
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 64, marginBottom: 8 }}>
                {getStatusIcon(shipment.status)}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: getStatusColor(shipment.status),
                  marginBottom: 4,
                }}
              >
                {getStatusLabel(shipment.status)}
              </Text>
              {tracking?.tracking_status?.status_details && (
                <Text style={{ fontSize: 14, color: t.muted, textAlign: 'center' }}>
                  {tracking.tracking_status.status_details}
                </Text>
              )}
            </View>

            {/* Order Info */}
            <View
              style={{
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: t.border,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.muted }}>Numéro de commande</Text>
                <Text style={{ color: t.heading, fontWeight: '600' }}>
                  {shipment.orderNumber}
                </Text>
              </View>

              {shipment.trackingNumber && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: t.muted }}>Numéro de suivi</Text>
                  <Text style={{ color: t.heading, fontWeight: '600' }}>
                    {shipment.trackingNumber}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.muted }}>Transporteur</Text>
                <Text style={{ color: t.heading, fontWeight: '600' }}>
                  {shipment.carrier}
                </Text>
              </View>

              {tracking?.eta && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: t.muted }}>Livraison estimée</Text>
                  <Text style={{ color: t.primaryBtn, fontWeight: '600' }}>
                    {formatDate(tracking.eta)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Addresses */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: t.heading,
              marginBottom: 12,
            }}
          >
            Itinéraire
          </Text>

          <View style={{ gap: 12 }}>
            {/* From Address */}
            <View
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#4CAF50',
              }}
            >
              <Text style={{ fontSize: 12, color: t.muted, marginBottom: 4 }}>
                📤 Expédié depuis
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.heading }}>
                {fromAddr.name}
              </Text>
              <Text style={{ fontSize: 13, color: t.muted }}>
                {fromAddr.street1}
                {fromAddr.street2 && `, ${fromAddr.street2}`}
              </Text>
              <Text style={{ fontSize: 13, color: t.muted }}>
                {fromAddr.zip} {fromAddr.city}, {fromAddr.country}
              </Text>
            </View>

            {/* To Address */}
            <View
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#2196F3',
              }}
            >
              <Text style={{ fontSize: 12, color: t.muted, marginBottom: 4 }}>
                📥 Livré à
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.heading }}>
                {toAddr.name}
              </Text>
              <Text style={{ fontSize: 13, color: t.muted }}>
                {toAddr.street1}
                {toAddr.street2 && `, ${toAddr.street2}`}
              </Text>
              <Text style={{ fontSize: 13, color: t.muted }}>
                {toAddr.zip} {toAddr.city}, {toAddr.country}
              </Text>
            </View>
          </View>
        </View>

        {/* Tracking History */}
        {tracking?.tracking_history && tracking.tracking_history.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: t.heading,
                marginBottom: 12,
              }}
            >
              Historique de suivi
            </Text>

            <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16 }}>
              {tracking.tracking_history.map((event, index) => (
                <View
                  key={index}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: index < tracking.tracking_history.length - 1 ? 1 : 0,
                    borderBottomColor: t.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: index === 0 ? t.primaryBtn : t.muted,
                        marginTop: 6,
                        marginRight: 12,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: t.heading,
                          marginBottom: 2,
                        }}
                      >
                        {event.status_details}
                      </Text>
                      <Text style={{ fontSize: 12, color: t.muted }}>
                        {formatDate(event.status_date)}
                      </Text>
                      {event.location && (
                        <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
                          📍 {event.location.city}, {event.location.country}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Label Download */}
        {shipment.labelUrl && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
            <TouchableOpacity
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: t.border,
                alignItems: 'center',
              }}
              onPress={() => {
                // TODO: Open label URL
                console.log('Open label:', shipment.labelUrl);
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
                📄 Télécharger l'étiquette
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

