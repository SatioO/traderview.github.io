import { useState, useEffect, useRef, useCallback } from 'react';

// Types
interface Tick {
  instrument_token: number;
  last_price: number;
  last_quantity: number;
  average_price: number;
  volume: number;
  buy_quantity: number;
  sell_quantity: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  timestamp: string;
}

interface WebSocketMessage {
  type: string;
  action?: string;
  data?: any;
  metadata?: any;
  timestamp?: number;
  success?: boolean;
  code?: string;
  message?: string;
  retryAfter?: number;
}

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'not_ready';
  message?: string;
  lastConnected?: number;
  reconnectAttempts?: number;
}

interface StreamingMetrics {
  messagesReceived: number;
  ticksReceived: number;
  errors: number;
  lastActivity: number;
  connectionStartTime: number;
  subscriptionCount: number;
}

// Connection Manager with Enterprise Features
class StreamingConnectionManager {
  private ws: WebSocket | null = null;
  private accessToken: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isConnecting = false;
  private isDestroyed = false;
  private rateLimited = false;
  private subscriptions = new Set<number>();
  private pendingSubscriptions = new Set<number>();
  private messageQueue: any[] = [];
  private metrics: StreamingMetrics;
  
  // Callbacks
  private onStatusChange: (status: ConnectionStatus) => void;
  private onTicksReceived: (ticks: Tick[]) => void;
  private onError: (error: any) => void;
  
  // Timers
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private rateLimitTimer: NodeJS.Timeout | null = null;

  constructor(
    accessToken: string,
    onStatusChange: (status: ConnectionStatus) => void,
    onTicksReceived: (ticks: Tick[]) => void,
    onError: (error: any) => void
  ) {
    this.accessToken = accessToken;
    this.onStatusChange = onStatusChange;
    this.onTicksReceived = onTicksReceived;
    this.onError = onError;
    
    this.metrics = {
      messagesReceived: 0,
      ticksReceived: 0,
      errors: 0,
      lastActivity: Date.now(),
      connectionStartTime: Date.now(),
      subscriptionCount: 0
    };
    
    this.startHealthMonitoring();
  }

