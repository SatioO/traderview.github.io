import httpClient from './httpClient';

// GTT Types
export type GTTType = 'single' | 'two-leg';
export type GTTStatus =
  | 'active'
  | 'triggered'
  | 'disabled'
  | 'expired'
  | 'cancelled'
  | 'rejected'
  | 'deleted';

export interface GTTCondition {
  exchange: string;
  tradingsymbol: string;
  trigger_values: number[];
  last_price: number;
}

export interface GTTOrder {
  exchange: string;
  tradingsymbol: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  product: 'CNC' | 'NRML' | 'MIS' | 'BO' | 'CO' | 'MTF';
  price?: number;
}

export interface PlaceGTTRequest {
  type: GTTType;
  condition: GTTCondition;
  orders: GTTOrder[];
}

export interface GTTTrigger {
  trigger_id: number;
  type: GTTType;
  status: GTTStatus;
  condition: GTTCondition;
  orders: GTTOrder[];
  created_at: string;
  updated_at: string;
}

export interface PlaceGTTResponse {
  success: boolean;
  data: {
    trigger_id: number;
    status: GTTStatus;
  };
  message: string;
  triggerId: number;
  timestamp: string;
  requestId: string;
}

export interface GetGTTResponse {
  success: boolean;
  data: GTTTrigger[];
  count: number;
  message: string;
  timestamp: string;
  requestId: string;
}

export interface GetSingleGTTResponse {
  success: boolean;
  data: GTTTrigger;
  message: string;
  timestamp: string;
  requestId: string;
}

export interface GTTError {
  success: false;
  message: string;
  errors?: Array<{
    msg: string;
    param: string;
    location: string;
  }>;
  timestamp: string;
  requestId: string;
}

export interface GTTOrderResult {
  orderSuccess: boolean;
  gttSuccess: boolean;
  orderResponse?: any;
  gttResponse?: PlaceGTTResponse;
  orderError?: any;
  gttError?: GTTError;
}

