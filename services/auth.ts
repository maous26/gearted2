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
      
      // Traduire les erreurs en messages compréhensibles
      let errorMessage = 'Erreur de connexion';
      
      // Erreur réseau
      if (!error.response) {
        if (error.message?.includes('Network Error') || error.message?.includes('timeout')) {
          errorMessage = 'Impossible de se connecter au serveur';
        } else {
          errorMessage = 'Problème de connexion';
        }
      } 
      // Erreur du serveur
      else if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          const detail = errorData.details[0];
          if (detail.includes('not allowed to be empty')) {
            errorMessage = 'Tous les champs sont requis';
          } else if (detail.includes('must be a valid email')) {
            errorMessage = 'Format d\'email invalide';
          } else {
            errorMessage = detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Le serveur rencontre un problème';
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
      
      // Traduire les erreurs en messages compréhensibles
      let errorMessage = 'Erreur lors de l\'inscription';
      
      // Erreur réseau
      if (!error.response) {
        if (error.message?.includes('Network Error') || error.message?.includes('timeout')) {
          errorMessage = 'Impossible de se connecter au serveur';
        } else {
          errorMessage = 'Problème de connexion';
        }
      }
      // Erreur du serveur
      else if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          const detail = errorData.details[0];
          // Traduire les erreurs courantes
          if (detail.includes('not allowed to be empty')) {
            errorMessage = 'Tous les champs sont requis';
          } else if (detail.includes('must be a valid email')) {
            errorMessage = 'Format d\'email invalide';
          } else if (detail.includes('at least')) {
            errorMessage = 'Le mot de passe doit contenir au moins 8 caractères';
          } else {
            errorMessage = detail;
          }
        } else if (errorData.message) {
          // Messages déjà en français du backend
          if (errorData.message.includes('déjà utilisé') || errorData.message.includes('already')) {
            errorMessage = 'Cet email est déjà utilisé';
          } else {
            errorMessage = errorData.message;
          }
        }
      } else if (error.response?.status === 409) {
        errorMessage = 'Cet email ou nom d\'utilisateur est déjà utilisé';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Le serveur rencontre un problème';
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
