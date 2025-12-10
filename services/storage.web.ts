// Version Web - utilise localStorage au lieu de SecureStore

class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';

  static async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Validation : s'assurer que les tokens sont des strings
      if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
        console.error('[TokenManager] Invalid token type:', {
          accessToken: typeof accessToken,
          refreshToken: typeof refreshToken,
          accessTokenValue: accessToken,
          refreshTokenValue: refreshToken
        });
        throw new Error('Les tokens doivent être des chaînes de caractères');
      }

      if (!accessToken || !refreshToken) {
        console.error('[TokenManager] Empty tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken
        });
        throw new Error('Les tokens ne peuvent pas être vides');
      }

      console.log('[TokenManager] Saving tokens...');
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      console.log('[TokenManager] Tokens saved successfully');
    } catch (error: any) {
      console.error('[TokenManager] Error saving tokens:', error);
      console.error('[TokenManager] Error message:', error.message);
      throw error;
    }
  }

  static async getAccessToken(): Promise<string | null> {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  static async getRefreshToken(): Promise<string | null> {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  static async clearTokens(): Promise<void> {
    try {
      console.log('[TokenManager] Clearing tokens...');
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      console.log('[TokenManager] Tokens cleared successfully');

      // Verify tokens are actually cleared
      const accessAfter = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const refreshAfter = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      console.log('[TokenManager] Verification after clear:', {
        hasAccessToken: !!accessAfter,
        hasRefreshToken: !!refreshAfter
      });
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  }

  static async hasValidToken(): Promise<boolean> {
    const token = await this.getAccessToken();
    console.log('[TokenManager] hasValidToken check:', { hasToken: token !== null });
    return token !== null;
  }
}

export default TokenManager;
