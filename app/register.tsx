import { LinearGradient } from "expo-linear-gradient";
import * as Location from 'expo-location';
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
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

export default function RegisterScreen() {
  const [theme] = useState<ThemeKey>("ranger");
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

  const handleRegister = async () => {
    if (!firstName || !lastName || !username || !email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (!city || !postalCode) {
      Alert.alert("Erreur", "Veuillez indiquer votre ville et code postal");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsLoading(true);
    
    // For demo purposes, simulate successful registration
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        "Inscription réussie!", 
        "Votre compte a été créé avec succès en mode démo.",
        [
          {
            text: "Se connecter",
            onPress: () => router.push("/login" as any)
          }
        ]
      );
    }, 1000);
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
                onChangeText={setFirstName}
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
                onChangeText={setLastName}
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
                borderColor: t.border
              }}
              placeholder="johndoe"
              value={username}
              onChangeText={setUsername}
              placeholderTextColor={t.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
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
                borderColor: t.border
              }}
              placeholder="votre.email@exemple.com"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={t.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
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
                borderColor: t.border
              }}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              placeholderTextColor={t.muted}
              secureTextEntry
            />
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
                borderColor: t.border
              }}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor={t.muted}
              secureTextEntry
            />
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
    </SafeAreaView>
  );
}