import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  X,
  RefreshCw,
  Zap,
} from 'lucide-react';
import type {
  PlaceOrderResponse,
  OrderError,
} from '../../services/orderService';

interface FloatingOrderNotificationProps {
  type: 'success' | 'error';
  orderResponse?: PlaceOrderResponse;
  error?: OrderError;
  onClose: () => void;
  onRetry?: () => void;
}

export const FloatingOrderNotification: React.FC<
  FloatingOrderNotificationProps
> = ({ type, orderResponse, error, onClose, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    const dismissTimer = setTimeout(
      () => {
        handleClose();
      },
      type === 'success' ? 1000 : 2000 // Success: 1s, Error: 2s
    );

    return () => clearTimeout(dismissTimer);
  }, [type]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match exit animation duration
  };

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

  if (type === 'success' && orderResponse) {
    return (
      <div
        className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-out ${
          isVisible && !isExiting
            ? 'translate-x-0 translate-y-0 opacity-100 scale-100'
            : isExiting
            ? 'translate-x-full opacity-0 scale-95'
            : 'translate-x-full opacity-0 scale-95'
        }`}
      >
        <div className="bg-gradient-to-br from-green-500/95 via-emerald-500/90 to-green-600/95 backdrop-blur-xl border border-green-400/50 rounded-2xl p-4 shadow-2xl shadow-green-500/20 min-w-[320px] max-w-[380px]">
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute top-2 right-2 w-2 h-2 bg-green-200 rounded-full animate-ping opacity-60" />
            <div className="absolute top-4 left-3 w-1 h-1 bg-green-300 rounded-full animate-pulse delay-300 opacity-40" />
            <div className="absolute bottom-3 right-6 w-1.5 h-1.5 bg-green-200 rounded-full animate-bounce delay-500 opacity-50" />
          </div>

          {/* Main content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <CheckCircle2 className="w-5 h-5 text-green-100 animate-bounce" />
                  <div className="absolute inset-0 w-5 h-5 bg-green-200/30 rounded-full animate-ping" />
                </div>
                <div>
                  <div className="text-green-50 font-bold text-sm tracking-wide">
                    ORDER FILLED
                  </div>
                  <div className="text-green-100/80 text-xs">
                    Trade executed successfully
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-1 hover:bg-green-400/20 rounded-lg transition-all duration-200 text-green-100/70 hover:text-green-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Compact order details */}
            <div className="bg-black/20 border border-green-400/20 rounded-xl p-2.5 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="text-green-50 font-semibold text-sm">
                      {orderResponse.orderData.tradingsymbol}
                    </div>
                    <div className="text-green-100/70 text-xs">
                      {orderResponse.orderData.quantity} •{' '}
                      {orderResponse.orderData.order_type}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                  <span className="text-green-100 text-xs font-medium">
                    {orderResponse.orderData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Order ID with copy */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-green-100/70 text-xs">ID:</span>
                <span className="text-green-50 font-mono text-xs bg-green-400/20 px-2 py-0.5 rounded">
                  #{orderResponse.orderId.slice(-8)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {copied && (
                  <span className="text-green-100 text-xs animate-in fade-in duration-200">
                    Copied!
                  </span>
                )}
                <button
                  onClick={copyOrderId}
                  className="p-1 hover:bg-green-400/20 rounded transition-all duration-200 text-green-100/70 hover:text-green-50"
                  title="Copy Order ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress bar for auto-dismiss */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-400/20 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-green-300 rounded-b-2xl animate-[shrink_3s_linear_forwards]"
              style={{
                animation: 'shrink 3s linear forwards',
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </div>
    );
  }

  if (type === 'error' && error) {
    const isRetryable = getRetryability();
    const isWarning = ['VALIDATION_ERROR', 'INSUFFICIENT_FUNDS'].includes(
      error.code || ''
    );

    return (
      <div
        className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-out ${
          isVisible && !isExiting
            ? 'translate-x-0 translate-y-0 opacity-100 scale-100'
            : isExiting
            ? 'translate-x-full opacity-0 scale-95'
            : 'translate-x-full opacity-0 scale-95'
        }`}
      >
        <div
          className={`backdrop-blur-xl border rounded-2xl p-4 shadow-2xl min-w-[320px] max-w-[380px] ${
            isWarning
              ? 'bg-gradient-to-br from-yellow-500/95 via-amber-500/90 to-yellow-600/95 border-yellow-400/50 shadow-yellow-500/20'
              : 'bg-gradient-to-br from-red-500/95 via-rose-500/90 to-red-600/95 border-red-400/50 shadow-red-500/20'
          }`}
        >
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div
              className={`absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse opacity-60 ${
                isWarning ? 'bg-yellow-200' : 'bg-red-200'
              }`}
            />
            <div
              className={`absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full animate-bounce delay-300 opacity-50 ${
                isWarning ? 'bg-amber-200' : 'bg-rose-200'
              }`}
            />
          </div>

          {/* Main content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <AlertCircle
                    className={`w-5 h-5 animate-pulse ${
                      isWarning ? 'text-yellow-100' : 'text-red-100'
                    }`}
                  />
                </div>
                <div>
                  <div
                    className={`font-bold text-sm tracking-wide ${
                      isWarning ? 'text-yellow-50' : 'text-red-50'
                    }`}
                  >
                    ORDER {isWarning ? 'BLOCKED' : 'REJECTED'}
                  </div>
                  <div
                    className={`text-xs ${
                      isWarning ? 'text-yellow-100/80' : 'text-red-100/80'
                    }`}
                  >
                    {isWarning ? 'Action required' : 'Execution failed'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className={`p-1 rounded-lg transition-all duration-200 ${
                  isWarning
                    ? 'hover:bg-yellow-400/20 text-yellow-100/70 hover:text-yellow-50'
                    : 'hover:bg-red-400/20 text-red-100/70 hover:text-red-50'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error message */}
            <div
              className={`border rounded-xl p-2.5 mb-3 ${
                isWarning
                  ? 'bg-yellow-500/20 border-yellow-400/30'
                  : 'bg-red-500/20 border-red-400/30'
              }`}
            >
              <div
                className={`text-sm font-medium ${
                  isWarning ? 'text-yellow-50' : 'text-red-50'
                }`}
              >
                {error.message}
              </div>
              {error.code && (
                <div
                  className={`text-xs font-mono mt-1 ${
                    isWarning ? 'text-yellow-100/70' : 'text-red-100/70'
                  }`}
                >
                  {error.code}
                </div>
              )}
            </div>

            {/* Quick fix suggestion */}
            {error.code === 'INSUFFICIENT_FUNDS' && (
              <div
                className={`flex items-center space-x-2 text-xs mb-3 ${
                  isWarning ? 'text-yellow-100/80' : 'text-red-100/80'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Add funds or reduce quantity</span>
              </div>
            )}

            {/* Action button */}
            {isRetryable && onRetry && (
              <div className="flex justify-end">
                <button
                  onClick={onRetry}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 flex items-center space-x-1 ${
                    isWarning
                      ? 'bg-yellow-400/30 hover:bg-yellow-400/40 text-yellow-50 border border-yellow-300/30'
                      : 'bg-red-400/30 hover:bg-red-400/40 text-red-50 border border-red-300/30'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}
          </div>

          {/* Progress bar for auto-dismiss */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden ${
              isWarning ? 'bg-yellow-400/20' : 'bg-red-400/20'
            }`}
          >
            <div
              className={`h-full rounded-b-2xl animate-[shrink_5s_linear_forwards] ${
                isWarning ? 'bg-yellow-300' : 'bg-red-300'
              }`}
              style={{
                animation: 'shrink 5s linear forwards',
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </div>
    );
  }

  return null;
};
