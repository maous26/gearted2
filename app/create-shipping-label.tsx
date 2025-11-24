import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

interface ShippingRate {
  rateId: string;
  provider: string;
  servicelevel: {
    name: string;
    token: string;
  };
  amount: string;
  currency: string;
  estimatedDays: number;
}

export default function CreateShippingLabelScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const params = useLocalSearchParams();

  const transactionId = params.transactionId as string;
  const productTitle = params.productTitle as string;
  const buyerName = params.buyerName as string;

  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [creatingLabel, setCreatingLabel] = useState(false);

  // Dimensions du colis
  const [length, setLength] = useState('30');
  const [width, setWidth] = useState('20');
  const [height, setHeight] = useState('10');
  const [weight, setWeight] = useState('1');

  const getRates = async () => {
    try {
      setLoading(true);
      const response = await api.post<{
        success: boolean;
        rates: ShippingRate[];
      }>(`/api/shipping/rates/${transactionId}`, {
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        weight: parseFloat(weight),
      });

      setRates(response.rates || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to get shipping rates:', error);
      Alert.alert('Erreur', error.message || 'Impossible de récupérer les tarifs');
      setLoading(false);
    }
  };

  const purchaseLabel = async () => {
    if (!selectedRate) {
      Alert.alert('Erreur', 'Veuillez sélectionner un tarif');
      return;
    }

    try {
      setCreatingLabel(true);
      const response = await api.post<{
        success: boolean;
        label: any;
        transaction: any;
      }>(`/api/shipping/label/${transactionId}`, {
        rateId: selectedRate,
      });

      Alert.alert(
        'Succès',
        'Étiquette créée avec succès!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to purchase label:', error);
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
          <Ionicons name="arrow-back" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: t.heading }}>
          Créer étiquette d'expédition
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
          <Text style={{ fontSize: 14, color: t.mutedText }}>
            Acheteur: {buyerName}
          </Text>
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
              <Text style={{ fontSize: 14, color: t.mutedText, marginBottom: 4 }}>
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
                  color: t.text,
                }}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontSize: 14, color: t.mutedText, marginBottom: 4 }}>
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
                  color: t.text,
                }}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 14, color: t.mutedText, marginBottom: 4 }}>
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
                  color: t.text,
                }}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontSize: 14, color: t.mutedText, marginBottom: 4 }}>
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
                  color: t.text,
                }}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={getRates}
            disabled={loading}
            style={{
              backgroundColor: t.primaryBtn,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 15 }}>
                Obtenir les tarifs
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Tarifs disponibles */}
        {rates.length > 0 && (
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
              Tarifs disponibles
            </Text>

            {rates.map((rate) => (
              <TouchableOpacity
                key={rate.rateId}
                onPress={() => setSelectedRate(rate.rateId)}
                style={{
                  backgroundColor: selectedRate === rate.rateId ? t.accentBg : t.rootBg,
                  borderWidth: 2,
                  borderColor: selectedRate === rate.rateId ? t.primaryBtn : t.border,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
                      {rate.provider}
                    </Text>
                    <Text style={{ fontSize: 14, color: t.mutedText, marginTop: 4 }}>
                      {rate.servicelevel.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: t.mutedText, marginTop: 4 }}>
                      Livraison estimée: {rate.estimatedDays} jours
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: t.primaryBtn }}>
                    {rate.amount} {rate.currency}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={purchaseLabel}
              disabled={!selectedRate || creatingLabel}
              style={{
                backgroundColor: selectedRate ? t.primaryBtn : t.muted,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              {creatingLabel ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
                  Acheter l'étiquette
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
