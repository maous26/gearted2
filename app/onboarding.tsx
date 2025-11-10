import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../components/ThemeProvider";
import { useUser } from "../components/UserProvider";
import { THEMES } from "../themes";

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const { setUser, completeOnboarding } = useUser();
  
  const [username, setUsername] = useState("");
  const [teamName, setTeamName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Infos, 2: Photo

  const selectFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour choisir une photo");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "L'accès à la caméra est nécessaire");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!username.trim()) {
        Alert.alert("Erreur", "Veuillez entrer un nom d'utilisateur");
        return;
      }
      setStep(2);
    }
  };

  const handleComplete = () => {
    if (!username.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom d'utilisateur");
      return;
    }

    // Créer le profil utilisateur
    setUser({
      id: Date.now().toString(),
      username: username.trim(),
      teamName: teamName.trim() || "Sans équipe",
      avatar: avatar,
      email: "user@example.com" // TODO: Récupérer l'email de l'auth
    });

    completeOnboarding();
    router.replace("/(tabs)");
  };

  if (step === 1) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
        <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
        
        <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
          {/* Progress */}
          <View style={{ flexDirection: 'row', marginBottom: 40 }}>
            <View style={{ flex: 1, height: 4, backgroundColor: t.primaryBtn, borderRadius: 2, marginRight: 8 }} />
            <View style={{ flex: 1, height: 4, backgroundColor: t.border, borderRadius: 2 }} />
          </View>

          {/* Icon */}
          <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: 24 }}>🎯</Text>

          {/* Title */}
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: t.heading,
            textAlign: 'center',
            marginBottom: 12
          }}>
            Bienvenue sur Gearted !
          </Text>

          <Text style={{
            fontSize: 16,
            color: t.muted,
            textAlign: 'center',
            marginBottom: 40
          }}>
            Commençons par créer votre profil
          </Text>

          {/* Username */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Nom d'utilisateur *
            </Text>
            <TextInput
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: t.heading,
                borderWidth: 1,
                borderColor: t.border
              }}
              placeholder="Votre pseudo"
              value={username}
              onChangeText={setUsername}
              placeholderTextColor={t.muted}
              autoCapitalize="none"
              maxLength={20}
            />
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>
              {username.length}/20
            </Text>
          </View>

          {/* Team Name */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Nom de votre équipe (optionnel)
            </Text>
            <TextInput
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: t.heading,
                borderWidth: 1,
                borderColor: t.border
              }}
              placeholder="ex: Team Alpha, Tactical Squad..."
              value={teamName}
              onChangeText={setTeamName}
              placeholderTextColor={t.muted}
              maxLength={30}
            />
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>
              {teamName.length}/30
            </Text>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={{
              backgroundColor: t.primaryBtn,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 16
            }}
            onPress={handleNext}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.white
            }}>
              Suivant
            </Text>
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity
            onPress={() => setStep(2)}
            style={{ alignItems: 'center', padding: 8 }}
          >
            <Text style={{ fontSize: 14, color: t.muted }}>
              Passer cette étape
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Step 2: Photo de profil
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
        {/* Progress */}
        <View style={{ flexDirection: 'row', marginBottom: 40 }}>
          <View style={{ flex: 1, height: 4, backgroundColor: t.primaryBtn, borderRadius: 2, marginRight: 8 }} />
          <View style={{ flex: 1, height: 4, backgroundColor: t.primaryBtn, borderRadius: 2 }} />
        </View>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => setStep(1)}
          style={{ position: 'absolute', top: 60, left: 24, zIndex: 10 }}
        >
          <Text style={{ fontSize: 24, color: t.primaryBtn }}>←</Text>
        </TouchableOpacity>

        {/* Icon */}
        <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: 24 }}>📸</Text>

        {/* Title */}
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: t.heading,
          textAlign: 'center',
          marginBottom: 12
        }}>
          Photo de profil
        </Text>

        <Text style={{
          fontSize: 16,
          color: t.muted,
          textAlign: 'center',
          marginBottom: 40
        }}>
          Ajoutez une photo pour personnaliser votre profil
        </Text>

        {/* Avatar Preview */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: t.cardBg,
            borderWidth: 3,
            borderColor: t.border,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text style={{ fontSize: 60 }}>👤</Text>
            )}
          </View>
        </View>

        {/* Photo Buttons */}
        <TouchableOpacity
          style={{
            backgroundColor: t.primaryBtn,
            borderRadius: 12,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12
          }}
          onPress={selectFromGallery}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>🖼️</Text>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: t.white
          }}>
            Choisir depuis la galerie
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: t.cardBg,
            borderRadius: 12,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: t.border,
            marginBottom: 40
          }}
          onPress={takePicture}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>📷</Text>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: t.heading
          }}>
            Prendre une photo
          </Text>
        </TouchableOpacity>

        {/* Complete Button */}
        <TouchableOpacity
          style={{
            backgroundColor: t.primaryBtn,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 16
          }}
          onPress={handleComplete}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: t.white
          }}>
            Terminer
          </Text>
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity
          onPress={handleComplete}
          style={{ alignItems: 'center', padding: 8 }}
        >
          <Text style={{ fontSize: 14, color: t.muted }}>
            Passer cette étape
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
