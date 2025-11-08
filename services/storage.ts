import * as SecureStore from 'expo-secure-store';

class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';

  static async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  static async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  static async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  static async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  }

  static async hasValidToken(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null;
  }
}

export default TokenManager;
