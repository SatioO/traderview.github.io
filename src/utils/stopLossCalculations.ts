/**
 * Stop Loss Calculation Utilities
 * Professional-grade stop loss calculations with market microstructure awareness
 */

export interface StopLossCalculationResult {
  stopPrice: number;
  isValid: boolean;
  warnings: string[];
}

/**
 * Get tick size for Indian equity markets
 * Based on NSE/BSE tick size rules
 */
export const getTickSize = (price: number): number => {
  if (price <= 0) return 0.01;
  
  // Indian equity tick sizes
  if (price >= 20) return 0.05;
  if (price >= 10) return 0.02;
  return 0.01;
};

/**
 * Calculate precise stop loss price with market microstructure awareness
 */
export const calculatePreciseStopLoss = (
  entryPrice: number, 
  percentage: number
): StopLossCalculationResult => {
  const warnings: string[] = [];
  
  if (entryPrice <= 0 || percentage <= 0) {
    return {
      stopPrice: 0,
      isValid: false,
      warnings: ['Invalid entry price or percentage']
    };
  }

  // Basic calculation
  const rawStopPrice = entryPrice * (1 - percentage / 100);
  
  // Adjust to proper tick size
  const tickSize = getTickSize(entryPrice);
  const adjustedStopPrice = Math.floor(rawStopPrice / tickSize) * tickSize;
  
  // Validate against circuit limits (5% lower circuit for most Indian equities)
  const maxDecline = entryPrice * 0.05; // 5% circuit limit
  const circuitLimitPrice = entryPrice - maxDecline;
  
  let finalStopPrice = adjustedStopPrice;
  
  // Check if stop loss is too close to circuit limit
  if (adjustedStopPrice <= circuitLimitPrice) {
    finalStopPrice = circuitLimitPrice;
    warnings.push('⚠️ Stop loss adjusted to circuit limit. Gap risk possible.');
  }
  
  // Check for very tight stops (less than 2x average spread)
  const estimatedSpread = entryPrice * 0.001; // Rough estimate: 0.1% spread
  if ((entryPrice - finalStopPrice) < (estimatedSpread * 2)) {
    warnings.push('💧 Very tight stop loss - high slippage risk');
  }
  
  // Check for very wide stops
  if (percentage > 8) {
    warnings.push('🔥 High risk stop loss - consider reducing position size');
  }

  return {
    stopPrice: finalStopPrice,
    isValid: true,
    warnings
  };
};

/**
 * Basic stop loss calculation (legacy compatibility)
 */
export const calculateStopLossPrice = (entryPrice: number, percentage: number): number => {
  const result = calculatePreciseStopLoss(entryPrice, percentage);
  return result.stopPrice;
};

/**
 * Validate stop loss inputs
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateStopLossInputs = (
  entryPrice: number, 
  percentage: number
): ValidationResult => {
  const errors: string[] = [];
  
  if (entryPrice <= 0) {
    errors.push('Entry price must be greater than 0');
  }
  
  if (percentage <= 0) {
    errors.push('Stop loss percentage must be greater than 0');
  }
  
  if (percentage >= 100) {
    errors.push('Stop loss percentage must be less than 100%');
  }
  
  if (percentage > 20) {
    errors.push('Stop loss percentage seems unusually high');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};