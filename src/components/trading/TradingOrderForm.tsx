import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTrading } from '../../contexts/TradingContext';
import { tradingApiService } from '../../services/tradingApiService';
import { useOrderPlacement } from '../../hooks/useOrderPlacement';
import { orderService } from '../../services/orderService';
import InstrumentSearch from './InstrumentSearch';
import OrderGTTStatus from './OrderGTTStatus';
import type { OrderData } from '../../contexts/TradingContext';

interface TradingOrderFormProps {
  className?: string;
  calculatedPositionSize?: number;
  entryPrice?: number;
  stopLossPrice?: number;
  onOrderPlaced?: (orderId: string) => void;
  onOrderError?: (error: string) => void;
}

const TradingOrderForm: React.FC<TradingOrderFormProps> = ({
  className = '',
  calculatedPositionSize = 0,
  entryPrice,
  stopLossPrice,
  onOrderPlaced,
  onOrderError,
}) => {
  const {
    state,
    updateOrderData,
    setCalculatedQuantity,
    setEstimatedCost,
    setBrokerageCalculation,
    setOrderStatus,
    setOrderError,
    resetOrder,
    isOrderReady,
    canPlaceOrder,
  } = useTrading();

  const [localOrderData, setLocalOrderData] = useState<Partial<OrderData>>({
    transaction_type: 'BUY',
    order_type: 'MARKET',
    product: 'CNC',
    validity: 'DAY',
    variety: 'regular',
  });

  // Current market price query
  const { data: marketPrice } = useQuery({
    queryKey: [
      'market-price',
      state.selectedInstrument?.tradingsymbol,
      state.selectedInstrument?.exchange,
    ],
    queryFn: () => {
      if (!state.selectedInstrument) return null;
      return tradingApiService.getMarketPrice(
        state.selectedInstrument.tradingsymbol,
        state.selectedInstrument.exchange
      );
    },
    enabled: !!state.selectedInstrument,
    refetchInterval: 3000, // Refresh every 3 seconds
    staleTime: 1000, // Consider stale after 1 second
  });

  // Brokerage calculation query
  const { data: brokerageData } = useQuery({
    queryKey: [
      'brokerage-calculation',
      state.selectedInstrument?.tradingsymbol,
      state.selectedInstrument?.exchange,
      state.calculatedQuantity,
      entryPrice || marketPrice?.ltp,
      localOrderData.transaction_type,
      localOrderData.product,
    ],
    queryFn: () => {
      if (!state.selectedInstrument || !state.calculatedQuantity) return null;

      const price = entryPrice || marketPrice?.ltp;
      if (!price) return null;

      return tradingApiService.calculateBrokerage({
        tradingsymbol: state.selectedInstrument.tradingsymbol,
        exchange: state.selectedInstrument.exchange,
        quantity: state.calculatedQuantity,
        price,
        transaction_type: localOrderData.transaction_type as 'BUY' | 'SELL',
        product: localOrderData.product as 'CNC' | 'MIS' | 'NRML',
      });
    },
    enabled: !!(
      state.selectedInstrument &&
      state.calculatedQuantity &&
      (entryPrice || marketPrice?.ltp)
    ),
    staleTime: 10000, // 10 seconds
  });

  // Order placement support
  const {
    placeOrder,
    status: orderStatus,
    lastError,
    lastOrderResponse,
    isSuccess,
    isError,
  } = useOrderPlacement();

  // Calculate position size based on entry price and account settings
  useEffect(() => {
    if (calculatedPositionSize > 0) {
      const currentPrice = entryPrice || marketPrice?.ltp;
      if (currentPrice && state.selectedInstrument) {
        const lotSize = state.selectedInstrument.lot_size || 1;
        let quantity = Math.floor(calculatedPositionSize / currentPrice);

        // Adjust for lot size
        if (lotSize > 1) {
          quantity = Math.floor(quantity / lotSize) * lotSize;
        }

        setCalculatedQuantity(Math.max(quantity, lotSize));
        setEstimatedCost(quantity * currentPrice);
      }
    }
  }, [
    calculatedPositionSize,
    entryPrice,
    marketPrice,
    state.selectedInstrument,
    setCalculatedQuantity,
    setEstimatedCost,
  ]);

  // Update brokerage calculation
  useEffect(() => {
    if (brokerageData) {
      setBrokerageCalculation({
        brokerage: brokerageData.brokerage || 0,
        taxes: brokerageData.taxes?.total || 0,
        total: brokerageData.total_charges || 0,
      });
    }
  }, [brokerageData, setBrokerageCalculation]);

  // Update order data in context
  useEffect(() => {
    updateOrderData(localOrderData);
  }, [localOrderData, updateOrderData]);

  // Handle order placement success
  useEffect(() => {
    if (isSuccess && lastOrderResponse) {
      setOrderStatus('success');
      resetOrder();
      if (onOrderPlaced && lastOrderResponse.orderId) {
        onOrderPlaced(lastOrderResponse.orderId);
      }
    }
  }, [isSuccess, lastOrderResponse, setOrderStatus, resetOrder, onOrderPlaced]);

  // Handle order placement error
  useEffect(() => {
    if (isError && lastError) {
      setOrderStatus('error');
      const errorMessage = orderService.getErrorMessage(lastError);
      setOrderError(errorMessage);
      if (onOrderError) {
        onOrderError(errorMessage);
      }
    }
  }, [isError, lastError, setOrderStatus, setOrderError, onOrderError]);

  // Calculate current price
  const currentPrice = entryPrice || marketPrice?.ltp || 0;

  // Handle form field changes
  const handleFieldChange = useCallback(
    (field: keyof OrderData, value: unknown) => {
      setLocalOrderData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle price changes
  const handlePriceChange = useCallback(
    (price: number) => {
      if (localOrderData.order_type === 'LIMIT') {
        handleFieldChange('price', price);
      }
    },
    [localOrderData.order_type, handleFieldChange]
  );

  // Handle order submission with automatic GTT integration
  const handleSubmitOrder = useCallback(async () => {
    if (!isOrderReady || !canPlaceOrder || !state.selectedInstrument) return;

    // Create order request for the orderService
    const orderRequest = orderService.createOrderRequest(
      state.selectedInstrument,
      localOrderData,
      localOrderData.order_type === 'MARKET' ? 'mkt' : 'lmt',
      { positionSize: state.calculatedQuantity }
    );

    // Override with current form data
    orderRequest.transaction_type = localOrderData.transaction_type as
      | 'BUY'
      | 'SELL';
    orderRequest.order_type = localOrderData.order_type as any;
    orderRequest.product = localOrderData.product as any;
    orderRequest.quantity = state.calculatedQuantity;
    if (localOrderData.order_type === 'LIMIT' && localOrderData.price) {
      orderRequest.price = localOrderData.price;
    }

    console.log('🚀 Placing order with GTT integration:', {
      orderRequest,
      stopLossPrice,
      currentPrice,
      instrument: state.selectedInstrument.tradingsymbol,
      hasStopLoss: !!stopLossPrice,
      willCreateGTT: !!(stopLossPrice && currentPrice > 0),
    });

    // Place order with stop loss metadata (GTT handled by backend)
    await placeOrder(
      'kite',
      orderRequest,
      stopLossPrice ? {
        mode: 'price',
        stopLossPrice: stopLossPrice,
        originalPrice: currentPrice,
      } : undefined
    );
  }, [
    isOrderReady,
    canPlaceOrder,
    state.selectedInstrument,
    state.calculatedQuantity,
    localOrderData,
    currentPrice,
    stopLossPrice,
    placeOrder,
  ]);

  const isLoading =
    orderStatus.state === 'placing' || orderStatus.state === 'validating';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
          Place Order
        </h3>
        {orderStatus.state === 'success' && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">
              {orderStatus.message || 'Order Placed'}
            </span>
          </div>
        )}
      </div>

      {/* Enhanced Order Status Display */}
      {orderStatus.state === 'success' && lastOrderResponse && (
        <OrderGTTStatus orderResponse={lastOrderResponse} />
      )}

      {/* Instrument Search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Select Instrument
        </label>
        <InstrumentSearch />
      </div>

      {/* Order Details - Only show when instrument is selected */}
      {state.selectedInstrument && (
        <div className="space-y-4 p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl border border-violet-400/20 backdrop-blur-sm">
          {/* Current Price Display */}
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
            <div>
              <div className="text-sm text-slate-400">Current Price</div>
              <div className="text-lg font-semibold text-white">
                ₹{currentPrice.toFixed(2)}
              </div>
            </div>
            {marketPrice && (
              <div className="text-right">
                <div
                  className={`text-sm font-medium ${
                    marketPrice.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {marketPrice.change >= 0 ? '+' : ''}₹
                  {marketPrice.change.toFixed(2)}
                </div>
                <div
                  className={`text-xs ${
                    marketPrice.change_percent >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  ({marketPrice.change_percent >= 0 ? '+' : ''}
                  {marketPrice.change_percent.toFixed(2)}%)
                </div>
              </div>
            )}
          </div>

          {/* Order Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Transaction Type
              </label>
              <select
                value={localOrderData.transaction_type}
                onChange={(e) =>
                  handleFieldChange('transaction_type', e.target.value)
                }
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Order Type
              </label>
              <select
                value={localOrderData.order_type}
                onChange={(e) =>
                  handleFieldChange('order_type', e.target.value)
                }
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50"
              >
                <option value="MARKET">MARKET</option>
                <option value="LIMIT">LIMIT</option>
                <option value="SL">STOP LOSS</option>
                <option value="SL-M">STOP LOSS MARKET</option>
              </select>
            </div>
          </div>

          {/* Limit Price (if LIMIT order) */}
          {localOrderData.order_type === 'LIMIT' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Limit Price
              </label>
              <input
                type="number"
                step="0.05"
                value={localOrderData.price || currentPrice}
                onChange={(e) =>
                  handlePriceChange(parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                placeholder="Enter limit price"
              />
            </div>
          )}

          {/* Product and Validity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Product Type
              </label>
              <select
                value={localOrderData.product}
                onChange={(e) => handleFieldChange('product', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50"
              >
                <option value="CNC">CNC (Cash & Carry)</option>
                <option value="MIS">MIS (Intraday)</option>
                <option value="NRML">NRML (Normal)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Validity
              </label>
              <select
                value={localOrderData.validity}
                onChange={(e) => handleFieldChange('validity', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50"
              >
                <option value="DAY">DAY</option>
                <option value="IOC">IOC (Immediate or Cancel)</option>
              </select>
            </div>
          </div>

          {/* Quantity and Cost Summary */}
          <div className="p-3 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-400/20 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">
                Calculated Quantity
              </span>
              <span className="font-semibold text-white">
                {state.calculatedQuantity.toLocaleString()} shares
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Estimated Value</span>
              <span className="font-semibold text-white">
                ₹{state.estimatedCost.toLocaleString()}
              </span>
            </div>

            {state.brokerageCalculation && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">
                    Brokerage + Taxes
                  </span>
                  <span className="font-medium text-slate-300">
                    ₹{state.brokerageCalculation.total.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-600/30">
                  <span className="font-medium text-white">Total Required</span>
                  <span className="font-bold text-lg text-violet-300">
                    ₹
                    {(
                      state.estimatedCost + state.brokerageCalculation.total
                    ).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Stop Loss Info */}
          {stopLossPrice && (
            <div className="p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-400/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-300">Stop Loss Price</span>
                <span className="font-semibold text-white">
                  ₹{stopLossPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {orderStatus.state === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01"
                  />
                </svg>
                <span className="text-red-300 text-sm">
                  {orderStatus.message || orderStatus.error}
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            disabled={!canPlaceOrder || isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
              canPlaceOrder && !isLoading
                ? 'bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30'
                : 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/30'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{orderStatus.message || 'Placing Order...'}</span>
              </div>
            ) : (
              `Place ${localOrderData.transaction_type} Order`
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TradingOrderForm;