class GTTService {
  private baseUrl = '/brokers/kite/gtt';

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
        message: errorData.message || error.message || 'GTT request failed',
        errors: errorData.errors || [],
        timestamp: errorData.timestamp || new Date().toISOString(),
        requestId: errorData.requestId || `gtt_error_${Date.now()}`,
      } as GTTError;
    }
  }

  // Place GTT trigger
  async placeGTT(gttRequest: PlaceGTTRequest): Promise<PlaceGTTResponse> {
    console.log('🎯 GTT Service: Placing GTT with request:', gttRequest);
    this.validateGTTRequest(gttRequest);
    console.log(
      '✅ GTT Service: Validation passed, making API call to:',
      this.baseUrl
    );
    return this.makeRequest<PlaceGTTResponse>(this.baseUrl, 'POST', gttRequest);
  }

  // Get all GTT triggers
  async getAllGTT(): Promise<GetGTTResponse> {
    return this.makeRequest<GetGTTResponse>(this.baseUrl, 'GET');
  }

  // Get specific GTT trigger
  async getGTT(triggerId: number): Promise<GetSingleGTTResponse> {
    return this.makeRequest<GetSingleGTTResponse>(
      `${this.baseUrl}/${triggerId}`,
      'GET'
    );
  }

  // Modify GTT trigger
  async modifyGTT(
    triggerId: number,
    gttRequest: PlaceGTTRequest
  ): Promise<PlaceGTTResponse> {
    this.validateGTTRequest(gttRequest);
    return this.makeRequest<PlaceGTTResponse>(
      `${this.baseUrl}/${triggerId}`,
      'PUT',
      gttRequest
    );
  }

  // Delete GTT trigger
  async deleteGTT(triggerId: number): Promise<PlaceGTTResponse> {
    return this.makeRequest<PlaceGTTResponse>(
      `${this.baseUrl}/${triggerId}`,
      'DELETE'
    );
  }

  // Validate GTT request before sending
  private validateGTTRequest(gttRequest: PlaceGTTRequest): void {
    const errors: string[] = [];

    if (!gttRequest.type || !['single', 'two-leg'].includes(gttRequest.type)) {
      errors.push('GTT type must be "single" or "two-leg"');
    }

    if (!gttRequest.condition) {
      errors.push('GTT condition is required');
    } else {
      const { condition } = gttRequest;

      if (!condition.exchange) {
        errors.push('Exchange is required in condition');
      }

      if (!condition.tradingsymbol) {
        errors.push('Trading symbol is required in condition');
      }

      if (
        !condition.trigger_values ||
        !Array.isArray(condition.trigger_values)
      ) {
        errors.push('Trigger values array is required');
      } else {
        if (
          gttRequest.type === 'single' &&
          condition.trigger_values.length !== 1
        ) {
          errors.push('Single GTT requires exactly 1 trigger value');
        }
        if (
          gttRequest.type === 'two-leg' &&
          condition.trigger_values.length !== 2
        ) {
          errors.push('Two-leg GTT requires exactly 2 trigger values');
        }

        condition.trigger_values.forEach((value, index) => {
          if (typeof value !== 'number' || value <= 0) {
            errors.push(`Trigger value ${index + 1} must be a positive number`);
          }
        });
      }

      if (
        typeof condition.last_price !== 'number' ||
        condition.last_price <= 0
      ) {
        errors.push('Last price must be a positive number');
      }
    }

    if (
      !gttRequest.orders ||
      !Array.isArray(gttRequest.orders) ||
      gttRequest.orders.length === 0
    ) {
      errors.push('At least one order is required');
    } else {
      gttRequest.orders.forEach((order, index) => {
        if (!order.exchange) {
          errors.push(`Order ${index + 1}: Exchange is required`);
        }

        if (!order.tradingsymbol) {
          errors.push(`Order ${index + 1}: Trading symbol is required`);
        }

        if (
          !order.transaction_type ||
          !['BUY', 'SELL'].includes(order.transaction_type)
        ) {
          errors.push(
            `Order ${index + 1}: Transaction type must be BUY or SELL`
          );
        }

        if (!order.quantity || order.quantity < 1) {
          errors.push(`Order ${index + 1}: Quantity must be at least 1`);
        }

        if (
          !order.order_type ||
          !['MARKET', 'LIMIT', 'SL', 'SL-M'].includes(order.order_type)
        ) {
          errors.push(`Order ${index + 1}: Invalid order type`);
        }

        if (
          !order.product ||
          !['CNC', 'NRML', 'MIS', 'BO', 'CO', 'MTF'].includes(order.product)
        ) {
          errors.push(`Order ${index + 1}: Invalid product type`);
        }

        if (
          order.order_type === 'LIMIT' &&
          (!order.price || order.price <= 0)
        ) {
          errors.push(`Order ${index + 1}: Price is required for LIMIT orders`);
        }
      });
    }

    if (errors.length > 0) {
      throw {
        success: false,
        message: 'GTT validation failed',
        errors: errors.map((msg) => ({
          msg,
          param: 'validation',
          location: 'body',
        })),
        timestamp: new Date().toISOString(),
        requestId: `gtt_validation_${Date.now()}`,
      } as GTTError;
    }
  }

  // Helper method to create single GTT from order data
  createSingleGTT(
    instrument: any,
    orderData: any,
    triggerPrice: number,
    currentPrice: number
  ): PlaceGTTRequest {
    console.log('🏗️ GTT Service: Creating single GTT:', {
      instrument: instrument.tradingsymbol,
      orderData,
      triggerPrice,
      currentPrice,
    });

    const gttRequest = {
      type: 'single' as const,
      condition: {
        exchange: instrument.exchange || 'NSE',
        tradingsymbol: instrument.tradingsymbol,
        trigger_values: [triggerPrice],
        last_price: currentPrice,
      },
      orders: [
        {
          exchange: instrument.exchange || 'NSE',
          tradingsymbol: instrument.tradingsymbol,
          transaction_type: orderData.transaction_type || 'BUY',
          quantity: orderData.quantity || 1,
          order_type: orderData.order_type || 'LIMIT',
          product: orderData.product || 'CNC',
          price: orderData.order_type === 'LIMIT' ? triggerPrice : undefined,
        },
      ],
    };

    console.log('📦 GTT Service: Created GTT request:', gttRequest);
    return gttRequest;
  }

  // Helper method to create two-leg GTT (OCO - One Cancels Other)
  createTwoLegGTT(
    instrument: any,
    orderData: any,
    stopLossPrice: number,
    targetPrice: number,
    currentPrice: number
  ): PlaceGTTRequest {
    return {
      type: 'two-leg',
      condition: {
        exchange: instrument.exchange || 'NSE',
        tradingsymbol: instrument.tradingsymbol,
        trigger_values: [stopLossPrice, targetPrice],
        last_price: currentPrice,
      },
      orders: [
        {
          exchange: instrument.exchange || 'NSE',
          tradingsymbol: instrument.tradingsymbol,
          transaction_type:
            orderData.transaction_type === 'BUY' ? 'SELL' : 'BUY',
          quantity: orderData.quantity,
          order_type: 'LIMIT',
          product: orderData.product || 'CNC',
          price: stopLossPrice,
        },
        {
          exchange: instrument.exchange || 'NSE',
          tradingsymbol: instrument.tradingsymbol,
          transaction_type:
            orderData.transaction_type === 'BUY' ? 'SELL' : 'BUY',
          quantity: orderData.quantity,
          order_type: 'LIMIT',
          product: orderData.product || 'CNC',
          price: targetPrice,
        },
      ],
    };
  }

  // Get user-friendly error messages
  getErrorMessage(error: GTTError): string {
    if (error.errors && error.errors.length > 0) {
      return error.errors.map((e) => e.msg).join(', ');
    }
    return error.message || 'An unexpected GTT error occurred';
  }

  // Get user-friendly status messages
  getStatusMessage(status: GTTStatus): string {
    switch (status) {
      case 'active':
        return 'GTT is active and monitoring trigger conditions';
      case 'triggered':
        return 'GTT has been triggered and orders are being placed';
      case 'disabled':
        return 'GTT has been temporarily disabled';
      case 'expired':
        return 'GTT has expired';
      case 'cancelled':
        return 'GTT has been cancelled';
      case 'rejected':
        return 'GTT was rejected due to validation or other issues';
      case 'deleted':
        return 'GTT has been deleted';
      default:
        return 'Unknown GTT status';
    }
  }
}

// Create singleton instance
export const gttService = new GTTService();
export default gttService;
