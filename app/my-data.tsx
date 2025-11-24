import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import shippingService from '../services/shipping';

interface SavedAddress {
  transactionId: string;
  address: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    zip: string;
    country: string;
    phone?: string;
    email?: string;
  };
  productTitle: string;
  productImage?: string;
  createdAt: string;
  trackingNumber?: string;
}

export default function MyDataScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const response = await shippingService.getMyShippingAddresses();
      setAddresses(response.addresses || []);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (transactionId: string, productTitle: string) => {
    Alert.alert(
      'Supprimer l\'adresse',
      `Voulez-vous supprimer l'adresse de livraison pour "${productTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await shippingService.deleteShippingAddress(transactionId);
              Alert.alert('Succès', 'Adresse supprimée avec succès');
              loadAddresses();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export des données',
      'Vous allez recevoir par email toutes vos données personnelles au format JSON (conformément au RGPD).',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exporter',
          onPress: () => {
            // TODO: Implémenter l'export des données
            Alert.alert('En développement', 'Cette fonctionnalité sera bientôt disponible');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // TODO: Implémenter la suppression du compte
            Alert.alert('En développement', 'Cette fonctionnalité sera bientôt disponible');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: t.navBg,
          borderBottomWidth: 1,
          borderBottomColor: t.border + '20',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: t.cardBg,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 20, color: t.heading }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: t.heading }}>
          Mes données personnelles
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Information RGPD */}
        <View
          style={{
            backgroundColor: t.primaryBtn + '15',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: t.primaryBtn,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 8 }}>
            🔒 Conformité RGPD
          </Text>
          <Text style={{ fontSize: 14, color: t.text, lineHeight: 20 }}>
            Vos données sont protégées. Vous avez le droit d'accéder, modifier ou supprimer vos
            données à tout moment.
          </Text>
        </View>

        {/* Mes adresses de livraison */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading, marginBottom: 15 }}>
            📦 Adresses de livraison enregistrées
          </Text>

          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator color={t.primaryBtn} />
            </View>
          ) : addresses.length === 0 ? (
            <View
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 48, marginBottom: 10 }}>📭</Text>
              <Text style={{ fontSize: 14, color: t.muted, textAlign: 'center' }}>
                Aucune adresse enregistrée
              </Text>
            </View>
          ) : (
            addresses.map((item) => (
              <View
                key={item.transactionId}
                style={{
                  backgroundColor: t.cardBg,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: t.heading, flex: 1 }}>
                    {item.productTitle}
                  </Text>
                  {item.trackingNumber && (
                    <View
                      style={{
                        backgroundColor: '#4CAF50' + '20',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#4CAF50', fontWeight: '600' }}>
                        Livré
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: t.text, marginBottom: 2 }}>
                    {item.address.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: t.muted }}>
                    {item.address.street1}
                  </Text>
                  {item.address.street2 && (
                    <Text style={{ fontSize: 13, color: t.muted }}>
                      {item.address.street2}
                    </Text>
                  )}
                  <Text style={{ fontSize: 13, color: t.muted }}>
                    {item.address.zip} {item.address.city}
                  </Text>
                  {item.address.phone && (
                    <Text style={{ fontSize: 13, color: t.muted }}>
                      📞 {item.address.phone}
                    </Text>
                  )}
                </View>

                <Text style={{ fontSize: 11, color: t.muted, marginBottom: 12 }}>
                  Enregistré le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                </Text>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#EF4444' + '15',
                    padding: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => handleDeleteAddress(item.transactionId, item.productTitle)}
                >
                  <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>
                    🗑️ Supprimer cette adresse
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Actions RGPD */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading, marginBottom: 15 }}>
            ⚙️ Gestion des données
          </Text>

          {/* Export des données */}
          <TouchableOpacity
            style={{
              backgroundColor: t.cardBg,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: t.border,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={handleExportData}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: t.primaryBtn + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 20 }}>📥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.heading, marginBottom: 2 }}>
                Exporter mes données
              </Text>
              <Text style={{ fontSize: 12, color: t.muted }}>
                Télécharger toutes vos données au format JSON
              </Text>
            </View>
          </TouchableOpacity>

          {/* Suppression du compte */}
          <TouchableOpacity
            style={{
              backgroundColor: '#EF4444' + '10',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#EF4444' + '30',
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={handleDeleteAccount}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#EF4444' + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 20 }}>⚠️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444', marginBottom: 2 }}>
                Supprimer mon compte
              </Text>
              <Text style={{ fontSize: 12, color: t.muted }}>
                Action irréversible - toutes vos données seront supprimées
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info légale */}
        <View
          style={{
            marginTop: 30,
            padding: 16,
            backgroundColor: t.cardBg,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: t.muted, lineHeight: 18, textAlign: 'center' }}>
            Conformément au RGPD, vos données personnelles ne sont utilisées que pour la livraison
            de vos commandes. Les adresses sont automatiquement supprimées 30 jours après la
            livraison confirmée.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
