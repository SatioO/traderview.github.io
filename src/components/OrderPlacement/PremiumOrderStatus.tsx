import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  X,
  RefreshCw,
  Zap,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type {
  PlaceOrderResponse,
  OrderError,
} from '../../services/orderService';

interface PremiumOrderStatusProps {
  type: 'success' | 'error';
  orderResponse?: PlaceOrderResponse;
  error?: OrderError;
  onClose: () => void;
  onRetry?: () => void;
}

export const PremiumOrderStatus: React.FC<PremiumOrderStatusProps> = ({
  type,
  orderResponse,
  error,
  onClose,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-close success after 4 seconds
  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  const copyOrderId = async () => {
    if (orderResponse?.orderId) {
      try {
        await navigator.clipboard.writeText(orderResponse.orderId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy order ID:', err);
      }
    }
  };

  const getRetryability = () => {
    if (!error) return false;
    const retryableCodes = [
      'NETWORK_ERROR',
      'BROKER_ERROR',
      'TIMEOUT_ERROR',
      'SERVER_ERROR',
    ];
    return retryableCodes.includes(error.code || '');
  };

  const getErrorSeverity = () => {
    if (!error) return 'error';
    return ['VALIDATION_ERROR', 'INSUFFICIENT_FUNDS'].includes(error.code || '')
      ? 'warning'
      : 'error';
  };

  if (type === 'success' && orderResponse) {
    return (
      <div className="relative overflow-hidden">
        {/* Success Animation Container */}
        <div className="bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-green-600/20 backdrop-blur-md border border-green-400/30 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-2 duration-500">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-2 w-8 h-8 bg-green-400 rounded-full animate-ping"></div>
            <div className="absolute top-6 right-8 w-4 h-4 bg-emerald-300 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-4 left-6 w-6 h-6 bg-green-300 rounded-full animate-bounce delay-500"></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10">
            {/* Header with Icon Animation */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <CheckCircle2 className="w-6 h-6 text-green-400 animate-bounce" />
                  <div className="absolute inset-0 w-6 h-6 bg-green-400/20 rounded-full animate-ping"></div>
                </div>
                <div>
                  <div className="text-green-100 font-bold text-lg tracking-wide">
                    ORDER FILLED
                  </div>
                  <div className="text-green-300 text-sm flex items-center space-x-2">
                    <Clock className="w-3 h-3" />
                    <span>Executed successfully</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-green-500/20 rounded-lg transition-all duration-200 text-green-300 hover:text-green-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Details Card */}
            <div className="bg-black/30 border border-green-500/20 rounded-xl p-3 mb-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-green-400 text-xs font-medium uppercase tracking-wider">
                    Symbol
                  </div>
                  <div className="text-green-100 font-semibold text-sm">
                    {orderResponse.order.tradingsymbol}
                  </div>
                </div>
                <div>
                  <div className="text-green-400 text-xs font-medium uppercase tracking-wider">
                    Quantity
                  </div>
                  <div className="text-green-100 font-semibold text-sm">
                    {orderResponse.order.quantity.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-green-400 text-xs font-medium uppercase tracking-wider">
                    Type
                  </div>
                  <div className="text-green-100 font-semibold text-sm">
                    {orderResponse.order.order_type}
                  </div>
                </div>
                <div>
                  <div className="text-green-400 text-xs font-medium uppercase tracking-wider">
                    Status
                  </div>
                  <div className="text-green-100 font-semibold text-sm flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span>{orderResponse.order.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order ID with Copy Function */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="text-green-400 text-xs font-medium uppercase tracking-wider">
                  Order ID
                </div>
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg px-2 py-1">
                  <span className="text-green-100 font-mono text-xs">
                    #{orderResponse.orderId.slice(-8)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {copied && (
                  <span className="text-green-300 text-xs animate-in fade-in duration-200">
                    Copied!
                  </span>
                )}
                <button
                  onClick={copyOrderId}
                  className="p-1.5 hover:bg-green-500/20 rounded-lg transition-all duration-200 text-green-300 hover:text-green-100"
                  title="Copy full Order ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'error' && error) {
    const isRetryable = getRetryability();
    const severity = getErrorSeverity();
    const isWarning = severity === 'warning';

    return (
      <div className="relative overflow-hidden">
        {/* Error Animation Container */}
        <div
          className={`backdrop-blur-md border rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-2 duration-500 ${
            isWarning
              ? 'bg-gradient-to-br from-yellow-500/20 via-amber-500/15 to-yellow-600/20 border-yellow-400/30'
              : 'bg-gradient-to-br from-red-500/20 via-rose-500/15 to-red-600/20 border-red-400/30'
          }`}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className={`absolute top-2 right-2 w-6 h-6 rounded-full animate-pulse ${
                isWarning ? 'bg-yellow-400' : 'bg-red-400'
              }`}
            ></div>
            <div
              className={`absolute bottom-2 left-2 w-4 h-4 rounded-full animate-bounce delay-300 ${
                isWarning ? 'bg-amber-300' : 'bg-rose-300'
              }`}
            ></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10">
            {/* Header with Icon Animation */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <AlertCircle
                    className={`w-6 h-6 animate-pulse ${
                      isWarning ? 'text-yellow-400' : 'text-red-400'
                    }`}
                  />
                  {!isWarning && (
                    <div className="absolute inset-0 w-6 h-6 bg-red-400/20 rounded-full animate-ping"></div>
                  )}
                </div>
                <div>
                  <div
                    className={`font-bold text-lg tracking-wide ${
                      isWarning ? 'text-yellow-100' : 'text-red-100'
                    }`}
                  >
                    ORDER {isWarning ? 'BLOCKED' : 'REJECTED'}
                  </div>
                  <div
                    className={`text-sm flex items-center space-x-2 ${
                      isWarning ? 'text-yellow-300' : 'text-red-300'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>
                      {isWarning ? 'Action required' : 'Execution failed'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isWarning
                    ? 'hover:bg-yellow-500/20 text-yellow-300 hover:text-yellow-100'
                    : 'hover:bg-red-500/20 text-red-300 hover:text-red-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            <div
              className={`border rounded-xl p-3 mb-3 ${
                isWarning
                  ? 'bg-yellow-500/10 border-yellow-400/20'
                  : 'bg-red-500/10 border-red-400/20'
              }`}
            >
              <div
                className={`text-sm font-medium ${
                  isWarning ? 'text-yellow-100' : 'text-red-100'
                }`}
              >
                {error.message}
              </div>
              {error.code && (
                <div
                  className={`text-xs font-mono mt-1 ${
                    isWarning ? 'text-yellow-300' : 'text-red-300'
                  }`}
                >
                  Error Code: {error.code}
                </div>
              )}
            </div>

            {/* Quick Solutions */}
            <div className="space-y-2">
              {error.code === 'INSUFFICIENT_FUNDS' && (
                <div
                  className={`text-xs flex items-center space-x-2 ${
                    isWarning ? 'text-yellow-200' : 'text-red-200'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Add funds or reduce quantity to continue</span>
                </div>
              )}
              {error.code === 'NETWORK_ERROR' && (
                <div
                  className={`text-xs flex items-center space-x-2 ${
                    isWarning ? 'text-yellow-200' : 'text-red-200'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Connection issue - retry in a moment</span>
                </div>
              )}
              {error.code === 'MARKET_CLOSED' && (
                <div
                  className={`text-xs flex items-center space-x-2 ${
                    isWarning ? 'text-yellow-200' : 'text-red-200'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Market is closed - try during trading hours</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`text-xs flex items-center space-x-1 transition-colors ${
                  isWarning
                    ? 'text-yellow-300 hover:text-yellow-100'
                    : 'text-red-300 hover:text-red-100'
                }`}
              >
                <span>{showDetails ? 'Hide' : 'Show'} details</span>
                <ArrowRight
                  className={`w-3 h-3 transition-transform ${
                    showDetails ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {isRetryable && onRetry && (
                <button
                  onClick={onRetry}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 flex items-center space-x-1 ${
                    isWarning
                      ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100 border border-yellow-400/30'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Order</span>
                </button>
              )}
            </div>

            {/* Expanded Details */}
            {showDetails && (
              <div
                className={`mt-3 pt-3 border-t text-xs space-y-1 animate-in fade-in slide-in-from-top-1 duration-200 ${
                  isWarning
                    ? 'border-yellow-400/20 text-yellow-200'
                    : 'border-red-400/20 text-red-200'
                }`}
              >
                <div>Request ID: {error.requestId}</div>
                <div>
                  Timestamp: {new Date(error.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
