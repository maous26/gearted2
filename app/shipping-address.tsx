import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import shippingService, { ShippingAddress } from '../services/shipping';

export default function ShippingAddressScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const { transactionId } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'FR',
    phone: '',
    email: '',
  });

  const handleSubmit = async () => {
    // Validation
    if (!address.name || !address.street1 || !address.city || !address.zip) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!gdprConsent) {
      Alert.alert('Consentement requis', 'Vous devez accepter la collecte de vos données pour la livraison');
      return;
    }

    setLoading(true);
    try {
      await shippingService.addShippingAddress(transactionId as string, address);

      Alert.alert(
        'Adresse enregistrée !',
        'Le vendeur va préparer votre colis et vous recevrez le numéro de suivi par email.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)'),
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
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: t.text, marginBottom: 10 }}>
        📦 Adresse de livraison
      </Text>
      <Text style={{ fontSize: 14, color: t.mutedText, marginBottom: 30 }}>
        Veuillez entrer votre adresse pour recevoir votre achat
      </Text>

      {/* Nom complet */}
      <Text style={{ color: t.text, marginBottom: 5, fontWeight: '600' }}>
        Nom complet *
      </Text>
      <TextInput
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: 15,
        }}
        placeholder="Jean Dupont"
        placeholderTextColor={t.mutedText}
        value={address.name}
        onChangeText={(text) => setAddress({ ...address, name: text })}
      />

      {/* Adresse ligne 1 */}
      <Text style={{ color: t.text, marginBottom: 5, fontWeight: '600' }}>
        Adresse *
      </Text>
      <TextInput
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: 15,
        }}
        placeholder="123 Rue de la Paix"
        placeholderTextColor={t.mutedText}
        value={address.street1}
        onChangeText={(text) => setAddress({ ...address, street1: text })}
      />

      {/* Adresse ligne 2 */}
      <Text style={{ color: t.text, marginBottom: 5, fontWeight: '600' }}>
        Complément d'adresse
      </Text>
      <TextInput
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: 15,
        }}
        placeholder="Apt 4B, Bâtiment C"
        placeholderTextColor={t.mutedText}
        value={address.street2}
        onChangeText={(text) => setAddress({ ...address, street2: text })}
      />

      {/* Ville */}
      <Text style={{ color: t.text, marginBottom: 5, fontWeight: '600' }}>
        Ville *
      </Text>
      <TextInput
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: 15,
        }}
        placeholder="Paris"
        placeholderTextColor={t.mutedText}
        value={address.city}
        onChangeText={(text) => setAddress({ ...address, city: text })}
      />

      {/* Code postal */}
      <Text style={{ color: t.text, marginBottom: 5, fontWeight: '600' }}>
        Code postal *
      </Text>
      <TextInput
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: 15,
        }}
        placeholder="75001"
        placeholderTextColor={t.mutedText}
        value={address.zip}
        onChangeText={(text) => setAddress({ ...address, zip: text })}
        keyboardType="numeric"
      />

      {/* Téléphone */}
      <Text style={{ color: t.text, marginBottom: 5, fontWeight: '600' }}>
        Téléphone
      </Text>
      <TextInput
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: 15,
        }}
        placeholder="+33 6 12 34 56 78"
        placeholderTextColor={t.mutedText}
        value={address.phone}
        onChangeText={(text) => setAddress({ ...address, phone: text })}
        keyboardType="phone-pad"
      />

      {/* Email */}
      <Text style={{ color: t.text, marginBottom: 5, fontWeight: '600' }}>
        Email
      </Text>
      <TextInput
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: 30,
        }}
        placeholder="jean.dupont@example.com"
        placeholderTextColor={t.mutedText}
        value={address.email}
        onChangeText={(text) => setAddress({ ...address, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* RGPD - Consentement */}
      <View style={{
        backgroundColor: t.cardBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: t.border
      }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'flex-start' }}
          onPress={() => setGdprConsent(!gdprConsent)}
        >
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: gdprConsent ? t.primaryBtn : t.border,
            backgroundColor: gdprConsent ? t.primaryBtn : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            marginTop: 2
          }}>
            {gdprConsent && (
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>✓</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>
              J'accepte que mes données personnelles (nom, adresse, téléphone) soient collectées et utilisées uniquement pour la livraison de ma commande. Ces données seront supprimées 30 jours après la livraison.
            </Text>
            <Text style={{ color: t.primaryBtn, fontSize: 13, marginTop: 8, fontWeight: '600' }}>
              En savoir plus sur nos pratiques RGPD →
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bouton de soumission */}
      <TouchableOpacity
        style={{
          backgroundColor: loading || !gdprConsent ? t.muted : t.primaryBtn,
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 40,
          opacity: loading || !gdprConsent ? 0.6 : 1,
        }}
        onPress={handleSubmit}
        disabled={loading || !gdprConsent}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
            Confirmer l'adresse
          </Text>
        )}
      </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
