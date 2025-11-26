import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();

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
          Politique de confidentialité
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View
          style={{
            backgroundColor: t.primaryBtn + '15',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderLeftWidth: 4,
            borderLeftColor: t.primaryBtn,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 8 }}>
            🔒 Votre vie privée est notre priorité
          </Text>
          <Text style={{ fontSize: 14, color: t.text, lineHeight: 20 }}>
            Gearted respecte le Règlement Général sur la Protection des Données (RGPD) et protège
            vos informations personnelles.
          </Text>
        </View>

        {/* Section 1 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
            1. Données collectées
          </Text>
          <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 12 }}>
              Nous collectons uniquement les données nécessaires au bon fonctionnement de la
              plateforme :
            </Text>

            <View style={{ marginLeft: 16 }}>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 8 }}>
                • <Text style={{ fontWeight: '600' }}>Compte utilisateur :</Text> email, nom
                d'utilisateur, mot de passe (crypté)
              </Text>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 8 }}>
                • <Text style={{ fontWeight: '600' }}>Adresse de livraison :</Text> nom complet,
                adresse postale, téléphone, email
              </Text>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 8 }}>
                • <Text style={{ fontWeight: '600' }}>Paiements :</Text> traités par Stripe (nous ne
                stockons JAMAIS vos données bancaires)
              </Text>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22 }}>
                • <Text style={{ fontWeight: '600' }}>Annonces :</Text> photos et descriptions de
                vos produits
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
            2. Utilisation des données
          </Text>
          <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 12 }}>
              Vos données sont utilisées exclusivement pour :
            </Text>

            <View style={{ marginLeft: 16 }}>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 8 }}>
                ✓ Permettre les transactions entre acheteurs et vendeurs
              </Text>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 8 }}>
                ✓ Assurer la livraison de vos commandes
              </Text>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 8 }}>
                ✓ Gérer le service client et résoudre les litiges
              </Text>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22 }}>
                ✓ Améliorer la sécurité et prévenir la fraude
              </Text>
            </View>

            <View
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: '#EF4444' + '15',
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: '#EF4444', lineHeight: 20, fontWeight: '600' }}>
                ❌ Nous ne vendons JAMAIS vos données à des tiers
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
            3. Conservation des données
          </Text>
          <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 12 }}>
              Nous appliquons une politique de conservation limitée :
            </Text>

            <View
              style={{
                backgroundColor: '#4CAF50' + '15',
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600', marginBottom: 4 }}>
                📦 Adresses de livraison
              </Text>
              <Text style={{ fontSize: 13, color: t.text, lineHeight: 20 }}>
                Supprimées automatiquement 30 jours après la livraison confirmée
              </Text>
            </View>

            <View
              style={{
                backgroundColor: t.primaryBtn + '15',
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600', marginBottom: 4 }}>
                👤 Compte utilisateur
              </Text>
              <Text style={{ fontSize: 13, color: t.text, lineHeight: 20 }}>
                Conservé tant que votre compte est actif. Vous pouvez le supprimer à tout moment.
              </Text>
            </View>

            <View style={{ backgroundColor: t.muted + '15', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600', marginBottom: 4 }}>
                💳 Transactions
              </Text>
              <Text style={{ fontSize: 13, color: t.text, lineHeight: 20 }}>
                Conservées 10 ans pour obligations légales et comptables
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
            4. Vos droits RGPD
          </Text>
          <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 12 }}>
              Conformément au RGPD, vous disposez des droits suivants :
            </Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600', marginBottom: 4 }}>
                👁️ Droit d'accès
              </Text>
              <Text style={{ fontSize: 13, color: t.muted, lineHeight: 20, marginBottom: 2 }}>
                Consultez toutes vos données dans "Mes données personnelles"
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600', marginBottom: 4 }}>
                ✏️ Droit de rectification
              </Text>
              <Text style={{ fontSize: 13, color: t.muted, lineHeight: 20, marginBottom: 2 }}>
                Modifiez vos informations à tout moment dans votre profil
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600', marginBottom: 4 }}>
                🗑️ Droit à l'oubli
              </Text>
              <Text style={{ fontSize: 13, color: t.muted, lineHeight: 20, marginBottom: 2 }}>
                Supprimez vos adresses ou votre compte complet
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600', marginBottom: 4 }}>
                📥 Droit à la portabilité
              </Text>
              <Text style={{ fontSize: 13, color: t.muted, lineHeight: 20, marginBottom: 2 }}>
                Exportez vos données au format JSON
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600', marginBottom: 4 }}>
                ⛔ Droit d'opposition
              </Text>
              <Text style={{ fontSize: 13, color: t.muted, lineHeight: 20 }}>
                Refusez le traitement de vos données (dans les limites légales)
              </Text>
            </View>
          </View>
        </View>

        {/* Section 5 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
            5. Sécurité
          </Text>
          <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 12 }}>
              Nous mettons en œuvre des mesures de sécurité strictes :
            </Text>

            <View style={{ marginLeft: 16 }}>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 8 }}>
                🔐 Cryptage SSL/TLS pour toutes les communications
              </Text>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 8 }}>
                🔑 Mots de passe hashés avec bcrypt
              </Text>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 8 }}>
                💳 Paiements sécurisés via Stripe (certifié PCI-DSS niveau 1)
              </Text>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22 }}>
                🛡️ Protection contre les accès non autorisés
              </Text>
            </View>
          </View>
        </View>

        {/* Section 6 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
            6. Cookies
          </Text>
          <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 12 }}>
              Nous utilisons uniquement des cookies essentiels :
            </Text>

            <View style={{ marginLeft: 16 }}>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 8 }}>
                • <Text style={{ fontWeight: '600' }}>Token d'authentification :</Text> pour
                maintenir votre session
              </Text>
              <Text style={{ fontSize: 14, color: t.text, lineHeight: 22 }}>
                • <Text style={{ fontWeight: '600' }}>Préférences :</Text> thème clair/sombre
              </Text>
            </View>

            <Text
              style={{
                fontSize: 13,
                color: t.muted,
                lineHeight: 20,
                marginTop: 12,
                fontStyle: 'italic',
              }}
            >
              Aucun cookie de tracking ou publicitaire n'est utilisé.
            </Text>
          </View>
        </View>

        {/* Section 7 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
            7. Contact
          </Text>
          <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 12 }}>
              Pour toute question concernant vos données personnelles :
            </Text>

            <View
              style={{
                backgroundColor: t.primaryBtn + '15',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600', marginBottom: 4 }}>
                📧 Email : privacy@gearted.com
              </Text>
              <Text style={{ fontSize: 13, color: t.muted, lineHeight: 20 }}>
                Nous répondons sous 48h ouvrées
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            padding: 16,
            backgroundColor: t.muted + '15',
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: t.muted, lineHeight: 18, textAlign: 'center' }}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            {'\n\n'}
            Cette politique peut être modifiée. Nous vous informerons de tout changement
            significatif.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
