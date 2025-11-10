import { LinearGradient } from "expo-linear-gradient";
import * as Location from 'expo-location';
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEMES, ThemeKey } from "../themes";
import authService from "../services/auth";
import { useUser } from "../components/UserProvider";

export default function RegisterScreen() {
  const [theme] = useState<ThemeKey>("ranger");
  const { updateProfile } = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [locationConsent, setLocationConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  
  // États pour les erreurs
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  
  const t = THEMES[theme];

  const handleRequestLocation = async () => {
    setIsRequestingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission refusée",
          "L'accès à la localisation est nécessaire pour remplir automatiquement votre ville. Vous pouvez la saisir manuellement."
        );
        setIsRequestingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (address.city) {
        setCity(address.city);
      }
      if (address.postalCode) {
        setPostalCode(address.postalCode);
      }
      
      setLocationConsent(true);
      Alert.alert("Succès", "Votre localisation a été détectée !");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de récupérer votre position");
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Réinitialiser les erreurs
    setEmailError("");
    setUsernameError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");

    // Validation
    let hasError = false;

    if (!firstName || !lastName) {
      setGeneralError("Veuillez remplir votre nom et prénom");
      hasError = true;
    }

    if (!email) {
      setEmailError("L'email est requis");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Format d'email invalide");
      hasError = true;
    }

    if (!username) {
      setUsernameError("Le nom d'utilisateur est requis");
      hasError = true;
    } else if (username.length < 3) {
      setUsernameError("Minimum 3 caractères");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Le mot de passe est requis");
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError("Minimum 8 caractères");
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Veuillez confirmer le mot de passe");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Les mots de passe ne correspondent pas");
      hasError = true;
    }

    if (!city || !postalCode) {
      setGeneralError("Veuillez indiquer votre ville et code postal");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Créer le compte avec toutes les informations
      const response = await authService.register({
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        location: `${city.trim()}, ${postalCode.trim()}`
      });

      console.log('[Register] Account created:', response.user.email);

      // Sauvegarder le profil utilisateur dans le contexte
      await updateProfile({
        username: response.user.username,
        avatar: response.user.avatar || null,
        teamName: "Sans équipe"
      });

      setIsLoading(false);
      Alert.alert(
        "Inscription réussie!", 
        `Bienvenue ${firstName} ! Votre compte a été créé avec succès.`,
        [
          {
            text: "Continuer",
            onPress: () => router.replace("/(tabs)" as any)
          }
        ]
      );
    } catch (error: any) {
      setIsLoading(false);
      console.error('[Register] Error:', error);
      
      // Analyser le message d'erreur
      let errorMessage = error.message || "Impossible de créer le compte";
      
      // Traduire les messages courants en français
      if (errorMessage.includes('Password must contain at least one uppercase letter')) {
        errorMessage = "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial";
      } else if (errorMessage.includes('not allowed to be empty')) {
        if (errorMessage.includes('password')) {
          errorMessage = "Le mot de passe est requis";
        } else if (errorMessage.includes('email')) {
          errorMessage = "L'email est requis";
        } else if (errorMessage.includes('username')) {
          errorMessage = "Le nom d'utilisateur est requis";
        }
      }
      
      // Déterminer le type d'erreur
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('mail')) {
        setEmailError(errorMessage);
      } else if (errorMessage.toLowerCase().includes('username') || errorMessage.toLowerCase().includes('utilisateur')) {
        setUsernameError(errorMessage);
      } else if (errorMessage.toLowerCase().includes('mot de passe') || errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('majuscule') || errorMessage.toLowerCase().includes('caractère spécial')) {
        setPasswordError(errorMessage);
      } else {
        setGeneralError(errorMessage);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <LinearGradient
          colors={[t.heroGradStart + 'CC', t.heroGradEnd + '66']}
          style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}
        >
          <Text style={{
            fontSize: 32,
            fontWeight: '700',
            color: t.heading,
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            INSCRIPTION
          </Text>
          <Text style={{
            fontSize: 16,
            color: t.muted,
            textAlign: 'center'
          }}>
            Créez votre compte Gearted
          </Text>
        </LinearGradient>

        {/* Register Form */}
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

          <View style={{ flexDirection: 'row', marginBottom: 20 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: t.heading,
                marginBottom: 8
              }}>
                Prénom
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
                  borderColor: t.border
                }}
                placeholder="John"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (generalError) setGeneralError("");
                }}
                placeholderTextColor={t.muted}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: t.heading,
                marginBottom: 8
              }}>
                Nom
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
                  borderColor: t.border
                }}
                placeholder="Doe"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (generalError) setGeneralError("");
                }}
                placeholderTextColor={t.muted}
              />
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Nom d'utilisateur
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
                borderColor: usernameError ? '#DC2626' : t.border
              }}
              placeholder="johndoe"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (usernameError) setUsernameError("");
                if (generalError) setGeneralError("");
              }}
              placeholderTextColor={t.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {usernameError ? (
              <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                {usernameError}
              </Text>
            ) : null}
          </View>

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

          {/* Localisation Section */}
          <View style={{
            backgroundColor: t.cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: t.border
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              📍 Localisation
            </Text>
            <Text style={{
              fontSize: 13,
              color: t.muted,
              marginBottom: 12,
              lineHeight: 18
            }}>
              Votre ville nous aide à afficher les annonces près de chez vous et facilite la remise en main propre.
            </Text>

            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{ flex: 2, marginRight: 12 }}>
                <TextInput
                  style={{
                    backgroundColor: t.rootBg,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 15,
                    color: t.heading,
                    borderWidth: 1,
                    borderColor: t.border
                  }}
                  placeholder="Ville"
                  value={city}
                  onChangeText={setCity}
                  placeholderTextColor={t.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={{
                    backgroundColor: t.rootBg,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 15,
                    color: t.heading,
                    borderWidth: 1,
                    borderColor: t.border
                  }}
                  placeholder="Code postal"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholderTextColor={t.muted}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: locationConsent ? t.sectionLight : t.primaryBtn,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                opacity: isRequestingLocation ? 0.7 : 1
              }}
              onPress={handleRequestLocation}
              disabled={isRequestingLocation || locationConsent}
            >
              <Text style={{ fontSize: 18, marginRight: 8 }}>
                {locationConsent ? '✅' : '📍'}
              </Text>
              <Text style={{
                color: locationConsent ? t.heading : t.white,
                fontSize: 14,
                fontWeight: '600'
              }}>
                {isRequestingLocation 
                  ? "Localisation..." 
                  : locationConsent 
                  ? "Position détectée" 
                  : "Détecter ma position"}
              </Text>
            </TouchableOpacity>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: t.border
            }}>
              <Switch
                value={locationConsent}
                onValueChange={setLocationConsent}
                trackColor={{ false: t.border, true: t.primaryBtn }}
                thumbColor={locationConsent ? t.white : t.muted}
              />
              <Text style={{
                fontSize: 12,
                color: t.muted,
                marginLeft: 10,
                flex: 1,
                lineHeight: 16
              }}>
                J'autorise Gearted à utiliser ma localisation pour améliorer mon expérience
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Mot de passe
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

          <View style={{ marginBottom: 32 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Confirmer le mot de passe
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
                borderColor: confirmPasswordError ? '#DC2626' : t.border
              }}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError("");
                if (generalError) setGeneralError("");
              }}
              placeholderTextColor={t.muted}
              secureTextEntry
            />
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
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={{
              color: t.white,
              fontSize: 16,
              fontWeight: '600'
            }}>
              {isLoading ? "Inscription..." : "S'inscrire"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 32
            }}
            onPress={() => router.push("/login" as any)}
          >
            <Text style={{
              color: t.muted,
              fontSize: 14
            }}>
              Déjà un compte ?{" "}
              <Text style={{ color: t.primaryBtn, fontWeight: '600' }}>
                Se connecter
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}