import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import shippingService, { ShippingRate } from '../services/shipping';

export default function SellerShippingScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const { transactionId } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
    weight: '',
  });

  const handleGetRates = async () => {
    // Validation
    if (!dimensions.length || !dimensions.width || !dimensions.height || !dimensions.weight) {
      Alert.alert('Erreur', 'Veuillez remplir toutes les dimensions du colis');
      return;
    }

    setLoadingRates(true);
    try {
      const result = await shippingService.getShippingRates(transactionId as string, {
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height),
        weight: parseFloat(dimensions.weight),
      });

      setRates(result.rates);

      if (result.rates.length === 0) {
        Alert.alert('Aucun tarif', 'Aucun tarif de livraison disponible pour ces dimensions');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoadingRates(false);
    }
  };

  const handlePurchaseLabel = async () => {
    if (!selectedRate) {
      Alert.alert('Erreur', 'Veuillez sélectionner un tarif de livraison');
      return;
    }

    setLoading(true);
    try {
      const label = await shippingService.purchaseLabel(transactionId as string, selectedRate);

      Alert.alert(
        'Étiquette créée ! 🎉',
        `Numéro de suivi : ${label.trackingNumber}\n\nVoulez-vous télécharger l'étiquette PDF ?`,
        [
          {
            text: 'Télécharger',
            onPress: () => Linking.openURL(label.labelUrl),
          },
          {
            text: 'Plus tard',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.rootBg }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: t.text, marginBottom: 10 }}>
        📦 Créer une étiquette d'expédition
      </Text>
      <Text style={{ fontSize: 14, color: t.mutedText, marginBottom: 30 }}>
        Entrez les dimensions du colis pour obtenir les tarifs de livraison
      </Text>

      {/* Dimensions du colis */}
      <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: t.text, marginBottom: 15 }}>
          Dimensions du colis
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.mutedText, marginBottom: 5, fontSize: 12 }}>Longueur (cm)</Text>
            <TextInput
              style={{
                backgroundColor: t.rootBg,
                borderColor: t.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                color: t.text,
              }}
              placeholder="30"
              placeholderTextColor={t.mutedText}
              value={dimensions.length}
              onChangeText={(text) => setDimensions({ ...dimensions, length: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: t.mutedText, marginBottom: 5, fontSize: 12 }}>Largeur (cm)</Text>
            <TextInput
              style={{
                backgroundColor: t.rootBg,
                borderColor: t.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                color: t.text,
              }}
              placeholder="20"
              placeholderTextColor={t.mutedText}
              value={dimensions.width}
              onChangeText={(text) => setDimensions({ ...dimensions, width: text })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.mutedText, marginBottom: 5, fontSize: 12 }}>Hauteur (cm)</Text>
            <TextInput
              style={{
                backgroundColor: t.rootBg,
                borderColor: t.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                color: t.text,
              }}
              placeholder="15"
              placeholderTextColor={t.mutedText}
              value={dimensions.height}
              onChangeText={(text) => setDimensions({ ...dimensions, height: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: t.mutedText, marginBottom: 5, fontSize: 12 }}>Poids (kg)</Text>
            <TextInput
              style={{
                backgroundColor: t.rootBg,
                borderColor: t.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                color: t.text,
              }}
              placeholder="2.5"
              placeholderTextColor={t.mutedText}
              value={dimensions.weight}
              onChangeText={(text) => setDimensions({ ...dimensions, weight: text })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: loadingRates ? t.muted : t.primaryBtn,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 15,
          }}
          onPress={handleGetRates}
          disabled={loadingRates}
        >
          {loadingRates ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>
              Obtenir les tarifs
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Liste des tarifs */}
      {rates.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: t.text, marginBottom: 15 }}>
            Tarifs disponibles
          </Text>

          {rates.map((rate) => (
            <TouchableOpacity
              key={rate.rateId}
              style={{
                backgroundColor: selectedRate === rate.rateId ? t.primaryBtn + '20' : t.cardBg,
                borderWidth: 2,
                borderColor: selectedRate === rate.rateId ? t.primaryBtn : t.border,
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
              }}
              onPress={() => setSelectedRate(rate.rateId)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: t.text }}>
                    {rate.provider}
                  </Text>
                  <Text style={{ fontSize: 13, color: t.mutedText, marginTop: 2 }}>
                    {rate.serviceName}
                  </Text>
                  <Text style={{ fontSize: 12, color: t.mutedText, marginTop: 4 }}>
                    ⏱️ {rate.estimatedDays} jour{rate.estimatedDays > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: t.text }}>
                    {rate.price.toFixed(2)} €
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={{
              backgroundColor: loading ? t.muted : t.accentBtn,
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 10,
            }}
            onPress={handlePurchaseLabel}
            disabled={loading || !selectedRate}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
                Acheter l'étiquette
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
