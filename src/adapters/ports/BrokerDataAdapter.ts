// Port definition for broker data operations (Hexagonal Architecture)
export interface InstrumentTick {
  token: number;
  symbol: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  averagePrice: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  open: number;
  close: number;
  timestamp: Date;
}

export interface InstrumentSubscription {
  token: number;
  symbol: string;
  mode: 'ltp' | 'quote' | 'full';
}

export interface OrderUpdate {
  orderId: string;
  status: string;
  instrument: string;
  quantity: number;
  price: number;
  timestamp: Date;
  [key: string]: unknown;
}

export interface BrokerConnectionStatus {
  isConnected: boolean;
  connectionTime?: Date;
  lastHeartbeat?: Date;
  error?: string;
}

// Main port interface for broker data operations
export interface BrokerDataAdapter {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionStatus(): BrokerConnectionStatus;

  // Subscription management
  subscribe(instruments: InstrumentSubscription[]): Promise<void>;
  unsubscribe(tokens: number[]): Promise<void>;
  setMode(mode: 'ltp' | 'quote' | 'full', tokens: number[]): Promise<void>;
  getActiveSubscriptions(): InstrumentSubscription[];

  // Event listeners
  onTick(callback: (ticks: InstrumentTick[]) => void): void;
  onConnect(callback: () => void): void;
  onDisconnect(callback: (error?: Error) => void): void;
  onError(callback: (error: Error) => void): void;
  onOrderUpdate(callback: (order: OrderUpdate) => void): void;

  // Cleanup
  removeAllListeners(): void;
  destroy(): Promise<void>;
}

// Factory interface for creating broker data adapters
export interface BrokerDataAdapterFactory {
  createAdapter(brokerName: string, config: BrokerAdapterConfig): BrokerDataAdapter;
  getSupportedBrokers(): string[];
}

// Configuration for broker adapters
export interface BrokerAdapterConfig {
  apiKey: string;
  accessToken: string;
  userId?: string;
  debug?: boolean;
  reconnect?: boolean;
  maxReconnectDelay?: number;
  maxReconnectAttempts?: number;
}

// Error types
export class BrokerConnectionError extends Error {
  public broker: string;
  public originalError?: Error;

  constructor(message: string, broker: string, originalError?: Error) {
    super(message);
    this.name = 'BrokerConnectionError';
    this.broker = broker;
    this.originalError = originalError;
  }
}

export class BrokerSubscriptionError extends Error {
  public tokens: number[];
  public originalError?: Error;

  constructor(message: string, tokens: number[], originalError?: Error) {
    super(message);
    this.name = 'BrokerSubscriptionError';
    this.tokens = tokens;
    this.originalError = originalError;
  }
}