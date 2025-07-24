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
    orderRequest: PlaceOrderRequest
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
    async (broker: BrokerType, orderRequest: PlaceOrderRequest) => {
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
        const response = await orderService.placeOrder(broker, orderRequest);

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
    confirmOrder,
    cancelOrder,
    resetStatus,
    lastOrderResponse,
    lastError,
  };
};
