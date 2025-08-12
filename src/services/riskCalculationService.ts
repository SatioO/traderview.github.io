import type { Position } from './positionsService';
import type { GTTTrigger } from './gttService';

// Configuration options for risk calculation
export interface RiskCalculationOptions {
  // If true: if there exists a single SELL order whose quantity >= position qty, treat risk as 0
  // If false: compute actual loss based on SL price(s) - this is the default safe mode
  fullCoverTreatedAsZero?: boolean;
}

// Position with calculated risk metrics
export interface PositionWithRisk {
  symbol: string;
  qty: number;
  avgPrice: number;
  lastPrice: number;          // Latest trading price (LTP)
  pnl: number;                // Profit & Loss
  multiplier: number;
  positionValue: number;      // ₹
  slList: string;             // strings like "5@95" or "-"
  unprotectedQty: number;
  totalRiskValue: number;     // ₹
  riskPercentOfPos: string;   // string or percent like "2.5%"
  posSizePercent: string;     // string percent like "8.5%"
  pfRiskPercent: string;      // string percent like "1.2%"
}

// Flattened GTT order for easier processing
interface FlattenedGTTOrder {
  tokenKey: string;
  tradingsymbol: string;
  exchange: string;
  gttId: string;
  status: string;
  order: {
    transaction_type: string;
    quantity: number;
    price: number;
  };
}

class RiskCalculationService {
  
  /**
   * Create an empty position with risk structure for error cases
   */
  private createEmptyPositionWithRisk(): PositionWithRisk {
    return {
      symbol: 'ERROR',
      qty: 0,
      avgPrice: 0,
      lastPrice: 0,
      pnl: 0,
      multiplier: 1,
      positionValue: 0,
      slList: "-",
      unprotectedQty: 0,
      totalRiskValue: 0,
      riskPercentOfPos: "-",
      posSizePercent: "-",
      pfRiskPercent: "-"
    };
  }

  /**
   * Generate a normalized key for matching positions with GTTs
   * Uses instrument_token if available, otherwise falls back to symbol+exchange
   */
  private normalizeKey(pos: Position): string {
    if (pos.instrument_token !== undefined && pos.instrument_token !== null && pos.instrument_token !== '') {
      return `T_${pos.instrument_token}`;
    }
    return `S_${pos.tradingsymbol || ''}_${pos.exchange || ''}`;
  }

  /**
   * Flatten GTT data structure for easier processing
   * Returns array of individual orders with their associated GTT metadata
   */
  private flattenGTTOrders(gttList: GTTTrigger[] = []): FlattenedGTTOrder[] {
    console.log('🔄 Flattening GTT orders:', gttList);
    const flattened: FlattenedGTTOrder[] = [];
    
    gttList.forEach((gtt, index) => {
      if (!gtt || !gtt.condition) {
        console.log(`⚠️ GTT ${index} has no condition:`, gtt);
        return;
      }
      
      const token = (gtt.condition as any).instrument_token || (gtt.condition as any).instrumentToken;
      const tradingSymbol = (gtt.condition as any).tradingsymbol || (gtt.condition as any).trading_symbol;
      const exchange = (gtt.condition as any).exchange;
      
      const key = (token && token !== '') 
        ? `T_${token}` 
        : `S_${tradingSymbol || ''}_${exchange || ''}`;
      
      console.log(`🔍 GTT ${index} (${tradingSymbol}):`, {
        originalGTT: gtt,
        generatedKey: key,
        token,
        tradingSymbol,
        exchange,
        orders: gtt.orders,
        condition: gtt.condition
      });
      
      ((gtt.orders as any) || []).forEach((order: any, orderIndex: number) => {
        if (!order) {
          console.log(`⚠️ GTT ${index} order ${orderIndex} is null`);
          return;
        }
        
        const flattenedOrder = {
          tokenKey: key,
          tradingsymbol: tradingSymbol || '',
          exchange: exchange || '',
          gttId: ((gtt as any).trigger_id || (gtt as any).triggerId || 0).toString(),
          status: (gtt as any).status || 'unknown',
          order: {
            transaction_type: order.transaction_type || order.transactionType || 'BUY',
            quantity: order.quantity || 0,
            price: order.price || 0,
          },
        };
        
        console.log(`✅ Flattened GTT order ${index}-${orderIndex}:`, flattenedOrder);
        flattened.push(flattenedOrder);
      });
    });
    
    console.log('📊 Total flattened GTT orders:', flattened.length);
    return flattened;
  }

