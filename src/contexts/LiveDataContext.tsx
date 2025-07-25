// src/contexts/LiveDataContext.tsx
import { createContext } from 'react';
import type { Tick } from '../types/broker';

export interface LiveDataContextType {
  ticks: Record<number, Tick>;
  subscribe: (tokens: number[], mode?: 'ltp' | 'quote' | 'full') => void;
  unsubscribe: (tokens: number[]) => void;
  isConnected: boolean;
  connectionError: string | null;
  // Helper functions
  getLivePrice: (instrumentToken: number) => number | null;
  getTickData: (instrumentToken: number) => Tick | null;
}

export const LiveDataContext = createContext<LiveDataContextType | undefined>(
  undefined
);
