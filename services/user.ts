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
      console.log('[UserService] Profile updated successfully');
      return response.data.user;
    } catch (error: any) {
      console.error('[UserService] Update profile error:', error);
      
      // Extraire le message d'erreur du backend
      let errorMessage = 'Erreur lors de la mise à jour du profil';
      const errorData = error.response?.data?.error;
      
      if (errorData) {
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          errorMessage = errorData.details[0];
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  }
}

export default new UserService();
