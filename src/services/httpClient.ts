import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// Response types for token refresh
interface RefreshTokenResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

class HttpClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token to requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getStoredAccessToken();
        if (token && !config.url?.includes('/auth/refresh-token')) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle 401 errors and token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          const errorData = error.response.data as any;

          // If this is a refresh token request that failed, redirect to login
          if (originalRequest.url?.includes('/auth/refresh-token')) {
            this.handleAuthFailure();
            return Promise.reject(error);
          }

          // If token expired, try to refresh
          if (errorData?.code === 'ACCESS_TOKEN_EXPIRED') {
            originalRequest._retry = true;

            try {
              const newAccessToken = await this.refreshAccessToken();
              
              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              }

              return this.axiosInstance(originalRequest);
            } catch (refreshError) {
              this.handleAuthFailure();
              return Promise.reject(refreshError);
            }
          } else {
            // Other 401 errors (invalid token, session expired, etc.)
            this.handleAuthFailure();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newAccessToken = await this.refreshPromise;
      this.isRefreshing = false;
      this.refreshPromise = null;
      return newAccessToken;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      throw error;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    const refreshToken = this.getStoredRefreshToken();

    if (!refreshToken) {
      this.clearAuthData();
      throw new Error('No refresh token available');
    }

    try {
      // Make refresh request without interceptors to avoid infinite loop
      const response = await axios.post<RefreshTokenResponse>(
        `${this.axiosInstance.defaults.baseURL}/auth/refresh-token`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const tokenResponse = response.data;

      // Store new tokens
      this.storeAuthData(
        tokenResponse.accessToken,
        tokenResponse.refreshToken,
        tokenResponse.user
      );

      return tokenResponse.accessToken;
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  private handleAuthFailure(): void {
    console.log('Authentication failed, redirecting to login...');
    this.clearAuthData();
    
    // Use setTimeout to ensure this runs after current execution context
    setTimeout(() => {
      window.location.href = '/login';
    }, 0);
  }

  // Token management methods
  private getStoredAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private storeAuthData(
    accessToken: string,
    refreshToken: string,
    user: RefreshTokenResponse['user']
  ): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearAuthData(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Public methods for making requests
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }

  // Get the axios instance for advanced usage
  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  // Utility methods for auth state
  public isAuthenticated(): boolean {
    const accessToken = this.getStoredAccessToken();
    const refreshToken = this.getStoredRefreshToken();
    const user = localStorage.getItem(USER_KEY);

    return !!(accessToken && refreshToken && user);
  }

  public getStoredUser(): RefreshTokenResponse['user'] | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  public logout(): void {
    this.clearAuthData();
  }
}

// Create and export singleton instance
export const httpClient = new HttpClient();
export default httpClient;