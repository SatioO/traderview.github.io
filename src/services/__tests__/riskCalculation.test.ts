import { riskCalculationService } from '../riskCalculationService';
import type { Position } from '../positionsService';
import type { GTTTrigger } from '../gttService';

// Mock data for testing
const mockPositions: Position[] = [
  {
    tradingsymbol: "XYZ",
    exchange: "NSE",
    instrument_token: "111",
    product: "CNC",
    quantity: 10,
    overnightQuantity: 10,
    multiplier: 1,
    averagePrice: 105,
    closePrice: 110,
    lastPrice: 108,
    value: 1080,
    pnl: 30,
    m2m: 30,
    unrealised: 30,
    realised: 0,
    buyQuantity: 10,
    buyPrice: 105,
    buyValue: 1050,
    buyM2m: 30,
    sellQuantity: 0,
    sellPrice: 0,
    sellValue: 0,
    sellM2m: 0,
    dayBuyQuantity: 10,
    dayBuyPrice: 105,
    dayBuyValue: 1050,
    daySellQuantity: 0,
    daySellPrice: 0,
    daySellValue: 0
  },
  {
    tradingsymbol: "ABC",
    exchange: "NSE",
    instrument_token: "222",
    product: "CNC",
    quantity: 5,
    overnightQuantity: 5,
    multiplier: 1,
    averagePrice: 200,
    closePrice: 210,
    lastPrice: 205,
    value: 1025,
    pnl: 25,
    m2m: 25,
    unrealised: 25,
    realised: 0,
    buyQuantity: 5,
    buyPrice: 200,
    buyValue: 1000,
    buyM2m: 25,
    sellQuantity: 0,
    sellPrice: 0,
    sellValue: 0,
    sellM2m: 0,
    dayBuyQuantity: 5,
    dayBuyPrice: 200,
    dayBuyValue: 1000,
    daySellQuantity: 0,
    daySellPrice: 0,
    daySellValue: 0
  }
];

const mockGTTs: GTTTrigger[] = [
  {
    trigger_id: 1,
    type: 'single',
    status: 'active',
    condition: {
      exchange: "NSE",
      tradingsymbol: "XYZ",
      instrument_token: "111",
      trigger_values: [95],
      last_price: 108
    },
    orders: [
      {
        exchange: "NSE",
        tradingsymbol: "XYZ",
        transaction_type: "SELL",
        quantity: 5,
        order_type: "LIMIT",
        product: "CNC",
        price: 95
      }
    ],
    created_at: "2024-01-20T10:30:00.000Z",
    updated_at: "2024-01-20T10:30:00.000Z"
  },
  {
    trigger_id: 2,
    type: 'single',
    status: 'active',
    condition: {
      exchange: "NSE",
      tradingsymbol: "ABC",
      instrument_token: "222",
      trigger_values: [190],
      last_price: 205
    },
    orders: [
      {
        exchange: "NSE",
        tradingsymbol: "ABC",
        transaction_type: "SELL",
        quantity: 5,
        order_type: "LIMIT",
        product: "CNC",
        price: 190
      }
    ],
    created_at: "2024-01-20T10:30:00.000Z",
    updated_at: "2024-01-20T10:30:00.000Z"
  }
];

