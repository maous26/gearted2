import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

export default function ShippingLabelScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const params = useLocalSearchParams();

  const trackingNumber = params.trackingNumber as string;
  const productTitle = params.productTitle as string;
  const carrier = params.carrier as string || 'Mondial Relay';

  const downloadLabel = () => {
    // TODO: Intégrer avec le vrai service de livraison pour obtenir le PDF
    const labelUrl = `https://example.com/labels/${trackingNumber}.pdf`;

    Alert.alert(
      'Téléchargement',
      'Dans la version finale, le PDF sera téléchargé automatiquement.\n\nURL: ' + labelUrl,
      [
        { text: 'OK' },
        {
          text: 'Ouvrir',
          onPress: () => Linking.openURL(labelUrl).catch(() =>
            Alert.alert('Erreur', 'Impossible d\'ouvrir le lien')
          ),
        },
      ]
    );
  };

  const trackPackage = () => {
    // URL de suivi Mondial Relay
    const trackingUrl = `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${trackingNumber}`;

    Linking.openURL(trackingUrl).catch(() =>
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de suivi')
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
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: t.heading }}>
          Étiquette d'expédition
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Info produit */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="business-outline" size={16} color={t.mutedText} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, color: t.mutedText }}>
              Transporteur: {carrier}
            </Text>
          </View>
        </View>

        {/* QR Code et tracking number */}
        <View
          style={{
            backgroundColor: t.cardBg,
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: t.border,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 16 }}>
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
              size={180}
              backgroundColor="white"
              color="black"
            />
          </View>

          {/* Tracking number */}
          <View
            style={{
              backgroundColor: t.accentBg,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: t.primaryBtn,
              borderStyle: 'dashed',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: t.primaryBtn,
                textAlign: 'center',
                fontFamily: 'monospace',
              }}
            >
              {trackingNumber}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View
          style={{
            backgroundColor: t.accentBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          <Ionicons name="information-circle" size={24} color={t.primaryBtn} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: t.text, lineHeight: 20 }}>
              Présentez ce QR code ou le numéro de suivi au point relais ou imprimez l'étiquette pour la coller sur votre colis.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={{ gap: 12 }}>
          {/* Télécharger le PDF */}
          <TouchableOpacity
            onPress={downloadLabel}
            style={{
              backgroundColor: t.primaryBtn,
              paddingVertical: 14,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="download-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
              Télécharger le PDF
            </Text>
          </TouchableOpacity>

          {/* Suivre le colis */}
          <TouchableOpacity
            onPress={trackPackage}
            style={{
              backgroundColor: t.cardBg,
              borderWidth: 2,
              borderColor: t.primaryBtn,
              paddingVertical: 14,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="location-outline" size={20} color={t.primaryBtn} style={{ marginRight: 8 }} />
            <Text style={{ color: t.primaryBtn, fontWeight: '600', fontSize: 16 }}>
              Suivre le colis
            </Text>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 12, color: t.mutedText, textAlign: 'center', lineHeight: 18 }}>
            Le vendeur a été notifié. Vous recevrez une notification dès que le colis sera expédié.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
