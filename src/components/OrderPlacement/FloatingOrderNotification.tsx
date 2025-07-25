import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  X,
  RefreshCw,
  Zap,
  Clock,
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
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(dismissTimer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
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
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
          isVisible && !isExiting
            ? 'translate-x-0 translate-y-0 opacity-100 scale-100'
            : isExiting
            ? 'translate-x-full opacity-0 scale-95'
            : 'translate-x-full opacity-0 scale-95'
        }`}
      >
        {/* Clean, Minimal Success Notification */}
        <div className="bg-gradient-to-br from-gray-900/95 via-slate-800/90 to-gray-900/95 backdrop-blur-2xl border border-emerald-500/20 rounded-2xl shadow-2xl shadow-emerald-500/10 w-[380px] relative overflow-hidden">
          
          {/* Success Header */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Order Placed Successfully</h2>
                  <p className="text-slate-400 text-sm">
                    Your <span className="text-emerald-400 font-semibold">{orderResponse.order?.tradingsymbol || 'order'}</span> has been submitted to the exchange
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-all duration-200 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Order Details */}
            <div className="pt-4 border-t border-slate-600/20 space-y-3">
              {/* Order Reference */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 text-sm font-medium">Reference:</span>
                  <code className="text-emerald-400 font-mono text-sm bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/20">
                    {orderResponse.orderId?.slice(-8) || 'N/A'}
                  </code>
                  {copied && (
                    <span className="text-emerald-400 text-xs font-medium animate-in fade-in duration-300">
                      ✓ Copied
                    </span>
                  )}
                </div>
                
                <button
                  onClick={copyOrderId}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-all duration-200"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              
              {/* Quick Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white font-medium">{orderResponse.order?.order_type || 'Market'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Qty:</span>
                  <span className="text-white font-medium">{orderResponse.order?.quantity?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Side:</span>
                  <span className={`font-medium ${
                    orderResponse.order?.transaction_type === 'BUY' ? 'text-emerald-400' : 'text-red-400'
                  }`}>{orderResponse.order?.transaction_type || 'Buy'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/40 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{
                animation: `shrink 5000ms linear forwards`,
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
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
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
          isVisible && !isExiting
            ? 'translate-x-0 translate-y-0 opacity-100 scale-100'
            : isExiting
            ? 'translate-x-full opacity-0 scale-95'
            : 'translate-x-full opacity-0 scale-95'
        }`}
      >
        {/* Clean, Minimal Error Notification */}
        <div className={`bg-gradient-to-br from-gray-900/95 via-slate-800/90 to-gray-900/95 backdrop-blur-2xl border rounded-2xl shadow-2xl w-[380px] relative overflow-hidden ${
          isWarning 
            ? 'border-yellow-400/20 shadow-yellow-500/10' 
            : 'border-red-400/20 shadow-red-500/10'
        }`}>
          
          {/* Error Header */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  isWarning 
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' 
                    : 'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {isWarning ? 'Order Blocked' : 'Order Failed'}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {error.message}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-all duration-200 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Error Code and Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-600/20">
              <div className="flex items-center space-x-3">
                {error.code && (
                  <code className={`text-xs font-mono px-2 py-1 rounded border ${
                    isWarning 
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' 
                      : 'bg-red-500/10 border-red-500/20 text-red-300'
                  }`}>
                    {error.code}
                  </code>
                )}
              </div>
              
              {isRetryable && onRetry && (
                <button
                  onClick={onRetry}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                    isWarning
                      ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              )}
            </div>

            {/* Quick Help for Common Errors */}
            {error.code === 'INSUFFICIENT_FUNDS' && (
              <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-blue-300 mb-1">Quick Solutions</h5>
                    <p className="text-xs text-slate-300">Add funds to your account or reduce quantity</p>
                  </div>
                </div>
              </div>
            )}

            {error.code === 'MARKET_CLOSED' && (
              <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-blue-300 mb-1">Market Closed</h5>
                    <p className="text-xs text-slate-300">Market opens at 9:15 AM on weekdays</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/40 rounded-b-2xl overflow-hidden">
            <div
              className={`h-full ${
                isWarning ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'
              }`}
              style={{
                animation: `shrink 6000ms linear forwards`,
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    );
  }

  return null;
};