describe('RiskCalculationService', () => {
  const tradingCapital = 100000;

  test('should calculate position risks correctly', () => {
    const result = riskCalculationService.calculatePositionRisks(
      mockPositions,
      mockGTTs,
      tradingCapital
    );

    expect(result.positionsWithRisk).toHaveLength(2);
    
    // XYZ position: 10 shares at ₹105 avg, 5 shares protected at ₹95 SL
    const xyzPosition = result.positionsWithRisk[0];
    expect(xyzPosition.symbol).toBe('XYZ');
    expect(xyzPosition.qty).toBe(10);
    expect(xyzPosition.avgPrice).toBe(105);
    expect(xyzPosition.positionValue).toBe(1050); // 10 * 105
    expect(xyzPosition.slList).toBe('5@95');
    expect(xyzPosition.unprotectedQty).toBe(5); // 10 - 5 protected
    expect(xyzPosition.totalRiskValue).toBe(575); // (105-95)*5 + 105*5 = 50 + 525
    
    // ABC position: 5 shares at ₹200 avg, all 5 shares protected at ₹190 SL
    const abcPosition = result.positionsWithRisk[1];
    expect(abcPosition.symbol).toBe('ABC');
    expect(abcPosition.qty).toBe(5);
    expect(abcPosition.avgPrice).toBe(200);
    expect(abcPosition.positionValue).toBe(1000); // 5 * 200
    expect(abcPosition.slList).toBe('5@190');
    expect(abcPosition.unprotectedQty).toBe(0); // Fully protected
    expect(abcPosition.totalRiskValue).toBe(50); // (200-190)*5 = 50
    
    // Total risk should be sum of individual risks
    expect(result.totalRisk).toBe(625); // 575 + 50
  });

  test('should handle positions without GTTs', () => {
    const result = riskCalculationService.calculatePositionRisks(
      mockPositions,
      [], // No GTTs
      tradingCapital
    );

    expect(result.positionsWithRisk).toHaveLength(2);
    
    // Without GTTs, all positions should be fully at risk
    const xyzPosition = result.positionsWithRisk[0];
    expect(xyzPosition.slList).toBe('-');
    expect(xyzPosition.unprotectedQty).toBe(10);
    expect(xyzPosition.totalRiskValue).toBe(1050); // Full position value
    expect(xyzPosition.riskPercentOfPos).toBe('100.00%');
    
    const abcPosition = result.positionsWithRisk[1];
    expect(abcPosition.slList).toBe('-');
    expect(abcPosition.unprotectedQty).toBe(5);
    expect(abcPosition.totalRiskValue).toBe(1000); // Full position value
    expect(abcPosition.riskPercentOfPos).toBe('100.00%');
  });

  test('should handle full cover treated as zero risk mode', () => {
    const fullCoverGTT: GTTTrigger[] = [
      {
        trigger_id: 1,
        type: 'single',
        status: 'active',
        condition: {
          exchange: "NSE",
          tradingsymbol: "XYZ",
          instrument_token: "111",
          trigger_values: [95],
          last_price: 108
        },
        orders: [
          {
            exchange: "NSE",
            tradingsymbol: "XYZ",
            transaction_type: "SELL",
            quantity: 10, // Covers full position
            order_type: "LIMIT",
            product: "CNC",
            price: 95
          }
        ],
        created_at: "2024-01-20T10:30:00.000Z",
        updated_at: "2024-01-20T10:30:00.000Z"
      }
    ];

    const result = riskCalculationService.calculatePositionRisks(
      [mockPositions[0]], // Only XYZ position
      fullCoverGTT,
      tradingCapital,
      { fullCoverTreatedAsZero: true } // Enable user-requested mode
    );

    const xyzPosition = result.positionsWithRisk[0];
    expect(xyzPosition.slList).toBe('10@95');
    expect(xyzPosition.unprotectedQty).toBe(0);
    expect(xyzPosition.totalRiskValue).toBe(0); // Zero risk in this mode
    expect(xyzPosition.riskPercentOfPos).toBe('0.00%');
  });

  test('should format currency correctly', () => {
    expect(riskCalculationService.formatCurrency(1234)).toBe('₹1,234');
    expect(riskCalculationService.formatCurrency(12345)).toBe('₹12.3K');
    expect(riskCalculationService.formatCurrency(123456)).toBe('₹1.2L');
    expect(riskCalculationService.formatCurrency(1234567)).toBe('₹12.3L');
  });

  test('should calculate portfolio risk percentage correctly', () => {
    const result = riskCalculationService.calculatePositionRisks(
      mockPositions,
      mockGTTs,
      tradingCapital
    );

    // Total risk 625 out of 100000 capital = 0.625%
    expect(result.totalPortfolioRiskPercent).toBe('0.63%');
  });
});

export {};