import React from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { OrderPlacementStatus } from '../../services/orderService';

interface OrderProgressIndicatorProps {
  status: OrderPlacementStatus;
}

export const OrderProgressIndicator: React.FC<OrderProgressIndicatorProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status.state) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'placing':
      case 'validating':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status.state) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'placing':
      case 'validating':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return null;
    }
  };

  const progress = status.progress || 0;

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      {progress > 0 && (
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r transition-all duration-500 ease-out ${
              status.state === 'success'
                ? 'from-green-500 to-green-400'
                : status.state === 'error'
                ? 'from-red-500 to-red-400'
                : 'from-blue-500 to-purple-500'
            }`}
            style={{
              width: `${progress}%`,
              transform: `translateX(${progress === 100 ? '0' : '-2px'})`,
            }}
          />
        </div>
      )}

      {/* Status Message */}
      {status.message && (
        <div className="flex items-center space-x-2 justify-center">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {status.message}
          </span>
        </div>
      )}

      {/* Order ID Display */}
      {status.orderId && (
        <div className="text-center">
          <div className="text-xs text-gray-400">Order ID</div>
          <div className="text-sm font-mono text-green-300 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 inline-block">
            {status.orderId}
          </div>
        </div>
      )}
    </div>
  );
};