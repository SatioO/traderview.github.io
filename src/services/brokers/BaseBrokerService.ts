import type { BrokerAuthProvider, BrokerConfig, BrokerLoginConfig, BrokerCallbackData, BrokerAuthResponse } from '../../types/broker';

export abstract class BaseBrokerService implements BrokerAuthProvider {
  protected config: BrokerConfig;
  protected apiBaseUrl: string;

  constructor(config: BrokerConfig) {
    this.config = config;
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  get name(): string {
    return this.config.name;
  }

  get displayName(): string {
    return this.config.displayName;
  }

  get color(): string {
    return this.config.color;
  }

  // Abstract methods that must be implemented by each broker
  abstract generateLoginUrl(config: BrokerLoginConfig): string;
  abstract handleCallback(data: BrokerCallbackData): Promise<BrokerAuthResponse>;
  abstract isTokenValid(): boolean;

  // Default implementation for common methods
  initiateLogin(additionalConfig?: Record<string, unknown>): void {
    if (!this.validateConfig()) {
      throw new Error(`${this.displayName} is not properly configured`);
    }

    const redirectUrl = `${window.location.origin}${this.config.callbackPath}`;
    const state = this.generateState();
    
    localStorage.setItem(`${this.name}_oauth_state`, state);
    
    const loginUrl = this.generateLoginUrl({
      apiKey: this.config.apiKey,
      redirectUrl,
      state,
      broker: this.name,
      ...additionalConfig,
    });

    window.location.href = loginUrl;
  }

  storeToken(token: string): void {
    localStorage.setItem(`${this.name}_access_token`, token);
  }

  getStoredToken(): string | null {
    return localStorage.getItem(`${this.name}_access_token`);
  }

  removeToken(): void {
    localStorage.removeItem(`${this.name}_access_token`);
    localStorage.removeItem(`${this.name}_oauth_state`);
  }

  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.isEnabled);
  }

  // Helper methods
  protected generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  protected validateState(receivedState?: string): boolean {
    const storedState = localStorage.getItem(`${this.name}_oauth_state`);
    if (receivedState && storedState !== receivedState) {
      return false;
    }
    localStorage.removeItem(`${this.name}_oauth_state`);
    return true;
  }

  protected async makeBackendRequest(endpoint: string, data: Record<string, unknown>): Promise<BrokerAuthResponse> {
    const response = await fetch(`${this.apiBaseUrl}/auth/${this.name}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        api_key: this.config.apiKey,
        broker: this.name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `${this.displayName} authentication failed`);
    }

    return response.json();
  }
}