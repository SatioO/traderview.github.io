import { createContext } from 'react';
import { type LiveDataSubscription } from '../services/LiveDataManager';
import type {
  InstrumentTick,
  OrderUpdate,
  BrokerConnectionStatus,
} from '../adapters/ports/BrokerDataAdapter';

export interface LiveDataContextType {
  // Connection status
  isConnected: boolean;
  connectionStatus: BrokerConnectionStatus | null;
  isInitializing: boolean;
  initializationError: string | null;

  // Subscription management
  subscribeToInstrument: (
    token: number,
    symbol: string,
    mode?: 'ltp' | 'quote' | 'full'
  ) => Promise<string>;
  unsubscribeFromInstrument: (token: number) => Promise<void>;
  getLatestTick: (token: number) => InstrumentTick | null;
  getAllLatestTicks: () => Map<number, InstrumentTick>;
  getActiveSubscriptions: () => LiveDataSubscription[];

  // Event handlers
  onTick: (callback: (ticks: InstrumentTick[]) => void) => () => void;
  onOrderUpdate: (callback: (order: OrderUpdate) => void) => () => void;

  // Manual controls
  reconnect: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export const LiveDataContext = createContext<LiveDataContextType | undefined>(
  undefined
);
