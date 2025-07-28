import React from 'react';
import type { PlaceOrderResponse } from '../../services/orderService';

interface OrderGTTStatusProps {
  orderResponse: PlaceOrderResponse | null;
  className?: string;
}

const OrderGTTStatus: React.FC<OrderGTTStatusProps> = ({
  orderResponse,
  className = ''
}) => {
  if (!orderResponse) return null;

  const hasGTT = orderResponse.gtt;
  const gttSuccess = hasGTT?.success;
  const gttError = hasGTT?.error;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Order Status */}
      <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-green-300">
            Order Placed Successfully
          </div>
          <div className="text-xs text-green-400/70">
            Order ID: {orderResponse.orderId}
          </div>
        </div>
      </div>

      {/* GTT Status */}
      {hasGTT && (
        <div
          className={`flex items-center space-x-3 p-3 border rounded-lg ${
            gttSuccess
              ? 'bg-blue-500/10 border-blue-400/20'
              : 'bg-yellow-500/10 border-yellow-400/20'
          }`}
        >
          <div className="flex-shrink-0">
            {gttSuccess ? (
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div
              className={`text-sm font-medium ${
                gttSuccess ? 'text-blue-300' : 'text-yellow-300'
              }`}
            >
              {gttSuccess ? 'GTT Created Successfully' : 'GTT Creation Failed'}
            </div>
            <div
              className={`text-xs ${
                gttSuccess ? 'text-blue-400/70' : 'text-yellow-400/70'
              }`}
            >
              {gttSuccess
                ? `GTT ID: ${hasGTT.triggerId}`
                : `Error: ${gttError}`}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Status Messages */}
      <div className="text-xs text-slate-400 p-2 bg-slate-800/30 rounded border border-slate-600/20">
        <div className="flex items-center justify-between">
          <span>Order Status:</span>
          <span className="text-green-400 font-medium">✓ Executed</span>
        </div>
        {hasGTT && (
          <div className="flex items-center justify-between mt-1">
            <span>GTT Status:</span>
            <span
              className={`font-medium ${
                gttSuccess ? 'text-blue-400' : 'text-yellow-400'
              }`}
            >
              {gttSuccess ? '✓ Active' : '⚠ Failed'}
            </span>
          </div>
        )}
      </div>

      {/* GTT Details (if successful) */}
      {gttSuccess && (
        <div className="text-xs text-slate-300 p-3 bg-slate-800/20 rounded border border-slate-600/10">
          <div className="font-medium text-slate-200 mb-2">GTT Details:</div>
          <div className="space-y-1">
            <div>• Stop loss/Target GTT is now monitoring market conditions</div>
            <div>• Orders will be triggered automatically when price conditions are met</div>
            <div>• You can manage your GTT orders from the GTT management panel</div>
          </div>
        </div>
      )}

      {/* GTT Error Details */}
      {gttError && (
        <div className="text-xs text-yellow-300 p-3 bg-yellow-500/5 rounded border border-yellow-400/10">
          <div className="font-medium text-yellow-200 mb-2">GTT Information:</div>
          <div className="space-y-1">
            <div>• Your main order was placed successfully</div>
            <div>• GTT creation failed: {gttError}</div>
            <div>• You can manually create GTT orders from the GTT management panel</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderGTTStatus;