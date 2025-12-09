import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import shippingService, { ShippingAddress } from '../services/shipping';
import { useUser } from '../components/UserProvider';

export default function ShippingSettingsScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(null);
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

  // Charger l'adresse sauvegardée
  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    setLoading(true);
    try {
      const defaultAddress = await shippingService.getDefaultAddress();
      if (defaultAddress) {
        setSavedAddress(defaultAddress);
        setAddress(defaultAddress);
      } else if (user?.email) {
        setAddress(prev => ({ ...prev, email: user.email }));
      }
    } catch (error) {
      console.log('[ShippingSettings] No saved address');
    } finally {
      setLoading(false);
    }
  };

  const formatZip = (text: string) => text.replace(/\D/g, '').slice(0, 5);

  const formatPhone = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly.length <= 2) return digitsOnly;
    if (digitsOnly.length <= 4) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2)}`;
    if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4)}`;
    if (digitsOnly.length <= 8) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 6)} ${digitsOnly.slice(6)}`;
    return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 6)} ${digitsOnly.slice(6, 8)} ${digitsOnly.slice(8, 10)}`;
  };

  const handleSave = async () => {
    // Validation basique
    if (!address.name || !address.street1 || !address.city || !address.zip || !address.phone || !address.email) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      await shippingService.saveAddress(address, true);
      setSavedAddress(address);
      setIsEditing(false);
      Alert.alert('Succès', 'Adresse de livraison sauvegardée');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder l\'adresse');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!savedAddress?.id) return;

    Alert.alert(
      'Supprimer l\'adresse',
      'Êtes-vous sûr de vouloir supprimer votre adresse de livraison ? Vous devrez la saisir à nouveau lors de vos prochains achats.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await shippingService.deleteSavedAddress(savedAddress.id!);
              setSavedAddress(null);
              setAddress({
                name: '',
                street1: '',
                street2: '',
                city: '',
                state: '',
                zip: '',
                country: 'FR',
                phone: '',
                email: user?.email || '',
              });
              Alert.alert('Succès', 'Adresse supprimée');
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={t.primaryBtn} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: t.border
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={t.heading} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: t.heading, flex: 1 }}>
          Adresse de livraison
        </Text>
        {savedAddress && !isEditing && (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={{ color: t.primaryBtn, fontWeight: '600' }}>Modifier</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info RGPD */}
          <View style={{
            backgroundColor: t.cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: t.border
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="shield-checkmark" size={20} color={t.primaryBtn} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.heading }}>
                Vos données sont protégées
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: t.muted, lineHeight: 18 }}>
              Votre adresse est stockée de manière sécurisée et chiffrée. Elle est utilisée uniquement pour la livraison de vos achats. Vous pouvez la modifier ou la supprimer à tout moment.
            </Text>
          </View>

          {/* Affichage de l'adresse ou formulaire */}
          {savedAddress && !isEditing ? (
            // Vue lecture seule
            <View style={{
              backgroundColor: t.cardBg,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: t.border
            }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: t.muted, marginBottom: 4 }}>Nom complet</Text>
                <Text style={{ fontSize: 16, color: t.heading, fontWeight: '500' }}>{savedAddress.name}</Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: t.muted, marginBottom: 4 }}>Adresse</Text>
                <Text style={{ fontSize: 16, color: t.heading }}>{savedAddress.street1}</Text>
                {savedAddress.street2 && (
                  <Text style={{ fontSize: 16, color: t.heading }}>{savedAddress.street2}</Text>
                )}
                <Text style={{ fontSize: 16, color: t.heading }}>
                  {savedAddress.zip} {savedAddress.city}
                </Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: t.muted, marginBottom: 4 }}>Téléphone</Text>
                <Text style={{ fontSize: 16, color: t.heading }}>{savedAddress.phone}</Text>
              </View>

              <View>
                <Text style={{ fontSize: 13, color: t.muted, marginBottom: 4 }}>Email</Text>
                <Text style={{ fontSize: 16, color: t.heading }}>{savedAddress.email}</Text>
              </View>

              {/* Bouton supprimer */}
              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  marginTop: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#ff4757',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#ff4757', fontWeight: '600' }}>
                  Supprimer cette adresse
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Formulaire d'édition
            <View style={{
              backgroundColor: t.cardBg,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: t.border
            }}>
              {/* Nom */}
              <Text style={{ color: t.heading, marginBottom: 6, fontWeight: '600' }}>Nom complet *</Text>
              <TextInput
                style={{
                  backgroundColor: t.rootBg,
                  borderRadius: 8,
                  padding: 12,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: t.border,
                  marginBottom: 16
                }}
                placeholder="Jean Dupont"
                placeholderTextColor={t.muted}
                value={address.name}
                onChangeText={(text) => setAddress({ ...address, name: text })}
              />

              {/* Adresse */}
              <Text style={{ color: t.heading, marginBottom: 6, fontWeight: '600' }}>Adresse *</Text>
              <TextInput
                style={{
                  backgroundColor: t.rootBg,
                  borderRadius: 8,
                  padding: 12,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: t.border,
                  marginBottom: 12
                }}
                placeholder="123 Rue de la Paix"
                placeholderTextColor={t.muted}
                value={address.street1}
                onChangeText={(text) => setAddress({ ...address, street1: text })}
              />

              {/* Complément */}
              <Text style={{ color: t.heading, marginBottom: 6, fontWeight: '600' }}>Complément</Text>
              <TextInput
                style={{
                  backgroundColor: t.rootBg,
                  borderRadius: 8,
                  padding: 12,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: t.border,
                  marginBottom: 16
                }}
                placeholder="Apt 4B, Bâtiment C"
                placeholderTextColor={t.muted}
                value={address.street2}
                onChangeText={(text) => setAddress({ ...address, street2: text })}
              />

              {/* Ville et Code Postal */}
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: t.heading, marginBottom: 6, fontWeight: '600' }}>Code postal *</Text>
                  <TextInput
                    style={{
                      backgroundColor: t.rootBg,
                      borderRadius: 8,
                      padding: 12,
                      color: t.heading,
                      borderWidth: 1,
                      borderColor: t.border
                    }}
                    placeholder="75001"
                    placeholderTextColor={t.muted}
                    value={address.zip}
                    onChangeText={(text) => setAddress({ ...address, zip: formatZip(text) })}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={{ color: t.heading, marginBottom: 6, fontWeight: '600' }}>Ville *</Text>
                  <TextInput
                    style={{
                      backgroundColor: t.rootBg,
                      borderRadius: 8,
                      padding: 12,
                      color: t.heading,
                      borderWidth: 1,
                      borderColor: t.border
                    }}
                    placeholder="Paris"
                    placeholderTextColor={t.muted}
                    value={address.city}
                    onChangeText={(text) => setAddress({ ...address, city: text })}
                  />
                </View>
              </View>

              {/* Téléphone */}
              <Text style={{ color: t.heading, marginBottom: 6, fontWeight: '600' }}>Téléphone *</Text>
              <TextInput
                style={{
                  backgroundColor: t.rootBg,
                  borderRadius: 8,
                  padding: 12,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: t.border,
                  marginBottom: 16
                }}
                placeholder="06 12 34 56 78"
                placeholderTextColor={t.muted}
                value={address.phone}
                onChangeText={(text) => setAddress({ ...address, phone: formatPhone(text) })}
                keyboardType="phone-pad"
                maxLength={14}
              />

              {/* Email */}
              <Text style={{ color: t.heading, marginBottom: 6, fontWeight: '600' }}>Email *</Text>
              <TextInput
                style={{
                  backgroundColor: t.rootBg,
                  borderRadius: 8,
                  padding: 12,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: t.border,
                  marginBottom: 24
                }}
                placeholder="jean.dupont@example.com"
                placeholderTextColor={t.muted}
                value={address.email}
                onChangeText={(text) => setAddress({ ...address, email: text.toLowerCase().trim() })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Boutons */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: t.primaryBtn,
                  padding: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
                    {savedAddress ? 'Mettre à jour' : 'Sauvegarder l\'adresse'}
                  </Text>
                )}
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  onPress={() => {
                    setAddress(savedAddress!);
                    setIsEditing(false);
                  }}
                  style={{ marginTop: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: t.muted }}>Annuler</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
