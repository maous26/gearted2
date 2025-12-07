import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
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
    if (!password) return { level: 0, color: '#E5E7EB', text: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: strength, color: '#EF4444', text: 'Faible' };
    if (strength <= 3) return { level: strength, color: '#F59E0B', text: 'Moyen' };
    return { level: strength, color: '#00D4AA', text: 'Fort' };
  };

  const passwordStrength = getPasswordStrength();

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
          onPress={() => router.back()}
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
          {/* Title */}
          <Text style={styles.subtitle}>Rejoins la communauté airsoft</Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

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
                            : '#E5E7EB',
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
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#9CA3AF"
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
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Password Match Indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchIndicator}>
              <Ionicons
                name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={password === confirmPassword ? '#00D4AA' : '#EF4444'}
              />
              <Text
                style={[
                  styles.matchText,
                  { color: password === confirmPassword ? '#00D4AA' : '#EF4444' },
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
            style={[styles.primaryButton, !acceptedTerms && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading || !acceptedTerms}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Créer mon compte</Text>
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
            onPress={handleDiscordRegister}
            disabled={discordLoading}
          >
            <Ionicons name="logo-discord" size={22} color="#FFF" />
            {discordLoading ? (
              <ActivityIndicator color="#FFF" style={{ marginLeft: 10 }} />
            ) : (
              <Text style={styles.discordButtonText}>S'inscrire avec Discord</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
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
    height: height * 0.25,
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
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    color: '#1A1A2E',
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
    borderColor: '#D1D5DB',
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
    color: '#6B7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#00D4AA',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#00D4AA',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  primaryButtonText: {
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
    marginBottom: 20,
    gap: 10,
  },
  discordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
