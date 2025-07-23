import type { TradingInstrument, OrderData } from '../contexts/TradingContext';
import { apiClient } from './authService';

// API Response Types
interface InstrumentSearchResponse {
  success: boolean;
  count: number;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  instruments: TradingInstrument[];
  filters: {
    query: string;
    exchange: string | null;
    instrument_type: string | null;
    segment: string | null;
  };
  message: string;
  timestamp: string;
  requestId: string;
}

interface OrderPlacementResponse {
  order_id: string;
  status: 'success' | 'error';
  message?: string;
  data?: {
    order_id: string;
    exchange_order_id?: string;
    placed_by: string;
    variety: string;
    status: string;
    status_message?: string;
  };
}

interface BrokerageCalculationResponse {
  brokerage: number;
  taxes: {
    stt: number;
    exchange_txn_charge: number;
    clearing_charge: number;
    gst: number;
    stamp_duty: number;
    total: number;
  };
  total_charges: number;
  net_amount: number;
  status: 'success' | 'error';
}

class TradingApiService {
  private baseUrl: string = '/instruments';

  private async makeRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(
      `${(apiClient as any).baseURL || 'http://localhost:3000/api'}${endpoint}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(apiClient as any).getStoredAccessToken()}`,
          ...((options?.headers as Record<string, string>) || {}),
        },
        ...options,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || `Request failed with status ${response.status}`
      );
    }

    return response.json();
  }

  private baseURL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // Search for instruments
  async searchInstruments(query: string): Promise<TradingInstrument[]> {
    const response = await this.makeRequest<InstrumentSearchResponse>(
      `${this.baseUrl}/search?q=${encodeURIComponent(query)}`
    );

    return response.instruments || [];
  }

  // Get instrument details by symbol
  async getInstrumentDetails(
    tradingsymbol: string,
    exchange: string
  ): Promise<TradingInstrument> {
    try {
      const response = await fetch(
        `${this.baseURL}/instruments/${exchange}/${tradingsymbol}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get instrument details: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.instrument;
    } catch (error) {
      console.error('Error getting instrument details:', error);
      throw error;
    }
  }

  // Calculate brokerage and charges
  async calculateBrokerage(orderData: {
    tradingsymbol: string;
    exchange: string;
    quantity: number;
    price: number;
    transaction_type: 'BUY' | 'SELL';
    product: 'CNC' | 'MIS' | 'NRML';
  }): Promise<BrokerageCalculationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/orders/calculate-charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to calculate brokerage: ${response.statusText}`
        );
      }

      const data: BrokerageCalculationResponse = await response.json();

      if (data.status === 'error') {
        throw new Error('Failed to calculate brokerage');
      }

      return data;
    } catch (error) {
      console.error('Error calculating brokerage:', error);
      throw error;
    }
  }

  // Place order (following Kite Connect API specification)
  async placeOrder(orderData: OrderData): Promise<OrderPlacementResponse> {
    try {
      // Validate required fields
      const requiredFields = [
        'tradingsymbol',
        'exchange',
        'transaction_type',
        'order_type',
        'quantity',
        'product',
        'validity',
        'variety',
      ];
      for (const field of requiredFields) {
        if (!orderData[field as keyof OrderData]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Prepare order payload
      const orderPayload = {
        tradingsymbol: orderData.tradingsymbol,
        exchange: orderData.exchange,
        transaction_type: orderData.transaction_type,
        order_type: orderData.order_type,
        quantity: orderData.quantity,
        product: orderData.product,
        validity: orderData.validity,
        variety: orderData.variety,
        ...(orderData.price && { price: orderData.price }),
        ...(orderData.trigger_price && {
          trigger_price: orderData.trigger_price,
        }),
        ...(orderData.disclosed_quantity && {
          disclosed_quantity: orderData.disclosed_quantity,
        }),
        ...(orderData.squareoff && { squareoff: orderData.squareoff }),
        ...(orderData.stoploss && { stoploss: orderData.stoploss }),
        ...(orderData.tag && { tag: orderData.tag }),
      };

      const response = await fetch(
        `${this.baseURL}/orders/${orderData.variety}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(orderPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to place order: ${response.statusText}`
        );
      }

      const data: OrderPlacementResponse = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message || 'Failed to place order');
      }

      return data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  // Validate order before placing
  async validateOrder(orderData: OrderData): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const response = await fetch(`${this.baseURL}/orders/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`Failed to validate order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating order:', error);
      return {
        valid: false,
        errors: ['Failed to validate order'],
        warnings: [],
      };
    }
  }

  // Get current market price for an instrument
  async getMarketPrice(
    tradingsymbol: string,
    exchange: string
  ): Promise<{
    ltp: number;
    change: number;
    change_percent: number;
    volume: number;
    last_trade_time: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseURL}/instruments/${exchange}/${tradingsymbol}/quote`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get market price: ${response.statusText}`);
      }

      const data = await response.json();
      return data.quote;
    } catch (error) {
      console.error('Error getting market price:', error);
      throw error;
    }
  }

  // Get order history/status
  async getOrderStatus(orderId: string): Promise<{
    order_id: string;
    status: string;
    status_message: string;
    tradingsymbol: string;
    exchange: string;
    quantity: number;
    filled_quantity: number;
    pending_quantity: number;
    average_price: number;
    placed_by: string;
    order_timestamp: string;
    exchange_timestamp?: string;
    variety: string;
    transaction_type: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to get order status: ${response.statusText}`);
      }

      const data = await response.json();
      return data.order;
    } catch (error) {
      console.error('Error getting order status:', error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(
    orderId: string,
    variety: string = 'regular'
  ): Promise<{
    order_id: string;
    status: 'success' | 'error';
    message?: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseURL}/orders/${variety}/${orderId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }
}

export const tradingApiService = new TradingApiService();
export default tradingApiService;
