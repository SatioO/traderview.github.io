import httpClient from './httpClient';
import { gttService, type PlaceGTTRequest } from './gttService';

// Order Types
export type BrokerType = 'kite';
export type TransactionType = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
export type ProductType = 'CNC' | 'NRML' | 'MIS' | 'BO' | 'CO' | 'MTF';
export type ExchangeType = 'NSE' | 'BSE';
export type ValidityType = 'DAY' | 'IOC' | 'TTL';
export type OrderStatus =
  | 'OPEN'
  | 'COMPLETE'
  | 'CANCELLED'
  | 'REJECTED'
  | 'PENDING';

export interface PlaceOrderRequest {
  tradingsymbol: string;
  exchange: ExchangeType;
  transaction_type: TransactionType;
  order_type: OrderType;
  product: ProductType;
  quantity: number;
  price?: number;
  trigger_price?: number;
  validity?: ValidityType;
  validity_ttl?: number;
  disclosed_quantity?: number;
  tag?: string;
  // GTT-specific fields
  with_stop_loss?: boolean;
  stop_loss_price?: number;
  current_price?: number; // Current market price for GTT last_price
}

export interface OrderData {
  tradingsymbol: string;
  exchange: ExchangeType;
  transaction_type: TransactionType;
  order_type: OrderType;
  quantity: number;
  price?: number;
  status: OrderStatus;
}

export interface PlaceOrderResponse {
  success: boolean;
  message: string;
  orderId: string;
  order: OrderData;
  timestamp: string;
  requestId: string;
  // GTT-specific response fields
  gttTriggerId?: number;
  isGttOrder?: boolean;
}

export interface OrderError {
  success: false;
  message: string;
  error: string;
  code?: string;
  field?: string;
  timestamp: string;
  requestId: string;
}

// Order placement states for UI
export type OrderPlacementState =
  | 'idle'
  | 'validating'
  | 'confirming'
  | 'placing'
  | 'success'
  | 'error';

export interface OrderPlacementStatus {
  state: OrderPlacementState;
  message?: string;
  orderId?: string;
  error?: string;
  progress?: number;
}

class OrderService {
  private baseUrl = '/brokers';

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    try {
      let response;
      switch (method) {
        case 'GET':
          response = await httpClient.get<T>(endpoint);
          break;
        case 'POST':
          response = await httpClient.post<T>(endpoint, data);
          break;
        case 'PUT':
          response = await httpClient.put<T>(endpoint, data);
          break;
        case 'PATCH':
          response = await httpClient.patch<T>(endpoint, data);
          break;
        case 'DELETE':
          response = await httpClient.delete<T>(endpoint);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      return response.data;
    } catch (error: any) {
      // Transform axios errors to OrderError format
      const errorData = error.response?.data || {};
      throw {
        success: false,
        message: errorData.message || error.message || 'Request failed',
        error: errorData.error || 'Unknown error',
        code: errorData.code,
        field: errorData.field,
        timestamp: errorData.timestamp || new Date().toISOString(),
        requestId: errorData.requestId || `error_${Date.now()}`,
      } as OrderError;
    }
  }

  // Place order with dual approach: regular order + GTT stop loss
  async placeOrder(
    broker: BrokerType,
    orderRequest: PlaceOrderRequest
  ): Promise<PlaceOrderResponse> {
    // Client-side validation
    this.validateOrderRequest(orderRequest);

    try {
      // Step 1: Place the regular BUY order (as it was before)
      console.log('About to place main order...');
      const cleanOrderRequest = {
        ...orderRequest,
        // Remove GTT-specific fields from regular order
        with_stop_loss: undefined,
        stop_loss_price: undefined,
      };
      console.log('Clean order request for main order:', cleanOrderRequest);

      const mainOrderResponse = await this.makeRequest<PlaceOrderResponse>(
        `${this.baseUrl}/${broker}/orders/place`,
        'POST',
        cleanOrderRequest
      );

      console.log('Main order API call completed');

      // Step 2: If main order succeeds and we have stop loss, place GTT stop loss order
      console.log('Main order response:', mainOrderResponse);
      console.log('Stop loss price:', orderRequest.stop_loss_price);
      console.log(
        'Should place GTT:',
        mainOrderResponse.success &&
          orderRequest.stop_loss_price &&
          orderRequest.stop_loss_price > 0
      );

      if (
        mainOrderResponse.success &&
        orderRequest.stop_loss_price &&
        orderRequest.stop_loss_price > 0
      ) {
        console.log('Placing GTT stop loss order...');
        try {
          const gttRequest = this.createStopLossGTT(orderRequest);
          console.log('GTT request:', gttRequest);
          const gttResponse = await gttService.placeGTT(gttRequest);
          console.log('GTT response:', gttResponse);

          if (gttResponse.success) {
            return {
              ...mainOrderResponse,
              message: `Order placed with GTT stop loss protection`,
              gttTriggerId: gttResponse.data.trigger_id,
              isGttOrder: true,
            };
          } else {
            // Main order succeeded but GTT failed - still return success but warn user
            return {
              ...mainOrderResponse,
              message: `Order placed successfully, but stop loss GTT failed: ${gttResponse.message}`,
              isGttOrder: false,
            };
          }
        } catch (gttError: any) {
          // GTT failed but main order succeeded - warn user
          return {
            ...mainOrderResponse,
            message: `Order placed successfully, but stop loss GTT failed: ${
              gttError.message || 'GTT error'
            }`,
            isGttOrder: false,
          };
        }
      }

      // Return main order response if no stop loss or stop loss not available
      return mainOrderResponse;
    } catch (error: any) {
      // Transform errors to OrderError format
      console.error('Order placement error caught:', error);
      const errorData = error.response?.data || error;
      throw {
        success: false,
        message: errorData.message || error.message || 'Order placement failed',
        error: errorData.error || 'Order placement error',
        code: errorData.code || 'ORDER_ERROR',
        timestamp: errorData.timestamp || new Date().toISOString(),
        requestId: errorData.requestId || `order_error_${Date.now()}`,
      } as OrderError;
    }
  }