  /**
   * Calculate risk metrics for a single position
   * Core risk calculation logic with support for multiple GTT orders
   */
  private calcRiskForPosition(
    pos: Position,
    gttFlattened: FlattenedGTTOrder[],
    tradingCapital: number,
    opts: RiskCalculationOptions = {}
  ): PositionWithRisk {
    // Safety checks for position data
    if (!pos) {
      return this.createEmptyPositionWithRisk();
    }

    // Try different possible field names for quantity and price
    const quantity = (pos as any).quantity || (pos as any).qty || 0;
    const averagePrice = (pos as any).averagePrice || (pos as any).average_price || (pos as any).buyPrice || (pos as any).buy_price || 
                        (pos as any).sellPrice || (pos as any).sell_price || 0;
    const lastPrice = (pos as any).lastPrice || (pos as any).last_price || (pos as any).ltp || 0;
    const pnl = (pos as any).pnl || (pos as any).m2m || (pos as any).unrealisedPnl || (pos as any).unrealised || 
                (pos as any).dayPnl || (pos as any).day_pnl || 0;
    
    const result: PositionWithRisk = {
      symbol: (pos as any).tradingsymbol || (pos as any).trading_symbol || 'UNKNOWN',
      qty: quantity,
      avgPrice: averagePrice,
      lastPrice: lastPrice,
      pnl: pnl,
      multiplier: pos.multiplier || 1,
      positionValue: 0,
      slList: "-",
      unprotectedQty: 0,
      totalRiskValue: 0,
      riskPercentOfPos: "-",
      posSizePercent: "-",
      pfRiskPercent: "-"
    };
    
    // Debug log for position data
    console.log(`🔍 Processing position ${result.symbol}:`, {
      originalPos: pos,
      extractedQuantity: quantity,
      extractedAvgPrice: averagePrice,
      extractedLastPrice: lastPrice,
      extractedPnl: pnl,
      processedResult: result
    });

    const key = this.normalizeKey(pos);
    
    // IMPORTANT: Only consider GTT orders with "active" status for risk calculation
    // Triggered, cancelled, expired, etc. GTTs should NOT be included in risk calculations
    
    // Primary matching: by instrument token (ONLY ACTIVE status)
    let matchedOrders = gttFlattened.filter(g => 
      g.tokenKey === key && 
      g.status?.toLowerCase() === "active" &&
      g.status?.toLowerCase() !== "triggered" &&
      g.status?.toLowerCase() !== "cancelled" &&
      g.status?.toLowerCase() !== "expired"
    );

    // Fallback matching: by symbol name if token matching fails (ONLY ACTIVE status)  
    if (matchedOrders.length === 0) {
      matchedOrders = gttFlattened.filter(g => 
        (g.tradingsymbol === result.symbol || g.tradingsymbol?.toUpperCase() === result.symbol?.toUpperCase()) && 
        g.status?.toLowerCase() === "active" &&
        g.status?.toLowerCase() !== "triggered" &&
        g.status?.toLowerCase() !== "cancelled" &&
        g.status?.toLowerCase() !== "expired"
      );
    }

    console.log(`🔍 GTT matching for ${result.symbol}:`, {
      positionKey: key,
      allGTTKeys: gttFlattened.map(g => ({ key: g.tokenKey, symbol: g.tradingsymbol, status: g.status })),
      matchedOrdersCount: matchedOrders.length,
      matchedOrders,
      // Find GTTs that might match by symbol
      symbolMatches: gttFlattened.filter(g => g.tradingsymbol === result.symbol || g.tradingsymbol?.toUpperCase() === result.symbol?.toUpperCase()),
      // Find GTTs with similar keys
      similarKeys: gttFlattened.filter(g => g.tokenKey.includes(key.split('_')[1]) || g.tradingsymbol?.includes(result.symbol)),
      usingFallbackMatching: gttFlattened.filter(g => g.tokenKey === key && g.status?.toLowerCase() === "active").length === 0 && matchedOrders.length > 0,
      // Show status breakdown for debugging
      statusBreakdown: {
        allGTTsForSymbol: gttFlattened.filter(g => g.tradingsymbol === result.symbol || g.tradingsymbol?.toUpperCase() === result.symbol?.toUpperCase()).map(g => ({ status: g.status, price: g.order.price })),
        activeGTTsForSymbol: gttFlattened.filter(g => (g.tradingsymbol === result.symbol || g.tradingsymbol?.toUpperCase() === result.symbol?.toUpperCase()) && g.status?.toLowerCase() === "active").length,
        nonActiveStatuses: gttFlattened.filter(g => g.tradingsymbol === result.symbol || g.tradingsymbol?.toUpperCase() === result.symbol?.toUpperCase()).filter(g => g.status?.toLowerCase() !== "active").map(g => g.status)
      }
    });

    // Filter only SL orders in the correct direction:
    // For LONG (qty > 0) consider SELL orders (to close long)
    // For SHORT (qty < 0) consider BUY orders (to close short)
    const isLong = quantity > 0;
    const posQtyAbs = Math.abs(quantity);

    const filteredOrders = matchedOrders.filter(m => {
      const transactionType = m.order.transaction_type.toUpperCase();
      return isLong ? transactionType === "SELL" : transactionType === "BUY";
    });

    result.positionValue = result.avgPrice * posQtyAbs * result.multiplier;
    result.posSizePercent = tradingCapital 
      ? ((result.positionValue / tradingCapital) * 100).toFixed(2) + "%" 
      : "-";

    // If position has zero quantity or zero average price, skip risk calculations
    if (posQtyAbs === 0 || result.avgPrice === 0) {
      console.warn(`⚠️ Position ${result.symbol} has zero qty (${posQtyAbs}) or zero avg price (${result.avgPrice})`);
      result.slList = "-";
      result.unprotectedQty = 0;
      result.totalRiskValue = 0;
      result.riskPercentOfPos = "-";
      result.pfRiskPercent = "-";
      return result;
    }

    console.log(`💰 Risk calculation for ${result.symbol}:`, {
      avgPrice: result.avgPrice,
      quantity: posQtyAbs,
      isLong: isLong,
      positionValue: result.positionValue
    });

    if (filteredOrders.length === 0) {
      // No relevant SLs
      result.slList = "-";
      result.unprotectedQty = posQtyAbs;
      result.totalRiskValue = result.positionValue; // Full position at risk
      result.riskPercentOfPos = "100.00%";
      result.pfRiskPercent = tradingCapital 
        ? ((result.positionValue / tradingCapital) * 100).toFixed(2) + "%" 
        : "-";
      return result;
    }

    // Build simple order objects for processing
    const orders = filteredOrders.map(m => ({
      qty: m.order.quantity,
      price: m.order.price,
      gttId: m.gttId
    }));

    // Quick full-cover by single order detection (user-requested mode)
    if (opts.fullCoverTreatedAsZero) {
      const anySingleFullCover = orders.some(o => o.qty >= posQtyAbs);
      if (anySingleFullCover) {
        result.slList = orders.map(o => `${o.qty}@${o.price}`).join(", ");
        result.unprotectedQty = 0;
        result.totalRiskValue = 0;
        result.riskPercentOfPos = "0.00%";
        result.pfRiskPercent = tradingCapital 
          ? "0.00%" 
          : "-";
        return result;
      }
    }

    // Allocation strategy: prefer best protection first
    // For LONG positions: prefer higher SL price first (less loss)
    // For SHORT positions: prefer lower SL price first (less loss)
    const sorted = orders.slice().sort((a, b) => {
      return isLong ? (b.price - a.price) : (a.price - b.price);
    });

    let remainingToCover = posQtyAbs;
    let totalRisk = 0;
    const slList: string[] = [];

    for (const order of sorted) {
      if (remainingToCover <= 0) break;
      
      const take = Math.min(order.qty, remainingToCover);
      remainingToCover -= take;
      slList.push(`${take}@${order.price}`);

      // Calculate monetary loss per unit:
      // For long: loss per unit = avgPrice - slPrice (if negative => no loss, treat as 0)
      // For short: loss per unit = slPrice - avgPrice
      let lossPerUnit = isLong 
        ? (result.avgPrice - order.price) 
        : (order.price - result.avgPrice);
      
      if (lossPerUnit < 0) lossPerUnit = 0; // SL better than avg = no loss

      const riskForThisOrder = lossPerUnit * take * result.multiplier;
      totalRisk += riskForThisOrder;
      
      console.log(`💰 Risk calculation detail for ${result.symbol}:`, {
        orderPrice: order.price,
        avgPrice: result.avgPrice,
        lossPerUnit,
        quantity: take,
        multiplier: result.multiplier,
        riskForThisOrder,
        runningTotal: totalRisk,
        calculation: `(${result.avgPrice} - ${order.price}) × ${take} × ${result.multiplier} = ${riskForThisOrder}`
      });
    }

    // Calculate risk for any uncovered quantity (full position value at risk)
    if (remainingToCover > 0) {
      totalRisk += result.avgPrice * remainingToCover * result.multiplier;
    }

    result.unprotectedQty = remainingToCover;
    result.slList = slList.length ? slList.join(", ") : "-";
    result.totalRiskValue = totalRisk;
    result.riskPercentOfPos = result.positionValue 
      ? ((totalRisk / result.positionValue) * 100).toFixed(2) + "%" 
      : "-";
    result.pfRiskPercent = tradingCapital 
      ? ((totalRisk / tradingCapital) * 100).toFixed(2) + "%" 
      : "-";

    return result;
  }

