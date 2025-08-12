import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { positionsService } from '../../services/positionsService';
import { gttService } from '../../services/gttService';
import { riskCalculationService, type PositionWithRisk } from '../../services/riskCalculationService';
import { useSettings } from '../../contexts/SettingsContext';
import type { Position } from '../../services/positionsService';
import type { GTTTrigger } from '../../services/gttService';

interface ActivePositionsTableProps {
  refreshInterval?: number; // in milliseconds, default 30000 (30s)
}

const ActivePositionsTable: React.FC<ActivePositionsTableProps> = ({ 
  refreshInterval = 30000
}) => {
  const { settings } = useSettings();
  const [positions, setPositions] = useState<Position[]>([]);
  const [gttTriggers, setGttTriggers] = useState<GTTTrigger[]>([]);
  const [positionsWithRisk, setPositionsWithRisk] = useState<PositionWithRisk[]>([]);
  const [totalRisk, setTotalRisk] = useState<number>(0);
  const [totalPortfolioRiskPercent, setTotalPortfolioRiskPercent] = useState<string>('-');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [animationTriggered, setAnimationTriggered] = useState<boolean>(false);

  const tradingCapital = settings.accountBalance || 100000; // Default to 1L if not set


  // Fetch positions data
  const fetchPositions = async () => {
    try {
      console.log('🔄 Fetching positions...');
      const response = await positionsService.getPositions('kite');
      console.log('✅ Positions API response:', response);
      console.log('📊 Response data structure:', response.data);
      console.log('📊 Net positions sample:', response.data?.net?.[0]);
      console.log('📊 Day positions sample:', response.data?.day?.[0]);
      return response.data?.net || []; // Return net positions only
    } catch (err: any) {
      console.error('❌ Error fetching positions:', err);
      throw new Error(positionsService.getErrorMessage(err));
    }
  };

  // Fetch GTT data
  const fetchGTTs = async () => {
    try {
      console.log('🔄 Fetching GTTs...');
      const response = await gttService.getAllGTT();
      console.log('✅ GTT API response:', response);
      console.log('📊 GTT data structure:', response.data);
      console.log('📊 GTT count:', response.data?.length || 0);
      console.log('📊 First GTT sample:', response.data?.[0]);
      return response.data || [];
    } catch (err: any) {
      console.error('❌ Error fetching GTTs:', err);
      console.log('❌ GTT error details:', err);
      throw new Error(gttService.getErrorMessage(err));
    }
  };

  // Load and calculate data
  const loadData = async () => {
    try {
      setError(null);
      
      // Fetch positions and GTTs in parallel
      const [positionsData, gttData] = await Promise.all([
        fetchPositions().catch(err => {
          console.warn('Failed to fetch positions, falling back to empty:', err);
          return []; // Return empty array on error
        }),
        fetchGTTs().catch(err => {
          console.warn('Failed to fetch GTTs, falling back to empty:', err);
          return []; // Return empty array on error
        })
      ]);

      setPositions(positionsData);
      setGttTriggers(gttData);

      console.log('📊 Raw positions data received:', positionsData);
      console.log('📊 First position raw data:', positionsData[0]);

      // Filter positions - keep all with valid symbols, including closed positions
      // This allows us to show closed positions in a grayed-out style like the broker
      const validPositions = positionsData.filter((pos, index) => {
        if (!pos || !pos.tradingsymbol) {
          console.log(`❌ Position ${index} has no symbol:`, pos);
          return false;
        }
        
        const qty = Math.abs(pos.quantity || 0);
        const avgPrice = pos.averagePrice || pos.buyPrice || pos.sellPrice || pos.lastPrice || 0;
        
        console.log(`🔍 Position ${pos.tradingsymbol}:`, {
          quantity: pos.quantity,
          averagePrice: pos.averagePrice,
          buyPrice: pos.buyPrice,
          sellPrice: pos.sellPrice,
          lastPrice: pos.lastPrice,
          value: pos.value,
          dayBuyQuantity: pos.day_buy_quantity || pos.dayBuyQuantity,
          daySellQuantity: pos.day_sell_quantity || pos.daySellQuantity,
          calculatedQty: qty,
          calculatedAvgPrice: avgPrice,
          allFields: Object.keys(pos),
          isClosed: qty === 0
        });
        
        // Include all positions with valid symbols, even closed ones (qty = 0)
        console.log(`✅ Including position ${pos.tradingsymbol}: qty=${qty}, ${qty === 0 ? 'CLOSED' : 'ACTIVE'}`);
        return true; // Keep all positions with valid symbols
      });

      console.log(`📊 Filtered positions: ${positionsData.length} -> ${validPositions.length}`);
      
      // Calculate risk metrics with safe defaults
      const riskResults = riskCalculationService.calculatePositionRisks(
        validPositions,
        gttData,
        tradingCapital || 100000, // Fallback capital
        { fullCoverTreatedAsZero: false } // Use safe mode by default
      );

      setPositionsWithRisk(riskResults.positionsWithRisk || []);
      setTotalRisk(riskResults.totalRisk || 0);
      setTotalPortfolioRiskPercent(riskResults.totalPortfolioRiskPercent || '-');
      setLastUpdated(new Date());
      
      console.log('✅ Data loaded successfully:', {
        positions: positionsData.length,
        gtts: gttData.length,
        risksCalculated: riskResults.positionsWithRisk.length,
        samplePosition: positionsData[0],
        sampleRisk: riskResults.positionsWithRisk[0],
        tradingCapital,
        // Show all GTT symbols to help debug matching
        allGTTSymbols: gttData.map((gtt: any) => ({
          symbol: gtt.condition?.tradingsymbol || gtt.condition?.trading_symbol,
          token: gtt.condition?.instrument_token,
          status: gtt.status
        }))
      });
    } catch (err: any) {
      console.error('Error in loadData:', err);
      setError(err.message || 'Failed to load position data');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    setLoading(true);
    await loadData();
  };

  // Initial load and auto-refresh
  useEffect(() => {
    loadData();
    
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, tradingCapital]);

  // Trigger animations after data loads
  useEffect(() => {
    if (positionsWithRisk.length > 0) {
      const timer = setTimeout(() => {
        setAnimationTriggered(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [positionsWithRisk]);

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return riskCalculationService.formatCurrency(amount);
  };

  // Get risk level styling
  const getRiskStyling = (riskPercent: string) => {
    if (riskPercent === '-') return 'text-slate-400';
    
    const risk = parseFloat(riskPercent.replace('%', ''));
    if (risk === 0) return 'text-emerald-400';
    if (risk < 2) return 'text-yellow-400';
    if (risk < 5) return 'text-orange-400';
    return 'text-red-400';
  };


  if (error) {
    return (
      <div className="backdrop-blur-xl rounded-xl border border-slate-700/30 overflow-hidden bg-slate-900/20 p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Positions</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl rounded-xl border border-slate-700/30 overflow-hidden bg-slate-900/20">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900/20 border-b border-slate-700/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-4 h-4 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">All Positions</h2>
            <span className="text-xs text-slate-500">
              ({positionsWithRisk.filter(p => {
                const posData = positions.find(pos => (pos.tradingsymbol || pos.trading_symbol) === p.symbol);
                const dayBuyQty = (posData?.day_buy_quantity || posData?.dayBuyQuantity || 0);
                const daySellQty = Math.abs(posData?.day_sell_quantity || posData?.daySellQuantity || 0);
                const isClosed = Math.abs(p.qty) === 0 || (dayBuyQty === 0 && daySellQty === Math.abs(p.qty) && p.qty < 0);
                return !isClosed;
              }).length} active, {positionsWithRisk.length} total)
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Last updated */}
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded hover:bg-slate-600/50 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-4 py-3 bg-slate-900/10 border-b border-slate-700/20">
        <div
          className="grid gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider"
          style={{
            gridTemplateColumns: '1.4fr 0.6fr 0.8fr 1fr 1.2fr 1fr 1fr 0.8fr 0.8fr',
          }}
        >
          <div>Symbol</div>
          <div className="text-center">Qty</div>
          <div className="text-right">LTP</div>
          <div className="text-right">P&L</div>
          <div className="text-right">Position Value</div>
          <div className="text-center">SLs (qty@price)</div>
          <div className="text-center">Open Risk</div>
          <div className="text-center">Position %</div>
          <div className="text-center">PF Risk %</div>
        </div>
      </div>

      {/* Loading state */}
      {loading && positionsWithRisk.length === 0 && (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading positions...</p>
        </div>
      )}

      {/* No positions state */}
      {!loading && positionsWithRisk.length === 0 && (
        <div className="p-8 text-center">
          <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No Open Positions</h3>
          <p className="text-slate-500 mb-2">You currently have no active positions</p>
          <p className="text-xs text-slate-600">
            Positions with valid quantities and prices will appear here when available
          </p>
        </div>
      )}

      {/* Positions Table */}
      {positionsWithRisk.length > 0 && (
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-600/30 hover:scrollbar-thumb-slate-500/50">
          <div className="divide-y divide-slate-700/20">
            {positionsWithRisk
              .sort((a, b) => {
                // Sort: Active positions first, then closed positions
                const aData = positions.find(pos => (pos.tradingsymbol || pos.trading_symbol) === a.symbol);
                const aDayBuyQty = (aData?.day_buy_quantity || aData?.dayBuyQuantity || 0);
                const aDaySellQty = Math.abs(aData?.day_sell_quantity || aData?.daySellQuantity || 0);
                const aIsClosed = Math.abs(a.qty) === 0 || (aDayBuyQty === 0 && aDaySellQty === Math.abs(a.qty) && a.qty < 0);
                
                const bData = positions.find(pos => (pos.tradingsymbol || pos.trading_symbol) === b.symbol);
                const bDayBuyQty = (bData?.day_buy_quantity || bData?.dayBuyQuantity || 0);
                const bDaySellQty = Math.abs(bData?.day_sell_quantity || bData?.daySellQuantity || 0);
                const bIsClosed = Math.abs(b.qty) === 0 || (bDayBuyQty === 0 && bDaySellQty === Math.abs(b.qty) && b.qty < 0);
                
                // Active positions (false) come before closed positions (true)
                if (aIsClosed !== bIsClosed) {
                  return aIsClosed ? 1 : -1;
                }
                
                // Within same category, sort by symbol name
                return a.symbol.localeCompare(b.symbol);
              })
              .map((position, index) => {
              // A position is closed if:
              // 1. Quantity is 0, OR 
              // 2. It's a complete exit from holdings (day_buy_quantity = 0 and day_sell_quantity matches absolute quantity)
              const posData = positions.find(p => (p.tradingsymbol || p.trading_symbol) === position.symbol);
              const dayBuyQty = (posData?.day_buy_quantity || posData?.dayBuyQuantity || 0);
              const daySellQty = Math.abs(posData?.day_sell_quantity || posData?.daySellQuantity || 0);
              
              const isCompleteExit = dayBuyQty === 0 && daySellQty === Math.abs(position.qty) && position.qty < 0;
              const isClosed = Math.abs(position.qty) === 0 || isCompleteExit;
              
              if (isCompleteExit) {
                console.log(`🔍 Detected complete exit for ${position.symbol}:`, {
                  quantity: position.qty,
                  dayBuyQty,
                  daySellQty,
                  isCompleteExit,
                  reasoning: 'No day buy + day sell matches absolute qty + negative position = complete exit from holdings'
                });
              }
              
              return (
                <div
                  key={`${position.symbol}-${index}`}
                  className={`
                    px-4 py-4 transition-all duration-300 hover:bg-slate-800/10
                    ${
                      animationTriggered
                        ? 'opacity-100 transform translate-y-0'
                        : 'opacity-0 transform translate-y-4'
                    }
                    ${isClosed ? 'opacity-50' : ''}
                  `}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div
                    className="grid gap-4 items-center text-sm"
                    style={{
                      gridTemplateColumns: '1.4fr 0.6fr 0.8fr 1fr 1.2fr 1fr 1fr 0.8fr 0.8fr',
                    }}
                  >
                    {/* Symbol */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isClosed 
                            ? 'bg-slate-500' 
                            : position.qty > 0 
                              ? 'bg-emerald-400' 
                              : 'bg-red-400'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold text-base truncate ${
                          isClosed ? 'text-slate-400' : 'text-white'
                        }`}>
                          {position.symbol}
                        </div>
                        <div className={`text-xs font-medium ${
                          isClosed ? 'text-slate-500' : 'text-slate-300'
                        }`}>
                          ₹{position.avgPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="text-center">
                      <div className={`font-semibold text-base ${
                        isClosed ? 'text-slate-500' : 'text-white'
                      }`}>
                        {Math.abs(position.qty)}
                      </div>
                      <div className={`text-xs ${
                        isClosed ? 'text-slate-600' : position.qty > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {isClosed ? '' : position.qty > 0 ? 'LONG' : 'SHORT'}
                      </div>
                    </div>

                    {/* LTP (Latest Price) */}
                    <div className="text-right">
                      <span className={`font-semibold ${
                        isClosed ? 'text-slate-500' : 'text-slate-200'
                      }`}>
                        ₹{(position.lastPrice || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* P&L */}
                    <div className="text-right">
                      <span className={`font-semibold ${
                        isClosed 
                          ? 'text-slate-500'
                          : position.pnl > 0 
                            ? 'text-emerald-400' 
                            : position.pnl < 0 
                              ? 'text-red-400' 
                              : 'text-slate-400'
                      }`}>
                        {position.pnl > 0 ? '+' : ''}{formatCurrency(Math.abs(position.pnl))}
                      </span>
                    </div>

                    {/* Position Value */}
                    <div className="text-right">
                      <span className={`font-semibold ${
                        isClosed ? 'text-slate-500' : 'text-white'
                      }`}>
                        {formatCurrency(position.positionValue)}
                      </span>
                    </div>

                    {/* SLs */}
                    <div className="text-center">
                      <span className={`text-sm font-medium ${
                        isClosed 
                          ? 'text-slate-600'
                          : position.slList === '-' 
                            ? 'text-slate-500' 
                            : 'text-emerald-400'
                      }`}>
                        {isClosed ? '-' : position.slList}
                      </span>
                    </div>

                    {/* Combined Open Risk (₹ + %) */}
                    <div className="text-center">
                      <div className={`${
                        isClosed ? 'text-slate-500' : getRiskStyling(position.riskPercentOfPos)
                      }`}>
                        <div className="text-sm font-semibold">
                          {isClosed ? '₹0' : formatCurrency(position.totalRiskValue)}
                        </div>
                        <div className={`text-xs font-medium opacity-80 ${
                          isClosed ? 'text-slate-600' : getRiskStyling(position.riskPercentOfPos)
                        }`}>
                          {isClosed ? '0%' : position.riskPercentOfPos}
                        </div>
                      </div>
                    </div>

                    {/* Position Size % */}
                    <div className="text-center">
                      <span className={`text-sm font-semibold ${
                        isClosed ? 'text-slate-500' : 'text-orange-400'
                      }`}>
                        {isClosed ? '0%' : position.posSizePercent}
                      </span>
                    </div>

                    {/* PF Risk % */}
                    <div className="text-center">
                      <span className={`text-sm font-semibold ${
                        isClosed ? 'text-slate-500' : getRiskStyling(position.pfRiskPercent)
                      }`}>
                        {isClosed ? '0%' : position.pfRiskPercent}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer with totals */}
      {positionsWithRisk.length > 0 && (
        <div className="px-4 py-3 bg-slate-900/10 border-t border-slate-700/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-slate-400">
              {(() => {
                const activePositions = positionsWithRisk.filter(p => {
                  const posData = positions.find(pos => (pos.tradingsymbol || pos.trading_symbol) === p.symbol);
                  const dayBuyQty = (posData?.day_buy_quantity || posData?.dayBuyQuantity || 0);
                  const daySellQty = Math.abs(posData?.day_sell_quantity || posData?.daySellQuantity || 0);
                  const isClosed = Math.abs(p.qty) === 0 || (dayBuyQty === 0 && daySellQty === Math.abs(p.qty) && p.qty < 0);
                  return !isClosed;
                });
                const closedPositions = positionsWithRisk.length - activePositions.length;
                
                return (
                  <>
                    <span>{activePositions.length} active</span>
                    {closedPositions > 0 && (
                      <>
                        <span>•</span>
                        <span>{closedPositions} closed</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Capital: {formatCurrency(tradingCapital)}</span>
                  </>
                );
              })()}
            </div>
            <div className="flex items-center space-x-6">
              {(() => {
                // Calculate risk only from active positions
                const activePositions = positionsWithRisk.filter(p => {
                  const posData = positions.find(pos => (pos.tradingsymbol || pos.trading_symbol) === p.symbol);
                  const dayBuyQty = (posData?.day_buy_quantity || posData?.dayBuyQuantity || 0);
                  const daySellQty = Math.abs(posData?.day_sell_quantity || posData?.daySellQuantity || 0);
                  const isClosed = Math.abs(p.qty) === 0 || (dayBuyQty === 0 && daySellQty === Math.abs(p.qty) && p.qty < 0);
                  return !isClosed;
                });
                
                const activeRisk = activePositions.reduce((sum, p) => sum + (p.totalRiskValue || 0), 0);
                const activeRiskPercent = tradingCapital ? ((activeRisk / tradingCapital) * 100).toFixed(2) + "%" : "-";
                
                return (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 text-xs">Active Risk:</span>
                      <span className={`font-bold ${getRiskStyling(activeRiskPercent)}`}>
                        {formatCurrency(activeRisk)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 text-xs">Portfolio Risk:</span>
                      <span className={`font-bold ${getRiskStyling(activeRiskPercent)}`}>
                        {activeRiskPercent}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivePositionsTable;