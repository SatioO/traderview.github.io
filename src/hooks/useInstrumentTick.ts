import { useEffect, useState } from 'react';
import { useLiveData } from './useLiveData';
import liveDataManager from '../services/LiveDataManager';
import type { InstrumentTick } from '../adapters/ports/BrokerDataAdapter';

// Hook to subscribe to a specific instrument with automatic cleanup
export const useInstrumentTick = (
  token: number | null,
  symbol: string,
  mode: 'ltp' | 'quote' | 'full' = 'ltp'
): {
  tick: InstrumentTick | null;
  isSubscribed: boolean;
  subscriptionError: string | null;
} => {
  const { subscribeToInstrument, unsubscribeFromInstrument, getLatestTick, isConnected } = useLiveData();
  const [tick, setTick] = useState<InstrumentTick | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !isConnected) {
      setTick(null);
      setIsSubscribed(false);
      return;
    }

    let subscriptionId: string | null = null;

    const subscribe = async () => {
      try {
        subscriptionId = await subscribeToInstrument(token, symbol, mode);
        setIsSubscribed(true);
        setSubscriptionError(null);
        
        // Get initial tick if available
        const initialTick = getLatestTick(token);
        if (initialTick) {
          setTick(initialTick);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Subscription failed';
        setSubscriptionError(errorMessage);
        setIsSubscribed(false);
        console.error(`Failed to subscribe to ${symbol}:`, error);
      }
    };

    subscribe();

    return () => {
      if (subscriptionId && token) {
        unsubscribeFromInstrument(token).catch(error => {
          console.error(`Failed to unsubscribe from ${symbol}:`, error);
        });
      }
      setTick(null);
      setIsSubscribed(false);
      setSubscriptionError(null);
    };
  }, [token, symbol, mode, isConnected, subscribeToInstrument, unsubscribeFromInstrument, getLatestTick]);

  // Update tick data when new ticks arrive
  useEffect(() => {
    if (!token || !isSubscribed) return;

    const unsubscribeFromTicks = liveDataManager.onTick((ticks) => {
      const instrumentTick = ticks.find(t => t.token === token);
      if (instrumentTick) {
        setTick(instrumentTick);
      }
    });

    return unsubscribeFromTicks;
  }, [token, isSubscribed]);

  return {
    tick,
    isSubscribed,
    subscriptionError,
  };
};

export default useInstrumentTick;