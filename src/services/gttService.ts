import httpClient from './httpClient';
import type {
  ExchangeType,
  TransactionType,
  ProductType,
} from './orderService';

// GTT Types based on the API documentation
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
  exchange: ExchangeType;
  tradingsymbol: string;
  trigger_values: number[];
  last_price: number; // Current market price - now required
}

export interface GTTOrder {
  exchange: ExchangeType;
  tradingsymbol: string;
  transaction_type: TransactionType;
  quantity: number;
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  product: ProductType;
  price?: number;
}

export interface PlaceGTTRequest {
  type: GTTType;
  condition: GTTCondition;
  orders: GTTOrder[];
}

export interface GTTTriggerData {
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
  data: GTTTriggerData[];
  count: number;
  message: string;
  timestamp: string;
  requestId: string;
}

export interface GetSingleGTTResponse {
  success: boolean;
  data: GTTTriggerData;
  message: string;
  timestamp: string;
  requestId: string;
}

export interface ModifyGTTResponse {
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

export interface DeleteGTTResponse {
  success: boolean;
  data: {
    trigger_id: number;
  };
  message: string;
  triggerId: number;
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

class GTTService {
  private baseUrl = '/brokers/kite/gtt';

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
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
        case 'DELETE':
          response = await httpClient.delete<T>(endpoint);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      return response.data;
    } catch (error: any) {
      // Transform axios errors to GTTError format
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

  // Place a new GTT trigger
  async placeGTT(gttRequest: PlaceGTTRequest): Promise<PlaceGTTResponse> {
    console.log('GTT Service: Starting GTT placement...');
    console.log('GTT Service: Validating request...');
    this.validateGTTRequest(gttRequest);
    console.log(
      'GTT Service: Validation passed, making API call to:',
      this.baseUrl
    );

    console.log(
      'GTT Service: Request data:',
      JSON.stringify(gttRequest, null, 2)
    );
    try {
      const response = await this.makeRequest<PlaceGTTResponse>(
        this.baseUrl,
        'POST',
        gttRequest
      );
      console.log('GTT Service: API call completed successfully:', response);
      return response;
    } catch (error) {
      console.error('GTT Service: API call failed:', error);
      throw error;
    }
  }

  // Get all GTT triggers
  async getAllGTTs(): Promise<GetGTTResponse> {
    return this.makeRequest<GetGTTResponse>(this.baseUrl);
  }

  // Get specific GTT trigger
  async getGTT(triggerId: number): Promise<GetSingleGTTResponse> {
    return this.makeRequest<GetSingleGTTResponse>(
      `${this.baseUrl}/${triggerId}`
    );
  }

  // Modify existing GTT trigger
  async modifyGTT(
    triggerId: number,
    gttRequest: PlaceGTTRequest
  ): Promise<ModifyGTTResponse> {
    this.validateGTTRequest(gttRequest);
    return this.makeRequest<ModifyGTTResponse>(
      `${this.baseUrl}/${triggerId}`,
      'PUT',
      gttRequest
    );
  }

  // Delete GTT trigger
  async deleteGTT(triggerId: number): Promise<DeleteGTTResponse> {
    return this.makeRequest<DeleteGTTResponse>(
      `${this.baseUrl}/${triggerId}`,
      'DELETE'
    );
  }

  // Validate GTT request before sending
  private validateGTTRequest(gttRequest: PlaceGTTRequest): void {
    console.log('GTT Validation: Starting validation for:', gttRequest);
    const errors: string[] = [];

    // Validate type
    console.log('GTT Validation: Checking type:', gttRequest.type);
    if (!gttRequest.type || !['single', 'two-leg'].includes(gttRequest.type)) {
      errors.push('GTT type must be either "single" or "two-leg"');
    }

    // Validate condition
    console.log('GTT Validation: Checking condition:', gttRequest.condition);
    if (!gttRequest.condition) {
      errors.push('GTT condition is required');
    } else {
      const { condition } = gttRequest;

      console.log('GTT Validation: Checking exchange:', condition.exchange);
      if (!condition.exchange) {
        errors.push('Exchange is required in condition');
      }

      console.log(
        'GTT Validation: Checking trading symbol:',
        condition.tradingsymbol
      );
      if (!condition.tradingsymbol) {
        errors.push('Trading symbol is required in condition');
      }

      console.log(
        'GTT Validation: Checking trigger values:',
        condition.trigger_values
      );
      if (
        !condition.trigger_values ||
        !Array.isArray(condition.trigger_values)
      ) {
        errors.push('Trigger values must be an array');
      } else {
        if (
          gttRequest.type === 'single' &&
          condition.trigger_values.length !== 1
        ) {
          errors.push('Single GTT must have exactly 1 trigger value');
        }
        if (
          gttRequest.type === 'two-leg' &&
          condition.trigger_values.length !== 2
        ) {
          errors.push('Two-leg GTT must have exactly 2 trigger values');
        }

        // Validate trigger values are positive numbers
        condition.trigger_values.forEach((value, index) => {
          console.log(
            `GTT Validation: Checking trigger value ${index + 1}:`,
            value,
            typeof value
          );
          if (typeof value !== 'number' || value <= 0) {
            errors.push(`Trigger value ${index + 1} must be a positive number`);
          }
        });
      }

      console.log(
        'GTT Validation: Checking last price:',
        condition.last_price,
        typeof condition.last_price
      );
      if (
        typeof condition.last_price !== 'number' ||
        condition.last_price <= 0
      ) {
        errors.push('Last price must be a positive number');
      }
    }

    // Validate orders
    if (!gttRequest.orders || !Array.isArray(gttRequest.orders)) {
      errors.push('Orders must be an array');
    } else {
      if (gttRequest.type === 'single' && gttRequest.orders.length !== 1) {
        errors.push('Single GTT must have exactly 1 order');
      }
      if (gttRequest.type === 'two-leg' && gttRequest.orders.length !== 2) {
        errors.push('Two-leg GTT must have exactly 2 orders');
      }

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

    console.log('GTT Validation: Errors found:', errors);
    if (errors.length > 0) {
      console.error('GTT Validation: Validation failed with errors:', errors);
      throw {
        success: false,
        message: 'GTT validation failed',
        errors: errors.map((error) => ({
          msg: error,
          param: 'request',
          location: 'body',
        })),
        timestamp: new Date().toISOString(),
        requestId: `gtt_validation_${Date.now()}`,
      } as GTTError;
    }
    console.log('GTT Validation: All validations passed!');
  }

  // Helper method to create a stop-loss GTT
  createStopLossGTT(
    instrument: any,
    formData: any,
    calculations: any
  ): PlaceGTTRequest {
    const currentPrice = formData.entryPrice;
    const stopLossPrice = formData.stopLoss;

    return {
      type: 'single',
      condition: {
        exchange: (instrument.exchange || 'NSE') as ExchangeType,
        tradingsymbol: instrument.tradingsymbol,
        trigger_values: [stopLossPrice],
        last_price: currentPrice, // Current market price
      },
      orders: [
        {
          exchange: (instrument.exchange || 'NSE') as ExchangeType,
          tradingsymbol: instrument.tradingsymbol,
          transaction_type: 'SELL', // Stop loss is always a sell order for long positions
          quantity: Math.floor(calculations?.positionSize || 1),
          order_type: 'LIMIT', // Limit order for stop loss
          product: 'CNC' as ProductType,
          price: stopLossPrice, // Stop loss price as limit price
        },
      ],
    };
  }

  // Helper method to create a bracket order (entry + stop loss + target)
  createBracketGTT(
    instrument: any,
    formData: any,
    calculations: any,
    targetPrice: number
  ): PlaceGTTRequest {
    const currentPrice = formData.entryPrice;
    const stopLossPrice = formData.stopLoss;

    return {
      type: 'two-leg',
      condition: {
        exchange: (instrument.exchange || 'NSE') as ExchangeType,
        tradingsymbol: instrument.tradingsymbol,
        trigger_values: [stopLossPrice, targetPrice],
        last_price: currentPrice, // Current market price
      },
      orders: [
        {
          // Stop Loss Order
          exchange: (instrument.exchange || 'NSE') as ExchangeType,
          tradingsymbol: instrument.tradingsymbol,
          transaction_type: 'SELL',
          quantity: Math.floor(calculations?.positionSize || 1),
          order_type: 'LIMIT',
          product: 'CNC' as ProductType,
          price: stopLossPrice, // Stop loss price as limit price
        },
        {
          // Target Order
          exchange: (instrument.exchange || 'NSE') as ExchangeType,
          tradingsymbol: instrument.tradingsymbol,
          transaction_type: 'SELL',
          quantity: Math.floor(calculations?.positionSize || 1),
          order_type: 'LIMIT',
          product: 'CNC' as ProductType,
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
}

// Create singleton instance
export const gttService = new GTTService();
export default gttService;
