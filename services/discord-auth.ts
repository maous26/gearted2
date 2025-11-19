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
      // 1. Obtenir l'URL d'authentification Discord
      const response = await api.get<DiscordAuthResponse>('/api/auth/discord');

      if (!response.success || !response.authUrl) {
        throw new Error('Impossible d\'obtenir l\'URL Discord');
      }

      // 2. Ouvrir le navigateur pour l'authentification
      const result = await WebBrowser.openAuthSessionAsync(
        response.authUrl,
        Linking.createURL('/auth/discord/callback')
      );

      if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Authentification annulée'
        };
      }

      if (result.type !== 'success') {
        throw new Error('Erreur lors de l\'authentification Discord');
      }

      // 3. Extraire le code de l'URL
      const url = result.url;
      const code = this.extractCodeFromUrl(url);

      if (!code) {
        throw new Error('Code d\'autorisation non trouvé');
      }

      // 4. Échanger le code contre des tokens
      const callbackResponse = await api.get<DiscordCallbackResponse>(
        `/api/auth/discord/callback?code=${code}`
      );

      if (!callbackResponse.success) {
        throw new Error(callbackResponse.message || 'Erreur lors de l\'authentification');
      }

      // 5. Sauvegarder les tokens
      await TokenManager.saveTokens(
        callbackResponse.accessToken,
        callbackResponse.refreshToken
      );

      return {
        success: true,
        user: callbackResponse.user
      };

    } catch (error: any) {
      console.error('❌ Discord login error:', error);
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
