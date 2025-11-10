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

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
  const response = await api.post<AuthResponse>('/api/auth/login', credentials);
      
      // Sauvegarder les tokens
      await TokenManager.saveTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
      
      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
  const response = await api.post<AuthResponse>('/api/auth/register', data);
      
      // Sauvegarder les tokens
      await TokenManager.saveTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
      
      return response;
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
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
