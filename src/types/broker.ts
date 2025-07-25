// Generic broker authentication types

// WebSocket Data Types
export interface Tick {
  tradable: boolean;
  mode: 'ltp' | 'quote' | 'full';
  instrument_token: number;
  last_price: number;
  // Add other potential fields from Kite Ticker
  last_quantity?: number;
  average_price?: number;
  volume?: number;
  buy_quantity?: number;
  sell_quantity?: number;
  ohlc?: {
    high: number;
    low: number;
    open: number;
    close: number;
  };
  change?: number;
  last_trade_time?: Date;
  timestamp?: Date;
  depth?: any; // Define depth structure if needed
}

export interface OrderUpdate {
  order_id: string;
  status: string;
  // Add other potential fields from Kite Ticker
  tradingsymbol?: string;
  exchange?: string;
  transaction_type?: 'BUY' | 'SELL';
  quantity?: number;
  filled_quantity?: number;
  average_price?: number;
  order_timestamp?: Date;
  [key: string]: any;
}

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
