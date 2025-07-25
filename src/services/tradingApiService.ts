import type { TradingInstrument, OrderData } from '../contexts/TradingContext';
import httpClient from './httpClient';

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

// Market Depth Interface
export interface MarketDepth {
  price: number;
  quantity: number;
  orders: number;
}

// OHLC Interface
export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
}

// Instrument Quote Interface
export interface InstrumentQuote {
  instrument_token: number;
  timestamp: string;
  last_trade_time?: string;
  last_price: number;
  last_quantity?: number;
  buy_quantity?: number;
  sell_quantity?: number;
  volume: number;
  average_price?: number;
  oi?: number;
  oi_day_high?: number;
  oi_day_low?: number;
  net_change?: number;
  lower_circuit_limit?: number;
  upper_circuit_limit?: number;
  ohlc: OHLC;
  depth?: {
    buy: MarketDepth[];
    sell: MarketDepth[];
  };
}

// Quote Response Interface
export interface InstrumentQuotesResponse {
  success: boolean;
  data: Record<string, InstrumentQuote>;
  requestedCount: number;
  receivedCount: number;
  missingInstruments: string[];
  message: string;
  timestamp: string;
  requestId: string;
}

// Recent Search Interfaces
export interface RecentSearchItem {
  searchedAt: string;
  instrument: TradingInstrument;
}

export interface RecentSearchesResponse {
  success: boolean;
  count: number;
  recentSearches: RecentSearchItem[];
  message: string;
  timestamp: string;
  requestId: string;
}

export interface AddRecentSearchResponse {
  success: boolean;
  recentSearch: {
    tradingsymbol: string;
    exchange: string;
    searchedAt: string;
  };
  message: string;
  timestamp: string;
  requestId: string;
}

class TradingApiService {
  private baseUrl: string = '/instruments';

  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', data?: any): Promise<T> {
    switch (method) {
      case 'GET':
        const getResponse = await httpClient.get<T>(endpoint);
        return getResponse.data;
      case 'POST':
        const postResponse = await httpClient.post<T>(endpoint, data);
        return postResponse.data;
      case 'PUT':
        const putResponse = await httpClient.put<T>(endpoint, data);
        return putResponse.data;
      case 'PATCH':
        const patchResponse = await httpClient.patch<T>(endpoint, data);
        return patchResponse.data;
      case 'DELETE':
        const deleteResponse = await httpClient.delete<T>(endpoint);
        return deleteResponse.data;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  private baseURL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // Search for instruments
  async searchInstruments(query: string): Promise<TradingInstrument[]> {
    const response = await this.makeRequest<InstrumentSearchResponse>(
      `${this.baseUrl}/search?q=${encodeURIComponent(query)}`,
      'GET'
    );

    // Debug: Log the first instrument to see structure
    if (response.instruments && response.instruments.length > 0) {
      console.log('Sample search result:', response.instruments[0]);
    }

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

  // Get real-time quotes for multiple instruments
  async getInstrumentQuotes(
    instruments: string[]
  ): Promise<InstrumentQuotesResponse> {
    if (!instruments || instruments.length === 0) {
      throw new Error('Instruments array cannot be empty');
    }

    if (instruments.length > 500) {
      throw new Error('Maximum 500 instruments allowed per request');
    }

    try {
      const response = await this.makeRequest<InstrumentQuotesResponse>(
        `${this.baseUrl}/quotes`,
        'POST',
        { instruments }
      );

      return response;
    } catch (error) {
      console.error('Error fetching instrument quotes:', error);
      throw error;
    }
  }

  // Get quote for a single instrument (convenience method)
  async getSingleInstrumentQuote(
    tradingsymbol: string,
    exchange: string
  ): Promise<InstrumentQuote | null> {
    const instrumentKey = `${exchange}:${tradingsymbol}`;

    try {
      const response = await this.getInstrumentQuotes([instrumentKey]);

      if (response.success && response.data[instrumentKey]) {
        return response.data[instrumentKey];
      }

      return null;
    } catch (error) {
      console.error('Error fetching single instrument quote:', error);
      throw error;
    }
  }

  // Get user's recent searches
  async getRecentSearches(): Promise<RecentSearchItem[]> {
    try {
      const response = await this.makeRequest<RecentSearchesResponse>(
        `${this.baseUrl}/recent-searches`
      );

      return response.recentSearches || [];
    } catch (error) {
      console.error('Error fetching recent searches:', error);
      // Return empty array instead of throwing to gracefully degrade
      return [];
    }
  }

  // Add instrument to recent searches
  async addToRecentSearches(tradingsymbol: string, exchange: string): Promise<void> {
    try {
      await this.makeRequest<AddRecentSearchResponse>(
        `${this.baseUrl}/recent-search`,
        'POST',
        { tradingsymbol, exchange }
      );
    } catch (error) {
      console.error('Error adding to recent searches:', error);
      // Don't throw error to avoid disrupting the main flow
      // Recent searches is a nice-to-have feature
    }
  }
}

export const tradingApiService = new TradingApiService();
export default tradingApiService;
