import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../components/UserProvider";
import authService from "../services/auth";
import discordAuthService from "../services/discord-auth";
import { THEMES, ThemeKey } from "../themes";
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [theme] = useState<ThemeKey>("ranger");
  const { updateProfile } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  
  const t = THEMES[theme];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // Réinitialiser les erreurs
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    // Validation
    let hasError = false;

    if (!email) {
      setEmailError("L'email est requis");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Format d'email invalide");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Le mot de passe est requis");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Connexion avec le backend
      const response = await authService.login({
        email: email.trim().toLowerCase(),
        password
      });

  // Connexion réussie

      // Charger le profil local existant pour fusionner avatar et teamName
      let localProfile = null;
      try {
        const storedUser = await AsyncStorage.getItem('@gearted_user_profile');
        if (storedUser) {
          localProfile = JSON.parse(storedUser);
        }
      } catch (e) {
        // Impossible de charger le profil local
      }

      await updateProfile({
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        avatar: localProfile?.avatar ?? response.user.avatar ?? null,
  teamName: localProfile?.teamName ?? (response.user as any).teamName ?? "Sans équipe",
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        location: response.user.location,
        phone: response.user.phone,
        bio: response.user.bio
      });

      setIsLoading(false);
      
      // Rediriger vers l'app
      router.replace("/(tabs)" as any);
      
    } catch (error: any) {
      setIsLoading(false);
      console.error('[Login] Error:', error);
      
      // Analyser le message d'erreur
      let errorMessage = error.message || "Identifiants invalides";
      
      // Traduire les messages courants en français
      if (errorMessage.includes('not allowed to be empty')) {
        if (errorMessage.includes('password')) {
          errorMessage = "Le mot de passe est requis";
        } else if (errorMessage.includes('email')) {
          errorMessage = "L'email est requis";
        }
      } else if (errorMessage.includes('must be a valid email')) {
        errorMessage = "L'email doit être valide";
      }
      
      // Déterminer si c'est une erreur d'email, de mot de passe ou générale
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('mail')) {
        setEmailError(errorMessage);
      } else if (errorMessage.toLowerCase().includes('mot de passe') || errorMessage.toLowerCase().includes('password')) {
        setPasswordError("Le mot de passe est incorrect. Veuillez réessayer.");
      } else if (errorMessage.toLowerCase().includes('identifiants') || errorMessage.toLowerCase().includes('credentials') || errorMessage.toLowerCase().includes('invalide')) {
        setPasswordError("Le mot de passe est incorrect. Veuillez réessayer.");
      } else {
        setGeneralError(errorMessage);
      }
    }
  };

  const handleRegister = () => {
    router.push("/register" as any);
  };

  const handleDiscordLogin = async () => {
    // Effacer les erreurs AVANT de commencer
    setGeneralError("");
    setEmailError("");
    setPasswordError("");
    setIsLoading(true);

    try {
      const result = await discordAuthService.loginWithDiscord();

      if (result.success && result.user) {
        // Mise à jour du profil
        updateProfile(result.user);

        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem('@gearted_user_profile', JSON.stringify(result.user));

        // Redirection vers l'accueil
        router.replace('/(tabs)' as any);
      } else {
        setGeneralError(result.error || "Erreur lors de la connexion avec Discord");
      }
    } catch (error: any) {
      setGeneralError("Impossible de se connecter avec Discord");
      console.error('Discord login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient
          colors={[t.heroGradStart + 'CC', t.heroGradEnd + '66']}
          style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}
        >
          <Text style={{
            fontSize: 28,
            fontWeight: '700',
            color: t.heading,
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            CONTENT DE TE REVOIR
          </Text>
          <Text style={{
            fontSize: 16,
            color: t.muted,
            textAlign: 'center'
          }}>
            Ta prochaine trouvaille t'attend 🎯
          </Text>
        </LinearGradient>

        {/* Login Form */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>
          {/* Message d'erreur général */}
          {generalError ? (
            <View style={{
              backgroundColor: '#FEE2E2',
              borderLeftWidth: 4,
              borderLeftColor: '#DC2626',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 20
            }}>
              <Text style={{ color: '#991B1B', fontSize: 14, fontWeight: '600' }}>
                {generalError}
              </Text>
            </View>
          ) : null}

          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Email
            </Text>
            <TextInput
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: t.heading,
                borderWidth: 1,
                borderColor: emailError ? '#DC2626' : t.border
              }}
              placeholder="votre.email@exemple.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError("");
                if (generalError) setGeneralError("");
              }}
              placeholderTextColor={t.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? (
              <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                {emailError}
              </Text>
            ) : null}
          </View>

          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: t.heading
              }}>
                Mot de passe
              </Text>
              <TouchableOpacity onPress={() => router.push("/forgot-password" as any)}>
                <Text style={{ fontSize: 14, color: t.primaryBtn, fontWeight: '500' }}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: t.heading,
                borderWidth: 1,
                borderColor: passwordError ? '#DC2626' : t.border
              }}
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError("");
                if (generalError) setGeneralError("");
              }}
              placeholderTextColor={t.muted}
              secureTextEntry
            />
            {passwordError ? (
              <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                {passwordError}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: t.primaryBtn,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 16,
              opacity: isLoading ? 0.7 : 1
            }}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={{
              color: t.white,
              fontSize: 16,
              fontWeight: '600'
            }}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Text>
          </TouchableOpacity>

          {/* Séparateur OU */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 24
          }}>
            <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
            <Text style={{
              marginHorizontal: 16,
              color: t.muted,
              fontSize: 14,
              fontWeight: '500'
            }}>
              OU
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
          </View>

          {/* Bouton Discord */}
          <TouchableOpacity
            style={{
              backgroundColor: '#5865F2',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 16,
              opacity: isLoading ? 0.7 : 1,
              flexDirection: 'row',
              justifyContent: 'center'
            }}
            onPress={handleDiscordLogin}
            disabled={isLoading}
          >
            <Ionicons name="logo-discord" size={24} color="#FFFFFF" style={{ marginRight: 12 }} />
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '600'
            }}>
              Se connecter avec Discord
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              paddingVertical: 16,
              alignItems: 'center'
            }}
            onPress={handleRegister}
          >
            <Text style={{
              color: t.muted,
              fontSize: 14
            }}>
              Pas encore de compte ?{" "}
              <Text style={{ color: t.primaryBtn, fontWeight: '600' }}>
                S'inscrire
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Login */}
        <View style={{ 
          paddingHorizontal: 24, 
          paddingTop: 32,
          paddingBottom: 32
        }}>
          <View style={{
            backgroundColor: t.cardBg,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: t.border
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              🚀 Demo - Testez directement
            </Text>
            <Text style={{
              fontSize: 12,
              color: t.muted,
              marginBottom: 12
            }}>
              Utilisez ces identifiants pour tester l'application :
            </Text>
            <Text style={{
              fontSize: 12,
              fontFamily: 'monospace',
              color: t.muted
            }}>
              Email: demo@gearted.com{'\n'}
              Mot de passe: Demo123!
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: t.border,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignSelf: 'flex-start',
                marginTop: 12
              }}
              onPress={() => {
                setEmail("demo@gearted.com");
                setPassword("Demo123!");
              }}
            >
              <Text style={{
                fontSize: 12,
                color: t.heading,
                fontWeight: '600'
              }}>
                Remplir automatiquement
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}