import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/auth';
import discordAuthService from '../services/discord-auth';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }
    return { valid: true, message: '' };
  };

  const handleRegister = async () => {
    // Validation
    if (!username.trim()) {
      Alert.alert('Erreur', "Veuillez entrer un nom d'utilisateur");
      return;
    }

    if (username.length < 3) {
      Alert.alert('Erreur', "Le nom d'utilisateur doit contenir au moins 3 caractères");
      return;
    }

    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert('Erreur', passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Erreur', 'Veuillez accepter les conditions d\'utilisation');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        email: email.trim().toLowerCase(),
        password,
        username: username.trim()
      });

      if (response.tokens && response.user) {
        await AsyncStorage.setItem('authToken', response.tokens.accessToken);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        
        Alert.alert(
          'Bienvenue !',
          'Votre compte a été créé avec succès.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert('Erreur', 'Réponse d\'inscription invalide');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      let errorMessage = 'Impossible de créer le compte';

      if (error?.message) {
        if (error.message.includes('email') && error.message.includes('exist')) {
          errorMessage = 'Cet email est déjà utilisé';
        } else if (error.message.includes('username') && error.message.includes('exist')) {
          errorMessage = "Ce nom d'utilisateur est déjà pris";
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Erreur de connexion au serveur';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Erreur d\'inscription', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordRegister = async () => {
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
          Alert.alert('Erreur', result.error || 'Échec de l\'inscription Discord');
        }
      }
    } catch (error: any) {
      console.error('Discord register error:', error);
      Alert.alert('Erreur', 'Impossible de s\'inscrire avec Discord');
    } finally {
      setDiscordLoading(false);
    }
  };

  const getPasswordStrength = (): { level: number; color: string; text: string } => {
    if (!password) return { level: 0, color: '#666', text: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: strength, color: '#FF6B6B', text: 'Faible' };
    if (strength <= 3) return { level: strength, color: '#FFB347', text: 'Moyen' };
    return { level: strength, color: '#00D4AA', text: 'Fort' };
  };

  const passwordStrength = getPasswordStrength();

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
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
          style={styles.gradientOverlay}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Logo Section */}
              <View style={styles.logoSection}>
                <View style={styles.logoContainer}>
                  <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" />
                </View>
                <Text style={styles.brandName}>GEARTED</Text>
              </View>

              {/* Form Card */}
              <BlurView intensity={20} tint="dark" style={styles.formCard}>
                <View style={styles.formContent}>
                  <Text style={styles.title}>Créer un compte</Text>
                  <Text style={styles.subtitle}>Rejoignez la communauté airsoft</Text>

                  {/* Username Input */}
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nom d'utilisateur"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

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

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBars}>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <View
                            key={level}
                            style={[
                              styles.strengthBar,
                              {
                                backgroundColor:
                                  level <= passwordStrength.level
                                    ? passwordStrength.color
                                    : 'rgba(255,255,255,0.1)',
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                        {passwordStrength.text}
                      </Text>
                    </View>
                  )}

                  {/* Confirm Password Input */}
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirmer le mot de passe"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="rgba(255,255,255,0.6)"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Password Match Indicator */}
                  {confirmPassword.length > 0 && (
                    <View style={styles.matchIndicator}>
                      <Ionicons
                        name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color={password === confirmPassword ? '#00D4AA' : '#FF6B6B'}
                      />
                      <Text
                        style={[
                          styles.matchText,
                          { color: password === confirmPassword ? '#00D4AA' : '#FF6B6B' },
                        ]}
                      >
                        {password === confirmPassword
                          ? 'Les mots de passe correspondent'
                          : 'Les mots de passe ne correspondent pas'}
                      </Text>
                    </View>
                  )}

                  {/* Terms Checkbox */}
                  <TouchableOpacity
                    style={styles.termsContainer}
                    onPress={() => setAcceptedTerms(!acceptedTerms)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        acceptedTerms && styles.checkboxChecked,
                      ]}
                    >
                      {acceptedTerms && (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      )}
                    </View>
                    <Text style={styles.termsText}>
                      J'accepte les{' '}
                      <Text
                        style={styles.termsLink}
                        onPress={() => router.push('/legal/cgu')}
                      >
                        conditions d'utilisation
                      </Text>
                      {' '}et la{' '}
                      <Text
                        style={styles.termsLink}
                        onPress={() => router.push('/privacy-policy')}
                      >
                        politique de confidentialité
                      </Text>
                    </Text>
                  </TouchableOpacity>

                  {/* Register Button */}
                  <TouchableOpacity
                    style={[styles.registerButton, !acceptedTerms && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading || !acceptedTerms}
                  >
                    <LinearGradient
                      colors={acceptedTerms ? ['#00D4AA', '#00B894'] : ['#555', '#444']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.registerButtonText}>Créer mon compte</Text>
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
                    onPress={handleDiscordRegister}
                    disabled={discordLoading}
                  >
                    <Ionicons name="logo-discord" size={24} color="#FFF" />
                    {discordLoading ? (
                      <ActivityIndicator color="#FFF" style={{ marginLeft: 10 }} />
                    ) : (
                      <Text style={styles.discordButtonText}>S'inscrire avec Discord</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </BlurView>

              {/* Login Link */}
              <View style={styles.loginSection}>
                <Text style={styles.loginText}>Déjà un compte ?</Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.loginLink}>Se connecter</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,212,170,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,212,170,0.5)',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 14,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    marginLeft: 10,
    fontWeight: '600',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  matchText: {
    fontSize: 12,
    marginLeft: 6,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  termsLink: {
    color: '#00D4AA',
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  },
  discordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  loginLink: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
