import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../components/ThemeProvider";
import { useUser } from "../components/UserProvider";
import api from "../services/api";
import { storeAuthToken, storeUserData } from "../services/secureStorage";
import { THEMES } from "../themes";

export default function DiscordJoinScreen() {
  const { theme } = useTheme();
  const { user, setUser } = useUser();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const t = THEMES[theme];

  const discordId = params.discord_id as string;
  const token = params.token as string;

  useEffect(() => {
    if (discordId && token) {
      verifyAndLink();
    } else {
      setError("Lien invalide. Paramètres manquants.");
      setLoading(false);
    }
  }, [discordId, token]);

  const verifyAndLink = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Verify token and authenticate with Discord
      const authResponse = await api.post<{ 
        success: boolean; 
        token: string;
        user: {
          id: string;
          discordId: string;
          username: string;
          email: string;
          avatar: string | null;
          teamName: string;
          points: number;
          badges: string[];
        };
      }>(
        '/api/discord/auth/discord',
        {
          token,
          discordId
        }
      );

      if (authResponse.success && authResponse.token) {
        // Store JWT token securely using SecureStore
        await storeAuthToken(authResponse.token);
        
        // Store user data securely
        await storeUserData({
          id: authResponse.user.id,
          discordId: authResponse.user.discordId,
          username: authResponse.user.username,
          email: authResponse.user.email,
          points: authResponse.user.points,
          badges: authResponse.user.badges
        });
        
        // Step 2: Update user profile with Discord data
        if (user) {
          setUser({
            ...user,
            id: authResponse.user.id,
            username: authResponse.user.username,
            teamName: authResponse.user.teamName,
            avatar: authResponse.user.avatar,
            email: authResponse.user.email
          });
        } else {
          // Create new user profile from Discord data
          setUser({
            id: authResponse.user.id,
            username: authResponse.user.username,
            teamName: authResponse.user.teamName,
            avatar: authResponse.user.avatar,
            email: authResponse.user.email
          });
        }

        setSuccess(true);
        
        Alert.alert(
          "Compte lié !",
          `Bienvenue ${authResponse.user.username} ! Tu as ${authResponse.user.points} points et ${authResponse.user.badges.length} badge(s).`,
          [{ text: "OK" }]
        );
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000);
      } else {
        setError("Échec de l'authentification Discord.");
      }
    } catch (err: any) {
      console.error('Discord link error:', err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        {loading && (
          <>
            <ActivityIndicator size="large" color={t.primaryBtn} />
            <Text style={{ fontSize: 18, color: t.heading, marginTop: 16, textAlign: 'center' }}>
              Vérification de ton lien Discord...
            </Text>
          </>
        )}

        {success && !loading && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 72, marginBottom: 16 }}>✅</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: t.primaryBtn, marginBottom: 8, textAlign: 'center' }}>
              Compte Discord lié !
            </Text>
            <Text style={{ fontSize: 16, color: t.muted, textAlign: 'center' }}>
              Ton compte Discord est maintenant connecté à Gearted.
            </Text>
            <Text style={{ fontSize: 14, color: t.muted, marginTop: 8, textAlign: 'center' }}>
              Redirection vers l'accueil...
            </Text>
          </View>
        )}

        {error && !loading && (
          <View style={{ alignItems: 'center', maxWidth: 400 }}>
            <Text style={{ fontSize: 72, marginBottom: 16 }}>❌</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#C62828', marginBottom: 8, textAlign: 'center' }}>
              Erreur
            </Text>
            <Text style={{ fontSize: 16, color: t.heading, marginBottom: 24, textAlign: 'center' }}>
              {error}
            </Text>

            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: t.primaryBtn,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center'
                }}
                onPress={() => {
                  if (discordId && token) {
                    verifyAndLink();
                  }
                }}
              >
                <Text style={{ color: t.white, fontWeight: '600', fontSize: 16 }}>
                  Réessayer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: t.cardBg,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: t.border
                }}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={{ color: t.heading, fontWeight: '600', fontSize: 16 }}>
                  Retour à l'accueil
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!loading && !success && !error && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 72, marginBottom: 16 }}>🔗</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: t.heading, marginBottom: 8, textAlign: 'center' }}>
              Liaison Discord
            </Text>
            <Text style={{ fontSize: 16, color: t.muted, textAlign: 'center' }}>
              Prêt à lier ton compte Discord à Gearted
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
