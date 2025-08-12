import { useState, useEffect } from 'react';
import { positionsService } from '../services/positionsService';
import { gttService } from '../services/gttService';
import { riskCalculationService, type PositionWithRisk } from '../services/riskCalculationService';
import { useSettings } from '../contexts/SettingsContext';

export interface PortfolioMetrics {
  totalTrades: number;
  openPositions: number;
  winRate: number; // percentage
  realisedPnl: number;
  unrealisedPnl: number;
  openHeat: number; // portfolio risk percentage
  percentInvested: number; // percentage
  totalPortfolioValue: number;
  totalRisk: number;
}

export const usePortfolioMetrics = (refreshInterval: number = 60000) => {
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalTrades: 0,
    openPositions: 0,
    winRate: 0,
    realisedPnl: 0,
    unrealisedPnl: 0,
    openHeat: 0,
    percentInvested: 0,
    totalPortfolioValue: 0,
    totalRisk: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const tradingCapital = settings.accountBalance || 500000; // Default 5L

  const calculateMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch positions and GTT data
      const [positionsResponse, gttResponse] = await Promise.all([
        positionsService.getPositions('kite').catch(() => ({ data: { net: [] } })),
        gttService.getAllGTT().catch(() => ({ data: [] }))
      ]);

      const positionsData = positionsResponse.data?.net || [];
      const gttData = gttResponse.data || [];

      // Filter valid positions
      const validPositions = positionsData.filter((pos: any) => 
        pos && pos.tradingsymbol
      );

      // Calculate risk metrics
      const riskResults = riskCalculationService.calculatePositionRisks(
        validPositions,
        gttData,
        tradingCapital,
        { fullCoverTreatedAsZero: false }
      );

      const positionsWithRisk = riskResults.positionsWithRisk || [];

      // Helper function to determine if position is closed
      const isPositionClosed = (position: any) => {
        const posData = validPositions.find((pos: any) => 
          (pos.tradingsymbol || pos.trading_symbol) === position.symbol
        );
        const dayBuyQty = (posData?.day_buy_quantity || posData?.dayBuyQuantity || 0);
        const daySellQty = Math.abs(posData?.day_sell_quantity || posData?.daySellQuantity || 0);
        return Math.abs(position.qty) === 0 || (dayBuyQty === 0 && daySellQty === Math.abs(position.qty) && position.qty < 0);
      };

      // Separate open and closed positions
      const openPositionsData = positionsWithRisk.filter(p => !isPositionClosed(p));
      const closedPositions = positionsWithRisk.filter(p => isPositionClosed(p));

      // 1. TOTAL TRADES: Count of all positions that have been entered (including closed)
      const totalTrades = positionsWithRisk.length;

      // 2. OPEN POSITIONS: Count of currently active positions
      const openPositionsCount = openPositionsData.length;

      // 3. WIN RATE: Percentage of profitable closed positions (trading performance)
      const profitableClosedPositions = closedPositions.filter(p => (p.pnl || 0) > 0).length;
      const winRate = closedPositions.length > 0 ? (profitableClosedPositions / closedPositions.length) * 100 : 0;

      // 4. REALISED P&L: Total profit/loss from closed positions (booked gains/losses)
      const realisedPnl = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);

      // 5. UNREALISED P&L: Current profit/loss from open positions (mark-to-market)
      const unrealisedPnl = openPositionsData.reduce((sum, p) => sum + (p.pnl || 0), 0);

      // 6. OPEN HEAT (Portfolio Risk): Sum of individual position risks as % of total capital
      // This shows the maximum amount you could lose if all stop losses are hit
      const totalActiveRisk = openPositionsData.reduce((sum, p) => sum + (p.totalRiskValue || 0), 0);
      
      // Fallback: Use the risk calculation service's total if individual positions don't have risk
      const fallbackTotalRisk = riskResults.totalRisk || 0;
      const actualTotalRisk = totalActiveRisk > 0 ? totalActiveRisk : fallbackTotalRisk;
      
      const openHeat = tradingCapital > 0 ? (actualTotalRisk / tradingCapital) * 100 : 0;
      
      console.log('🔥 Open Heat Calculation Debug:', {
        openPositionsCount: openPositionsData.length,
        totalActiveRisk,
        fallbackTotalRisk,
        actualTotalRisk,
        tradingCapital,
        openHeat: openHeat.toFixed(3),
        individualRisks: openPositionsData.map(p => ({
          symbol: p.symbol,
          risk: p.totalRiskValue || 0,
          pfRisk: p.pfRiskPercent
        }))
      });

      // 7. % INVESTED: Percentage of capital currently deployed in positions
      // This shows how much of your capital is actively invested
      const totalOpenPositionValue = openPositionsData.reduce((sum, p) => sum + Math.abs(p.positionValue || 0), 0);
      const percentInvested = tradingCapital > 0 ? (totalOpenPositionValue / tradingCapital) * 100 : 0;

      console.log('📊 Portfolio Metrics Debug:', {
        totalTrades,
        openPositionsCount,
        closedPositionsCount: closedPositions.length,
        winRate: winRate.toFixed(1),
        realisedPnl,
        unrealisedPnl,
        totalActiveRisk,
        openHeat: openHeat.toFixed(2),
        totalOpenPositionValue,
        percentInvested: percentInvested.toFixed(1),
        tradingCapital,
        // Individual position risks for debugging
        positionRisks: openPositionsData.map(p => ({
          symbol: p.symbol,
          riskValue: p.totalRiskValue || 0,
          riskPercent: p.pfRiskPercent || '0%',
          positionValue: p.positionValue || 0,
          qty: p.qty,
          avgPrice: p.avgPrice
        })),
        // Additional debugging
        totalPositionsWithRisk: positionsWithRisk.length,
        validPositionsCount: validPositions.length,
        gttDataCount: gttData.length,
        riskCalculationResult: {
          totalRisk: riskResults.totalRisk,
          totalPortfolioRiskPercent: riskResults.totalPortfolioRiskPercent
        }
      });

      setMetrics({
        totalTrades,
        openPositions: openPositionsCount,
        winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
        realisedPnl,
        unrealisedPnl,
        openHeat: Math.round(openHeat * 1000) / 1000, // Portfolio risk as percentage with 3 decimal precision
        percentInvested: Math.round(percentInvested * 100) / 100, // Capital deployment percentage
        totalPortfolioValue: tradingCapital,
        totalRisk: actualTotalRisk, // Absolute risk amount in ₹
      });

    } catch (err: any) {
      console.error('Error calculating portfolio metrics:', err);
      setError(err.message || 'Failed to calculate metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateMetrics();
    
    const interval = setInterval(calculateMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, tradingCapital]);

  return { metrics, loading, error, refresh: calculateMetrics };
};