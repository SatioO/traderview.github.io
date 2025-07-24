import React, { useEffect, useState } from 'react';
import { CheckCircle2, TrendingUp, Copy } from 'lucide-react';
import type { PlaceOrderResponse } from '../../services/orderService';

interface OrderSuccessAnimationProps {
  orderResponse: PlaceOrderResponse;
  onClose: () => void;
}

export const OrderSuccessAnimation: React.FC<OrderSuccessAnimationProps> = ({
  orderResponse,
  onClose,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderResponse.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy order ID:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="text-center space-y-6">
      {/* Success Animation */}
      <div className="relative">
        {/* Animated Circles */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-32 h-32 bg-green-500/20 rounded-full animate-ping" />
          <div className="absolute w-24 h-24 bg-green-500/30 rounded-full animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-r from-green-500 to-green-400 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Success Message */}
        <div className="mt-6 space-y-2">
          <h3 className="text-2xl font-bold text-green-400 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Order Placed Successfully!
          </h3>
          <p className="text-gray-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Your {orderResponse.orderData.order_type.toLowerCase()} order has been submitted to the exchange
          </p>
        </div>
      </div>

      {/* Order Details */}
      {showDetails && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Order ID */}
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-green-300">Order ID:</span>
            <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-lg">
              <span className="font-mono text-green-200 text-sm">
                {orderResponse.orderId}
              </span>
              <button
                onClick={copyOrderId}
                className="p-1 hover:bg-green-500/20 rounded transition-colors"
                title="Copy Order ID"
              >
                <Copy className="w-3 h-3 text-green-300" />
              </button>
            </div>
          </div>

          {copied && (
            <div className="text-xs text-green-400 animate-in fade-in duration-200">
              Order ID copied to clipboard!
            </div>
          )}

          {/* Order Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400">Symbol</div>
              <div className="text-white font-medium">
                {orderResponse.orderData.tradingsymbol}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Quantity</div>
              <div className="text-white font-medium">
                {orderResponse.orderData.quantity.toLocaleString()}
              </div>
            </div>
            {orderResponse.orderData.price && (
              <div>
                <div className="text-gray-400">Price</div>
                <div className="text-white font-medium">
                  {formatCurrency(orderResponse.orderData.price)}
                </div>
              </div>
            )}
            <div>
              <div className="text-gray-400">Status</div>
              <div className="text-green-400 font-medium">
                {orderResponse.orderData.status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 pt-4">
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20"
        >
          <span className="flex items-center justify-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Continue Trading</span>
          </span>
        </button>
        
        <button className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
          View Order History
        </button>
      </div>
    </div>
  );
};