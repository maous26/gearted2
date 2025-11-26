import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEMES, ThemeKey } from "../themes";
import { Ionicons } from '@expo/vector-icons';
import api from "../services/api";

export default function ForgotPasswordScreen() {
  const [theme] = useState<ThemeKey>("ranger");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const t = THEMES[theme];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    setEmailError("");
    setGeneralError("");
    setSuccessMessage("");

    if (!email) {
      setEmailError("L'email est requis");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Format d'email invalide");
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/api/auth/forgot-password', {
        email: email.trim().toLowerCase()
      });

      setSuccessMessage("Un email de réinitialisation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception.");
      setEmail("");

      setTimeout(() => {
        router.back();
      }, 3000);

    } catch (error: any) {
      console.error('[ForgotPassword] Error:', error);

      const errorMessage = error.response?.data?.message || error.message || "Une erreur est survenue";

      if (errorMessage.toLowerCase().includes('email')) {
        setEmailError(errorMessage);
      } else {
        setGeneralError(errorMessage);
      }
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 60,
              left: 24,
              zIndex: 10
            }}
          >
            <Ionicons name="arrow-back" size={28} color={t.heading} />
          </TouchableOpacity>

          <Text style={{
            fontSize: 32,
            fontWeight: '700',
            color: t.heading,
            textAlign: 'center',
            marginBottom: 8,
            fontFamily: 'Oswald-Bold',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            MOT DE PASSE OUBLIÉ
          </Text>
          <Text style={{
            fontSize: 16,
            color: t.muted,
            textAlign: 'center'
          }}>
            Réinitialisez votre mot de passe
          </Text>
        </LinearGradient>

        {/* Form */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>
          {/* Message de succès */}
          {successMessage ? (
            <View style={{
              backgroundColor: '#D1FAE5',
              borderLeftWidth: 4,
              borderLeftColor: '#10B981',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 20
            }}>
              <Text style={{ color: '#065F46', fontSize: 14, fontWeight: '600' }}>
                {successMessage}
              </Text>
            </View>
          ) : null}

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

          <Text style={{
            fontSize: 16,
            color: t.muted,
            marginBottom: 24,
            lineHeight: 24
          }}>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>

          <View style={{ marginBottom: 32 }}>
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
              editable={!isLoading}
            />
            {emailError ? (
              <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                {emailError}
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
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            <Text style={{
              color: t.white,
              fontSize: 16,
              fontWeight: '600'
            }}>
              {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              paddingVertical: 16,
              alignItems: 'center'
            }}
            onPress={() => router.back()}
          >
            <Text style={{
              color: t.muted,
              fontSize: 14
            }}>
              Retour à la{" "}
              <Text style={{ color: t.primaryBtn, fontWeight: '600' }}>
                connexion
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
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
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="information-circle" size={20} color={t.primaryBtn} style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: t.heading,
                  marginBottom: 8
                }}>
                  Conseils de sécurité
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: t.muted,
                  lineHeight: 18
                }}>
                  • Vérifiez votre dossier spam si vous ne recevez pas l'email{'\n'}
                  • Le lien de réinitialisation expire après 1 heure{'\n'}
                  • Créez un mot de passe fort avec au moins 8 caractères
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
