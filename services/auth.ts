import api from './api';
import TokenManager from './storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
  location?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    avatar?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Backend response wrapper
interface BackendResponse<T> {
  success: boolean;
  data: T;
  error?: any;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<BackendResponse<AuthResponse>>('/api/auth/login', credentials);
      const authData = response.data;
      
      // Sauvegarder les tokens
      await TokenManager.saveTokens(
        authData.tokens.accessToken,
        authData.tokens.refreshToken
      );
      
      return authData;
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Login failed';
      throw new Error(errorMessage);
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<BackendResponse<AuthResponse>>('/api/auth/register', data);
      const authData = response.data;
      
      // Sauvegarder les tokens
      await TokenManager.saveTokens(
        authData.tokens.accessToken,
        authData.tokens.refreshToken
      );
      
      return authData;
    } catch (error: any) {
      console.error('[Register] Full error:', error);
      console.error('[Register] Error response:', error.response?.data);
      console.error('[Register] Error status:', error.response?.status);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      if (refreshToken) {
  await api.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await TokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
  return await api.get('/api/auth/profile');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return await TokenManager.hasValidToken();
  }
}

export default new AuthService();
