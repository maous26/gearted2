import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';

export default function TrackPackageScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const params = useLocalSearchParams();

  const trackingNumber = params.trackingNumber as string;
  const productTitle = params.productTitle as string;
  const carrier = params.carrier as string;
  const sellerName = params.sellerName as string;

  // Determine tracking URL based on carrier
  const getTrackingUrl = () => {
    const carrierLower = carrier?.toLowerCase() || '';
    if (carrierLower.includes('mondial') || carrierLower.includes('relay')) {
      return `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${trackingNumber}`;
    } else if (carrierLower.includes('colissimo')) {
      return `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`;
    } else if (carrierLower.includes('chronopost')) {
      return `https://www.chronopost.fr/tracking-no-cms/suivi-page?liession=${trackingNumber}`;
    }
    // Default - generic tracking
    return `https://www.google.com/search?q=suivi+colis+${trackingNumber}`;
  };

  const openTrackingUrl = () => {
    const url = getTrackingUrl();
    Linking.openURL(url).catch(() => {
      console.error('Failed to open tracking URL');
    });
  };

  const getCarrierName = () => {
    const carrierLower = carrier?.toLowerCase() || '';
    if (carrierLower.includes('mondial') || carrierLower.includes('relay')) {
      return 'Mondial Relay';
    } else if (carrierLower.includes('colissimo')) {
      return 'Colissimo';
    } else if (carrierLower.includes('chronopost')) {
      return 'Chronopost';
    }
    return carrier || 'Transporteur';
  };

  const getCarrierIcon = () => {
    const carrierLower = carrier?.toLowerCase() || '';
    if (carrierLower.includes('mondial') || carrierLower.includes('relay')) {
      return 'storefront-outline';
    } else if (carrierLower.includes('colissimo')) {
      return 'mail-outline';
    }
    return 'cube-outline';
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
          Suivi du colis
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Product info */}
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
          <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 4 }}>
            {productTitle}
          </Text>
          <Text style={{ fontSize: 13, color: t.muted }}>
            Vendu par {sellerName}
          </Text>
        </View>

        {/* Carrier info */}
        <View
          style={{
            backgroundColor: t.cardBg,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: t.border,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#4CAF50' + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <Ionicons name={getCarrierIcon() as any} size={24} color="#4CAF50" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: t.muted }}>Transporteur</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
              {getCarrierName()}
            </Text>
          </View>
        </View>

        {/* QR Code and tracking number */}
        <View
          style={{
            backgroundColor: t.cardBg,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: t.border,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, color: t.muted, marginBottom: 16 }}>
            Numéro de suivi
          </Text>

          {/* QR Code */}
          <View
            style={{
              backgroundColor: '#FFF',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <QRCode
              value={trackingNumber}
              size={150}
              backgroundColor="#FFF"
              color="#000"
            />
          </View>

          {/* Tracking number */}
          <View
            style={{
              backgroundColor: t.sectionLight,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: t.heading,
                letterSpacing: 1,
                textAlign: 'center',
              }}
              selectable
            >
              {trackingNumber}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: t.muted }}>
            Appuyez longuement pour copier
          </Text>
        </View>

        {/* Track online button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#4CAF50',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 12,
          }}
          onPress={openTrackingUrl}
        >
          <Ionicons name="globe-outline" size={22} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
            Suivre sur {getCarrierName()}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View
          style={{
            backgroundColor: t.sectionLight,
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          <Ionicons name="information-circle" size={24} color={t.primaryBtn} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: t.heading, lineHeight: 20 }}>
              Présentez ce QR code ou le numéro de suivi au point relais pour récupérer votre colis.
              {'\n\n'}
              Le suivi en ligne peut prendre quelques heures pour être mis à jour après l'expédition.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
