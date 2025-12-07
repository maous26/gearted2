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
  ImageBackground,
  StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/auth';
import discordAuthService from '../services/discord-auth';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
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

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const response = await authService.login({ email: 'demo@gearted.eu', password: 'Demo123!' });
      
      if (response.tokens && response.user) {
        await AsyncStorage.setItem('authToken', response.tokens.accessToken);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Demo login error:', error);
      Alert.alert('Erreur', 'Compte démo non disponible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Image */}
      <ImageBackground
        source={require('../assets/accueil.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.gradientOverlay}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Ionicons name="shield-checkmark" size={50} color="#FFFFFF" />
              </View>
              <Text style={styles.brandName}>GEARTED</Text>
              <Text style={styles.tagline}>L'équipement airsoft de confiance</Text>
            </View>

            {/* Form Card */}
            <BlurView intensity={20} tint="dark" style={styles.formCard}>
              <View style={styles.formContent}>
                <Text style={styles.title}>Connexion</Text>
                <Text style={styles.subtitle}>Accédez à votre compte</Text>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mot de passe"
                    placeholderTextColor="rgba(255,255,255,0.4)"
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
                      color="rgba(255,255,255,0.6)"
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
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#00D4AA', '#00B894']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.loginButtonText}>Se connecter</Text>
                    )}
                  </LinearGradient>
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
                  <Ionicons name="logo-discord" size={24} color="#FFF" />
                  {discordLoading ? (
                    <ActivityIndicator color="#FFF" style={{ marginLeft: 10 }} />
                  ) : (
                    <Text style={styles.discordButtonText}>Continuer avec Discord</Text>
                  )}
                </TouchableOpacity>

                {/* Demo Login */}
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={handleDemoLogin}
                  disabled={loading}
                >
                  <Text style={styles.demoButtonText}>🎮 Compte démo</Text>
                </TouchableOpacity>
              </View>
            </BlurView>

            {/* Register Link */}
            <View style={styles.registerSection}>
              <Text style={styles.registerText}>Pas encore de compte ?</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,212,170,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,212,170,0.5)',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  formContent: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#00D4AA',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  discordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5865F2',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  discordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  demoButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  registerLink: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
