import React, { useEffect, useState } from 'react';import { LinearGradient } from "expo-linear-gradient";

import {import { useRouter } from "expo-router";

  View,import React, { useEffect, useState } from "react";

  Text,import {

  TouchableOpacity,    Dimensions,

  StyleSheet,    ScrollView,

  Dimensions,    StatusBar,

  ImageBackground,    Text,

  StatusBar,    TextInput,

  ScrollView,    TouchableOpacity,

  ActivityIndicator,    View

} from 'react-native';} from "react-native";

import { BlurView } from 'expo-blur';import { SafeAreaView } from "react-native-safe-area-context";

import { LinearGradient } from 'expo-linear-gradient';import { CategoryPill } from "../components/CategoryPill";

import { useRouter } from 'expo-router';import { CATEGORIES, TRUST } from "../data";

import { Ionicons } from '@expo/vector-icons';import TokenManager from "../services/storage";

import TokenManager from '../services/storage';import { THEMES, ThemeKey } from "../themes";



const { width, height } = Dimensions.get('window');const { width } = Dimensions.get('window');



export default function GeartedLanding() {export default function GeartedLanding() {

  const router = useRouter();  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);  const [theme, setTheme] = useState<ThemeKey>("ranger");

  const [searchText, setSearchText] = useState("");

  useEffect(() => {  const [location, setLocation] = useState("");

    const checkAuth = async () => {  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

      try {  

        const hasValidToken = await TokenManager.hasValidToken();  const t = THEMES[theme];

        

        if (hasValidToken) {  // Vérifier si l'utilisateur est déjà connecté au démarrage

          console.log('[Landing] Valid token found, redirecting to home');  useEffect(() => {

          router.replace('/(tabs)');    const checkAuth = async () => {

        } else {      try {

          console.log('[Landing] No valid token, showing landing page');        const hasValidToken = await TokenManager.hasValidToken();

          setIsCheckingAuth(false);        

        }        if (hasValidToken) {

      } catch (error) {          // Token valide trouvé, rediriger vers l'app

        console.error('[Landing] Auth check error:', error);          // Le UserProvider chargera automatiquement le profil depuis AsyncStorage

        setIsCheckingAuth(false);          console.log('[Landing] Valid token found, redirecting to home');

      }          router.replace("/(tabs)" as any);

    };        } else {

          console.log('[Landing] No valid token, showing landing page');

    checkAuth();          setIsCheckingAuth(false);

  }, []);        }

      } catch (error) {

  if (isCheckingAuth) {        console.error('[Landing] Auth check error:', error);

    return (        setIsCheckingAuth(false);

      <View style={styles.loadingContainer}>      }

        <ActivityIndicator size="large" color="#00D4AA" />    };

      </View>

    );    checkAuth();

  }  }, []);



  return (  // Afficher un écran vide pendant la vérification

    <View style={styles.container}>  if (isCheckingAuth) {

      <StatusBar barStyle="light-content" />    return (

            <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>

      {/* Background Image */}        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

      <ImageBackground          <Text style={{ color: t.muted }}>Chargement...</Text>

        source={require('../assets/GEARTEDicon8.png')}        </View>

        style={styles.backgroundImage}      </SafeAreaView>

        resizeMode="cover"    );

      >  }

        {/* Gradient Overlay */}

        <LinearGradient  return (

          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>

          style={styles.gradientOverlay}      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

        >

          <ScrollView       <ScrollView style={{ flex: 1 }}>

            contentContainerStyle={styles.scrollContent}        {/* Hero Section */}

            showsVerticalScrollIndicator={false}        <LinearGradient

          >          colors={[t.heroGradStart + 'CC', t.heroGradEnd + '66']}

            {/* Logo Section */}          style={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: 24 }}

            <View style={styles.logoSection}>        >

              <View style={styles.logoContainer}>          <View>

                <Ionicons name="shield-checkmark" size={60} color="#FFFFFF" />            <Text style={{

              </View>              fontSize: 26,

              <Text style={styles.brandName}>GEARTED</Text>              fontWeight: '700',

              <Text style={styles.tagline}>La marketplace airsoft de confiance</Text>              color: t.heading,

            </View>              textAlign: 'center',

              marginBottom: 10,

            {/* Features Section */}              letterSpacing: 0.5,

            <View style={styles.featuresSection}>              textTransform: 'uppercase'

              <FeatureItem             }}>

                icon="flash"               TON ÉQUIPEMENT{'\n'}MÉRITE UNE{'\n'}

                title="Annonce live en 2 min"               <Text style={{ color: t.primaryBtn }}>SECONDE VIE</Text>

                description="Publie ton équipement rapidement"            </Text>

              />

              <FeatureItem             <Text style={{

                icon="shield-checkmark"               fontSize: 15,

                title="Paiement sécurisé"               color: t.muted,

                description="Protégé jusqu'à réception"              textAlign: 'center',

              />              marginBottom: 20

              <FeatureItem             }}>

                icon="people"               La marketplace des airsofteurs

                title="Communauté vérifiée"             </Text>

                description="Joueurs authentiques"

              />            {/* Key Points - Plus dynamiques */}

              <FeatureItem             <View style={{ marginBottom: 24 }}>

                icon="location"               {[

                title="Près de chez toi"                 { icon: "⚡", label: "Ton annonce live en 2 minutes" },

                description="Trouve facilement autour de toi"                { icon: "🔒", label: "Paiement protégé jusqu'à réception" },

              />                { icon: "✅", label: "Joueurs vérifiés, avis authentiques" },

            </View>                { icon: "🎯", label: "Trouve exactement ce qu'il te faut" },

              ].map((item, i) => (

            {/* CTA Section */}                <View

            <BlurView intensity={20} tint="dark" style={styles.ctaCard}>                  key={i}

              <View style={styles.ctaContent}>                  style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}

                <Text style={styles.ctaTitle}>Rejoins la communauté</Text>                >

                <Text style={styles.ctaSubtitle}>                  <Text style={{ fontSize: 16, marginRight: 10 }}>{item.icon}</Text>

                  Des milliers d'airsofteurs t'attendent                  <Text style={{ color: t.subtle, fontSize: 14 }}>{item.label}</Text>

                </Text>                </View>

              ))}

                {/* Primary Button */}            </View>

                <TouchableOpacity

                  style={styles.primaryButton}            {/* Primary CTA Row */}

                  onPress={() => router.push('/register')}            <View

                >              style={{

                  <LinearGradient                flexDirection: "row",

                    colors={['#00D4AA', '#00B894']}                flexWrap: "wrap",

                    start={{ x: 0, y: 0 }}                gap: 12,

                    end={{ x: 1, y: 0 }}                marginBottom: 28,

                    style={styles.buttonGradient}                justifyContent: "center",

                  >              }}

                    <Ionicons name="person-add" size={20} color="#FFF" />            >

                    <Text style={styles.primaryButtonText}>Créer un compte</Text>              <TouchableOpacity

                  </LinearGradient>                style={{

                </TouchableOpacity>                  backgroundColor: t.primaryBtn,

                  paddingHorizontal: 24,

                {/* Secondary Button */}                  paddingVertical: 14,

                <TouchableOpacity                  borderRadius: 14,

                  style={styles.secondaryButton}                  flexDirection: "row",

                  onPress={() => router.push('/login')}                  alignItems: "center",

                >                }}

                  <Ionicons name="log-in" size={20} color="#FFF" />                onPress={() => router.push("/register" as any)}

                  <Text style={styles.secondaryButtonText}>Se connecter</Text>              >

                </TouchableOpacity>                <Text style={{ color: t.white, fontWeight: "600", marginRight: 8 }}>🎯</Text>

                <Text style={{ color: t.white, fontWeight: "600" }}>Rejoindre la communauté</Text>

                {/* Browse without account */}              </TouchableOpacity>

                <TouchableOpacity              <TouchableOpacity

                  style={styles.browseButton}                style={{

                  onPress={() => router.push('/(tabs)')}                  borderWidth: 1,

                >                  borderColor: t.border,

                  <Text style={styles.browseButtonText}>                  backgroundColor: t.white,

                    Explorer sans compte →                  paddingHorizontal: 24,

                  </Text>                  paddingVertical: 14,

                </TouchableOpacity>                  borderRadius: 14,

              </View>                }}

            </BlurView>                onPress={() => router.push("/login" as any)}

              >

            {/* Trust Badges */}                <Text style={{ color: t.heading, fontWeight: "600" }}>Connexion</Text>

            <View style={styles.trustSection}>              </TouchableOpacity>

              <View style={styles.trustBadge}>            </View>

                <Text style={styles.trustNumber}>10K+</Text>

                <Text style={styles.trustLabel}>Utilisateurs</Text>            {/* Search Section */}

              </View>            <View style={{ marginBottom: 24 }}>

              <View style={styles.trustDivider} />              <View style={{

              <View style={styles.trustBadge}>                backgroundColor: t.white,

                <Text style={styles.trustNumber}>50K+</Text>                borderRadius: 12,

                <Text style={styles.trustLabel}>Annonces</Text>                borderWidth: 1,

              </View>                borderColor: t.border,

              <View style={styles.trustDivider} />                padding: 12,

              <View style={styles.trustBadge}>                marginBottom: 12

                <Text style={styles.trustNumber}>4.8★</Text>              }}>

                <Text style={styles.trustLabel}>Note moyenne</Text>                <Text style={{ color: t.muted, fontSize: 12, marginBottom: 8 }}>🔍 Rechercher</Text>

              </View>                <TextInput

            </View>                  placeholder="Rechercher un modèle, ex. M4, G17, VSR-10..."

                  value={searchText}

          </ScrollView>                  onChangeText={setSearchText}

        </LinearGradient>                  style={{ 

      </ImageBackground>                    fontSize: 16, 

    </View>                    color: t.heading,

  );                    paddingVertical: 4

}                  }}

                  placeholderTextColor={t.extraMuted}

