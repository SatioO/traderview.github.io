import { useState, useCallback } from 'react';
import {
  orderService,
  type BrokerType,
  type PlaceOrderRequest,
  type PlaceOrderResponse,
  type OrderError,
  type OrderPlacementStatus,
} from '../services/orderService';

interface UseOrderPlacementResult {
  // State
  status: OrderPlacementStatus;
  isPlacing: boolean;
  isSuccess: boolean;
  isError: boolean;

  // Actions
  placeOrder: (
    broker: BrokerType,
    orderRequest: PlaceOrderRequest,
    stopLossMetadata?: {
      mode: 'price' | 'percentage';
      percentage?: number;
      originalPrice?: number;
      stopLossPrice?: number;
    }
  ) => Promise<void>;
  placeOrderWithGTT: (
    broker: BrokerType,
    orderRequest: PlaceOrderRequest,
    instrument: any,
    currentPrice: number,
    targetPrice?: number,
    stopLossMetadata?: {
      mode: 'price' | 'percentage';
      percentage?: number;
      stopLossPrice?: number;
      originalPrice?: number;
    }
  ) => Promise<void>;
  confirmOrder: () => void;
  cancelOrder: () => void;
  resetStatus: () => void;

  // Data
  lastOrderResponse: PlaceOrderResponse | null;
  lastError: OrderError | null;
}

export const useOrderPlacement = (): UseOrderPlacementResult => {
  const [status, setStatus] = useState<OrderPlacementStatus>({
    state: 'idle',
    progress: 0,
  });

  const [lastOrderResponse, setLastOrderResponse] =
    useState<PlaceOrderResponse | null>(null);
  const [lastError, setLastError] = useState<OrderError | null>(null);

  // Computed states
  const isPlacing = status.state === 'placing' || status.state === 'validating';
  const isSuccess = status.state === 'success';
  const isError = status.state === 'error';

  // Place order immediately - no confirmations, no delays
  const placeOrder = useCallback(
    async (
      broker: BrokerType, 
      orderRequest: PlaceOrderRequest,
      stopLossMetadata?: {
        mode: 'price' | 'percentage';
        percentage?: number;
        originalPrice?: number;
        stopLossPrice?: number;
      }
    ) => {
      try {
        // Reset previous states
        setLastError(null);
        setLastOrderResponse(null);

        // Immediate execution - show placing state
        setStatus({
          state: 'placing',
          message: 'Placing order...',
          progress: 50,
        });

        // Execute the order immediately - no delays
        const response = await orderService.placeOrder(broker, orderRequest, stopLossMetadata);

        setLastOrderResponse(response);
        setStatus({
          state: 'success',
          message: 'Order placed!',
          orderId: response.orderId,
          progress: 100,
        });
      } catch (error) {
        const orderError = error as OrderError;
        setLastError(orderError);
        setStatus({
          state: 'error',
          message: orderService.getErrorMessage(orderError),
          error: orderError.message,
          progress: 0,
        });
      }
    },
    []
  );

  // Place order with GTT - enhanced version
  const placeOrderWithGTT = useCallback(
    async (
      broker: BrokerType,
      orderRequest: PlaceOrderRequest,
      instrument: any,
      currentPrice: number,
      targetPrice?: number,
      stopLossMetadata?: {
        mode: 'price' | 'percentage';
        percentage?: number;
        originalPrice?: number;
        stopLossPrice?: number;
      }
    ) => {
      try {
        // Reset previous states
        setLastError(null);
        setLastOrderResponse(null);

        // Show placing state with GTT message
        setStatus({
          state: 'placing',
          message: stopLossMetadata?.stopLossPrice || targetPrice ? 'Placing order with GTT...' : 'Placing order...',
          progress: 30,
        });

        // Execute the order with GTT
        const response = await orderService.placeOrderWithGTT(
          broker,
          orderRequest,
          instrument,
          currentPrice,
          targetPrice,
          stopLossMetadata
        );

        setLastOrderResponse(response);
        
        // Enhanced success message based on GTT result
        let successMessage = 'Order placed!';
        if (response.gtt?.success) {
          successMessage += ` GTT created (ID: ${response.gtt.triggerId})`;
        } else if (response.gtt?.error) {
          successMessage += ` (GTT failed: ${response.gtt.error})`;
        }

        setStatus({
          state: 'success',
          message: successMessage,
          orderId: response.orderId,
          progress: 100,
        });
      } catch (error) {
        const orderError = error as OrderError;
        setLastError(orderError);
        setStatus({
          state: 'error',
          message: orderService.getErrorMessage(orderError),
          error: orderError.message,
          progress: 0,
        });
      }
    },
    []
  );

  // No longer needed - direct execution
  const confirmOrder = useCallback(() => {
    // Deprecated - orders execute immediately now
  }, []);

  // No longer needed - no confirmation step
  const cancelOrder = useCallback(() => {
    // Deprecated - no confirmation to cancel
  }, []);

  // Reset all states
  const resetStatus = useCallback(() => {
    setStatus({
      state: 'idle',
      progress: 0,
    });
    setLastError(null);
    setLastOrderResponse(null);
  }, []);

  return {
    status,
    isPlacing,
    isSuccess,
    isError,
    placeOrder,
    placeOrderWithGTT,
    confirmOrder,
    cancelOrder,
    resetStatus,
    lastOrderResponse,
    lastError,
  };
};
