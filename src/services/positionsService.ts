import httpClient from './httpClient';

// Position Types
export type BrokerType = 'kite';

export interface Position {
  tradingsymbol?: string;
  trading_symbol?: string;
  exchange?: string;
  instrument_token?: string;
  product?: string;
  quantity?: number;
  qty?: number;
  overnightQuantity?: number;
  multiplier?: number;
  averagePrice?: number;
  average_price?: number;
  closePrice?: number;
  close_price?: number;
  lastPrice?: number;
  last_price?: number;
  value?: number;
  pnl?: number;
  m2m?: number;
  unrealised?: number;
  realised?: number;
  buyQuantity?: number;
  buy_quantity?: number;
  buyPrice?: number;
  buy_price?: number;
  buyValue?: number;
  buy_value?: number;
  buyM2m?: number;
  buy_m2m?: number;
  sellQuantity?: number;
  sell_quantity?: number;
  sellPrice?: number;
  sell_price?: number;
  sellValue?: number;
  sell_value?: number;
  sellM2m?: number;
  sell_m2m?: number;
  dayBuyQuantity?: number;
  day_buy_quantity?: number;
  dayBuyPrice?: number;
  day_buy_price?: number;
  dayBuyValue?: number;
  day_buy_value?: number;
  daySellQuantity?: number;
  day_sell_quantity?: number;
  daySellPrice?: number;
  day_sell_price?: number;
  daySellValue?: number;
  day_sell_value?: number;
}

export interface PositionsResponse {
  success: boolean;
  data: {
    net: Position[];
    day: Position[];
  };
  count: {
    net: number;
    day: number;
  };
  stats: {
    net: {
      totalPositions: number;
      totalValue: number;
      totalPnl: number;
      totalM2m: number;
      totalUnrealised: number;
      totalRealised: number;
      profitableCount: number;
      lossCount: number;
      neutralCount: number;
    };
    day: {
      totalPositions: number;
      totalValue: number;
      totalPnl: number;
      totalM2m: number;
      totalUnrealised: number;
      totalRealised: number;
      profitableCount: number;
      lossCount: number;
      neutralCount: number;
    };
  };
  message: string;
}

export interface PositionsError {
  success: false;
  message: string;
  error: string;
  code?: string;
  timestamp: string;
  requestId: string;
}

class PositionsService {
  private baseUrl = '/brokers';

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    try {
      let response: { data: T };
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
        case 'DELETE':
          response = await httpClient.delete<T>(endpoint);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data || {};
      throw {
        success: false,
        message: errorData.message || error.message || 'Request failed',
        error: errorData.error || 'Unknown error',
        code: errorData.code,
        timestamp: errorData.timestamp || new Date().toISOString(),
        requestId: errorData.requestId || `error_${Date.now()}`,
      } as PositionsError;
    }
  }

  // Get positions from broker
  async getPositions(
    broker: BrokerType,
    filters?: {
      tradingsymbol?: string;
      exchange?: string;
      product?: string;
    }
  ): Promise<PositionsResponse> {
    const params = new URLSearchParams();
    if (filters?.tradingsymbol) params.append('tradingsymbol', filters.tradingsymbol);
    if (filters?.exchange) params.append('exchange', filters.exchange);
    if (filters?.product) params.append('product', filters.product);
    
    const queryString = params.toString();
    const endpoint = `${this.baseUrl}/${broker}/positions${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<PositionsResponse>(endpoint, 'GET');
  }

  // Get user-friendly error messages
  getErrorMessage(error: PositionsError): string {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'Invalid or missing authorization token';
      case 'FORBIDDEN':
        return 'No active broker session';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection';
      case 'BROKER_ERROR':
        return 'Broker service is temporarily unavailable';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }
}

// Create singleton instance
export const positionsService = new PositionsService();
export default positionsService;