interface FeatureItemProps {                />

  icon: keyof typeof Ionicons.glyphMap;              </View>

  title: string;              

  description: string;              <View style={{

}                backgroundColor: t.white,

                borderRadius: 12,

function FeatureItem({ icon, title, description }: FeatureItemProps) {                borderWidth: 1,

  return (                borderColor: t.border,

    <View style={styles.featureItem}>                padding: 12,

      <View style={styles.featureIconContainer}>                marginBottom: 12

        <Ionicons name={icon} size={24} color="#00D4AA" />              }}>

      </View>                <Text style={{ color: t.muted, fontSize: 12, marginBottom: 8 }}>📍 Localisation</Text>

      <View style={styles.featureTextContainer}>                <TextInput

        <Text style={styles.featureTitle}>{title}</Text>                  placeholder="Localisation (ex. Paris)"

        <Text style={styles.featureDescription}>{description}</Text>                  value={location}

      </View>                  onChangeText={setLocation}

    </View>                  style={{ 

  );                    fontSize: 16, 

}                    color: t.heading,

                    paddingVertical: 4

const styles = StyleSheet.create({                  }}

  container: {                  placeholderTextColor={t.extraMuted}

    flex: 1,                />

    backgroundColor: '#000',              </View>

  },

  loadingContainer: {              <TouchableOpacity style={{

    flex: 1,                backgroundColor: t.primaryBtn,

    backgroundColor: '#000',                paddingVertical: 14,

    justifyContent: 'center',                borderRadius: 12,

    alignItems: 'center',                alignItems: 'center'

  },              }}

  backgroundImage: {              onPress={() => {

    flex: 1,                console.log('Search pressed with:', searchText, location);

    width: '100%',                router.push({

    height: '100%',                  pathname: '/(tabs)/browse',

  },                  params: { 

  gradientOverlay: {                    search: searchText,

    flex: 1,                    location: location 

  },                  }

  scrollContent: {                } as any);

    flexGrow: 1,              }}

    paddingHorizontal: 24,              >

    paddingTop: 60,                <Text style={{ color: t.white, fontWeight: '600', fontSize: 16 }}>Chercher</Text>

    paddingBottom: 40,              </TouchableOpacity>

    justifyContent: 'space-between',            </View>

  },

  logoSection: {            {/* Trust Indicators */}

    alignItems: 'center',            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>

    marginBottom: 30,              {TRUST.map((item, index) => (

  },                <View key={index} style={{ 

  logoContainer: {                  flexDirection: 'row', 

    width: 100,                  alignItems: 'center' 

    height: 100,                }}>

    borderRadius: 50,                  <View style={{

    backgroundColor: 'rgba(0,212,170,0.2)',                    width: 8,

    justifyContent: 'center',                    height: 8,

    alignItems: 'center',                    borderRadius: 4,

    marginBottom: 16,                    backgroundColor: t.primaryBtn,

    borderWidth: 2,                    marginRight: 8

    borderColor: 'rgba(0,212,170,0.5)',                  }} />

  },                  <Text style={{ color: t.muted, fontSize: 12 }}>{item.label}</Text>

  brandName: {                </View>

    fontSize: 40,              ))}

    fontWeight: '800',            </View>

    color: '#FFFFFF',          </View>

    letterSpacing: 6,        </LinearGradient>

  },

  tagline: {        {/* Categories Section */}

    fontSize: 16,        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>

    color: 'rgba(255,255,255,0.7)',          <Text style={{

    marginTop: 8,            fontSize: 18,

    textAlign: 'center',            fontWeight: '700',

  },            color: t.heading,

  featuresSection: {            marginBottom: 16,

    marginBottom: 30,            fontFamily: 'Oswald-Bold',

  },            letterSpacing: 0.5,

  featureItem: {            textTransform: 'uppercase'

    flexDirection: 'row',          }}>

    alignItems: 'center',            PARCOURIR PAR CATÉGORIE

    marginBottom: 16,          </Text>

    backgroundColor: 'rgba(255,255,255,0.05)',          

    padding: 14,          <View style={{ 

    borderRadius: 12,            flexDirection: 'row', 

  },            flexWrap: 'wrap', 

  featureIconContainer: {            gap: 12 

    width: 44,          }}>

    height: 44,            {CATEGORIES.map((category) => (

    borderRadius: 22,              <CategoryPill

    backgroundColor: 'rgba(0,212,170,0.15)',                key={category.slug}

    justifyContent: 'center',                label={category.label}

    alignItems: 'center',                icon={category.icon}

    marginRight: 14,                theme={theme}

  },                onPress={() => {

  featureTextContainer: {                  console.log(`Category pressed: ${category.label}`);

    flex: 1,                  router.push({

  },                    pathname: '/(tabs)/browse',

  featureTitle: {                    params: { category: category.slug }

    fontSize: 16,                  } as any);

    fontWeight: '600',                }}

    color: '#FFFFFF',              />

    marginBottom: 2,            ))}

  },          </View>

  featureDescription: {        </View>

    fontSize: 13,

    color: 'rgba(255,255,255,0.6)',        {/* Sample Listings */}

  },        <View style={{ 

  ctaCard: {          backgroundColor: t.sectionLight + '66', 

    borderRadius: 24,          paddingHorizontal: 16, 

    overflow: 'hidden',          paddingVertical: 24 

    borderWidth: 1,        }}>

    borderColor: 'rgba(255,255,255,0.1)',          <Text style={{

    marginBottom: 30,            fontSize: 18,

  },            fontWeight: '700',

  ctaContent: {            color: t.heading,

    padding: 24,            marginBottom: 16,

    backgroundColor: 'rgba(0,0,0,0.3)',            fontFamily: 'Oswald-Bold',

  },            letterSpacing: 0.5,

  ctaTitle: {            textTransform: 'uppercase'

    fontSize: 24,          }}>

    fontWeight: '700',            ANNONCES RÉCENTES

    color: '#FFFFFF',          </Text>

    textAlign: 'center',          

    marginBottom: 4,          <View style={{ 

  },            flexDirection: 'row', 

  ctaSubtitle: {            flexWrap: 'wrap', 

    fontSize: 14,            gap: 12 

    color: 'rgba(255,255,255,0.6)',          }}>

    textAlign: 'center',            {[1, 2, 3, 4].map((i) => (

    marginBottom: 24,              <View

  },                key={i}

  primaryButton: {                style={{

    borderRadius: 12,                  width: (width - 44) / 2,

    overflow: 'hidden',                  backgroundColor: t.white,

    marginBottom: 12,                  borderRadius: 16,

  },                  padding: 12,

  buttonGradient: {                  borderWidth: 1,

    flexDirection: 'row',                  borderColor: t.border

    alignItems: 'center',                }}

    justifyContent: 'center',              >

    paddingVertical: 16,                <View style={{

    gap: 10,                  height: 100,

  },                  backgroundColor: t.cardBg,

  primaryButtonText: {                  borderRadius: 12,

    color: '#FFFFFF',                  marginBottom: 12

    fontSize: 16,                }} />

    fontWeight: '700',                <View style={{ 

  },                  flexDirection: 'row', 

  secondaryButton: {                  justifyContent: 'space-between',

    flexDirection: 'row',                  alignItems: 'center' 

    alignItems: 'center',                }}>

    justifyContent: 'center',                  <View>

    backgroundColor: 'rgba(255,255,255,0.1)',                    <Text style={{ 

    paddingVertical: 14,                      fontSize: 14, 

    borderRadius: 12,                      fontWeight: '600', 

    marginBottom: 16,                      color: t.heading 

    gap: 10,                    }}>

  },                      Annonce #{i}

  secondaryButtonText: {                    </Text>

    color: '#FFFFFF',                    <Text style={{ 

    fontSize: 16,                      fontSize: 12, 

    fontWeight: '600',                      color: t.extraMuted 

  },                    }}>

  browseButton: {                      Très bon état

    alignItems: 'center',                    </Text>

    paddingVertical: 8,                  </View>

  },                  <TouchableOpacity style={{

  browseButtonText: {                    backgroundColor: t.pillBg,

    color: 'rgba(255,255,255,0.5)',                    paddingHorizontal: 12,

    fontSize: 14,                    paddingVertical: 6,

  },                    borderRadius: 8

  trustSection: {                  }}

    flexDirection: 'row',                  onPress={() => {

    justifyContent: 'center',                    console.log(`Viewing sample listing #${i}`);

    alignItems: 'center',                    router.push('/(tabs)/browse' as any);

    paddingVertical: 16,                  }}

  },                  >

  trustBadge: {                    <Text style={{ 

    alignItems: 'center',                      fontSize: 12, 

    paddingHorizontal: 20,                      color: t.heading,

  },                      fontWeight: '500' 

  trustNumber: {                    }}>

    fontSize: 22,                      Voir

    fontWeight: '700',                    </Text>

    color: '#00D4AA',                  </TouchableOpacity>

  },                </View>

  trustLabel: {              </View>

    fontSize: 12,            ))}

    color: 'rgba(255,255,255,0.5)',          </View>

    marginTop: 4,        </View>

  },

  trustDivider: {        {/* How it works */}

    width: 1,        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>

    height: 30,          <Text style={{

    backgroundColor: 'rgba(255,255,255,0.2)',            fontSize: 18,

  },            fontWeight: '700',

});            color: t.heading,

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
