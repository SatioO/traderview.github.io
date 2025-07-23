import type {
  BrokerDataAdapter,
  BrokerAdapterConfig,
  InstrumentTick,
  InstrumentSubscription,
  OrderUpdate,
  BrokerConnectionStatus,
} from '../ports/BrokerDataAdapter';
import {
  BrokerConnectionError,
  BrokerSubscriptionError,
} from '../ports/BrokerDataAdapter';
import { KiteWebSocketClient, type KiteTick, type KiteOrderUpdate } from './kite/KiteWebSocketClient';

export class KiteBrokerDataAdapter implements BrokerDataAdapter {
  private client: KiteWebSocketClient | null = null;
  private config: BrokerAdapterConfig;
  private connectionStatus: BrokerConnectionStatus;
  private activeSubscriptions: Map<number, InstrumentSubscription> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  // Event callbacks
  private tickCallbacks: Array<(ticks: InstrumentTick[]) => void> = [];
  private connectCallbacks: Array<() => void> = [];
  private disconnectCallbacks: Array<(error?: Error) => void> = [];
  private errorCallbacks: Array<(error: Error) => void> = [];
  private orderUpdateCallbacks: Array<(order: OrderUpdate) => void> = [];

  constructor(config: BrokerAdapterConfig) {
    this.config = {
      debug: false,
      reconnect: true,
      maxReconnectDelay: 30000,
      maxReconnectAttempts: 5,
      ...config,
    };

    this.connectionStatus = {
      isConnected: false,
    };
  }

