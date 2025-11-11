import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from './ThemeProvider';
import { THEMES } from '../themes';
import api from '../services/api';

interface ShippingRate {
  id: string;
  carrier: string;
  carrierName: string;
  serviceLevelName: string;
  amount: number;
  currency: string;
  estimatedDays: number;
  durationTerms: string;
  zone: string;
}

interface Address {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

interface ShippingCalculatorProps {
  productId?: string;
  sellerAddress?: Address;
  parcel?: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  onRateSelected?: (rate: ShippingRate) => void;
}

export default function ShippingCalculator({
  productId,
  sellerAddress,
  parcel,
  onRateSelected,
}: ShippingCalculatorProps) {
  const { theme } = useTheme();
  const t = THEMES[theme];

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  // Buyer address form
  const [name, setName] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('FR');
  const [phone, setPhone] = useState('');

  const calculateRates = async () => {
    if (!name || !street1 || !city || !zip || !country) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setRates([]);

    try {
      const buyerAddress: Address = {
        name,
        street1,
        street2,
        city,
        zip,
        country,
        phone,
      };

      const response = await api.post('/shipments/calculate-rates', {
        productId,
        fromAddress: sellerAddress,
        toAddress: buyerAddress,
        parcel,
      });

      setRates(response.data.rates || []);
      if (response.data.selectedRate) {
        setSelectedRate(response.data.selectedRate);
      }
    } catch (error: any) {
      console.error('[ShippingCalculator] Error:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.error || 'Impossible de calculer les frais de port'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectRate = (rate: ShippingRate) => {
    setSelectedRate(rate);
    if (onRateSelected) {
      onRateSelected(rate);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  return (
    <>
      <TouchableOpacity
        style={{
          backgroundColor: t.primaryBtn,
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: 12,
          alignItems: 'center',
          marginVertical: 12,
        }}
        onPress={() => setVisible(true)}
      >
        <Text style={{ color: t.white, fontSize: 16, fontWeight: '600' }}>
          📦 Calculer les frais de port
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: t.rootBg }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
              backgroundColor: t.navBg,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading }}>
              Calculer les frais de port
            </Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={{ fontSize: 24, color: t.primaryBtn }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
          >
            {/* Address Form */}
            {rates.length === 0 && (
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: t.heading,
                    marginBottom: 16,
                  }}
                >
                  Adresse de livraison
                </Text>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: t.muted, marginBottom: 6 }}>
                    Nom complet *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: t.cardBg,
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: t.border,
                      color: t.heading,
                    }}
                    value={name}
                    onChangeText={setName}
                    placeholder="Jean Dupont"
                    placeholderTextColor={t.muted}
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: t.muted, marginBottom: 6 }}>
                    Adresse *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: t.cardBg,
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: t.border,
                      color: t.heading,
                    }}
                    value={street1}
                    onChangeText={setStreet1}
                    placeholder="123 Rue de la Paix"
                    placeholderTextColor={t.muted}
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: t.muted, marginBottom: 6 }}>
                    Complément d'adresse
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: t.cardBg,
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: t.border,
                      color: t.heading,
                    }}
                    value={street2}
                    onChangeText={setStreet2}
                    placeholder="Apt. 4B"
                    placeholderTextColor={t.muted}
                  />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: 12,
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 2 }}>
                    <Text style={{ color: t.muted, marginBottom: 6 }}>
                      Ville *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: t.cardBg,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: t.border,
                        color: t.heading,
                      }}
                      value={city}
                      onChangeText={setCity}
                      placeholder="Paris"
                      placeholderTextColor={t.muted}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.muted, marginBottom: 6 }}>
                      Code postal *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: t.cardBg,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: t.border,
                        color: t.heading,
                      }}
                      value={zip}
                      onChangeText={setZip}
                      placeholder="75001"
                      placeholderTextColor={t.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: t.muted, marginBottom: 6 }}>
                    Pays *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: t.cardBg,
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: t.border,
                      color: t.heading,
                    }}
                    value={country}
                    onChangeText={setCountry}
                    placeholder="FR"
                    placeholderTextColor={t.muted}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: t.muted, marginBottom: 6 }}>
                    Téléphone
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: t.cardBg,
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: t.border,
                      color: t.heading,
                    }}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+33 6 12 34 56 78"
                    placeholderTextColor={t.muted}
                    keyboardType="phone-pad"
                  />
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: t.primaryBtn,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    marginTop: 20,
                  }}
                  onPress={calculateRates}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={t.white} />
                  ) : (
                    <Text
                      style={{ color: t.white, fontSize: 16, fontWeight: '600' }}
                    >
                      Calculer les tarifs
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Rates List */}
            {rates.length > 0 && (
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: t.heading,
                    marginBottom: 16,
                  }}
                >
                  Options d'expédition disponibles
                </Text>

                {rates.map((rate) => (
                  <TouchableOpacity
                    key={rate.id}
                    style={{
                      backgroundColor: t.cardBg,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 2,
                      borderColor:
                        selectedRate?.id === rate.id ? t.primaryBtn : t.border,
                    }}
                    onPress={() => selectRate(rate)}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: t.heading,
                            marginBottom: 4,
                          }}
                        >
                          {rate.serviceLevelName}
                        </Text>
                        <Text style={{ fontSize: 14, color: t.muted }}>
                          {rate.carrierName}
                        </Text>
                        {rate.durationTerms && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: t.muted,
                              marginTop: 4,
                            }}
                          >
                            ⏱️ {rate.durationTerms}
                          </Text>
                        )}
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: '700',
                            color: t.primaryBtn,
                          }}
                        >
                          {formatPrice(rate.amount, rate.currency)}
                        </Text>
                        {rate.zone && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: t.muted,
                              marginTop: 4,
                            }}
                          >
                            Zone {rate.zone}
                          </Text>
                        )}
                      </View>
                    </View>

                    {selectedRate?.id === rate.id && (
                      <View
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: t.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: t.primaryBtn,
                            fontWeight: '600',
                          }}
                        >
                          ✓ Sélectionné
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={{
                    backgroundColor: t.cardBg,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                  onPress={() => {
                    setRates([]);
                    setSelectedRate(null);
                  }}
                >
                  <Text style={{ color: t.heading, fontSize: 14 }}>
                    ← Modifier l'adresse
                  </Text>
                </TouchableOpacity>

                {selectedRate && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: t.primaryBtn,
                      paddingVertical: 16,
                      borderRadius: 12,
                      alignItems: 'center',
                      marginTop: 12,
                    }}
                    onPress={() => {
                      setVisible(false);
                    }}
                  >
                    <Text
                      style={{ color: t.white, fontSize: 16, fontWeight: '600' }}
                    >
                      Confirmer l'expédition
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

