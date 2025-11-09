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

export default function LoginScreen() {
  const [theme] = useState<ThemeKey>("ranger");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const t = THEMES[theme];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    
    // For demo purposes, allow any login to succeed
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Succès", "Connexion réussie en mode démo!", [
        {
          text: "OK",
          onPress: () => router.push("/(tabs)")
        }
      ]);
    }, 1000);
  };

  const handleRegister = () => {
    router.push("/register" as any);
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
            fontFamily: 'Oswald-Bold',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            CONNECTE-TOI
          </Text>
          <Text style={{
            fontSize: 16,
            color: t.muted,
            textAlign: 'center'
          }}>
            Commence à déposer tes annonces
          </Text>
        </LinearGradient>

        {/* Login Form */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>
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

          <View style={{ marginBottom: 32 }}>
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