  async connect(): Promise<void> {
    if (this.client?.connected) {
      return;
    }

    try {
      this.client = new KiteWebSocketClient({
        api_key: this.config.apiKey,
        access_token: this.config.accessToken,
        reconnect: this.config.reconnect,
        max_reconnect_delay: this.config.maxReconnectDelay,
        max_retry: this.config.maxReconnectAttempts,
      });

      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new BrokerConnectionError('Connection timeout', 'kite'));
        }, 30000);

        this.client!.on('connect', () => {
          clearTimeout(timeout);
          this.connectionStatus = {
            isConnected: true,
            connectionTime: new Date(),
            lastHeartbeat: new Date(),
          };
          this.reconnectAttempts = 0;
          
          if (this.config.debug) {
            console.log('Kite WebSocket connected successfully');
          }
          
          resolve();
        });

        this.client!.on('error', (error: Error) => {
          clearTimeout(timeout);
          reject(new BrokerConnectionError(error.message, 'kite', error));
        });

        this.client!.connect();
      });
    } catch (error) {
      throw new BrokerConnectionError(
        `Failed to initialize Kite connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'kite',
        error instanceof Error ? error : undefined
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }

    this.connectionStatus = {
      isConnected: false,
    };

    this.activeSubscriptions.clear();
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  getConnectionStatus(): BrokerConnectionStatus {
    return { ...this.connectionStatus };
  }

  async subscribe(instruments: InstrumentSubscription[]): Promise<void> {
    if (!this.isConnected()) {
      throw new BrokerSubscriptionError('Not connected to broker', []);
    }

    try {
      const tokens = instruments.map(inst => inst.token);
      
      // Subscribe to tokens
      this.client!.subscribe(tokens);
      
      // Set mode for each subscription
      const modeGroups = new Map<string, number[]>();
      instruments.forEach(inst => {
        if (!modeGroups.has(inst.mode)) {
          modeGroups.set(inst.mode, []);
        }
        modeGroups.get(inst.mode)!.push(inst.token);
      });

      // Apply modes
      for (const [mode, modeTokens] of modeGroups) {
        this.client!.setMode(mode as 'ltp' | 'quote' | 'full', modeTokens);
      }

      // Store active subscriptions
      instruments.forEach(inst => {
        this.activeSubscriptions.set(inst.token, inst);
      });

      if (this.config.debug) {
        console.log('Subscribed to instruments:', instruments);
      }
    } catch (error) {
      const tokens = instruments.map(inst => inst.token);
      throw new BrokerSubscriptionError(
        `Failed to subscribe to instruments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tokens,
        error instanceof Error ? error : undefined
      );
    }
  }

  async unsubscribe(tokens: number[]): Promise<void> {
    if (!this.isConnected()) {
      throw new BrokerSubscriptionError('Not connected to broker', tokens);
    }

    try {
      this.client!.unsubscribe(tokens);
      
      // Remove from active subscriptions
      tokens.forEach(token => {
        this.activeSubscriptions.delete(token);
      });

      if (this.config.debug) {
        console.log('Unsubscribed from tokens:', tokens);
      }
    } catch (error) {
      throw new BrokerSubscriptionError(
        `Failed to unsubscribe from instruments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tokens,
        error instanceof Error ? error : undefined
      );
    }
  }

  async setMode(mode: 'ltp' | 'quote' | 'full', tokens: number[]): Promise<void> {
    if (!this.isConnected()) {
      throw new BrokerSubscriptionError('Not connected to broker', tokens);
    }

    try {
      this.client!.setMode(mode, tokens);

      // Update active subscriptions
      tokens.forEach(token => {
        const subscription = this.activeSubscriptions.get(token);
        if (subscription) {
          this.activeSubscriptions.set(token, { ...subscription, mode });
        }
      });

      if (this.config.debug) {
        console.log(`Set mode ${mode} for tokens:`, tokens);
      }
    } catch (error) {
      throw new BrokerSubscriptionError(
        `Failed to set mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tokens,
        error instanceof Error ? error : undefined
      );
    }
  }

  getActiveSubscriptions(): InstrumentSubscription[] {
    return Array.from(this.activeSubscriptions.values());
  }

  onTick(callback: (ticks: InstrumentTick[]) => void): void {
    this.tickCallbacks.push(callback);
  }

  onConnect(callback: () => void): void {
    this.connectCallbacks.push(callback);
  }

  onDisconnect(callback: (error?: Error) => void): void {
    this.disconnectCallbacks.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  onOrderUpdate(callback: (order: OrderUpdate) => void): void {
    this.orderUpdateCallbacks.push(callback);
  }

  removeAllListeners(): void {
    this.tickCallbacks = [];
    this.connectCallbacks = [];
    this.disconnectCallbacks = [];
    this.errorCallbacks = [];
    this.orderUpdateCallbacks = [];
  }

  async destroy(): Promise<void> {
    this.removeAllListeners();
    await this.disconnect();
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    // Tick data handler
    this.client.on('ticks', (ticks: KiteTick[]) => {
      try {
        const transformedTicks = this.transformTicks(ticks);
        this.tickCallbacks.forEach(callback => {
          try {
            callback(transformedTicks);
          } catch (error) {
            console.error('Error in tick callback:', error);
          }
        });
      } catch (error) {
        console.error('Error transforming ticks:', error);
      }
    });

    // Connection handler
    this.client.on('connect', () => {
      this.connectionStatus = {
        isConnected: true,
        connectionTime: new Date(),
        lastHeartbeat: new Date(),
      };
      
      this.connectCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in connect callback:', error);
        }
      });
    });

    // Disconnection handler
    this.client.on('disconnect', (error?: Error) => {
      this.connectionStatus = {
        isConnected: false,
        error: error?.message,
      };

      this.disconnectCallbacks.forEach(callback => {
        try {
          callback(error);
        } catch (callbackError) {
          console.error('Error in disconnect callback:', callbackError);
        }
      });

      // Handle reconnection
      this.handleReconnection();
    });

    // Error handler
    this.client.on('error', (error: Error) => {
      this.connectionStatus = {
        ...this.connectionStatus,
        error: error.message,
      };

      this.errorCallbacks.forEach(callback => {
        try {
          callback(error);
        } catch (callbackError) {
          console.error('Error in error callback:', callbackError);
        }
      });
    });

    // Order update handler
    this.client.on('order_update', (order: KiteOrderUpdate) => {
      try {
        const transformedOrder = this.transformOrderUpdate(order);
        this.orderUpdateCallbacks.forEach(callback => {
          try {
            callback(transformedOrder);
          } catch (error) {
            console.error('Error in order update callback:', error);
          }
        });
      } catch (error) {
        console.error('Error transforming order update:', error);
      }
    });
  }

  private transformTicks(rawTicks: KiteTick[]): InstrumentTick[] {
    return rawTicks.map(tick => ({
      token: tick.instrument_token,
      symbol: `${tick.instrument_token}`, // Use token as symbol for now
      lastPrice: tick.last_price,
      change: tick.change || 0,
      changePercent: tick.change_percent || 0,
      volume: tick.volume || 0,
      averagePrice: tick.average_price || 0,
      bid: tick.depth?.buy?.[0]?.price || 0,
      ask: tick.depth?.sell?.[0]?.price || 0,
      high: tick.ohlc?.high || 0,
      low: tick.ohlc?.low || 0,
      open: tick.ohlc?.open || 0,
      close: tick.ohlc?.close || 0,
      timestamp: tick.exchange_timestamp || new Date(),
    }));
  }

  private transformOrderUpdate(rawOrder: KiteOrderUpdate): OrderUpdate {
    return {
      orderId: rawOrder.order_id,
      status: rawOrder.status,
      instrument: rawOrder.tradingsymbol,
      quantity: rawOrder.quantity,
      price: rawOrder.price || rawOrder.average_price,
      timestamp: new Date(rawOrder.order_timestamp),
      // Include other fields without conflicts
      exchangeOrderId: rawOrder.exchange_order_id,
      parentOrderId: rawOrder.parent_order_id,
      statusMessage: rawOrder.status_message,
      variety: rawOrder.variety,
      exchange: rawOrder.exchange,
      orderType: rawOrder.order_type,
      transactionType: rawOrder.transaction_type,
      validity: rawOrder.validity,
      product: rawOrder.product,
      disclosedQuantity: rawOrder.disclosed_quantity,
      triggerPrice: rawOrder.trigger_price,
      averagePrice: rawOrder.average_price,
      filledQuantity: rawOrder.filled_quantity,
      pendingQuantity: rawOrder.pending_quantity,
      cancelledQuantity: rawOrder.cancelled_quantity,
      tag: rawOrder.tag,
      guid: rawOrder.guid,
    };
  }

  private handleReconnection(): void {
    if (!this.config.reconnect || this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.config.maxReconnectDelay || 30000);

    if (this.config.debug) {
      console.log(`Attempting reconnection ${this.reconnectAttempts} in ${delay}ms`);
    }

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        
        // Resubscribe to all active subscriptions
        if (this.activeSubscriptions.size > 0) {
          const subscriptions = Array.from(this.activeSubscriptions.values());
          await this.subscribe(subscriptions);
        }
      } catch (reconnectError) {
        if (this.config.debug) {
          console.error('Reconnection failed:', reconnectError);
        }
      }
    }, delay);
  }
}