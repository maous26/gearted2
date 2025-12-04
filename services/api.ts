import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import TokenManager from './storage';

// Configuration de l'API
// Toggle between local and production
const USE_LOCAL = false; // Set to false to use Railway (for Discord OAuth)
const LOCAL_URL = 'http://192.168.1.22:3000';
const RAILWAY_URL = 'https://gearted2-production.up.railway.app';

const API_URL = USE_LOCAL ? LOCAL_URL : RAILWAY_URL;
const API_ENV = USE_LOCAL ? 'development' : 'production';

// Logs de debug pour vérifier que Expo charge bien le .env
console.log('🔗 [API SERVICE] Using API URL:', API_URL);
console.log('🌍 [API SERVICE] Environment:', API_ENV);

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];

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

  private processQueue(error: Error | null, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private setupInterceptors() {
    // Request interceptor - Ajouter le token
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Skip adding token if Authorization header already exists (from retry logic)
        const hasAuthHeader = config.headers?.Authorization;
        if (hasAuthHeader) {
          console.log('[API Request] Using existing Authorization header');
          return config;
        }

        const token = await TokenManager.getAccessToken();
        console.log('[API Request] Token available:', !!token, 'URL:', config.url);
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
          const hasAuth = !!originalRequest.headers?.Authorization;
          // eslint-disable-next-line no-console
          console.warn(
            `[API ${error.response?.status ?? 'ERR'}] ${method} ${fullUrl}`,
            {
              params: originalRequest.params,
              data: originalRequest.data,
              hasAuthHeader: hasAuth,
              responseData: error.response?.data,
            }
          );
        } catch { }

        // Si 401 et pas déjà retry, tenter refresh token
        // Ne pas tenter de refresh si la requête échouée EST déjà le refresh endpoint
        const isRefreshEndpoint = originalRequest.url?.includes('/refresh-token');

        // Si c'est déjà un retry qui échoue, on déconnecte l'utilisateur
        if (error.response?.status === 401 && originalRequest._retry) {
          console.log('[API] Retry failed with 401, clearing tokens');
          await TokenManager.clearTokens();
          return Promise.reject(new Error('Session expired after refresh'));
        }

        if (error.response?.status === 401 && !isRefreshEndpoint) {
          originalRequest._retry = true;

          // Si un refresh est déjà en cours, mettre cette requête en file d'attente
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          this.isRefreshing = true;

          console.log('[API] Access token expired, attempting refresh...');
          const refreshToken = await TokenManager.getRefreshToken();
          if (!refreshToken) {
            console.log('[API] No refresh token available, logging out');
            await TokenManager.clearTokens();
            this.isRefreshing = false;
            this.processQueue(new Error('Session expired'), null);
            return Promise.reject(new Error('Session expired'));
          }

          console.log('[API] Calling refresh token endpoint...');

          // Wrap ONLY the refresh request in try-catch
          let accessToken: string;
          let newRefreshToken: string;
          try {
            // Créer une nouvelle instance axios sans intercepteurs pour éviter la récursion
            const response = await axios.post(`${API_URL}/api/auth/refresh-token`, { refreshToken });
            console.log('[API] Refresh response received:', response.status);

            // Extraire proprement les tokens du payload
            const payload = (response as any).data ?? response;
            const tokensObj = payload?.data?.tokens ?? payload?.tokens ?? payload;
            accessToken = tokensObj?.accessToken ?? null;
            newRefreshToken = tokensObj?.refreshToken ?? null;

            console.log('[API] Extracted tokens - hasAccess:', !!accessToken, 'hasRefresh:', !!newRefreshToken);

            // Valider les tokens avant de tenter de les sauvegarder
            if (typeof accessToken !== 'string' || typeof newRefreshToken !== 'string' || !accessToken || !newRefreshToken) {
              console.error('[API] Invalid tokens received from refresh endpoint');
              throw new Error('Invalid tokens from refresh endpoint');
            }

            console.log('[API] Tokens validated successfully');
          } catch (refreshError: any) {
            // Refresh token request itself failed
            const status = refreshError.response?.status;
            if (status === 401) {
              console.log('[API] Refresh token expired, redirecting to login');
            } else {
              console.error('[API] Refresh token request failed:', status, refreshError.message);
            }
            await TokenManager.clearTokens();
            this.isRefreshing = false;
            this.processQueue(new Error('Session expired - please log in again'), null);
            return Promise.reject(new Error('Session expired - please log in again'));
          }

          // Save tokens (outside try-catch so errors propagate)
          await TokenManager.saveTokens(accessToken, newRefreshToken);
          console.log('[API] Tokens saved, retrying original request');

          // Update the Authorization header with the new token
          if (!originalRequest.headers) {
            originalRequest.headers = {} as any;
          }
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Log token info for debugging
          const tokenPreview = accessToken.substring(0, 20) + '...' + accessToken.substring(accessToken.length - 10);
          console.log('[API] Retrying request with new token:', originalRequest.method?.toUpperCase(), originalRequest.url);
          console.log('[API] Token preview:', tokenPreview);

          this.isRefreshing = false;
          this.processQueue(null, accessToken);

          // Retry the original request - let any errors propagate to outer handler
          return this.api(originalRequest);
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
