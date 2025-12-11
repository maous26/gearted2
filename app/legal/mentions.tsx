import { router } from "expo-router";
import React from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../components/ThemeProvider";
import { THEMES } from "../../themes";

export default function MentionsLegalesScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: t.border
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ fontSize: 24, color: t.primaryBtn }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: t.heading }}>
          Mentions Legales
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 12, color: t.muted, marginBottom: 20 }}>
          Derniere mise a jour : 11 decembre 2024
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          1. EDITEUR DE LA PLATEFORME
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          La plateforme GEARTED est exploitee par :
          {'\n\n'}
          OULARE ISMAEL
          {'\n'}Entrepreneur Individuel
          {'\n'}SIRET : 88250756900011
          {'\n'}Adresse professionnelle : 75 AVENUE LAPLACE 94110
          {'\n'}Email : contact@gearted.eu
          {'\n'}Site : www.gearted.eu
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          2. HEBERGEMENT
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          - Backend : Railway (Union Europeenne)
          {'\n'}- Stockage images : Cloudinary
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          3. DIRECTEUR DE LA PUBLICATION
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          OULARE ISMAEL
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          4. CONTACT
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Pour toute question concernant la plateforme :
          {'\n'}Email : contact@gearted.eu
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          5. PROPRIETE INTELLECTUELLE
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          L'ensemble du contenu de la plateforme GEARTED (textes, images, logos, marques, design) est protege par le droit de la propriete intellectuelle.
          {'\n\n'}
          Toute reproduction, representation, modification ou exploitation, totale ou partielle, sans autorisation prealable ecrite est interdite.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          6. DONNEES PERSONNELLES
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Conformement au Reglement General sur la Protection des Donnees (RGPD), vous disposez de droits sur vos donnees personnelles.
          {'\n\n'}
          Pour exercer ces droits ou pour toute question relative a vos donnees :
          {'\n'}Email : contact@gearted.eu
          {'\n\n'}
          Pour plus d'informations, consultez notre Politique de Confidentialite.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          7. COOKIES
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          La plateforme utilise des cookies essentiels au fonctionnement du service (authentification, preferences utilisateur).
          {'\n\n'}
          Aucun cookie publicitaire n'est utilise.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          8. LIMITATION DE RESPONSABILITE
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 40 }}>
          GEARTED agit en qualite d'intermediaire technique entre vendeurs et acheteurs. La plateforme ne peut etre tenue responsable :
          {'\n\n'}
          - Du contenu des annonces publiees par les utilisateurs
          {'\n'}- De la qualite ou conformite des produits vendus
          {'\n'}- Des transactions effectuees entre utilisateurs
          {'\n'}- Des eventuels litiges entre utilisateurs
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
