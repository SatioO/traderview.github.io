/**
 * Kite Connect WebSocket Client
 * Implements native WebSocket connection to Kite's streaming API
 * Based on: https://kite.trade/docs/connect/v3/websocket/
 */

export interface KiteTickerParams {
  api_key: string;
  access_token: string;
  reconnect?: boolean;
  max_reconnect_delay?: number;
  max_retry?: number;
}

export interface KiteDepthItem {
  price: number;
  quantity: number;
  orders: number;
}

export interface KiteDepth {
  buy: KiteDepthItem[];
  sell: KiteDepthItem[];
}

export interface KiteTick {
  instrument_token: number;
  last_price: number;
  last_quantity?: number;
  average_price?: number;
  volume?: number;
  buy_quantity?: number;
  sell_quantity?: number;
  ohlc?: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  change?: number;
  change_percent?: number;
  exchange_timestamp?: Date;
  last_trade_time?: Date;
  oi?: number;
  oi_day_high?: number;
  oi_day_low?: number;
  depth?: KiteDepth;
}

export interface KiteOrderUpdate {
  account_id: string;
  order_id: string;
  exchange_order_id: string;
  parent_order_id: string;
  status: string;
  status_message: string;
  order_timestamp: string;
  exchange_update_timestamp: string;
  exchange_timestamp: string;
  variety: string;
  exchange: string;
  tradingsymbol: string;
  instrument_token: number;
  order_type: string;
  transaction_type: string;
  validity: string;
  product: string;
  quantity: number;
  disclosed_quantity: number;
  price: number;
  trigger_price: number;
  average_price: number;
  filled_quantity: number;
  pending_quantity: number;
  cancelled_quantity: number;
  market_protection: number;
  meta: Record<string, unknown>;
  tag: string;
  guid: string;
}

type KiteMode = 'ltp' | 'quote' | 'full';

export class KiteWebSocketClient {
  private ws: WebSocket | null = null;
  private params: KiteTickerParams;
  private isConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private subscriptions = new Set<number>();
  private tokenModes = new Map<number, KiteMode>();

  // Event handlers
  private onConnectHandlers: Array<() => void> = [];
  private onDisconnectHandlers: Array<(error?: Error) => void> = [];
  private onErrorHandlers: Array<(error: Error) => void> = [];
  private onTickHandlers: Array<(ticks: KiteTick[]) => void> = [];
  private onOrderUpdateHandlers: Array<(order: KiteOrderUpdate) => void> = [];
  private onMessageHandlers: Array<(data: ArrayBuffer) => void> = [];

  constructor(params: KiteTickerParams) {
    this.params = {
      reconnect: true,
      max_reconnect_delay: 60000,
      max_retry: 50,
      ...params,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `wss://ws.kite.trade?api_key=${this.params.api_key}&access_token=${this.params.access_token}`;
        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 30000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectHandlers.forEach((handler) => {
            try {
              handler();
            } catch (error) {
              console.error('Error in connect handler:', error);
            }
          });
          resolve();
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          this.isConnected = false;
          const error = new Error(
            `WebSocket closed: ${event.code} ${event.reason}`
          );
          this.onDisconnectHandlers.forEach((handler) => {
            try {
              handler(error);
            } catch (handlerError) {
              console.error('Error in disconnect handler:', handlerError);
            }
          });
          this.handleReconnection();
        };

        this.ws.onerror = (err) => {
          console.log(err);
          clearTimeout(timeout);
          const error = new Error('WebSocket error occurred');
          this.onErrorHandlers.forEach((handler) => {
            try {
              handler(error);
            } catch (handlerError) {
              console.error('Error in error handler:', handlerError);
            }
          });
          if (!this.isConnected) {
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.subscriptions.clear();
    this.tokenModes.clear();
  }

  get connected(): boolean {
    return this.isConnected;
  }

  subscribe(tokens: number[]): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    tokens.forEach((token) => this.subscriptions.add(token));

    const message = {
      a: 'subscribe',
      v: tokens,
    };

    this.ws.send(JSON.stringify(message));
  }

  unsubscribe(tokens: number[]): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    tokens.forEach((token) => {
      this.subscriptions.delete(token);
      this.tokenModes.delete(token);
    });

    const message = {
      a: 'unsubscribe',
      v: tokens,
    };

    this.ws.send(JSON.stringify(message));
  }

  setMode(mode: KiteMode, tokens: number[]): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    tokens.forEach((token) => this.tokenModes.set(token, mode));

    const message = {
      a: 'mode',
      v: [mode, tokens],
    };

