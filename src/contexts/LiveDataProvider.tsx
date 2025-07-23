import React, { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import liveDataManager from '../services/LiveDataManager';
import type {
  InstrumentTick,
  OrderUpdate,
  BrokerConnectionStatus,
} from '../adapters/ports/BrokerDataAdapter';
import brokerApiService from '../services/brokerApiService';
import { LiveDataContext, type LiveDataContextType } from './LiveDataContext';

interface LiveDataProviderProps {
  children: ReactNode;
}

export const LiveDataProvider: React.FC<LiveDataProviderProps> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const { hasActiveBrokerSession } = useSettings();

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<BrokerConnectionStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  // Get active broker session to determine which broker to connect to
  const { data: activeSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['broker', 'active-session'],
    queryFn: () => brokerApiService.getActiveSession(),
    enabled: isAuthenticated && hasActiveBrokerSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Initialize live data manager when user is authenticated and has active broker session
  useEffect(() => {
    let mounted = true;

    const initializeLiveData = async () => {
      if (
        !isAuthenticated ||
        !hasActiveBrokerSession ||
        !activeSession?.hasActiveSession
      ) {
        return;
      }

      if (!activeSession.activeSession?.broker) {
        console.warn('Active session missing broker details');
        return;
      }

      setIsInitializing(true);
      setInitializationError(null);

      try {
        await liveDataManager.initialize({
          brokerName: activeSession.activeSession.broker,
          apiKey: import.meta.env.VITE_KITE_API_KEY || '',
          debug: import.meta.env.DEV,
          autoReconnect: true,
          maxReconnectAttempts: 5,
        });

        if (mounted) {
          setIsConnected(liveDataManager.isConnected());
          setConnectionStatus(liveDataManager.getConnectionStatus());
          console.log(
            `Live data connection established for ${activeSession.activeSession.broker}`
          );
        }
      } catch (error) {
        if (mounted) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to initialize live data';
          setInitializationError(errorMessage);
          console.error('Failed to initialize live data manager:', error);
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeLiveData();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, hasActiveBrokerSession, activeSession]);

  // Set up connection status monitoring
  useEffect(() => {
    if (!isAuthenticated || !hasActiveBrokerSession) {
      return;
    }

    const unsubscribeFromConnectionStatus = liveDataManager.onConnectionStatus(
      (status) => {
        setIsConnected(status.isConnected);
        setConnectionStatus(status);

        if (status.error) {
          console.warn('Live data connection error:', status.error);
        }
      }
    );

    // Update initial connection status
    setIsConnected(liveDataManager.isConnected());
    setConnectionStatus(liveDataManager.getConnectionStatus());

    return unsubscribeFromConnectionStatus;
  }, [isAuthenticated, hasActiveBrokerSession]);

  // Cleanup when user logs out or loses broker session
  useEffect(() => {
    if (!isAuthenticated || !hasActiveBrokerSession) {
      const cleanup = async () => {
        try {
          await liveDataManager.cleanup();
          setIsConnected(false);
          setConnectionStatus(null);
          setInitializationError(null);
        } catch (error) {
          console.error('Error cleaning up live data manager:', error);
        }
      };

      cleanup();
    }
  }, [isAuthenticated, hasActiveBrokerSession]);

  // Subscription management functions
  const subscribeToInstrument = useCallback(
    async (
      token: number,
      symbol: string,
      mode: 'ltp' | 'quote' | 'full' = 'ltp'
    ) => {
      if (!isConnected) {
        throw new Error('Not connected to live data stream');
      }
      return liveDataManager.subscribeToInstrument(token, symbol, mode);
    },
    [isConnected]
  );

  const unsubscribeFromInstrument = useCallback(async (token: number) => {
    return liveDataManager.unsubscribeFromInstrument(token);
  }, []);

  const getLatestTick = useCallback((token: number) => {
    return liveDataManager.getLatestTick(token);
  }, []);

  const getAllLatestTicks = useCallback(() => {
    return liveDataManager.getAllLatestTicks();
  }, []);

  const getActiveSubscriptions = useCallback(() => {
    return liveDataManager.getActiveSubscriptions();
  }, []);

  const onTick = useCallback((callback: (ticks: InstrumentTick[]) => void) => {
    return liveDataManager.onTick(callback);
  }, []);

  const onOrderUpdate = useCallback(
    (callback: (order: OrderUpdate) => void) => {
      return liveDataManager.onOrderUpdate(callback);
    },
    []
  );

  const reconnect = useCallback(async () => {
    setIsInitializing(true);
    setInitializationError(null);

    try {
      await liveDataManager.reconnect();
      setIsConnected(liveDataManager.isConnected());
      setConnectionStatus(liveDataManager.getConnectionStatus());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Reconnection failed';
      setInitializationError(errorMessage);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const cleanup = useCallback(async () => {
    await liveDataManager.cleanup();
    setIsConnected(false);
    setConnectionStatus(null);
    setInitializationError(null);
  }, []);

  const value: LiveDataContextType = {
    isConnected,
    connectionStatus,
    isInitializing: isInitializing || isLoadingSession,
    initializationError,
    subscribeToInstrument,
    unsubscribeFromInstrument,
    getLatestTick,
    getAllLatestTicks,
    getActiveSubscriptions,
    onTick,
    onOrderUpdate,
    reconnect,
    cleanup,
  };

  return (
    <LiveDataContext.Provider value={value}>
      {children}
    </LiveDataContext.Provider>
  );
};
