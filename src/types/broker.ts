// Generic broker authentication types
export interface BrokerConfig {
  name: string;
  displayName: string;
  apiKey: string;
  loginUrl: string;
  callbackPath: string;
  logoUrl?: string;
  color: string;
  isEnabled: boolean;
}

export interface BrokerAuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    brokerUserId: string;
    brokerUserName: string;
    broker: string;
  };
}

export interface BrokerLoginConfig {
  apiKey: string;
  redirectUrl: string;
  state?: string;
  broker: string;
}

export interface BrokerCallbackData {
  requestToken?: string;
  authCode?: string;
  state?: string;
  broker: string;
  [key: string]: any; // Allow additional broker-specific data
}

export interface BrokerAuthProvider {
  name: string;
  displayName: string;
  color: string;
  
  // Authentication methods
  generateLoginUrl(config?: BrokerLoginConfig): string;
  initiateLogin(config?: any): void;
  handleCallback(data: BrokerCallbackData): Promise<BrokerAuthResponse>;
  
  // Token management
  storeToken(token: string): void;
  getStoredToken(): string | null;
  removeToken(): void;
  isTokenValid(): boolean;
  refreshToken?(): Promise<string>;
  
  // Validation
  validateConfig(): boolean;
}