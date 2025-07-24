import React, { useState } from 'react';
import { AlertCircle, RefreshCw, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { OrderError } from '../../services/orderService';

interface OrderErrorAnimationProps {
  error: OrderError;
  onRetry: () => void;
  onClose: () => void;
}

export const OrderErrorAnimation: React.FC<OrderErrorAnimationProps> = ({
  error,
  onRetry,
  onClose,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getErrorSeverity = () => {
    if (error.code === 'VALIDATION_ERROR') return 'warning';
    if (error.code === 'INSUFFICIENT_FUNDS') return 'warning';
    return 'error';
  };

  const getRetryability = () => {
    const retryableCodes = [
      'NETWORK_ERROR',
      'BROKER_ERROR',
      'TIMEOUT_ERROR',
      'SERVER_ERROR'
    ];
    return retryableCodes.includes(error.code || '');
  };

  const getSuggestedActions = () => {
    switch (error.code) {
      case 'INSUFFICIENT_FUNDS':
        return [
          'Add funds to your trading account',
          'Reduce the order quantity',
          'Check your available margin'
        ];
      case 'INVALID_SYMBOL':
        return [
          'Verify the trading symbol',
          'Check if the symbol is tradeable',
          'Ensure correct exchange selection'
        ];
      case 'MARKET_CLOSED':
        return [
          'Wait for market to open',
          'Use After Market Orders (AMO) if available',
          'Check market timings'
        ];
      case 'NETWORK_ERROR':
        return [
          'Check your internet connection',
          'Try again in a few moments',
          'Refresh the page if needed'
        ];
      default:
        return [
          'Review order details',
          'Contact support if issue persists',
          'Try placing the order again'
        ];
    }
  };

  const severity = getErrorSeverity();
  const isRetryable = getRetryability();
  const suggestions = getSuggestedActions();

  return (
    <div className="text-center space-y-6">
      {/* Error Animation */}
      <div className="relative">
        {/* Animated Circles */}
        <div className="relative flex items-center justify-center">
          <div className={`absolute w-32 h-32 rounded-full animate-ping ${
            severity === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20'
          }`} />
          <div className={`absolute w-24 h-24 rounded-full animate-pulse ${
            severity === 'warning' ? 'bg-yellow-500/30' : 'bg-red-500/30'
          }`} />
          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center animate-bounce ${
            severity === 'warning' 
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' 
              : 'bg-gradient-to-r from-red-500 to-red-400'
          }`}>
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Error Message */}
        <div className="mt-6 space-y-2">
          <h3 className={`text-2xl font-bold animate-in fade-in slide-in-from-bottom-4 duration-700 ${
            severity === 'warning' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            Order Failed
          </h3>
          <p className="text-gray-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            {error.message}
          </p>
        </div>
      </div>

      {/* Error Details */}
      <div className={`border rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        severity === 'warning' 
          ? 'bg-yellow-500/10 border-yellow-500/20' 
          : 'bg-red-500/10 border-red-500/20'
      }`}>
        {/* Error Code and Time */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Error Code:</span>
          <span className={`font-mono ${
            severity === 'warning' ? 'text-yellow-300' : 'text-red-300'
          }`}>
            {error.code || 'UNKNOWN'}
          </span>
        </div>

        {/* Suggested Actions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Suggested Actions</span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showDetails && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 text-sm text-gray-300"
                  >
                    <span className="text-gray-500 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 pt-4">
        {isRetryable && (
          <button
            onClick={onRetry}
            className={`w-full px-6 py-3 font-semibold rounded-lg transition-all duration-200 hover:shadow-lg ${
              severity === 'warning'
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white hover:shadow-yellow-500/20'
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:shadow-red-500/20'
            }`}
          >
            <span className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </span>
          </button>
        )}
        
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded-lg transition-all duration-200"
        >
          Close
        </button>
        
        <button className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  );
};