import { BaseBrokerService } from './BaseBrokerService';
import type {
  BrokerConfig,
  BrokerCallbackData,
  BrokerAuthResponse,
} from '../../types/broker';

export class KiteBrokerService extends BaseBrokerService {
  constructor() {
    const config: BrokerConfig = {
      name: 'kite',
      displayName: 'Kite by Zerodha',
      apiKey: import.meta.env.VITE_KITE_API_KEY || '',
      loginUrl: '', // Will be fetched from backend
      callbackPath: '/auth/kite/callback',
      color: '#ff6600',
      isEnabled: !!import.meta.env.VITE_KITE_API_KEY,
    };

    super(config);
  }

  async initiateLogin(): Promise<void> {
    if (!this.validateConfig()) {
      throw new Error(`${this.displayName} is not properly configured`);
    }

    try {
      // Get login URL from your backend service
      const response = await fetch(`${this.apiBaseUrl}/auth/kite/login-url`);
      if (!response.ok) {
        throw new Error('Failed to get login URL');
      }

      const { loginUrl } = await response.json();
      window.location.href = loginUrl;
    } catch (error) {
      throw new Error(
        `Failed to initiate ${this.displayName} login: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  generateLoginUrl(): string {
    // This method is not used since we get the URL from backend
    // But keeping it for interface compliance
    return '';
  }

  async handleCallback(data: BrokerCallbackData): Promise<BrokerAuthResponse> {
    if (!data.requestToken) {
      throw new Error('Missing request token from Kite');
    }

    // Use your backend's callback endpoint
    const response = await fetch(`${this.apiBaseUrl}/auth/kite/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_token: data.requestToken,
        action: 'login',
        status: 'success',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Kite authentication failed');
    }

    const result = await response.json();

    // Transform response to match our interface
    return {
      accessToken: result.accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        brokerUserId: result.user.id,
        brokerUserName: `${result.user.firstName} ${result.user.lastName}`,
        broker: 'kite',
      },
    };
  }

  isTokenValid(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;

    // Kite tokens expire at 6 AM the next day
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    nextDay.setHours(6, 0, 0, 0);

    return now < nextDay;
  }

  // Kite doesn't support token refresh, user needs to login again
  async refreshToken(): Promise<string> {
    this.removeToken();
    throw new Error('Kite token expired. Please login again.');
  }
}
