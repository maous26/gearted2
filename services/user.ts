import api from './api';

export interface UpdateProfileData {
  username?: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    field?: string;
    details?: string[];
  };
}

class UserService {
  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get<BackendResponse<{ user: UserProfile }>>('/api/users/me');
      console.log('[UserService] Profile fetched successfully');
      return response.data.user;
    } catch (error: any) {
      console.error('[UserService] Get profile error:', error);
      throw new Error(error.response?.data?.error?.message || 'Erreur lors de la récupération du profil');
    }
  }

  /**
   * Mettre à jour le profil de l'utilisateur connecté
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      console.log('[UserService] Updating profile:', data);
      const response = await api.patch<BackendResponse<{ user: UserProfile }>>('/api/users/me', data);
      console.log('[UserService] Raw response:', response);
      console.log('[UserService] Response data:', response.data);
      console.log('[UserService] Response data.user:', response.data?.user);
      
      // Vérifier la structure de la réponse
      if (!response || !response.data) {
        throw new Error('Réponse invalide du serveur');
      }
      
      if (!response.data.user) {
        console.error('[UserService] No user in response. Full response:', JSON.stringify(response, null, 2));
        throw new Error('Format de réponse invalide');
      }
      
      console.log('[UserService] Profile updated successfully');
      return response.data.user;
    } catch (error: any) {
      console.error('[UserService] Update profile error:', error);
      console.error('[UserService] Error response:', error.response?.data);
      console.error('[UserService] Error status:', error.response?.status);
      console.error('[UserService] Error message:', error.message);
      
      // Traduire les erreurs techniques en messages compréhensibles
      let errorMessage = 'Une erreur est survenue';
      
      // Erreur réseau
      if (!error.response) {
        if (error.message?.includes('Network Error') || error.message?.includes('timeout')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
        } else if (error.message?.includes('SecureStore') || error.message?.includes('Invalid value')) {
          errorMessage = 'Erreur de sauvegarde locale. Veuillez réessayer.';
        } else {
          errorMessage = 'Problème de connexion au serveur';
        }
      } 
      // Erreur du serveur
      else {
        const errorData = error.response?.data?.error;
        
        if (errorData) {
          // Messages du backend
          if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
            const detail = errorData.details[0];
            // Traduire les erreurs Joi courantes
            if (detail.includes('must be a valid email')) {
              errorMessage = 'Format d\'email invalide';
            } else if (detail.includes('is required')) {
              errorMessage = 'Tous les champs requis doivent être remplis';
            } else if (detail.includes('must be a string')) {
              errorMessage = 'Format de données invalide';
            } else {
              errorMessage = detail;
            }
          } else if (errorData.message) {
            // Messages spécifiques du backend déjà en français
            if (errorData.message.includes('déjà pris') || errorData.message.includes('already')) {
              errorMessage = 'Ce nom d\'utilisateur est déjà utilisé';
            } else if (errorData.message.includes('non authentifié') || errorData.message.includes('Unauthorized')) {
              errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            } else {
              errorMessage = errorData.message;
            }
          }
        }
        
        // Erreurs HTTP standard
        if (error.response?.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Action non autorisée';
        } else if (error.response?.status === 404) {
          errorMessage = 'Profil introuvable';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Le serveur rencontre un problème. Réessayez dans quelques instants.';
        }
      }
      
      throw new Error(errorMessage);
    }
  }
}

export default new UserService();
