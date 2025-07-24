import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Copy, X, RefreshCw, TrendingUp } from 'lucide-react';
import type { PlaceOrderResponse, OrderError } from '../../services/orderService';

interface CompactOrderStatusProps {
  type: 'success' | 'error';
  orderResponse?: PlaceOrderResponse;
  error?: OrderError;
  onClose: () => void;
  onRetry?: () => void;
}

export const CompactOrderStatus: React.FC<CompactOrderStatusProps> = ({
  type,
  orderResponse,
  error,
  onClose,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-close success after 3 seconds if not expanded (faster for trading)
  useEffect(() => {
    if (type === 'success' && !isExpanded) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [type, isExpanded, onClose]);

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
    const retryableCodes = ['NETWORK_ERROR', 'BROKER_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR'];
    return retryableCodes.includes(error.code || '');
  };

  if (type === 'success' && orderResponse) {
    return (
      <div className="bg-gradient-to-r from-green-600/90 to-green-700/90 backdrop-blur-sm border border-green-500/50 rounded-lg p-3 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <CheckCircle2 className="w-4 h-4 text-green-200 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-green-100">✓ FILLED</div>
              <div className="text-xs text-green-200 truncate font-mono">
                #{orderResponse.orderId.slice(-8)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {!isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="p-1 hover:bg-green-500/20 rounded text-green-200 hover:text-green-100 transition-colors"
                title="View details"
              >
                <TrendingUp className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={copyOrderId}
              className="p-1 hover:bg-green-500/20 rounded text-green-200 hover:text-green-100 transition-colors"
              title="Copy Order ID"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-green-500/20 rounded text-green-200 hover:text-green-100 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-green-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-green-300">Symbol</div>
                <div className="text-green-100 font-medium">
                  {orderResponse.orderData.tradingsymbol}
                </div>
              </div>
              <div>
                <div className="text-green-300">Quantity</div>
                <div className="text-green-100 font-medium">
                  {orderResponse.orderData.quantity}
                </div>
              </div>
              <div>
                <div className="text-green-300">Type</div>
                <div className="text-green-100 font-medium">
                  {orderResponse.orderData.order_type}
                </div>
              </div>
              <div>
                <div className="text-green-300">Status</div>
                <div className="text-green-100 font-medium">
                  {orderResponse.orderData.status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Copy feedback */}
        {copied && (
          <div className="mt-2 text-xs text-green-200 animate-in fade-in duration-200">
            Order ID copied!
          </div>
        )}
      </div>
    );
  }

  if (type === 'error' && error) {
    const isRetryable = getRetryability();
    const isWarning = error.code === 'VALIDATION_ERROR' || error.code === 'INSUFFICIENT_FUNDS';
    
    return (
      <div className={`backdrop-blur-sm border rounded-lg p-3 animate-in slide-in-from-top-2 duration-300 ${
        isWarning
          ? 'bg-gradient-to-r from-yellow-600/90 to-yellow-700/90 border-yellow-500/50'
          : 'bg-gradient-to-r from-red-600/90 to-red-700/90 border-red-500/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <AlertCircle className={`w-4 h-4 flex-shrink-0 ${
              isWarning ? 'text-yellow-200' : 'text-red-200'
            }`} />
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-semibold ${
                isWarning ? 'text-yellow-100' : 'text-red-100'
              }`}>
                ✗ REJECTED
              </div>
              <div className={`text-xs truncate ${
                isWarning ? 'text-yellow-200' : 'text-red-200'
              }`}>
                {error.message}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {!isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className={`p-1 rounded transition-colors ${
                  isWarning
                    ? 'hover:bg-yellow-500/20 text-yellow-200 hover:text-yellow-100'
                    : 'hover:bg-red-500/20 text-red-200 hover:text-red-100'
                }`}
                title="View details"
              >
                <AlertCircle className="w-3 h-3" />
              </button>
            )}
            {isRetryable && onRetry && (
              <button
                onClick={onRetry}
                className={`p-1 rounded transition-colors ${
                  isWarning
                    ? 'hover:bg-yellow-500/20 text-yellow-200 hover:text-yellow-100'
                    : 'hover:bg-red-500/20 text-red-200 hover:text-red-100'
                }`}
                title="Retry"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1 rounded transition-colors ${
                isWarning
                  ? 'hover:bg-yellow-500/20 text-yellow-200 hover:text-yellow-100'
                  : 'hover:bg-red-500/20 text-red-200 hover:text-red-100'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Expanded Error Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-opacity-20 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className={isWarning ? 'text-yellow-300' : 'text-red-300'}>
                  Error Code:
                </span>
                <span className={`font-mono ${isWarning ? 'text-yellow-100' : 'text-red-100'}`}>
                  {error.code || 'UNKNOWN'}
                </span>
              </div>
              
              {/* Quick suggestions based on error type */}
              {error.code === 'INSUFFICIENT_FUNDS' && (
                <div className={`text-xs ${isWarning ? 'text-yellow-200' : 'text-red-200'}`}>
                  💡 Add funds or reduce quantity
                </div>
              )}
              {error.code === 'NETWORK_ERROR' && (
                <div className={`text-xs ${isWarning ? 'text-yellow-200' : 'text-red-200'}`}>
                  💡 Check connection and retry
                </div>
              )}
              {error.code === 'MARKET_CLOSED' && (
                <div className={`text-xs ${isWarning ? 'text-yellow-200' : 'text-red-200'}`}>
                  💡 Wait for market to open
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};