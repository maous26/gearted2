import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../components/ThemeProvider';
import api from '../services/api';
import { useMessagesStore } from '../stores/messagesStore';
import { THEMES } from '../themes';

export default function SellerSetDimensionsScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addHugoMessage, hasHugoMessage } = useMessagesStore();

  const transactionId = params.transactionId as string;
  const productTitle = params.productTitle as string;
  const buyerName = params.buyerName as string;

  const [loading, setLoading] = useState(false);

  // Dimensions du colis
  const [length, setLength] = useState('30');
  const [width, setWidth] = useState('20');
  const [height, setHeight] = useState('10');
  const [weight, setWeight] = useState('1');

  const saveDimensions = async () => {
    try {
      setLoading(true);

      const response = await api.post(`/api/shipping/dimensions/${transactionId}`, {
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        weight: parseFloat(weight),
      });

      // Notification pour l'acheteur: Dimensions saisies
      // Note: La notification sera créée dans orders.tsx lors du chargement des achats
      // Cela permet d'avoir accès aux infos de l'acheteur

      Alert.alert(
        'Dimensions enregistrées ✓',
        'L\'acheteur peut maintenant choisir son mode de livraison.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Retour à l'écran orders - useFocusEffect déclenchera le rechargement
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to save dimensions:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'enregistrer les dimensions');
    } finally {
      setLoading(false);
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
          Préparer l'expédition
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
            Acheteur: {buyerName}
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
              Entrez les dimensions de votre colis pour les articles volumineux. Ces dimensions seront utilisées pour calculer les frais d'expédition.
            </Text>
          </View>
        </View>

        {/* Dimensions du colis */}
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
            Dimensions du colis
          </Text>

          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }}>
                Longueur (cm)
              </Text>
              <TextInput
                value={length}
                onChangeText={setLength}
                keyboardType="numeric"
                style={{
                  backgroundColor: t.rootBg,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: t.heading,
                }}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }}>
                Largeur (cm)
              </Text>
              <TextInput
                value={width}
                onChangeText={setWidth}
                keyboardType="numeric"
                style={{
                  backgroundColor: t.rootBg,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: t.heading,
                }}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }}>
                Hauteur (cm)
              </Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                style={{
                  backgroundColor: t.rootBg,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: t.heading,
                }}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }}>
                Poids (kg)
              </Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                style={{
                  backgroundColor: t.rootBg,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: t.heading,
                }}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={saveDimensions}
            disabled={loading}
            style={{
              backgroundColor: t.primaryBtn,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 15 }}>
                Enregistrer les dimensions
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Text style={{ fontSize: 12, color: t.muted, textAlign: 'center', lineHeight: 18 }}>
            Une fois les dimensions enregistrées, vous pourrez générer l'étiquette d'expédition après la vente.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
