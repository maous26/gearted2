import React, { useEffect, useState } from 'react';import React, { useEffect, useState } from 'react';import { LinearGradient } from "expo-linear-gradient";

import {

  View,import {import { useRouter } from "expo-router";

  Text,

  TouchableOpacity,  View,import React, { useEffect, useState } from "react";

  StyleSheet,

  Dimensions,  Text,import {

  Image,

  StatusBar,  TouchableOpacity,    Dimensions,

  ScrollView,

  ActivityIndicator,  StyleSheet,    ScrollView,

} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';  Dimensions,    StatusBar,

import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';  ImageBackground,    Text,

import TokenManager from '../services/storage';

  StatusBar,    TextInput,

const { width, height } = Dimensions.get('window');

  ScrollView,    TouchableOpacity,

export default function GeartedLanding() {

  const router = useRouter();  ActivityIndicator,    View

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

} from 'react-native';} from "react-native";

  useEffect(() => {

    const checkAuth = async () => {import { BlurView } from 'expo-blur';import { SafeAreaView } from "react-native-safe-area-context";

      try {

        const hasValidToken = await TokenManager.hasValidToken();import { LinearGradient } from 'expo-linear-gradient';import { CategoryPill } from "../components/CategoryPill";

        

        if (hasValidToken) {import { useRouter } from 'expo-router';import { CATEGORIES, TRUST } from "../data";

          console.log('[Landing] Valid token found, redirecting to home');

          router.replace('/(tabs)');import { Ionicons } from '@expo/vector-icons';import TokenManager from "../services/storage";

        } else {

          console.log('[Landing] No valid token, showing landing page');import TokenManager from '../services/storage';import { THEMES, ThemeKey } from "../themes";

          setIsCheckingAuth(false);

        }

      } catch (error) {

        console.error('[Landing] Auth check error:', error);const { width, height } = Dimensions.get('window');const { width } = Dimensions.get('window');

        setIsCheckingAuth(false);

      }

    };

export default function GeartedLanding() {export default function GeartedLanding() {

    checkAuth();

  }, []);  const router = useRouter();  const router = useRouter();



  if (isCheckingAuth) {  const [isCheckingAuth, setIsCheckingAuth] = useState(true);  const [theme, setTheme] = useState<ThemeKey>("ranger");

    return (

      <View style={styles.loadingContainer}>  const [searchText, setSearchText] = useState("");

        <ActivityIndicator size="large" color="#00D4AA" />

      </View>  useEffect(() => {  const [location, setLocation] = useState("");

    );

  }    const checkAuth = async () => {  const [isCheckingAuth, setIsCheckingAuth] = useState(true);



  return (      try {  

    <View style={styles.container}>

      <StatusBar barStyle="dark-content" />        const hasValidToken = await TokenManager.hasValidToken();  const t = THEMES[theme];

      

      {/* Header with image and fade effect */}        

      <View style={styles.headerContainer}>

        <Image        if (hasValidToken) {  // Vérifier si l'utilisateur est déjà connecté au démarrage

          source={require('../assets/GEARTEDicon8.png')}

          style={styles.headerImage}          console.log('[Landing] Valid token found, redirecting to home');  useEffect(() => {

          resizeMode="cover"

        />          router.replace('/(tabs)');    const checkAuth = async () => {

        {/* Gradient fade from image to white */}

        <LinearGradient        } else {      try {

          colors={['transparent', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.8)', '#FFFFFF']}

          style={styles.fadeGradient}          console.log('[Landing] No valid token, showing landing page');        const hasValidToken = await TokenManager.hasValidToken();

        />

        {/* Side gradients for glow effect */}          setIsCheckingAuth(false);        

        <LinearGradient

          colors={['rgba(99,102,241,0.4)', 'transparent']}        }        if (hasValidToken) {

          start={{ x: 0, y: 0.5 }}

          end={{ x: 1, y: 0.5 }}      } catch (error) {          // Token valide trouvé, rediriger vers l'app

          style={styles.leftGlow}

        />        console.error('[Landing] Auth check error:', error);          // Le UserProvider chargera automatiquement le profil depuis AsyncStorage

        <LinearGradient

          colors={['transparent', 'rgba(168,85,247,0.4)']}        setIsCheckingAuth(false);          console.log('[Landing] Valid token found, redirecting to home');

          start={{ x: 0, y: 0.5 }}

          end={{ x: 1, y: 0.5 }}      }          router.replace("/(tabs)" as any);

          style={styles.rightGlow}

        />    };        } else {

      </View>

          console.log('[Landing] No valid token, showing landing page');

      {/* Content */}

      <ScrollView     checkAuth();          setIsCheckingAuth(false);

        style={styles.content}

        contentContainerStyle={styles.contentContainer}  }, []);        }

        showsVerticalScrollIndicator={false}

      >      } catch (error) {

        {/* Title Section */}

        <View style={styles.titleSection}>  if (isCheckingAuth) {        console.error('[Landing] Auth check error:', error);

          <Text style={styles.title}>

            Ton équipement,{'\n'}ta communauté.    return (        setIsCheckingAuth(false);

          </Text>

          <Text style={styles.subtitle}>      <View style={styles.loadingContainer}>      }

            La marketplace airsoft de confiance pour acheter et vendre ton matériel.

          </Text>        <ActivityIndicator size="large" color="#00D4AA" />    };

        </View>

      </View>

        {/* Pagination dots */}

        <View style={styles.dotsContainer}>    );    checkAuth();

          <View style={[styles.dot, styles.dotInactive]} />

          <View style={[styles.dot, styles.dotActive]} />  }  }, []);

          <View style={[styles.dot, styles.dotInactive]} />

        </View>



        {/* Features */}  return (  // Afficher un écran vide pendant la vérification

        <View style={styles.featuresContainer}>

          <FeatureItem     <View style={styles.container}>  if (isCheckingAuth) {

            icon="flash-outline"

            title="Annonce en 2 minutes"      <StatusBar barStyle="light-content" />    return (

            description="Publie ton équipement rapidement."

          />            <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>

          <FeatureItem 

            icon="shield-checkmark-outline"      {/* Background Image */}        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

            title="Paiement sécurisé"

            description="Protégé jusqu'à réception."      <ImageBackground          <Text style={{ color: t.muted }}>Chargement...</Text>

          />

          <FeatureItem         source={require('../assets/GEARTEDicon8.png')}        </View>

            icon="people-outline"

            title="Communauté vérifiée"        style={styles.backgroundImage}      </SafeAreaView>

            description="Des joueurs passionnés comme toi."

          />        resizeMode="cover"    );

        </View>

      >  }

        {/* CTA Buttons */}

        <TouchableOpacity        {/* Gradient Overlay */}

          style={styles.primaryButton}

          onPress={() => router.push('/register')}        <LinearGradient  return (

        >

          <Text style={styles.primaryButtonText}>Commencer l'aventure</Text>          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>

        </TouchableOpacity>

          style={styles.gradientOverlay}      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

        <TouchableOpacity

          style={styles.secondaryButton}        >

          onPress={() => router.push('/login')}

        >          <ScrollView       <ScrollView style={{ flex: 1 }}>

          <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>

        </TouchableOpacity>            contentContainerStyle={styles.scrollContent}        {/* Hero Section */}

      </ScrollView>

    </View>            showsVerticalScrollIndicator={false}        <LinearGradient

  );

}          >          colors={[t.heroGradStart + 'CC', t.heroGradEnd + '66']}



interface FeatureItemProps {            {/* Logo Section */}          style={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: 24 }}

  icon: keyof typeof Ionicons.glyphMap;

  title: string;            <View style={styles.logoSection}>        >

  description: string;

}              <View style={styles.logoContainer}>          <View>



function FeatureItem({ icon, title, description }: FeatureItemProps) {                <Ionicons name="shield-checkmark" size={60} color="#FFFFFF" />            <Text style={{

  return (

    <View style={styles.featureItem}>              </View>              fontSize: 26,

      <View style={styles.featureIconContainer}>

        <Ionicons name={icon} size={22} color="#00D4AA" />              <Text style={styles.brandName}>GEARTED</Text>              fontWeight: '700',

      </View>

      <View style={styles.featureTextContainer}>              <Text style={styles.tagline}>La marketplace airsoft de confiance</Text>              color: t.heading,

        <Text style={styles.featureTitle}>{title}</Text>

        <Text style={styles.featureDescription}>{description}</Text>            </View>              textAlign: 'center',

      </View>

    </View>              marginBottom: 10,

  );

}            {/* Features Section */}              letterSpacing: 0.5,



const styles = StyleSheet.create({            <View style={styles.featuresSection}>              textTransform: 'uppercase'

  container: {

    flex: 1,              <FeatureItem             }}>

    backgroundColor: '#FFFFFF',

  },                icon="flash"               TON ÉQUIPEMENT{'\n'}MÉRITE UNE{'\n'}

  loadingContainer: {

    flex: 1,                title="Annonce live en 2 min"               <Text style={{ color: t.primaryBtn }}>SECONDE VIE</Text>

    backgroundColor: '#FFFFFF',

    justifyContent: 'center',                description="Publie ton équipement rapidement"            </Text>

    alignItems: 'center',

  },              />

  headerContainer: {

    height: height * 0.38,              <FeatureItem             <Text style={{

    position: 'relative',

  },                icon="shield-checkmark"               fontSize: 15,

  headerImage: {

    width: '100%',                title="Paiement sécurisé"               color: t.muted,

    height: '100%',

  },                description="Protégé jusqu'à réception"              textAlign: 'center',

  fadeGradient: {

    position: 'absolute',              />              marginBottom: 20

    bottom: 0,

    left: 0,              <FeatureItem             }}>

    right: 0,

    height: 120,                icon="people"               La marketplace des airsofteurs

  },

  leftGlow: {                title="Communauté vérifiée"             </Text>

    position: 'absolute',

    top: 0,                description="Joueurs authentiques"

    left: 0,

    width: 80,              />            {/* Key Points - Plus dynamiques */}

    height: '100%',

  },              <FeatureItem             <View style={{ marginBottom: 24 }}>

  rightGlow: {

    position: 'absolute',                icon="location"               {[

    top: 0,

    right: 0,                title="Près de chez toi"                 { icon: "⚡", label: "Ton annonce live en 2 minutes" },

    width: 80,

    height: '100%',                description="Trouve facilement autour de toi"                { icon: "🔒", label: "Paiement protégé jusqu'à réception" },

  },

  content: {              />                { icon: "✅", label: "Joueurs vérifiés, avis authentiques" },

    flex: 1,

  },            </View>                { icon: "🎯", label: "Trouve exactement ce qu'il te faut" },

  contentContainer: {

    paddingHorizontal: 24,              ].map((item, i) => (

    paddingBottom: 40,

  },            {/* CTA Section */}                <View

  titleSection: {

    marginBottom: 20,            <BlurView intensity={20} tint="dark" style={styles.ctaCard}>                  key={i}

  },

  title: {              <View style={styles.ctaContent}>                  style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}

    fontSize: 28,

    fontWeight: '700',                <Text style={styles.ctaTitle}>Rejoins la communauté</Text>                >

    color: '#1A1A2E',

    textAlign: 'center',                <Text style={styles.ctaSubtitle}>                  <Text style={{ fontSize: 16, marginRight: 10 }}>{item.icon}</Text>

    marginBottom: 12,

    lineHeight: 36,                  Des milliers d'airsofteurs t'attendent                  <Text style={{ color: t.subtle, fontSize: 14 }}>{item.label}</Text>

  },

  subtitle: {                </Text>                </View>

    fontSize: 15,

    color: '#6B7280',              ))}

    textAlign: 'center',

    lineHeight: 22,                {/* Primary Button */}            </View>

    paddingHorizontal: 10,

  },                <TouchableOpacity

  dotsContainer: {

    flexDirection: 'row',                  style={styles.primaryButton}            {/* Primary CTA Row */}

    justifyContent: 'center',

    alignItems: 'center',                  onPress={() => router.push('/register')}            <View

    marginBottom: 28,

    gap: 8,                >              style={{

  },

  dot: {                  <LinearGradient                flexDirection: "row",

    width: 8,

    height: 8,                    colors={['#00D4AA', '#00B894']}                flexWrap: "wrap",

    borderRadius: 4,

  },                    start={{ x: 0, y: 0 }}                gap: 12,

  dotActive: {

    backgroundColor: '#00D4AA',                    end={{ x: 1, y: 0 }}                marginBottom: 28,

    width: 24,

  },                    style={styles.buttonGradient}                justifyContent: "center",

  dotInactive: {

    backgroundColor: '#E5E7EB',                  >              }}

  },

  featuresContainer: {                    <Ionicons name="person-add" size={20} color="#FFF" />            >

    marginBottom: 28,

  },                    <Text style={styles.primaryButtonText}>Créer un compte</Text>              <TouchableOpacity

  featureItem: {

    flexDirection: 'row',                  </LinearGradient>                style={{

    alignItems: 'center',

    backgroundColor: '#F9FAFB',                </TouchableOpacity>                  backgroundColor: t.primaryBtn,

    padding: 16,

    borderRadius: 16,                  paddingHorizontal: 24,

    marginBottom: 12,

    borderWidth: 1,                {/* Secondary Button */}                  paddingVertical: 14,

    borderColor: '#F3F4F6',

  },                <TouchableOpacity                  borderRadius: 14,

  featureIconContainer: {

    width: 44,                  style={styles.secondaryButton}                  flexDirection: "row",

    height: 44,

    borderRadius: 12,                  onPress={() => router.push('/login')}                  alignItems: "center",

    backgroundColor: 'rgba(0,212,170,0.1)',

    justifyContent: 'center',                >                }}

    alignItems: 'center',

    marginRight: 14,                  <Ionicons name="log-in" size={20} color="#FFF" />                onPress={() => router.push("/register" as any)}

  },

  featureTextContainer: {                  <Text style={styles.secondaryButtonText}>Se connecter</Text>              >

    flex: 1,

  },                </TouchableOpacity>                <Text style={{ color: t.white, fontWeight: "600", marginRight: 8 }}>🎯</Text>

  featureTitle: {

    fontSize: 16,                <Text style={{ color: t.white, fontWeight: "600" }}>Rejoindre la communauté</Text>

    fontWeight: '600',

    color: '#1A1A2E',                {/* Browse without account */}              </TouchableOpacity>

    marginBottom: 2,

  },                <TouchableOpacity              <TouchableOpacity

  featureDescription: {

    fontSize: 13,                  style={styles.browseButton}                style={{

    color: '#6B7280',

  },                  onPress={() => router.push('/(tabs)')}                  borderWidth: 1,

  primaryButton: {

    backgroundColor: '#00D4AA',                >                  borderColor: t.border,

    paddingVertical: 16,

    borderRadius: 14,                  <Text style={styles.browseButtonText}>                  backgroundColor: t.white,

    alignItems: 'center',

    marginBottom: 12,                    Explorer sans compte →                  paddingHorizontal: 24,

  },

  primaryButtonText: {                  </Text>                  paddingVertical: 14,

    color: '#FFFFFF',

    fontSize: 16,                </TouchableOpacity>                  borderRadius: 14,

    fontWeight: '700',

  },              </View>                }}

  secondaryButton: {

    paddingVertical: 14,            </BlurView>                onPress={() => router.push("/login" as any)}

    alignItems: 'center',

  },              >

  secondaryButtonText: {

    color: '#6B7280',            {/* Trust Badges */}                <Text style={{ color: t.heading, fontWeight: "600" }}>Connexion</Text>

    fontSize: 15,

  },            <View style={styles.trustSection}>              </TouchableOpacity>

});

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
