import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTrading } from '../../contexts/TradingContext';
import { brokerApiService } from '../../services/brokerApiService';
import TradingOrderForm from './TradingOrderForm';

interface TradingPanelProps {
  className?: string;
  // Integration with trading calculator
  calculatedPositionSize?: number;
  entryPrice?: number;
  stopLossPrice?: number;
  targetPrice?: number;
  riskAmount?: number;
  accountBalance?: number;
  // Callbacks
  onOrderPlaced?: (orderId: string) => void;
  onOrderError?: (error: string) => void;
}

const TradingPanel: React.FC<TradingPanelProps> = ({
  className = '',
  calculatedPositionSize = 0,
  entryPrice,
  stopLossPrice,
  targetPrice,
  riskAmount,
  accountBalance,
  onOrderPlaced,
  onOrderError,
}) => {
  const { state } = useTrading();
  const [showPanel, setShowPanel] = useState(false);

  // Check if user has an active broker session
  const { data: activeSession, isLoading: isCheckingSession } = useQuery({
    queryKey: ['broker', 'active-session'],
    queryFn: () => brokerApiService.getActiveSession(),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  const hasActiveSession = activeSession?.hasActiveSession;

  // Show/hide panel based on session status
  useEffect(() => {
    setShowPanel(hasActiveSession && calculatedPositionSize > 0);
  }, [hasActiveSession, calculatedPositionSize]);

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <div className={`${className}`}>
        <div className="p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl border border-violet-400/20 backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-4 h-4 border-2 border-violet-400/40 border-t-violet-400 rounded-full animate-spin"></div>
            <span className="text-violet-200 text-sm font-medium">
              Checking broker session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Don't show if no active session
  if (!hasActiveSession) {
    return null;
  }

  // Don't show if no calculated position size
  if (calculatedPositionSize <= 0) {
    return (
      <div className={`${className}`}>
        <div className="p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl border border-slate-600/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-slate-300 mb-2">
              Ready to Trade
            </h4>
            <p className="text-slate-400 text-sm">
              Calculate your position size first to enable order placement
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-blue-950/80 rounded-2xl border border-violet-400/30 backdrop-blur-md shadow-2xl shadow-violet-500/10">
        {/* Header with Trading Status */}
        <div className="p-4 border-b border-violet-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/40">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-violet-200 via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                  Live Trading
                </h3>
                <p className="text-xs text-slate-400">
                  Connected to broker • Ready to place orders
                </p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs font-medium">Live</span>
              </div>
              
              {state.selectedInstrument && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-300 text-xs font-medium">
                    {state.selectedInstrument.tradingsymbol}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trading Calculation Summary */}
        <div className="p-4 border-b border-violet-400/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg border border-slate-600/30">
              <div className="text-xs text-slate-400 mb-1">Position Size</div>
              <div className="font-semibold text-white text-sm">
                ₹{calculatedPositionSize.toLocaleString()}
              </div>
            </div>
            
            {entryPrice && (
              <div className="p-3 bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg border border-slate-600/30">
                <div className="text-xs text-slate-400 mb-1">Entry Price</div>
                <div className="font-semibold text-white text-sm">
                  ₹{entryPrice.toFixed(2)}
                </div>
              </div>
            )}
            
            {stopLossPrice && (
              <div className="p-3 bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-lg border border-red-400/20">
                <div className="text-xs text-red-300 mb-1">Stop Loss</div>
                <div className="font-semibold text-white text-sm">
                  ₹{stopLossPrice.toFixed(2)}
                </div>
              </div>
            )}
            
            {targetPrice && (
              <div className="p-3 bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg border border-green-400/20">
                <div className="text-xs text-green-300 mb-1">Target Price</div>
                <div className="font-semibold text-white text-sm">
                  ₹{targetPrice.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Risk Information */}
          {riskAmount && (
            <div className="mt-3 p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-400/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-amber-300 text-sm font-medium">Risk Amount</span>
                </div>
                <div className="text-white font-semibold">
                  ₹{riskAmount.toLocaleString()}
                </div>
              </div>
              
              {accountBalance && (
                <div className="mt-2 text-xs text-amber-200">
                  {((riskAmount / accountBalance) * 100).toFixed(1)}% of portfolio at risk
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trading Order Form */}
        <div className="p-4">
          <TradingOrderForm
            calculatedPositionSize={calculatedPositionSize}
            entryPrice={entryPrice}
            stopLossPrice={stopLossPrice}
            onOrderPlaced={onOrderPlaced}
            onOrderError={onOrderError}
          />
        </div>

        {/* Risk Disclaimer */}
        <div className="px-4 pb-4">
          <div className="p-3 bg-slate-800/30 border border-slate-600/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Risk Disclaimer:</strong> Trading in securities involves risk of loss. 
                Past performance is not indicative of future results. Please ensure you understand the risks before placing trades.
                Only invest what you can afford to lose.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingPanel;