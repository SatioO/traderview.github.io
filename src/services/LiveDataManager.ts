import type {
  BrokerDataAdapter,
  InstrumentTick,
  OrderUpdate,
  BrokerConnectionStatus,
} from '../adapters/ports/BrokerDataAdapter';
import {
  BrokerSubscriptionError,
  BrokerConnectionError,
} from '../adapters/ports/BrokerDataAdapter';
import { brokerDataAdapterFactory } from '../adapters/factories/BrokerDataAdapterFactory';
import authService from './authService';

export interface LiveDataSubscription {
  id: string;
  token: number;
  symbol: string;
  mode: 'ltp' | 'quote' | 'full';
  subscribedAt: Date;
  callback?: (tick: InstrumentTick) => void;
}

export interface LiveDataManagerConfig {
  brokerName: string;
  apiKey: string;
  debug?: boolean;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

export class LiveDataManager {
  private adapter: BrokerDataAdapter | null = null;
  private config: LiveDataManagerConfig | null = null;
  private subscriptions = new Map<number, LiveDataSubscription>();
  private latestTicks = new Map<number, InstrumentTick>();
  private globalTickCallbacks: Array<(ticks: InstrumentTick[]) => void> = [];
  private connectionStatusCallbacks: Array<
    (status: BrokerConnectionStatus) => void
  > = [];
  private orderUpdateCallbacks: Array<(order: OrderUpdate) => void> = [];
  private isInitialized = false;

  constructor() {
    // Empty constructor - initialization happens in initialize()
  }

  /**
   * Initialize the live data manager with broker configuration
   */
  async initialize(config: LiveDataManagerConfig): Promise<void> {
    try {
      // Clean up existing adapter if any
      if (this.adapter) {
        await this.cleanup();
      }

      this.config = config;

      // Get access token from auth service
      // TODO: change access token retrieval logic as needed
      const accessToken = authService.getStoredToken();
      if (!accessToken) {
        throw new BrokerConnectionError(
          'No access token available',
          config.brokerName
        );
      }

      // Create broker adapter
      this.adapter = brokerDataAdapterFactory.createAdapter(config.brokerName, {
        apiKey: config.apiKey,
        accessToken,
        debug: config.debug,
        reconnect: config.autoReconnect,
        maxReconnectAttempts: config.maxReconnectAttempts,
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Connect to the broker
      await this.adapter.connect();

      this.isInitialized = true;
      console.log(`LiveDataManager initialized for ${config.brokerName}`);
    } catch (error) {
      throw new BrokerConnectionError(
        `Failed to initialize live data manager: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        config.brokerName,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Subscribe to instrument live data
   */
  async subscribeToInstrument(
    token: number,
    symbol: string,
    mode: 'ltp' | 'quote' | 'full' = 'ltp',
    callback?: (tick: InstrumentTick) => void
  ): Promise<string> {
    if (!this.isInitialized || !this.adapter) {
      throw new BrokerSubscriptionError('LiveDataManager not initialized', [
        token,
      ]);
    }

    const subscriptionId = `${token}-${Date.now()}`;
    const subscription: LiveDataSubscription = {
      id: subscriptionId,
      token,
      symbol,
      mode,
      subscribedAt: new Date(),
      callback,
    };

    try {
      // Check if already subscribed to this token
      const existingSubscription = this.subscriptions.get(token);
      if (existingSubscription) {
        // Update mode if different
        if (existingSubscription.mode !== mode) {
          await this.adapter.setMode(mode, [token]);
          existingSubscription.mode = mode;
        }
        // Update callback
        if (callback) {
          existingSubscription.callback = callback;
        }
        return existingSubscription.id;
      }

      // Subscribe to new instrument
      await this.adapter.subscribe([{ token, symbol, mode }]);
      this.subscriptions.set(token, subscription);

      console.log(`Subscribed to ${symbol} (${token}) in ${mode} mode`);
      return subscriptionId;
    } catch (error) {
      throw new BrokerSubscriptionError(
        `Failed to subscribe to ${symbol}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        [token],
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Unsubscribe from instrument live data
   */
  async unsubscribeFromInstrument(token: number): Promise<void> {
    if (!this.isInitialized || !this.adapter) {
      throw new BrokerSubscriptionError('LiveDataManager not initialized', [
        token,
      ]);
    }

    try {
      const subscription = this.subscriptions.get(token);
      if (!subscription) {
        console.warn(`No subscription found for token ${token}`);
        return;
      }

      await this.adapter.unsubscribe([token]);
      this.subscriptions.delete(token);
      this.latestTicks.delete(token);

      console.log(`Unsubscribed from ${subscription.symbol} (${token})`);
    } catch (error) {
      throw new BrokerSubscriptionError(
        `Failed to unsubscribe from token ${token}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        [token],
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get latest tick data for an instrument
   */
  getLatestTick(token: number): InstrumentTick | null {
    return this.latestTicks.get(token) || null;
  }

  /**
   * Get all latest ticks
   */
  getAllLatestTicks(): Map<number, InstrumentTick> {
    return new Map(this.latestTicks);
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): LiveDataSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Check if connected to broker
   */
  isConnected(): boolean {
    return this.adapter?.isConnected() ?? false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): BrokerConnectionStatus | null {
    return this.adapter?.getConnectionStatus() || null;
  }

  /**
   * Subscribe to global tick updates
   */
  onTick(callback: (ticks: InstrumentTick[]) => void): () => void {
    this.globalTickCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.globalTickCallbacks.indexOf(callback);
      if (index > -1) {
        this.globalTickCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionStatus(
    callback: (status: BrokerConnectionStatus) => void
  ): () => void {
    this.connectionStatusCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.connectionStatusCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionStatusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to order updates
   */
  onOrderUpdate(callback: (order: OrderUpdate) => void): () => void {
    this.orderUpdateCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.orderUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.orderUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Clean up and disconnect
   */
  async cleanup(): Promise<void> {
    if (this.adapter) {
      await this.adapter.destroy();
      this.adapter = null;
    }

    this.subscriptions.clear();
    this.latestTicks.clear();
    this.globalTickCallbacks = [];
    this.connectionStatusCallbacks = [];
    this.orderUpdateCallbacks = [];
    this.isInitialized = false;
    this.config = null;

    console.log('LiveDataManager cleaned up');
  }

  /**
   * Reconnect to broker (useful after token refresh)
   */
  async reconnect(): Promise<void> {
    if (!this.config) {
      throw new BrokerConnectionError(
        'No configuration available for reconnection',
        'unknown'
      );
    }

    // Store current subscriptions
    const currentSubscriptions = Array.from(this.subscriptions.values());

    // Reinitialize
    await this.initialize(this.config);

    // Resubscribe to all instruments
    for (const subscription of currentSubscriptions) {
      try {
        await this.subscribeToInstrument(
          subscription.token,
          subscription.symbol,
          subscription.mode,
          subscription.callback
        );
      } catch (error) {
        console.error(
          `Failed to resubscribe to ${subscription.symbol}:`,
          error
        );
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.adapter) return;

    // Handle tick data
    this.adapter.onTick((ticks) => {
      // Update latest ticks
      ticks.forEach((tick) => {
        this.latestTicks.set(tick.token, tick);

        // Call individual subscription callback
        const subscription = this.subscriptions.get(tick.token);
        if (subscription?.callback) {
          try {
            subscription.callback(tick);
          } catch (error) {
            console.error(
              `Error in subscription callback for ${subscription.symbol}:`,
              error
            );
          }
        }
      });

      // Call global callbacks
      this.globalTickCallbacks.forEach((callback) => {
        try {
          callback(ticks);
        } catch (error) {
          console.error('Error in global tick callback:', error);
        }
      });
    });

    // Handle connection status changes
    this.adapter.onConnect(() => {
      const status = this.adapter!.getConnectionStatus();
      this.connectionStatusCallbacks.forEach((callback) => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in connection status callback:', error);
        }
      });
    });

    this.adapter.onDisconnect(() => {
      const status = this.adapter!.getConnectionStatus();
      this.connectionStatusCallbacks.forEach((callback) => {
        try {
          callback(status);
        } catch (callbackError) {
          console.error('Error in connection status callback:', callbackError);
        }
      });
    });

    // Handle order updates
    this.adapter.onOrderUpdate((order) => {
      this.orderUpdateCallbacks.forEach((callback) => {
        try {
          callback(order);
        } catch (error) {
          console.error('Error in order update callback:', error);
        }
      });
    });

    // Handle errors
    this.adapter.onError((error) => {
      console.error('Broker adapter error:', error);
    });
  }
}

// Singleton instance
export const liveDataManager = new LiveDataManager();

// Export singleton as default
export default liveDataManager;
