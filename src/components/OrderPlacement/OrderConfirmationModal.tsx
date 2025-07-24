import React from 'react';
import { X, AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import type { PlaceOrderRequest } from '../../services/orderService';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  orderRequest: PlaceOrderRequest | null;
  instrument: any;
  calculations: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  orderRequest,
  instrument,
  calculations,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !orderRequest) return null;

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const riskPercentage = calculations ? 
    ((calculations.riskAmount / calculations.accountBalance) * 100).toFixed(2) : '0';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Confirm Order</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Order Details */}
        <div className="space-y-4 mb-6">
          {/* Instrument */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
            <div className="text-sm text-gray-400 mb-1">Instrument</div>
            <div className="text-white font-semibold">
              {instrument?.symbol} ({orderRequest.exchange})
            </div>
          </div>

          {/* Order Type & Transaction */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
              <div className="text-sm text-gray-400 mb-1">Order Type</div>
              <div className={`font-semibold ${
                orderRequest.order_type === 'MARKET' ? 'text-orange-400' : 'text-blue-400'
              }`}>
                {orderRequest.order_type}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
              <div className="text-sm text-gray-400 mb-1">Transaction</div>
              <div className={`font-semibold ${
                orderRequest.transaction_type === 'BUY' ? 'text-green-400' : 'text-red-400'
              }`}>
                {orderRequest.transaction_type}
              </div>
            </div>
          </div>

          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
              <div className="text-sm text-gray-400 mb-1">Quantity</div>
              <div className="text-white font-semibold">
                {orderRequest.quantity.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
              <div className="text-sm text-gray-400 mb-1">
                {orderRequest.order_type === 'MARKET' ? 'Market Price' : 'Limit Price'}
              </div>
              <div className="text-white font-semibold">
                {orderRequest.order_type === 'MARKET' 
                  ? 'Current Market' 
                  : formatCurrency(orderRequest.price || 0)
                }
              </div>
            </div>
          </div>

          {/* Stop Loss */}
          {orderRequest.trigger_price && (
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-red-400" />
                <div className="text-sm text-red-300">Stop Loss Protection</div>
              </div>
              <div className="text-red-200 font-semibold">
                {formatCurrency(orderRequest.trigger_price)}
              </div>
            </div>
          )}

          {/* Investment Summary */}
          {calculations && (
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <div className="text-sm text-blue-300 mb-2">Investment Summary</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-300">Total Investment:</div>
                <div className="text-white font-semibold">
                  {formatCurrency(calculations.totalInvestment)}
                </div>
                <div className="text-gray-300">Portfolio Risk:</div>
                <div className="text-white font-semibold">{riskPercentage}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Risk Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-200">
              Please review all details carefully. Orders cannot be cancelled once placed in the market.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20"
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
};