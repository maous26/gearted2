import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import shippingService from '../services/shipping';

interface TrackingEvent {
  status: string;
  status_details: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  object_created: string;
}

export default function TrackingScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const { transactionId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');

  useEffect(() => {
    loadTracking();
  }, []);

  const loadTracking = async () => {
    setLoading(true);
    try {
      const result = await shippingService.getTracking(transactionId as string);
      setTracking(result.tracking);
      setTrackingNumber(result.trackingNumber);
      setTrackingUrl(result.trackingUrl);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#10B981'; // Green
      case 'transit':
      case 'in_transit':
        return '#3B82F6'; // Blue
      case 'pre_transit':
        return '#F59E0B'; // Orange
      case 'failure':
      case 'returned':
        return '#EF4444'; // Red
      default:
        return t.mutedText;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '✅';
      case 'transit':
      case 'in_transit':
        return '🚚';
      case 'pre_transit':
        return '📦';
      case 'failure':
      case 'returned':
        return '❌';
      default:
        return '📍';
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.rootBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={t.primaryBtn} />
        <Text style={{ color: t.mutedText, marginTop: 10 }}>Chargement du suivi...</Text>
      </View>
    );
  }

  if (!tracking) {
    return (
      <View style={{ flex: 1, backgroundColor: t.rootBg, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>📭</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: t.text, marginBottom: 10 }}>
          Aucun suivi disponible
        </Text>
        <Text style={{ fontSize: 14, color: t.mutedText, textAlign: 'center', marginBottom: 30 }}>
          Le vendeur n'a pas encore généré l'étiquette d'expédition
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: t.primaryBtn, padding: 12, borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.rootBg }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: t.text, marginBottom: 10 }}>
        📦 Suivi de colis
      </Text>

      {/* Numéro de suivi */}
      <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 12, color: t.mutedText, marginBottom: 5 }}>Numéro de suivi</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: t.text, marginBottom: 15 }}>
          {trackingNumber}
        </Text>

        {trackingUrl && (
          <TouchableOpacity
            style={{
              backgroundColor: t.primaryBtn,
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => Linking.openURL(trackingUrl)}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
              Suivre sur le site du transporteur
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Statut actuel */}
      {tracking.tracking_status && (
        <View
          style={{
            backgroundColor: t.cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: getStatusColor(tracking.tracking_status.status),
          }}
        >
          <Text style={{ fontSize: 32, marginBottom: 10 }}>
            {getStatusIcon(tracking.tracking_status.status)}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: t.text, marginBottom: 5 }}>
            {tracking.tracking_status.status_details || tracking.tracking_status.status}
          </Text>
          {tracking.tracking_status.location && (
            <Text style={{ fontSize: 13, color: t.mutedText }}>
              📍 {tracking.tracking_status.location.city}, {tracking.tracking_status.location.country}
            </Text>
          )}
        </View>
      )}

      {/* Historique de suivi */}
      {tracking.tracking_history && tracking.tracking_history.length > 0 && (
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: t.text, marginBottom: 15 }}>
            Historique
          </Text>

          {tracking.tracking_history.map((event: TrackingEvent, index: number) => (
            <View
              key={index}
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
                borderLeftWidth: 3,
                borderLeftColor: getStatusColor(event.status),
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: t.text, marginBottom: 3 }}>
                    {event.status_details || event.status}
                  </Text>
                  {event.location && (
                    <Text style={{ fontSize: 12, color: t.mutedText }}>
                      📍 {event.location.city}, {event.location.country}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 11, color: t.mutedText }}>
                  {new Date(event.object_created).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Bouton rafraîchir */}
      <TouchableOpacity
        style={{
          backgroundColor: t.secondaryBtn,
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 20,
          marginBottom: 40,
        }}
        onPress={loadTracking}
      >
        <Text style={{ color: t.text, fontWeight: 'bold' }}>
          🔄 Rafraîchir le suivi
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
