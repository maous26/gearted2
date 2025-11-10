import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryPill } from "../components/CategoryPill";
import { useUser } from "../components/UserProvider";
import { CATEGORIES, TRUST } from "../data";
import TokenManager from "../services/storage";
import { THEMES, ThemeKey } from "../themes";

const { width } = Dimensions.get('window');

export default function GeartedLanding() {
  const router = useRouter();
  const { user } = useUser();
  const [theme, setTheme] = useState<ThemeKey>("ranger");
  const [searchText, setSearchText] = useState("");
  const [location, setLocation] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const t = THEMES[theme];

  // Vérifier si l'utilisateur est déjà connecté au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasValidToken = await TokenManager.hasValidToken();
        if (hasValidToken && user) {
          // Utilisateur connecté, rediriger vers l'app
          console.log('[Landing] User authenticated, redirecting to home');
          router.replace("/(tabs)" as any);
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('[Landing] Auth check error:', error);
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [user]);

  // Afficher un écran vide pendant la vérification
  if (isCheckingAuth) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: t.muted }}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      <ScrollView style={{ flex: 1 }}>
        {/* Hero Section */}
        <LinearGradient
          colors={[t.heroGradStart + 'CC', t.heroGradEnd + '66']}
          style={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: 24 }}
        >
          <View>
            <Text style={{
              fontSize: 28,
              fontWeight: '700',
              color: t.heading,
              textAlign: 'center',
              marginBottom: 18,
              fontFamily: 'Oswald-Bold',
              letterSpacing: 0.5,
              textTransform: 'uppercase'
            }}>
              VENDEZ & ÉCHANGEZ{'\n'}VOTRE MATÉRIEL{'\n'}
              <Text style={{ color: t.primaryBtn }}>AIRSOFT</Text>
            </Text>
            
            {/* Removed logo & descriptive paragraph per request */}

            {/* Key Points */}
            <View style={{ marginBottom: 24 }}>
              {[
                { label: "Publication en 2 minutes" },
                { label: "Paiement sécurisé (escrow)" },
                { label: "Profils vérifiés & avis" },
                { label: "Compatibilité technique" },
              ].map((item, i) => (
                <View
                  key={i}
                  style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
                >
                  <Text style={{ color: t.primaryBtn, marginRight: 8 }}>✓</Text>
                  <Text style={{ color: t.subtle, fontSize: 14 }}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Primary CTA Row */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 28,
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: t.primaryBtn,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
                onPress={() => router.push("/register" as any)}
              >
                <Text style={{ color: t.white, fontWeight: "600", marginRight: 8 }}>+</Text>
                <Text style={{ color: t.white, fontWeight: "600" }}>Créer mon compte</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.white,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 14,
                }}
                onPress={() => router.push("/login" as any)}
              >
                <Text style={{ color: t.heading, fontWeight: "600" }}>Connexion</Text>
              </TouchableOpacity>
            </View>

            {/* Search Section */}
            <View style={{ marginBottom: 24 }}>
              <View style={{
                backgroundColor: t.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: t.border,
                padding: 12,
                marginBottom: 12
              }}>
                <Text style={{ color: t.muted, fontSize: 12, marginBottom: 8 }}>🔍 Rechercher</Text>
                <TextInput
                  placeholder="Rechercher un modèle, ex. M4, G17, VSR-10..."
                  value={searchText}
                  onChangeText={setSearchText}
                  style={{ 
                    fontSize: 16, 
                    color: t.heading,
                    paddingVertical: 4
                  }}
                  placeholderTextColor={t.extraMuted}
                />
              </View>
              
              <View style={{
                backgroundColor: t.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: t.border,
                padding: 12,
                marginBottom: 12
              }}>
                <Text style={{ color: t.muted, fontSize: 12, marginBottom: 8 }}>📍 Localisation</Text>
                <TextInput
                  placeholder="Localisation (ex. Paris)"
                  value={location}
                  onChangeText={setLocation}
                  style={{ 
                    fontSize: 16, 
                    color: t.heading,
                    paddingVertical: 4
                  }}
                  placeholderTextColor={t.extraMuted}
                />
              </View>

              <TouchableOpacity style={{
                backgroundColor: t.primaryBtn,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center'
              }}
              onPress={() => {
                console.log('Search pressed with:', searchText, location);
                router.push({
                  pathname: '/(tabs)/browse',
                  params: { 
                    search: searchText,
                    location: location 
                  }
                } as any);
              }}
              >
                <Text style={{ color: t.white, fontWeight: '600', fontSize: 16 }}>Chercher</Text>
              </TouchableOpacity>
            </View>

            {/* Trust Indicators */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {TRUST.map((item, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center' 
                }}>
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: t.primaryBtn,
                    marginRight: 8
                  }} />
                  <Text style={{ color: t.muted, fontSize: 12 }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Categories Section */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: t.heading,
            marginBottom: 16,
            fontFamily: 'Oswald-Bold',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            PARCOURIR PAR CATÉGORIE
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            gap: 12 
          }}>
            {CATEGORIES.map((category) => (
              <CategoryPill
                key={category.slug}
                label={category.label}
                icon={category.icon}
                theme={theme}
                onPress={() => {
                  console.log(`Category pressed: ${category.label}`);
                  router.push({
                    pathname: '/(tabs)/browse',
                    params: { category: category.slug }
                  } as any);
                }}
              />
            ))}
          </View>
        </View>

        {/* Sample Listings */}
        <View style={{ 
          backgroundColor: t.sectionLight + '66', 
          paddingHorizontal: 16, 
          paddingVertical: 24 
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: t.heading,
            marginBottom: 16,
            fontFamily: 'Oswald-Bold',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            ANNONCES RÉCENTES
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            gap: 12 
          }}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={{
                  width: (width - 44) / 2,
                  backgroundColor: t.white,
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: t.border
                }}
              >
                <View style={{
                  height: 100,
                  backgroundColor: t.cardBg,
                  borderRadius: 12,
                  marginBottom: 12
                }} />
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  alignItems: 'center' 
                }}>
                  <View>
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '600', 
                      color: t.heading 
                    }}>
                      Annonce #{i}
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: t.extraMuted 
                    }}>
                      Très bon état
                    </Text>
                  </View>
                  <TouchableOpacity style={{
                    backgroundColor: t.pillBg,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8
                  }}
                  onPress={() => {
                    console.log(`Viewing sample listing #${i}`);
                    router.push('/(tabs)/browse' as any);
                  }}
                  >
                    <Text style={{ 
                      fontSize: 12, 
                      color: t.heading,
                      fontWeight: '500' 
                    }}>
                      Voir
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: t.heading,
            marginBottom: 16,
            fontFamily: 'Oswald-Bold',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            COMMENT ÇA MARCHE
          </Text>
          {[
            { step: '1', title: 'Créez votre compte', desc: 'Accédez à la marketplace et personnalisez votre profil.' },
            { step: '2', title: 'Trouvez du matériel', desc: 'Filtrez par catégories et références précises.' },
            { step: '3', title: 'Vérifiez la compatibilité', desc: 'Assurez-vous que les pièces correspondent avant l\'achat.' },
            { step: '4', title: 'Achetez & échangez en confiance', desc: 'Processus fluide et futur système d’évaluation.' }
          ].map(item => (
            <View key={item.step} style={{ flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start', gap: 12 }}>
              <View style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: t.cardBg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: t.border
              }}>
                <Text style={{ color: t.heading, fontWeight: '700', fontSize: 16 }}>{item.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.heading, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{item.title}</Text>
                <Text style={{ color: t.muted, fontSize: 13, lineHeight: 18 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={{
          backgroundColor: t.navBg + 'CC',
          borderTopWidth: 1,
          borderTopColor: t.border,
          paddingHorizontal: 16,
          paddingVertical: 32,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 8
          }}>
            Gearted
          </Text>
          <Text style={{
            fontSize: 14,
            color: t.muted,
            textAlign: 'center'
          }}>
            Marketplace & échange de matériel airsoft{'\n'}
            sécurisé, simple, et pensé pour la communauté.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
