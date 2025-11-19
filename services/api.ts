import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import TokenManager from './storage';

// Configuration de l'API
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://empowering-truth-production.up.railway.app';
const API_ENV = process.env.EXPO_PUBLIC_ENV || 'development';

// Logs de debug pour vérifier que Expo charge bien le .env
console.log('🔗 [API SERVICE] Using API URL:', API_URL);
console.log('🌍 [API SERVICE] Environment:', API_ENV);

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Ajouter le token
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await TokenManager.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Gérer les erreurs et refresh token
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config || {};

        // Debug logging for failed requests (helps track 404s)
        try {
          const method = (originalRequest.method || 'GET').toUpperCase();
          const fullUrl = `${originalRequest.baseURL || ''}${originalRequest.url || ''}`;
          // eslint-disable-next-line no-console
          console.warn(
            `[API ${error.response?.status ?? 'ERR'}] ${method} ${fullUrl}`,
            {
              params: originalRequest.params,
              data: originalRequest.data,
            }
          );
        } catch {}

        // Si 401 et pas déjà retry, tenter refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await TokenManager.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            // Correct refresh endpoint (server mounts /api/auth and route is /refresh-token)
              const response = await this.api.post('/api/auth/refresh-token', { refreshToken });

              // Extraire proprement les tokens du payload
              const payload = (response as any).data ?? response;
              const accessToken = payload?.accessToken ?? payload?.tokens?.accessToken ?? null;
              const newRefreshToken = payload?.refreshToken ?? payload?.tokens?.refreshToken ?? null;

              // Valider les tokens avant de tenter de les sauvegarder
              if (typeof accessToken !== 'string' || typeof newRefreshToken !== 'string' || !accessToken || !newRefreshToken) {
                console.error('[API] Invalid tokens received from refresh endpoint:', {
                  accessToken,
                  newRefreshToken,
                  payload
                });
                // Nettoyer les tokens existants et forcer la sortie
                await TokenManager.clearTokens();
                throw new Error('Session expirée');
              }

              try {
                await TokenManager.saveTokens(accessToken, newRefreshToken);
              } catch (saveError) {
                console.error('[API] Error saving refreshed tokens:', saveError);
                // Si on ne peut pas sauvegarder les tokens, on les efface pour éviter incohérences
                await TokenManager.clearTokens();
                throw saveError;
              }

              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            await TokenManager.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  // Upload avec multipart/form-data
  async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export default new ApiService();