    this.ws.send(JSON.stringify(message));
  }

  // Event handler registration
  on(event: 'connect', handler: () => void): void;
  on(event: 'disconnect', handler: (error?: Error) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'ticks', handler: (ticks: KiteTick[]) => void): void;
  on(event: 'order_update', handler: (order: KiteOrderUpdate) => void): void;
  on(event: 'message', handler: (data: ArrayBuffer) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  on(event: string, handler: Function): void {
    switch (event) {
      case 'connect':
        this.onConnectHandlers.push(handler as () => void);
        break;
      case 'disconnect':
        this.onDisconnectHandlers.push(handler as (error?: Error) => void);
        break;
      case 'error':
        this.onErrorHandlers.push(handler as (error: Error) => void);
        break;
      case 'ticks':
        this.onTickHandlers.push(handler as (ticks: KiteTick[]) => void);
        break;
      case 'order_update':
        this.onOrderUpdateHandlers.push(
          handler as (order: KiteOrderUpdate) => void
        );
        break;
      case 'message':
        this.onMessageHandlers.push(handler as (data: ArrayBuffer) => void);
        break;
    }
  }

  private handleMessage(data: ArrayBuffer | string): void {
    if (typeof data === 'string') {
      // Text message - could be order update or error
      try {
        const message = JSON.parse(data);
        if (message.type === 'order') {
          this.onOrderUpdateHandlers.forEach((handler) => {
            try {
              handler(message.data as KiteOrderUpdate);
            } catch (error) {
              console.error('Error in order update handler:', error);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing text message:', error);
      }
    } else {
      // Binary message - market data
      this.onMessageHandlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });

      const ticks = this.parseBinaryMessage(data);
      if (ticks.length > 0) {
        this.onTickHandlers.forEach((handler) => {
          try {
            handler(ticks);
          } catch (error) {
            console.error('Error in tick handler:', error);
          }
        });
      }
    }
  }

  private parseBinaryMessage(buffer: ArrayBuffer): KiteTick[] {
    const ticks: KiteTick[] = [];
    const dataView = new DataView(buffer);
    let offset = 0;

    while (offset < buffer.byteLength) {
      if (offset + 4 > buffer.byteLength) break;

      // First 2 bytes: number of packets (not used but part of protocol)
      offset += 2;

      // Next 2 bytes: length of packet
      const packetLength = dataView.getUint16(offset, false);
      offset += 2;

      if (offset + packetLength > buffer.byteLength) break;

      // Parse packet based on length
      const tick = this.parsePacket(dataView, offset, packetLength);
      if (tick) {
        ticks.push(tick);
      }

      offset += packetLength;
    }

    return ticks;
  }

  private parsePacket(
    dataView: DataView,
    offset: number,
    length: number
  ): KiteTick | null {
    try {
      // First 4 bytes: instrument token
      const instrumentToken = dataView.getUint32(offset, false);
      const tick: KiteTick = {
        instrument_token: instrumentToken,
        last_price: 0,
      };

      if (length >= 8) {
        // LTP mode (8 bytes)
        tick.last_price = dataView.getUint32(offset + 4, false) / 100;
      }

      if (length >= 44) {
        // Quote mode (44 bytes)
        tick.last_quantity = dataView.getUint32(offset + 8, false);
        tick.average_price = dataView.getUint32(offset + 12, false) / 100;
        tick.volume = dataView.getUint32(offset + 16, false);
        tick.buy_quantity = dataView.getUint32(offset + 20, false);
        tick.sell_quantity = dataView.getUint32(offset + 24, false);

        const open = dataView.getUint32(offset + 28, false) / 100;
        const high = dataView.getUint32(offset + 32, false) / 100;
        const low = dataView.getUint32(offset + 36, false) / 100;
        const close = dataView.getUint32(offset + 40, false) / 100;

        tick.ohlc = { open, high, low, close };

        // Calculate change and change percentage
        if (close > 0) {
          tick.change = tick.last_price - close;
          tick.change_percent = (tick.change / close) * 100;
        }
      }

      if (length >= 184) {
        // Full mode (184 bytes)
        const lastTradeTime = dataView.getUint32(offset + 44, false);
        if (lastTradeTime > 0) {
          tick.last_trade_time = new Date(lastTradeTime * 1000);
        }

        tick.oi = dataView.getUint32(offset + 48, false);
        tick.oi_day_high = dataView.getUint32(offset + 52, false);
        tick.oi_day_low = dataView.getUint32(offset + 56, false);

        const exchangeTimestamp = dataView.getUint32(offset + 60, false);
        if (exchangeTimestamp > 0) {
          tick.exchange_timestamp = new Date(exchangeTimestamp * 1000);
        }

        // Parse market depth (10 bid/ask pairs, 12 bytes each)
        const depth: KiteDepth = { buy: [], sell: [] };
        let depthOffset = offset + 64;

        // 5 buy levels
        for (let i = 0; i < 5; i++) {
          const quantity = dataView.getUint32(depthOffset, false);
          const price = dataView.getUint32(depthOffset + 4, false) / 100;
          const orders = dataView.getUint16(depthOffset + 8, false);

          depth.buy.push({ quantity, price, orders });
          depthOffset += 12;
        }

        // 5 sell levels
        for (let i = 0; i < 5; i++) {
          const quantity = dataView.getUint32(depthOffset, false);
          const price = dataView.getUint32(depthOffset + 4, false) / 100;
          const orders = dataView.getUint16(depthOffset + 8, false);

          depth.sell.push({ quantity, price, orders });
          depthOffset += 12;
        }

        tick.depth = depth;
      }

      return tick;
    } catch (error) {
      console.error('Error parsing packet:', error);
      return null;
    }
  }

  private handleReconnection(): void {
    if (
      !this.params.reconnect ||
      this.reconnectAttempts >= (this.params.max_retry || 50)
    ) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      this.params.max_reconnect_delay || 60000
    );

    console.log(
      `Attempting reconnection ${this.reconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();

        // Resubscribe to all tokens
        if (this.subscriptions.size > 0) {
          const tokens = Array.from(this.subscriptions);
          this.subscribe(tokens);

          // Restore modes
          const modeGroups = new Map<KiteMode, number[]>();
          this.tokenModes.forEach((mode, token) => {
            if (!modeGroups.has(mode)) {
              modeGroups.set(mode, []);
            }
            modeGroups.get(mode)!.push(token);
          });

          modeGroups.forEach((tokens, mode) => {
            this.setMode(mode, tokens);
          });
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }
}