  /**
   * Calculate risk metrics for all positions
   * Main public method that processes positions and GTTs to generate risk table
   */
  calculatePositionRisks(
    positions: Position[],
    gttTriggers: GTTTrigger[],
    tradingCapital: number,
    options: RiskCalculationOptions = {}
  ): {
    positionsWithRisk: PositionWithRisk[];
    totalRisk: number;
    totalPortfolioRiskPercent: string;
  } {
    // Safety checks for input data
    if (!Array.isArray(positions)) {
      console.warn('Positions is not an array:', positions);
      positions = [];
    }
    
    if (!Array.isArray(gttTriggers)) {
      console.warn('GTT triggers is not an array:', gttTriggers);
      gttTriggers = [];
    }

    if (!tradingCapital || typeof tradingCapital !== 'number' || tradingCapital <= 0) {
      console.warn('Invalid trading capital:', tradingCapital);
      tradingCapital = 100000; // Default fallback
    }

    const gttFlattened = this.flattenGTTOrders(gttTriggers);
    const positionsWithRisk: PositionWithRisk[] = [];
    let totalRisk = 0;

    // Process each position
    for (const position of positions) {
      try {
        const positionRisk = this.calcRiskForPosition(
          position,
          gttFlattened,
          tradingCapital,
          options
        );
        positionsWithRisk.push(positionRisk);
        totalRisk += positionRisk.totalRiskValue || 0;
      } catch (error) {
        console.error('Error calculating risk for position:', position, error);
        positionsWithRisk.push(this.createEmptyPositionWithRisk());
      }
    }

    const totalPortfolioRiskPercent = tradingCapital 
      ? ((totalRisk / tradingCapital) * 100).toFixed(2) + "%"
      : "-";

    return {
      positionsWithRisk,
      totalRisk,
      totalPortfolioRiskPercent
    };
  }

  /**
   * Format currency values for display
   */
  formatCurrency(amount: number): string {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${Math.round(amount).toLocaleString()}`;
  }
}

// Create singleton instance
export const riskCalculationService = new RiskCalculationService();
export default riskCalculationService;