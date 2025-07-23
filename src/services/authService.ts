export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface RefreshTokenResponse {
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

export interface AuthError {
  message: string;
  code?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  connectedBrokers: Array<{
    _id: string;
    broker: string;
    brokerUserName: string;
    connectedAt: string;
  }>;
  createdAt: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// Create axios-like instance with interceptors for token management
class ApiClient {
  public baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Add access token to headers if available
    const accessToken = this.getStoredAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (accessToken && !endpoint.includes('/auth/refresh-token')) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 with automatic token refresh
      if (
        response.status === 401 &&
        !endpoint.includes('/auth/refresh-token')
      ) {
        const errorData = await response.clone().json();

        if (errorData.code === 'ACCESS_TOKEN_EXPIRED') {
          // Try to refresh token
          const newAccessToken = await this.refreshAccessToken();

          // Retry original request with new token
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          };

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });

          if (!retryResponse.ok) {
            const retryError = await retryResponse.json();
            throw new Error(
              retryError.message || 'Request failed after token refresh'
            );
          }

          return retryResponse.json();
        } else {
          // Other 401 errors (invalid token, etc.) - force logout
          this.clearAuthData();
          // Force redirect to login for expired sessions
          if (
            errorData.code === 'INVALID_REFRESH_TOKEN' ||
            errorData.code === 'SESSION_EXPIRED' ||
            errorData.message?.includes('Session expired')
          ) {
            console.log('Session expired, redirecting to login...');
            window.location.href = '/login';
          }
          throw new Error(errorData.message || 'Authentication failed');
        }
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || `Request failed with status ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
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
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle specific refresh token errors
        if (
          error.code === 'INVALID_REFRESH_TOKEN' ||
          error.code === 'SECURITY_BREACH' ||
          error.code === 'MISSING_REFRESH_TOKEN' ||
          error.code === 'SESSION_EXPIRED'
        ) {
          this.clearAuthData();
          // Force redirect to login when refresh tokens are invalid
          console.log('Refresh token invalid, redirecting to login...');
          window.location.href = '/login';
        }

        throw new Error(error.message || 'Token refresh failed');
      }

      const tokenResponse: RefreshTokenResponse = await response.json();

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

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/user/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<void> {
    const refreshToken = this.getStoredRefreshToken();

    try {
      if (refreshToken) {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.clearAuthData();
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ logoutAll: true }),
      });
    } catch (error) {
      console.error('Logout all API call failed:', error);
    } finally {
      this.clearAuthData();
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.makeRequest<UserProfile>('/user/profile');
  }

  async verifyToken(): Promise<{ valid: boolean; user?: UserProfile }> {
    try {
      return await this.makeRequest<{ valid: boolean; user: UserProfile }>(
        '/auth/verify-token'
      );
    } catch {
      return { valid: false };
    }
  }

  async getActiveSessions(): Promise<{
    activeSessions: Array<{
      id: string;
      deviceInfo: {
        userAgent: string;
        ipAddress: string;
        deviceId?: string;
      };
      createdAt: string;
      lastUsedAt: string;
      isCurrent: boolean;
    }>;
    totalCount: number;
  }> {
    return this.makeRequest('/auth/active-sessions');
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.makeRequest(`/auth/revoke-session/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Token management
  getStoredAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getStoredRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getStoredUser(): AuthResponse['user'] | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  storeAuthData(
    accessToken: string,
    refreshToken: string,
    user: AuthResponse['user']
  ): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearAuthData(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const accessToken = this.getStoredAccessToken();
    const refreshToken = this.getStoredRefreshToken();
    const user = this.getStoredUser();

    return !!(accessToken && refreshToken && user);
  }

  // Legacy methods for backward compatibility
  getStoredToken(): string | null {
    return this.getStoredAccessToken();
  }
}

// Create singleton instance
const apiClient = new ApiClient(API_BASE_URL);

// Export legacy interface for backward compatibility
const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.login(credentials);
    apiClient.storeAuthData(
      response.accessToken,
      response.refreshToken,
      response.user
    );
    return response;
  },

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.signup(userData);
    apiClient.storeAuthData(
      response.accessToken,
      response.refreshToken,
      response.user
    );
    return response;
  },

  async logout(): Promise<void> {
    await apiClient.logout();
  },

  async logoutAll(): Promise<void> {
    await apiClient.logoutAll();
  },

  async getUserProfile(): Promise<UserProfile> {
    return apiClient.getUserProfile();
  },

  async verifyToken(): Promise<{ valid: boolean; user?: UserProfile }> {
    return apiClient.verifyToken();
  },

  async getActiveSessions() {
    return apiClient.getActiveSessions();
  },

  async revokeSession(sessionId: string): Promise<void> {
    return apiClient.revokeSession(sessionId);
  },

  getStoredToken(): string | null {
    return apiClient.getStoredAccessToken();
  },

  getStoredUser(): AuthResponse['user'] | null {
    return apiClient.getStoredUser();
  },

  storeAuthData(): void {
    // For backward compatibility, assume this is access token only
    // In practice, this should be updated to use the new method
    console.warn(
      'authService.storeAuthData is deprecated. Use the new format with refresh tokens.'
    );
  },

  clearAuthData(): void {
    apiClient.clearAuthData();
  },

  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  },
};

// Export both the new API client and legacy service
export { apiClient };
export default authService;
