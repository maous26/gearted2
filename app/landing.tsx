import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TokenManager from '../services/storage';
import { useUser } from '../components/UserProvider';

const { height } = Dimensions.get('window');

export default function GeartedLanding() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check auth on focus - this handles both initial load and returning from logout
  useFocusEffect(
    useCallback(() => {
      // Reset checking state on each focus (important for logout flow)
      setIsCheckingAuth(true);

      // Wait for UserProvider to finish loading from AsyncStorage
      if (!isLoaded) {
        console.log('[Landing] Waiting for user profile to load...');
        return;
      }

      // User exists, but we need to verify the token is still valid
      const checkAuth = async () => {
        try {
          // Longer delay to ensure SecureStore is fully updated after logout
          // This gives time for the logout process to complete
          await new Promise(resolve => setTimeout(resolve, 500));

          // ALWAYS check token first - this is the source of truth for auth state
          const hasValidToken = await TokenManager.hasValidToken();

          console.log('[Landing] Auth check:', { hasValidToken, hasUser: !!user, isLoaded });

          // Only redirect if token is valid (token is the source of truth, not React state)
          // The token check is async and reads directly from SecureStore
          if (hasValidToken) {
            console.log('[Landing] Valid token found, redirecting to home');
            // Small delay to ensure navigation is ready
            setTimeout(() => {
              try {
                router.replace('/(tabs)');
              } catch (navError) {
                console.warn('[Landing] Navigation error, retrying...', navError);
                router.push('/(tabs)');
              }
            }, 100);
          } else {
            console.log('[Landing] No valid token, showing landing page');
            setIsCheckingAuth(false);
          }
        } catch (error) {
          console.error('[Landing] Auth check error:', error);
          setIsCheckingAuth(false);
        }
      };

      checkAuth();
    }, [isLoaded])
  );

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/accueil4.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.spacer} />

        <View style={styles.overlay}>
          <View style={styles.titleSection}>
            <Text style={styles.brandName}>GEARTED</Text>
            <Text style={styles.title}>
              Ton équipement,{'\n'}ta communauté.
            </Text>
            <Text style={styles.subtitle}>
              La marketplace airsoft de confiance pour acheter et vendre ton matériel.
            </Text>
          </View>

          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotInactive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotInactive]} />
          </View>

          <View style={styles.featuresContainer}>
            <FeatureItem
              icon="flash-outline"
              title="Annonce en 2 minutes"
              description="Publie ton équipement rapidement."
            />
            <FeatureItem
              icon="shield-checkmark-outline"
              title="Paiement sécurisé"
              description="Protégé jusqu'à réception."
            />
            <FeatureItem
              icon="people-outline"
              title="Communauté vérifiée"
              description="Des joueurs passionnés comme toi."
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.primaryButtonText}>Commencer l'aventure</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={22} color="#00D4AA" />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A2E', // Fallback color matching the image
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  spacer: {
    height: height * 0.25,
  },
  overlay: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00D4AA',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#00D4AA',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#E5E7EB',
  },
  featuresContainer: {
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,212,170,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  primaryButton: {
    backgroundColor: '#00D4AA',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
