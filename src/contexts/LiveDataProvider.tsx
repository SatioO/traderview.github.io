// src/contexts/LiveDataProvider.tsx
import React, {
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  useContext,
} from 'react';
import { LiveDataContext } from './LiveDataContext';
import type { Tick } from '../types/broker';
import WebSocketService from '../services/WebSocketService';
import AuthContext from './AuthContext';
import authService from '../services/authService';

interface LiveDataProviderProps {
  children: ReactNode;
}

export const LiveDataProvider: React.FC<LiveDataProviderProps> = ({
  children,
}) => {
  const [ticks, setTicks] = useState<Record<number, Tick>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { isAuthenticated } = useContext(AuthContext)!;

  useEffect(() => {
    if (isAuthenticated) {
      const token = authService.getStoredToken();
      if (token) {
        WebSocketService.connect(token, (message) => {
          switch (message.type) {
            case 'ticks':
              console.log('Ticks received:', message.data);
              setTicks((prevTicks) => {
                const newTicks = { ...prevTicks };
                (message.data as Tick[]).forEach((tick) => {
                  newTicks[tick.instrument_token] = tick;
                });
                return newTicks;
              });
              break;
            case 'info':
              console.log('WebSocket Info:', message.message);
              if (message.message?.includes('established')) {
                setIsConnected(true);
                setConnectionError(null);
              } else if (message.message?.includes('closed')) {
                setIsConnected(false);
              }
              break;
            case 'error':
              console.error('WebSocket Error:', message.message);
              setConnectionError(
                message.message || 'An unknown error occurred.'
              );
              setIsConnected(false);
              break;
            case 'order_update':
              console.log('Order update received:', message.data);
              // Handle order updates if necessary
              break;
            default:
              break;
          }
        });
      }
    } else {
      WebSocketService.disconnect();
      setIsConnected(false);
      setTicks({});
    }

    return () => {
      WebSocketService.disconnect();
    };
  }, [isAuthenticated]);

  // Helper function to get live price for an instrument
  const getLivePrice = useCallback((instrumentToken: number): number | null => {
    const tick = ticks[instrumentToken];
    console.log('LiveDataProvider: getLivePrice called:', {
      instrumentToken,
      tick: tick ? { last_price: tick.last_price, timestamp: tick.timestamp } : null,
      allTicks: Object.keys(ticks)
    });
    return tick?.last_price || null;
  }, [ticks]);

  // Helper function to get full tick data for an instrument
  const getTickData = useCallback((instrumentToken: number): Tick | null => {
    return ticks[instrumentToken] || null;
  }, [ticks]);

  const subscribe = useCallback(
    (tokens: number[], mode: 'ltp' | 'quote' | 'full' = 'full') => {
      WebSocketService.subscribe(tokens, mode);
    },
    []
  );

  const unsubscribe = useCallback((tokens: number[]) => {
    WebSocketService.unsubscribe(tokens);
  }, []);

  return (
    <LiveDataContext.Provider
      value={{ 
        ticks, 
        subscribe, 
        unsubscribe, 
        isConnected, 
        connectionError,
        getLivePrice,
        getTickData
      }}
    >
      {children}
    </LiveDataContext.Provider>
  );
};

export default LiveDataProvider;