  // Create GTT stop loss order (single, sell) - triggers when price hits stop loss
  private createStopLossGTT(orderRequest: PlaceOrderRequest): PlaceGTTRequest {
    const stopLossPrice = orderRequest.stop_loss_price!;
    const currentPrice = orderRequest.current_price!; // Current market price

    // Create single GTT for stop loss protection only
    // This assumes the main BUY order has already been placed successfully
    return {
      type: 'single',
      condition: {
        exchange: orderRequest.exchange,
        tradingsymbol: orderRequest.tradingsymbol,
        trigger_values: [stopLossPrice], // Stop loss trigger price
        last_price: currentPrice, // Current market price for GTT validation
      },
      orders: [
        {
          exchange: orderRequest.exchange,
          tradingsymbol: orderRequest.tradingsymbol,
          transaction_type: 'SELL', // Stop loss sell order
          quantity: orderRequest.quantity,
          order_type: 'LIMIT', // Limit order for stop loss
          product: orderRequest.product,
          price: stopLossPrice, // Stop loss price as limit price
        },
      ],
    };
  }

  // Validate order request before sending
  private validateOrderRequest(orderRequest: PlaceOrderRequest): void {
    const errors: string[] = [];

    if (!orderRequest.tradingsymbol || orderRequest.tradingsymbol.length > 50) {
      errors.push(
        'Trading symbol is required and must be less than 50 characters'
      );
    }

    if (!orderRequest.exchange) {
      errors.push('Exchange is required');
    }

    if (!orderRequest.transaction_type) {
      errors.push('Transaction type is required');
    }

    if (!orderRequest.order_type) {
      errors.push('Order type is required');
    }

    if (!orderRequest.product) {
      errors.push('Product type is required');
    }

    if (!orderRequest.quantity || orderRequest.quantity < 1) {
      errors.push('Quantity must be at least 1');
    }

    if (orderRequest.order_type === 'LIMIT' && !orderRequest.price) {
      errors.push('Price is required for LIMIT orders');
    }

    if (orderRequest.validity === 'TTL' && !orderRequest.validity_ttl) {
      errors.push('TTL is required when validity is TTL');
    }

    if (
      orderRequest.validity_ttl &&
      (orderRequest.validity_ttl < 1 || orderRequest.validity_ttl > 365)
    ) {
      errors.push('TTL must be between 1 and 365 minutes');
    }

    if (orderRequest.tag && orderRequest.tag.length > 20) {
      errors.push('Tag must be less than 20 characters');
    }

    // GTT-specific validation
    if (orderRequest.with_stop_loss && !orderRequest.stop_loss_price) {
      errors.push('Stop loss price is required when with_stop_loss is true');
    }

    if (orderRequest.stop_loss_price && orderRequest.stop_loss_price <= 0) {
      errors.push('Stop loss price must be positive');
    }

    if (errors.length > 0) {
      throw {
        success: false,
        message: 'Validation failed',
        error: errors.join(', '),
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        requestId: `validation_${Date.now()}`,
      } as OrderError;
    }
  }

  // Get user-friendly error messages
  getErrorMessage(error: OrderError): string {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return error.error;
      case 'INSUFFICIENT_FUNDS':
        return 'Insufficient funds to place this order';
      case 'INVALID_SYMBOL':
        return 'Invalid trading symbol or exchange';
      case 'MARKET_CLOSED':
        return 'Market is currently closed';
      case 'ORDER_REJECTED':
        return 'Order was rejected by the broker';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection';
      case 'BROKER_ERROR':
        return 'Broker service is temporarily unavailable';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }

  // Create order request from form data
  createOrderRequest(
    instrument: any,
    formData: any,
    entryPriceMode: 'mkt' | 'lmt',
    calculations: any
  ): PlaceOrderRequest {
    console.log('Creating order request with formData:', instrument, formData);
    console.log('Entry price mode:', entryPriceMode);
    console.log('Calculations:', calculations);

    const baseRequest: PlaceOrderRequest = {
      tradingsymbol: instrument.tradingsymbol,
      exchange: instrument.exchange || 'NSE',
      transaction_type: 'BUY', // Default to BUY, can be made configurable
      order_type: entryPriceMode === 'mkt' ? 'MARKET' : 'LIMIT',
      product: 'CNC', // Default to Cash & Carry
      // quantity: Math.floor(calculations?.positionSize || 1),
      quantity: 1,
      price: entryPriceMode === 'lmt' ? formData.entryPrice : undefined,
      validity: 'DAY',
      tag: `tv_${Date.now().toString().slice(-8)}`,
    };

    // Always add GTT stop loss if stop loss is available
    if (formData.stopLoss && formData.stopLoss > 0) {
      console.log('Adding stop loss to order request:', formData.stopLoss);
      baseRequest.with_stop_loss = true;
      baseRequest.stop_loss_price = formData.stopLoss;
      // Add current price for GTT (always use entryPrice as it's the current market price)
      baseRequest.current_price = formData.entryPrice;
    } else {
      console.log('No stop loss found in formData:', formData.stopLoss);
    }

    console.log('Final order request:', baseRequest);
    return baseRequest;
  }
}

// Create singleton instance
export const orderService = new OrderService();
export default orderService;
