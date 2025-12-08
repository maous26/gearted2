import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "../components/ThemeProvider";
import { THEMES } from "../themes";
import { useMessagesStore } from "../stores/messagesStore";

export default function WelcomeMessageScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const { markAsRead } = useMessagesStore();

  // Marquer comme lu à l'ouverture
  useEffect(() => {
    markAsRead('gearted-welcome');
  }, []);

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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={t.heading} />
        </TouchableOpacity>
        <Image
          source={{ uri: 'https://ui-avatars.com/api/?name=Hugo+Gearted&background=4B5D3A&color=fff&size=100' }}
          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading }}>
            Hugo de Gearted
          </Text>
          <Text style={{ fontSize: 12, color: t.muted }}>
            Equipe Gearted
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Message bubble */}
        <View style={{
          backgroundColor: t.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: t.border,
          maxWidth: '85%'
        }}>
          <Text style={{ fontSize: 15, color: t.heading, lineHeight: 22 }}>
            Bienvenue sur Gearted ! 🎯
          </Text>
          <Text style={{ fontSize: 15, color: t.heading, lineHeight: 22, marginTop: 12 }}>
            Je suis Hugo, et avec l'equipe nous sommes ravis de t'accueillir sur la premiere marketplace dediee a l'airsoft en France.
          </Text>
          <Text style={{ fontSize: 15, color: t.heading, lineHeight: 22, marginTop: 12 }}>
            Que tu sois la pour vendre tes repliques ou trouver de nouveaux equipements, tu es au bon endroit !
          </Text>
          <Text style={{ fontSize: 15, color: t.heading, lineHeight: 22, marginTop: 12 }}>
            Quelques conseils pour bien demarrer :
          </Text>
          <View style={{ marginTop: 8, marginLeft: 8 }}>
            <Text style={{ fontSize: 14, color: t.heading, lineHeight: 20 }}>
              • Complete ton profil pour inspirer confiance
            </Text>
            <Text style={{ fontSize: 14, color: t.heading, lineHeight: 20 }}>
              • Ajoute des photos de qualite a tes annonces
            </Text>
            <Text style={{ fontSize: 14, color: t.heading, lineHeight: 20 }}>
              • Decris precisement l'etat de tes articles
            </Text>
            <Text style={{ fontSize: 14, color: t.heading, lineHeight: 20 }}>
              • Reponds rapidement aux messages
            </Text>
          </View>
          <Text style={{ fontSize: 15, color: t.heading, lineHeight: 22, marginTop: 12 }}>
            Si tu as des questions, n'hesite pas a nous contacter via le support.
          </Text>
          <Text style={{ fontSize: 15, color: t.heading, lineHeight: 22, marginTop: 12 }}>
            Bonnes ventes et bons achats ! 🔫
          </Text>
          <Text style={{ fontSize: 12, color: t.muted, marginTop: 12 }}>
            - Hugo & l'equipe Gearted
          </Text>
        </View>

        {/* Info card */}
        <View style={{
          backgroundColor: t.primaryBtn + '15',
          borderRadius: 12,
          padding: 16,
          marginTop: 8
        }}>
          <Text style={{ fontSize: 14, color: t.primaryBtn, fontWeight: '600', marginBottom: 8 }}>
            💡 Besoin d'aide ?
          </Text>
          <Text style={{ fontSize: 13, color: t.muted, lineHeight: 18 }}>
            Consulte notre FAQ ou contacte le support depuis les parametres de l'application.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
