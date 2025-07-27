import httpClient from './httpClient';

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

  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', data?: any): Promise<T> {
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

  // Place order with comprehensive error handling
  async placeOrder(
    broker: BrokerType,
    orderRequest: PlaceOrderRequest
  ): Promise<PlaceOrderResponse> {
    // Client-side validation
    this.validateOrderRequest(orderRequest);

    return this.makeRequest<PlaceOrderResponse>(
      `${this.baseUrl}/${broker}/orders/place`,
      'POST',
      orderRequest
    );
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
    return {
      tradingsymbol: instrument.tradingsymbol,
      exchange: instrument.exchange || 'NSE',
      transaction_type: 'BUY', // Default to BUY, can be made configurable
      order_type: entryPriceMode === 'mkt' ? 'MARKET' : 'LIMIT',
      product: 'CNC', // Default to Cash & Carry
      // quantity: Math.floor(calculations?.positionSize || 0),
      quantity: 1,
      price: entryPriceMode === 'lmt' ? formData.entryPrice : undefined,
      validity: 'DAY',
      tag: `tv_${Date.now().toString().slice(-8)}`,
    };
  }
}

// Create singleton instance
export const orderService = new OrderService();
export default orderService;
