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
        return {
          success: false,
          error: 'Impossible de se connecter à Discord. Veuillez réessayer.'
        };
      }

      // 2. Ouvrir le navigateur pour l'authentification
      const result = await WebBrowser.openAuthSessionAsync(
        response.authUrl,
        Linking.createURL('/auth/discord/callback')
      );

      if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Connexion annulée'
        };
      }

      if (result.type !== 'success') {
        return {
          success: false,
          error: 'Erreur lors de la connexion avec Discord'
        };
      }

      // 3. Extraire les données de l'URL de callback
      const urlObj = new URL(result.url);
      const params = urlObj.searchParams;

      const success = params.get('success');
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');
      const userId = params.get('userId');
      const email = params.get('email');
      const username = params.get('username');
      const firstName = params.get('firstName');
      const avatar = params.get('avatar');

      if (!success || !accessToken || !refreshToken) {
        return {
          success: false,
          error: 'Erreur lors de la connexion. Veuillez réessayer.'
        };
      }

      // 4. Sauvegarder les tokens
      await TokenManager.saveTokens(accessToken, refreshToken);

      // 5. Construire l'objet utilisateur
      const user = {
        id: userId || '',
        email: email || '',
        username: username || '',
        firstName: firstName || '',
        avatar: avatar || null,
        provider: 'discord'
      };

      return {
        success: true,
        user
      };

    } catch (error: any) {
      // Log technique pour les développeurs uniquement (console)
      console.error('[Discord Auth] Error:', error.message);

      // Message simple pour l'utilisateur
      return {
        success: false,
        error: 'Impossible de se connecter avec Discord. Vérifiez vos identifiants.'
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
