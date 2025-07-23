import { useInstrumentTick } from './useInstrumentTick';

// Hook for getting live price in a simple format
export const useLivePrice = (token: number | null, symbol: string) => {
  const { tick, isSubscribed, subscriptionError } = useInstrumentTick(token, symbol, 'ltp');
  
  return {
    price: tick?.lastPrice || 0,
    change: tick?.change || 0,
    changePercent: tick?.changePercent || 0,
    timestamp: tick?.timestamp,
    isLive: isSubscribed && !!tick,
    error: subscriptionError,
  };
};

export default useLivePrice;