import api from './api';
import TokenManager from './storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

interface DiscordAuthResponse {
  success: boolean;
  authUrl: string;
  state: string;
}

interface DiscordCallbackResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    avatar?: string;
    provider: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Service d'authentification Discord OAuth2
 */
class DiscordAuthService {
  /**
   * Initie le flux OAuth Discord
   */
  async loginWithDiscord(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      console.log('🔍 [DISCORD AUTH] Step 1: Getting auth URL from backend...');

      // 1. Obtenir l'URL d'authentification Discord
      const response = await api.get<DiscordAuthResponse>('/api/auth/discord');
      console.log('✅ [DISCORD AUTH] Step 1: Auth URL received:', response.authUrl.substring(0, 100) + '...');

      if (!response.success || !response.authUrl) {
        throw new Error('Impossible d\'obtenir l\'URL Discord');
      }

      console.log('🔍 [DISCORD AUTH] Step 2: Opening browser...');
      const redirectUrl = Linking.createURL('/auth/discord/callback');
      console.log('📱 [DISCORD AUTH] Redirect URL:', redirectUrl);

      // 2. Ouvrir le navigateur pour l'authentification
      const result = await WebBrowser.openAuthSessionAsync(
        response.authUrl,
        redirectUrl
      );

      console.log('✅ [DISCORD AUTH] Step 2: Browser result:', result.type);

      if (result.type === 'cancel') {
        console.log('⚠️ [DISCORD AUTH] User cancelled authentication');
        return {
          success: false,
          error: 'Authentification annulée'
        };
      }

      if (result.type !== 'success') {
        console.error('❌ [DISCORD AUTH] Browser failed:', result.type);
        throw new Error('Erreur lors de l\'authentification Discord');
      }

      console.log('🔍 [DISCORD AUTH] Step 3: Extracting code from URL...');
      // 3. Extraire le code de l'URL
      const url = result.url;
      console.log('📱 [DISCORD AUTH] Callback URL:', url);
      const code = this.extractCodeFromUrl(url);

      if (!code) {
        console.error('❌ [DISCORD AUTH] No code found in URL');
        throw new Error('Code d\'autorisation non trouvé');
      }

      console.log('✅ [DISCORD AUTH] Code extracted:', code.substring(0, 20) + '...');
      console.log('🔍 [DISCORD AUTH] Step 4: Exchanging code for tokens...');

      // 4. Échanger le code contre des tokens
      const callbackResponse = await api.get<DiscordCallbackResponse>(
        `/api/auth/discord/callback?code=${code}`
      );

      console.log('✅ [DISCORD AUTH] Step 4: Tokens received');

      if (!callbackResponse.success) {
        throw new Error(callbackResponse.message || 'Erreur lors de l\'authentification');
      }

      console.log('🔍 [DISCORD AUTH] Step 5: Saving tokens...');

      // 5. Sauvegarder les tokens
      await TokenManager.saveTokens(
        callbackResponse.accessToken,
        callbackResponse.refreshToken
      );

      console.log('✅ [DISCORD AUTH] All steps completed successfully!');

      return {
        success: true,
        user: callbackResponse.user
      };

    } catch (error: any) {
      console.error('❌ [DISCORD AUTH] Error occurred:', error);
      console.error('❌ [DISCORD AUTH] Error details:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'authentification Discord'
      };
    }
  }

  /**
   * Extrait le code OAuth de l'URL de callback
   */
  private extractCodeFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('code');
    } catch {
      return null;
    }
  }

  /**
   * Déconnexion Discord
   */
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/discord/logout');
      await TokenManager.clearTokens();
    } catch (error) {
      console.error('❌ Discord logout error:', error);
      // Clear tokens même en cas d'erreur
      await TokenManager.clearTokens();
    }
  }
}

export default new DiscordAuthService();
