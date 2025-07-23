import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Signal, SignalHigh, SignalLow } from 'lucide-react';
import { useInstrumentTick } from '../hooks/useInstrumentTick';
import { useLiveData } from '../hooks/useLiveData';
import type { InstrumentTick } from '../adapters/ports/BrokerDataAdapter';

interface LivePriceDisplayProps {
  token: number;
  symbol: string;
  mode?: 'ltp' | 'quote' | 'full';
  className?: string;
}

export const LivePriceDisplay: React.FC<LivePriceDisplayProps> = ({
  token,
  symbol,
  mode = 'ltp',
  className = '',
}) => {
  const { tick, isSubscribed, subscriptionError } = useInstrumentTick(token, symbol, mode);
  const { isConnected, connectionStatus } = useLiveData();

  if (!isConnected) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <SignalLow className="w-4 h-4" />
        <span className="text-sm">Not connected</span>
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div className={`flex items-center space-x-2 text-red-500 ${className}`}>
        <SignalLow className="w-4 h-4" />
        <span className="text-sm">Error: {subscriptionError}</span>
      </div>
    );
  }

  if (!isSubscribed || !tick) {
    return (
      <div className={`flex items-center space-x-2 text-gray-400 ${className}`}>
        <Signal className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Loading {symbol}...</span>
      </div>
    );
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getPriceColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-700';
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(change)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Connection Status */}
      <SignalHigh className="w-4 h-4 text-green-500" />
      
      {/* Symbol */}
      <span className="font-medium text-gray-900">{symbol}</span>
      
      {/* Price */}
      <span className={`font-bold text-lg ${getPriceColor(tick.change)}`}>
        ₹{formatPrice(tick.lastPrice)}
      </span>
      
      {/* Change */}
      <div className="flex items-center space-x-1">
        {getTrendIcon(tick.change)}
        <span className={`text-sm ${getPriceColor(tick.change)}`}>
          {formatChange(tick.change, tick.changePercent)}
        </span>
      </div>

      {/* Additional data for quote/full mode */}
      {mode !== 'ltp' && (
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Vol: {tick.volume.toLocaleString()}</span>
          <span>H: ₹{formatPrice(tick.high)}</span>
          <span>L: ₹{formatPrice(tick.low)}</span>
        </div>
      )}

      {/* Timestamp */}
      <span className="text-xs text-gray-400">
        {tick.timestamp.toLocaleTimeString()}
      </span>
    </div>
  );
};

// Example component showing multiple instruments
export const LivePriceList: React.FC = () => {
  const { isConnected, connectionStatus, isInitializing } = useLiveData();
  
  // Example instruments (Kite token numbers for popular stocks)
  const instruments = [
    { token: 738561, symbol: 'RELIANCE' },
    { token: 256265, symbol: 'HDFCBANK' },
    { token: 424961, symbol: 'INFY' },
    { token: 81153, symbol: 'TCS' },
  ];

  if (isInitializing) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Signal className="w-5 h-5 text-blue-500 animate-pulse" />
          <span className="text-blue-700">Initializing live data connection...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <SignalLow className="w-5 h-5 text-red-500" />
          <span className="text-red-700">
            Live data not connected. {connectionStatus?.error || 'Please check your broker session.'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Prices</h3>
        <div className="flex items-center space-x-2">
          <SignalHigh className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600">Connected</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {instruments.map((instrument) => (
          <div
            key={instrument.token}
            className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <LivePriceDisplay
              token={instrument.token}
              symbol={instrument.symbol}
              mode="quote"
            />
          </div>
        ))}
      </div>
    </div>
  );
};


export default LivePriceDisplay;