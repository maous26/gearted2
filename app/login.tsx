import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/auth';
import discordAuthService from '../services/discord-auth';
import { useUser } from '../components/UserProvider';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { updateProfile } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      router.replace('/(tabs)');
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    if (!password) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({ email: email.trim().toLowerCase(), password });
      
      if (response.tokens && response.user) {
        await AsyncStorage.setItem('authToken', response.tokens.accessToken);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        // Update UserProvider with user data
        updateProfile({
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          avatar: response.user.avatar,
          teamName: (response.user as any).teamName || 'Sans équipe',
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          location: response.user.location,
          phone: response.user.phone,
          bio: response.user.bio,
          provider: (response.user as any).provider,
          role: (response.user as any).role,
          badge: (response.user as any).badge,
          badges: (response.user as any).badges,
        });
        router.replace('/(tabs)');
      } else {
        Alert.alert('Erreur', 'Réponse de connexion invalide');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Email ou mot de passe incorrect';
      
      if (error?.message) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
        } else if (error.message.includes('401') || error.message.includes('Invalid')) {
          errorMessage = 'Email ou mot de passe incorrect';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Erreur de connexion', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setDiscordLoading(true);
    try {
      const result = await discordAuthService.loginWithDiscord();
      
      if (result.success && result.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));
        // Update UserProvider with user data
        updateProfile({
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          avatar: result.user.avatar,
          teamName: result.user.teamName || 'Sans équipe',
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          location: result.user.location,
          phone: result.user.phone,
          bio: result.user.bio,
          provider: result.user.provider,
          role: result.user.role,
          badge: result.user.badge,
          badges: result.user.badges,
        });
        router.replace('/(tabs)');
      } else {
        if (result.error === 'Connexion annulée') {
          // User cancelled - do nothing
        } else {
          Alert.alert('Erreur', result.error || 'Échec de la connexion Discord');
        }
      }
    } catch (error: any) {
      console.error('Discord login error:', error);
      Alert.alert('Erreur', 'Impossible de se connecter avec Discord');
    } finally {
      setDiscordLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with image and fade effect */}
      <View style={styles.headerContainer}>
        <Image
          source={require('../assets/accueil.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
        {/* Gradient fade from image to white */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.8)', '#FFFFFF']}
          style={styles.fadeGradient}
        />
        {/* Side gradients for glow effect */}
        <LinearGradient
          colors={['rgba(255,255,255,0.5)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.leftGlow}
        />
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.5)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.rightGlow}
        />
        
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        >
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Discord Button */}
          <TouchableOpacity
            style={styles.discordButton}
            onPress={handleDiscordLogin}
            disabled={discordLoading}
          >
            <Ionicons name="logo-discord" size={22} color="#FFF" />
            {discordLoading ? (
              <ActivityIndicator color="#FFF" style={{ marginLeft: 10 }} />
            ) : (
              <Text style={styles.discordButtonText}>Continuer avec Discord</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    height: height * 0.30,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  leftGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: '100%',
  },
  rightGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 12,
    color: '#1A1A2E',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#00D4AA',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#9CA3AF',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  discordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5865F2',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 24,
    gap: 10,
  },
  discordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  registerLink: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
