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
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // Validation functions
  const validateName = (name: string): string | null => {
    if (!name.trim()) return 'Le nom complet est requis';
    if (name.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name)) return 'Le nom ne peut contenir que des lettres';
    return null;
  };

  const validateStreet = (street: string): string | null => {
    if (!street.trim()) return 'L\'adresse est requise';
    if (street.trim().length < 5) return 'L\'adresse doit contenir au moins 5 caractères';
    return null;
  };

  const validateCity = (city: string): string | null => {
    if (!city.trim()) return 'La ville est requise';
    if (city.trim().length < 2) return 'Le nom de la ville doit contenir au moins 2 caractères';
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(city)) return 'Le nom de la ville ne peut contenir que des lettres';
    return null;
  };

  const validateZip = (zip: string): string | null => {
    if (!zip.trim()) return 'Le code postal est requis';
    // French postal code format
    if (!/^[0-9]{5}$/.test(zip.trim())) return 'Le code postal doit contenir 5 chiffres';
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) return 'Le téléphone est requis';
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) return 'Le numéro de téléphone doit contenir au moins 10 chiffres';
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return 'L\'email est requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'L\'email n\'est pas valide';
    return null;
  };

  // Format functions
  const formatZip = (text: string) => {
    // Only allow digits, max 5
    return text.replace(/\D/g, '').slice(0, 5);
  };

  const formatPhone = (text: string) => {
    // Remove all non-digit characters
    const digitsOnly = text.replace(/\D/g, '');
    // Format as French phone number: 06 12 34 56 78
    if (digitsOnly.length <= 2) return digitsOnly;
    if (digitsOnly.length <= 4) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2)}`;
    if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4)}`;
    if (digitsOnly.length <= 8) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 6)} ${digitsOnly.slice(6)}`;
    return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 6)} ${digitsOnly.slice(6, 8)} ${digitsOnly.slice(8, 10)}`;
  };

  const formatName = (text: string) => {
    // Capitalize first letter of each word
    return text.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatCity = (text: string) => {
    // Capitalize first letter of each word
    return text.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleSubmit = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};

    const nameError = validateName(address.name);
    if (nameError) newErrors.name = nameError;

    const street1Error = validateStreet(address.street1);
    if (street1Error) newErrors.street1 = street1Error;

    const cityError = validateCity(address.city);
    if (cityError) newErrors.city = cityError;

    const zipError = validateZip(address.zip);
    if (zipError) newErrors.zip = zipError;

    const phoneError = validatePhone(address.phone);
    if (phoneError) newErrors.phone = phoneError;

    const emailError = validateEmail(address.email);
    if (emailError) newErrors.email = emailError;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire');
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
          borderColor: errors.name ? '#EF4444' : t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: errors.name ? 5 : 15,
        }}
        placeholder="Jean Dupont"
        placeholderTextColor={t.mutedText}
        value={address.name}
        onChangeText={(text) => {
          setAddress({ ...address, name: formatName(text) });
          if (errors.name) {
            const error = validateName(formatName(text));
            setErrors({ ...errors, name: error || '' });
          }
        }}
        onBlur={() => {
          const error = validateName(address.name);
          if (error) setErrors({ ...errors, name: error });
        }}
      />
      {errors.name && (
        <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>
          {errors.name}
        </Text>
      )}

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
          borderColor: errors.zip ? '#EF4444' : t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: errors.zip ? 5 : 15,
        }}
        placeholder="75001"
        placeholderTextColor={t.mutedText}
        value={address.zip}
        onChangeText={(text) => {
          const formatted = formatZip(text);
          setAddress({ ...address, zip: formatted });
          if (errors.zip) {
            const error = validateZip(formatted);
            setErrors({ ...errors, zip: error || '' });
          }
        }}
        onBlur={() => {
          const error = validateZip(address.zip);
          if (error) setErrors({ ...errors, zip: error });
        }}
        keyboardType="numeric"
        maxLength={5}
      />
      {errors.zip && (
        <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>
          {errors.zip}
        </Text>
      )}

      {/* Téléphone */}
      <Text style={{ color: t.text, marginBottom: 5, fontWeight: '600' }}>
        Téléphone *
      </Text>
      <TextInput
        style={{
          backgroundColor: t.cardBg,
          borderColor: errors.phone ? '#EF4444' : t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: errors.phone ? 5 : 15,
        }}
        placeholder="06 12 34 56 78"
        placeholderTextColor={t.mutedText}
        value={address.phone}
        onChangeText={(text) => {
          const formatted = formatPhone(text);
          setAddress({ ...address, phone: formatted });
          if (errors.phone) {
            const error = validatePhone(formatted);
            setErrors({ ...errors, phone: error || '' });
          }
        }}
        onBlur={() => {
          const error = validatePhone(address.phone);
          if (error) setErrors({ ...errors, phone: error });
        }}
        keyboardType="phone-pad"
        maxLength={14}
      />
      {errors.phone && (
        <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>
          {errors.phone}
        </Text>
      )}

      {/* Email */}
      <Text style={{ color: t.text, marginBottom: 5, fontWeight: '600' }}>
        Email *
      </Text>
      <TextInput
        style={{
          backgroundColor: t.cardBg,
          borderColor: errors.email ? '#EF4444' : t.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: t.text,
          marginBottom: errors.email ? 5 : 30,
        }}
        placeholder="jean.dupont@example.com"
        placeholderTextColor={t.mutedText}
        value={address.email}
        onChangeText={(text) => {
          setAddress({ ...address, email: text.toLowerCase().trim() });
          if (errors.email) {
            const error = validateEmail(text.toLowerCase().trim());
            setErrors({ ...errors, email: error || '' });
          }
        }}
        onBlur={() => {
          const error = validateEmail(address.email);
          if (error) setErrors({ ...errors, email: error });
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && (
        <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 20 }}>
          {errors.email}
        </Text>
      )}

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
            <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
              <Text style={{ color: t.primaryBtn, fontSize: 13, marginTop: 8, fontWeight: '600' }}>
                En savoir plus sur nos pratiques RGPD →
              </Text>
            </TouchableOpacity>
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
