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
    firstName?: string;
    lastName?: string;
    location?: string;
    phone?: string;
    bio?: string;
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
      console.error('[Login] Error:', error);
      console.error('[Login] Error response:', error.response?.data);
      
      // Extraire le message d'erreur
      let errorMessage = 'Login failed';
      
      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        
        // Si c'est une erreur de validation avec des détails
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          errorMessage = errorData.details[0];
        } 
        // Sinon prendre le message
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('[Register] Sending data:', {
        email: data.email,
        username: data.username,
        hasPassword: !!data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        location: data.location
      });
      
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
      
      // Extraire le message d'erreur de validation
      let errorMessage = 'Registration failed';
      
      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        
        // Si c'est une erreur de validation avec des détails
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          // Prendre le premier message de détail
          errorMessage = errorData.details[0];
        }
        // Si c'est une erreur avec un champ spécifique (email déjà utilisé, etc.)
        else if (errorData.message && errorData.field) {
          errorMessage = errorData.message;
        } 
        // Sinon prendre le message général
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
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
