// src/services/WebSocketService.ts
import type { Tick, OrderUpdate } from '../types/broker';

type MessageType = 'ticks' | 'order_update' | 'info' | 'error';

interface WebSocketMessage {
  type: MessageType;
  data: Tick[] | OrderUpdate | any;
  message?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandler: MessageHandler | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds

  public connect(token: string, onMessage: MessageHandler): void {
    this.messageHandler = onMessage;
    const wsUrl = `ws://localhost:8000?token=${token}`;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket connection already open.');
      return;
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connection established.');
      this.reconnectAttempts = 0;
      onMessage({ type: 'info', data: 'WebSocket connection established.' });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (this.messageHandler) {
          this.messageHandler(message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        onMessage({ type: 'error', data: 'Error parsing WebSocket message.' });
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onMessage({ type: 'error', data: 'WebSocket error occurred.' });
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed.');
      onMessage({ type: 'info', data: 'WebSocket connection closed.' });
      this.handleReconnect(token, onMessage);
    };
  }

  private handleReconnect(token: string, onMessage: MessageHandler): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      setTimeout(() => this.connect(token, onMessage), this.reconnectInterval);
    } else {
      console.error('Max reconnect attempts reached.');
      onMessage({ type: 'error', data: 'Could not reconnect to WebSocket.' });
    }
  }

  private sendMessage(message: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocketService: Sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected. Ready state:', this.ws?.readyState);
    }
  }

  public subscribe(tokens: number[], mode = 'full'): void {
    console.log('WebSocketService: Subscribing to tokens:', { tokens, mode });
    this.sendMessage({ action: 'subscribe', tokens, mode });
  }

  public unsubscribe(tokens: number[]): void {
    this.sendMessage({ action: 'unsubscribe', tokens });
  }

  public setMode(mode: 'ltp' | 'quote' | 'full', tokens: number[]): void {
    this.sendMessage({ action: 'setMode', mode, tokens });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new WebSocketService();