  async connect(): Promise<void> {
    if (this.isDestroyed || this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.onStatusChange({ status: 'connecting' });

    try {
      // Check connection eligibility first
      const canConnect = await this.checkConnectionEligibility();
      if (!canConnect) {
        throw new Error('Cannot establish connection - eligibility check failed');
      }

      // Establish WebSocket connection
      const wsUrl = `ws://localhost:8000?token=${this.accessToken}`;
      this.ws = new WebSocket(wsUrl);
      
      this.setupEventHandlers();
      
      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, 30000);

      this.ws.addEventListener('open', () => {
        clearTimeout(connectionTimeout);
      }, { once: true });

    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error);
    }
  }

  private async checkConnectionEligibility(): Promise<boolean> {
    try {
      const response = await fetch('/api/streaming/connection-check', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      const data = await response.json();
      return data.success && data.data.canConnect;
    } catch (error) {
      console.error('Connection eligibility check failed:', error);
      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }

  private handleOpen(): void {
    if (this.isDestroyed) return;
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.metrics.connectionStartTime = Date.now();
    
    this.onStatusChange({
      status: 'connected',
      message: 'Market data connection established',
      lastConnected: Date.now()
    });

    // Start ping mechanism
    this.startPing();
    
    // Process queued messages
    this.processMessageQueue();
    
    // Re-subscribe to previous subscriptions
    if (this.subscriptions.size > 0) {
      this.subscribe(Array.from(this.subscriptions));
    }
  }

  private handleMessage(event: MessageEvent): void {
    if (this.isDestroyed) return;
    
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.metrics.messagesReceived++;
      this.metrics.lastActivity = Date.now();
      
      this.processMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.metrics.errors++;
    }
  }

  private processMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'connection':
        this.handleConnectionStatus(message);
        break;
      
      case 'ticks':
        this.handleTicks(message);
        break;
      
      case 'order_update':
        this.handleOrderUpdate(message);
        break;
      
      case 'subscription_response':
        this.handleSubscriptionResponse(message);
        break;
      
      case 'error':
        this.handleStreamingError(message);
        break;
      
      case 'pong':
        // Ping response received
        break;
      
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleConnectionStatus(message: WebSocketMessage): void {
    this.onStatusChange({
      status: message.status as any,
      message: message.message
    });
  }

  private handleTicks(message: WebSocketMessage): void {
    if (message.data && Array.isArray(message.data)) {
      this.metrics.ticksReceived += message.data.length;
      this.onTicksReceived(message.data);
    }
  }

  private handleOrderUpdate(message: WebSocketMessage): void {
    // Handle order updates if needed
    console.log('Order update received:', message.data);
  }

  private handleSubscriptionResponse(message: WebSocketMessage): void {
    if (message.success && message.action === 'subscribe') {
      this.metrics.subscriptionCount = message.data?.totalSubscriptions || 0;
    }
  }

  private handleStreamingError(message: WebSocketMessage): void {
    this.metrics.errors++;
    
    switch (message.code) {
      case 'RATE_LIMIT_EXCEEDED':
        this.handleRateLimit(message);
        break;
      
      case 'SUBSCRIPTION_LIMIT_EXCEEDED':
        this.onError({
          type: 'subscription_limit',
          message: 'Maximum subscriptions reached',
          code: message.code
        });
        break;
      
      case 'SERVICE_NOT_READY':
        this.onStatusChange({ status: 'not_ready' });
        break;
      
      default:
        this.onError({
          type: 'streaming_error',
          message: message.message,
          code: message.code
        });
    }
  }

  private handleRateLimit(message: WebSocketMessage): void {
    const retryAfter = message.retryAfter || 60;
    this.rateLimited = true;
    
    console.warn(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`);
    
    if (this.rateLimitTimer) {
      clearTimeout(this.rateLimitTimer);
    }
    
    this.rateLimitTimer = setTimeout(() => {
      this.rateLimited = false;
    }, retryAfter * 1000);
  }

  private handleClose(event: CloseEvent): void {
    if (this.isDestroyed) return;
    
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    
    this.stopPing();
    
    // Handle different close codes
    if (event.code === 1001) {
      // Client going away (page reload) - normal behavior
      console.log('Page reload detected - no reconnection needed');
      return;
    }
    
    if (event.code !== 1000) {
      // Abnormal closure - attempt reconnection
      this.onStatusChange({
        status: 'reconnecting',
        reconnectAttempts: this.reconnectAttempts
      });
      this.attemptReconnection();
    } else {
      this.onStatusChange({ status: 'disconnected' });
    }
  }

  private handleError(error: Event): void {
    if (this.isDestroyed) return;
    
    console.error('WebSocket error:', error);
    this.metrics.errors++;
    this.onStatusChange({ status: 'error' });
  }

  private handleConnectionError(error: any): void {
    console.error('Connection error:', error);
    this.metrics.errors++;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnection();
    } else {
      this.onStatusChange({ status: 'error' });
      this.onError({
        type: 'max_reconnect_attempts',
        message: 'Maximum reconnection attempts reached'
      });
    }
  }

  private attemptReconnection(): void {
    if (this.isDestroyed || this.reconnectTimer) return;
    
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.rateLimited) {
        this.sendMessage({
          action: 'ping',
          timestamp: Date.now()
        });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.checkConnectionHealth();
    }, 60000); // Check every minute
  }

  private checkConnectionHealth(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.metrics.lastActivity;
    
    // If no activity for 2 minutes and connected, send ping
    if (timeSinceLastActivity > 120000 && this.ws?.readyState === WebSocket.OPEN) {
      console.warn('No activity for 2 minutes, sending ping');
      this.sendMessage({ action: 'ping', timestamp: now });
    }
    
    // Log metrics periodically
    console.log('Streaming metrics:', {
      ...this.metrics,
      connectionAge: now - this.metrics.connectionStartTime,
      subscriptionCount: this.subscriptions.size
    });
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  private sendMessage(message: any): void {
    if (this.isDestroyed || this.rateLimited) return;
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }

  // Public methods
  subscribe(tokens: number[], mode: 'ltp' | 'quote' | 'full' = 'full'): void {
    if (this.isDestroyed) return;
    
    // Add to subscriptions set
    tokens.forEach(token => this.subscriptions.add(token));
    
    // Batch subscriptions for performance
    this.batchSubscribe(tokens, mode);
  }

  private batchSubscribe(tokens: number[], mode: string): void {
    const batchSize = 50;
    const batches = this.createBatches(tokens, batchSize);
    
    batches.forEach((batch, index) => {
      setTimeout(() => {
        this.sendMessage({
          action: 'subscribe',
          tokens: batch,
          mode
        });
      }, index * 100); // Small delay between batches
    });
  }

  unsubscribe(tokens: number[]): void {
    if (this.isDestroyed) return;
    
    // Remove from subscriptions set
    tokens.forEach(token => this.subscriptions.delete(token));
    
    this.sendMessage({
      action: 'unsubscribe',
      tokens
    });
  }

  changeMode(tokens: number[], mode: 'ltp' | 'quote' | 'full'): void {
    if (this.isDestroyed) return;
    
    this.sendMessage({
      action: 'setMode',
      tokens,
      mode
    });
  }

  getSubscriptions(): number[] {
    return Array.from(this.subscriptions);
  }

  getMetrics(): StreamingMetrics {
    return { ...this.metrics };
  }

  private createBatches<T>(array: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  destroy(): void {
    this.isDestroyed = true;
    
    // Clear all timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    if (this.rateLimitTimer) {
      clearTimeout(this.rateLimitTimer);
      this.rateLimitTimer = null;
    }
    
    // Close WebSocket connection
    if (this.ws) {
      this.ws.close(1000, 'Component unmounted');
      this.ws = null;
    }
    
    // Clear data
    this.subscriptions.clear();
    this.messageQueue.length = 0;
    
    console.log('[STREAM] Connection destroyed successfully');
  }
}

// React Hook
export const useWebSocketStreaming = (accessToken: string | null) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected'
  });
  const [ticks, setTicks] = useState<Record<number, Tick>>({});
  const [subscriptions, setSubscriptions] = useState<Set<number>>(new Set());
  const [metrics, setMetrics] = useState<StreamingMetrics | null>(null);
  
  const connectionManagerRef = useRef<StreamingConnectionManager | null>(null);
  
  // Callbacks
  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
  }, []);
  
  const handleTicksReceived = useCallback((newTicks: Tick[]) => {
    setTicks(prevTicks => {
      const updated = { ...prevTicks };
      newTicks.forEach(tick => {
        updated[tick.instrument_token] = tick;
      });
      return updated;
    });
  }, []);
  
  const handleError = useCallback((error: any) => {
    console.error('Streaming error:', error);
    // You can add error handling UI updates here
  }, []);
  
  // Connection management
  const connect = useCallback(() => {
    if (!accessToken || connectionManagerRef.current) return;
    
    connectionManagerRef.current = new StreamingConnectionManager(
      accessToken,
      handleStatusChange,
      handleTicksReceived,
      handleError
    );
    
    connectionManagerRef.current.connect();
  }, [accessToken, handleStatusChange, handleTicksReceived, handleError]);
  
  const disconnect = useCallback(() => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.destroy();
      connectionManagerRef.current = null;
    }
    setConnectionStatus({ status: 'disconnected' });
    setTicks({});
    setSubscriptions(new Set());
    setMetrics(null);
  }, []);
  
  // Subscription management
  const subscribe = useCallback((tokens: number[], mode: 'ltp' | 'quote' | 'full' = 'full') => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.subscribe(tokens, mode);
      setSubscriptions(new Set(connectionManagerRef.current.getSubscriptions()));
    }
  }, []);
  
  const unsubscribe = useCallback((tokens: number[]) => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.unsubscribe(tokens);
      setSubscriptions(new Set(connectionManagerRef.current.getSubscriptions()));
    }
  }, []);
  
  const changeMode = useCallback((tokens: number[], mode: 'ltp' | 'quote' | 'full') => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.changeMode(tokens, mode);
    }
  }, []);
  
  const getMetrics = useCallback(() => {
    if (connectionManagerRef.current) {
      const currentMetrics = connectionManagerRef.current.getMetrics();
      setMetrics(currentMetrics);
      return currentMetrics;
    }
    return null;
  }, []);
  
  // Effects
  useEffect(() => {
    if (accessToken) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [accessToken, connect, disconnect]);
  
  // Periodic metrics update
  useEffect(() => {
    if (connectionStatus.status === 'connected') {
      const interval = setInterval(() => {
        getMetrics();
      }, 30000); // Update metrics every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [connectionStatus.status, getMetrics]);
  
  return {
    connectionStatus,
    ticks,
    subscriptions,
    metrics,
    subscribe,
    unsubscribe,
    changeMode,
    connect,
    disconnect,
    getMetrics
  };
};

export default useWebSocketStreaming;