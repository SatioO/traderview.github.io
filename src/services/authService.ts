import { analyticsService } from './analyticsService';
import httpClient from './httpClient';

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

interface ActiveSessionsResponse {
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
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/user/login', credentials);
    const authData = response.data;
    
    // Store auth data
    this.storeAuthData(authData.accessToken, authData.refreshToken, authData.user);

    // Set user context in analytics
    analyticsService.setUser({
      userId: authData.user.id,
      username: `${authData.user.firstName} ${authData.user.lastName}`,
      email: authData.user.email,
      displayName: `${authData.user.firstName} ${authData.user.lastName}`,
    });

    // Track login event
    analyticsService.trackEvent('login_success', {
      method: 'email',
      userId: authData.user.id,
      email: authData.user.email,
      name: `${authData.user.firstName} ${authData.user.lastName}`,
    });

    return authData;
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/user/signup', userData);
    const authData = response.data;

    // Store auth data
    this.storeAuthData(authData.accessToken, authData.refreshToken, authData.user);

    // Set user context in analytics
    analyticsService.setUser({
      userId: authData.user.id,
      email: authData.user.email,
      displayName: `${authData.user.firstName} ${authData.user.lastName}`,
    });

    // Track signup event
    analyticsService.trackEvent('signup_success', {
      method: 'email',
      userId: authData.user.id,
      email: authData.user.email,
    });

    return authData;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getStoredRefreshToken();

    try {
      if (refreshToken) {
        await httpClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.clearAuthData();
      httpClient.logout(); // Clear tokens from httpClient as well
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await httpClient.post('/auth/logout', { logoutAll: true });
    } catch (error) {
      console.error('Logout all API call failed:', error);
    } finally {
      this.clearAuthData();
      httpClient.logout(); // Clear tokens from httpClient as well
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    const response = await httpClient.get<UserProfile>('/user/profile');
    return response.data;
  }

  async verifyToken(): Promise<{ valid: boolean; user?: UserProfile }> {
    try {
      const response = await httpClient.get<{ valid: boolean; user: UserProfile }>('/auth/verify-token');
      return response.data;
    } catch {
      return { valid: false };
    }
  }

  async getActiveSessions(): Promise<ActiveSessionsResponse> {
    const response = await httpClient.get<ActiveSessionsResponse>('/auth/active-sessions');
    return response.data;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await httpClient.delete(`/auth/revoke-session/${sessionId}`);
  }

  // Token management methods
  getStoredToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

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

  isAuthenticated(): boolean {
    return httpClient.isAuthenticated();
  }
}

// Create and export singleton instance
const authService = new AuthService();

// Export both the instance and the class for backward compatibility
export { authService as apiClient }; // For backward compatibility
export default authService;