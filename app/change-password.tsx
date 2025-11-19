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

export default function ChangePasswordScreen() {
  const [theme] = useState<ThemeKey>("ranger");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const t = THEMES[theme];

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleChangePassword = async () => {
    setCurrentPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");

    let hasError = false;

    if (!currentPassword) {
      setCurrentPasswordError("Le mot de passe actuel est requis");
      hasError = true;
    }

    if (!newPassword) {
      setNewPasswordError("Le nouveau mot de passe est requis");
      hasError = true;
    } else if (!validatePassword(newPassword)) {
      setNewPasswordError("Le mot de passe doit contenir au moins 8 caractères");
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Veuillez confirmer le nouveau mot de passe");
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Les mots de passe ne correspondent pas");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });

      Alert.alert(
        "Succès",
        "Votre mot de passe a été modifié avec succès",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );

    } catch (error: any) {
      console.error('[ChangePassword] Error:', error);

      const errorMessage = error.response?.data?.message || error.message || "Une erreur est survenue";

      if (errorMessage.toLowerCase().includes('current') || errorMessage.toLowerCase().includes('actuel') || errorMessage.toLowerCase().includes('incorrect')) {
        setCurrentPasswordError("Le mot de passe actuel est incorrect");
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
            CHANGER LE MOT DE PASSE
          </Text>
          <Text style={{
            fontSize: 16,
            color: t.muted,
            textAlign: 'center'
          }}>
            Modifiez votre mot de passe de connexion
          </Text>
        </LinearGradient>

        {/* Form */}
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

          {/* Mot de passe actuel */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Mot de passe actuel
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={{
                  backgroundColor: t.cardBg,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  paddingRight: 48,
                  fontSize: 16,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: currentPasswordError ? '#DC2626' : t.border
                }}
                placeholder="Votre mot de passe actuel"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (currentPasswordError) setCurrentPasswordError("");
                  if (generalError) setGeneralError("");
                }}
                placeholderTextColor={t.muted}
                secureTextEntry={!showCurrentPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 12,
                  padding: 4
                }}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-off" : "eye"}
                  size={20}
                  color={t.muted}
                />
              </TouchableOpacity>
            </View>
            {currentPasswordError ? (
              <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                {currentPasswordError}
              </Text>
            ) : null}
          </View>

          {/* Nouveau mot de passe */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Nouveau mot de passe
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={{
                  backgroundColor: t.cardBg,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  paddingRight: 48,
                  fontSize: 16,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: newPasswordError ? '#DC2626' : t.border
                }}
                placeholder="Votre nouveau mot de passe"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (newPasswordError) setNewPasswordError("");
                  if (generalError) setGeneralError("");
                }}
                placeholderTextColor={t.muted}
                secureTextEntry={!showNewPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 12,
                  padding: 4
                }}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off" : "eye"}
                  size={20}
                  color={t.muted}
                />
              </TouchableOpacity>
            </View>
            {newPasswordError ? (
              <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                {newPasswordError}
              </Text>
            ) : null}
          </View>

          {/* Confirmer le nouveau mot de passe */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Confirmer le nouveau mot de passe
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={{
                  backgroundColor: t.cardBg,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  paddingRight: 48,
                  fontSize: 16,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: confirmPasswordError ? '#DC2626' : t.border
                }}
                placeholder="Confirmez votre nouveau mot de passe"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError("");
                  if (generalError) setGeneralError("");
                }}
                placeholderTextColor={t.muted}
                secureTextEntry={!showConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 12,
                  padding: 4
                }}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={t.muted}
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? (
              <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                {confirmPasswordError}
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
            onPress={handleChangePassword}
            disabled={isLoading}
          >
            <Text style={{
              color: t.white,
              fontSize: 16,
              fontWeight: '600'
            }}>
              {isLoading ? "Modification en cours..." : "Modifier le mot de passe"}
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
              Annuler
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
              <Ionicons name="shield-checkmark" size={20} color={t.primaryBtn} style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: t.heading,
                  marginBottom: 8
                }}>
                  Conseils pour un mot de passe sécurisé
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: t.muted,
                  lineHeight: 18
                }}>
                  • Utilisez au moins 8 caractères{'\n'}
                  • Mélangez majuscules, minuscules et chiffres{'\n'}
                  • Ajoutez des caractères spéciaux (!@#$%){'\n'}
                  • Évitez les mots courants ou informations personnelles
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
