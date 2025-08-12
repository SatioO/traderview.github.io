import React, { useState, useEffect } from 'react';
import { TrendingUp, PieChart, Shield, Layers, Wallet } from 'lucide-react';
import ActivePositionsTable from './ActivePositionsTable';

// Static portfolio data matching the reference image
const staticPortfolioData = {
  totalInvested: 245000,
  openRisk: 0,
  totalPortfolioValue: 285420,
  dayChange: 12450,
  dayChangePercent: 4.56,
  positions: [
    {
      ticker: 'CARERATING',
      status: 'Open' as const,
      daysHeld: 23,
      tradeManagement: 'SL > BE' as const,
      openRisk: 0,
      sizePercent: 8.7,
      group: 'Capital Markets',
      location: 'Pivot' as const,
      pnlPercent: 17.76,
      currentPrice: 1245.8,
      entryPrice: 1057.5,
      quantity: 18,
    },
    {
      ticker: 'SHARDACROP',
      status: 'Open' as const,
      daysHeld: 15,
      tradeManagement: 'SL > BE' as const,
      openRisk: 0,
      sizePercent: 7.0,
      group: 'Chemicals (FPAC)',
      location: 'ITB' as const,
      pnlPercent: 16.42,
      currentPrice: 892.3,
      entryPrice: 766.8,
      quantity: 22,
    },
    {
      ticker: 'ASTRAZEN',
      status: 'Open' as const,
      daysHeld: 10,
      tradeManagement: 'SL > BE' as const,
      openRisk: 0,
      sizePercent: 8.8,
      group: 'Pharma',
      location: 'Pivot' as const,
      pnlPercent: 17.75,
      currentPrice: 2156.9,
      entryPrice: 1831.2,
      quantity: 12,
    },
  ],
};

const PortfolioSnapshot: React.FC = () => {
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const { totalInvested, openRisk, totalPortfolioValue } = staticPortfolioData;

  const totalPnL = totalPortfolioValue - totalInvested;
  const portfolioInvestedPercent = Math.round(
    (totalInvested / totalPortfolioValue) * 100
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationTriggered(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Clean Portfolio Header - No Duplication */}
      <div className="flex items-center justify-between mb-6">
        {/* Left: Simple Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-lg flex items-center justify-center border border-purple-400/30">
            <Layers className="w-4 h-4 text-purple-300" />
          </div>
          <h1 className="text-xl font-bold text-white">Portfolio Overview</h1>
        </div>

        {/* Right: Market Status & Connection Only */}
        <div className="flex items-center space-x-6">
          {/* Market Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-emerald-400">
              NSE OPEN
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date().toLocaleTimeString()}
            </span>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
            <span>Live Data</span>
          </div>
        </div>
      </div>

      {/* Beautiful Portfolio Stats Grid - Smaller but detailed */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Portfolio Value - Enhanced Design */}
        <div className="group relative overflow-hidden rounded-3xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          {/* Unified Purple Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-purple-400/8 to-violet-500/12 opacity-70"></div>

          {/* Premium Border System */}
          <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/45 group-hover:border-cyan-300/75 transition-all duration-500"></div>
          <div className="absolute inset-0 rounded-3xl border border-blue-400/35 group-hover:shadow-2xl group-hover:shadow-cyan-500/35 transition-all duration-500"></div>

          {/* Content Layer */}
          <div className="relative z-10 p-5">
            {/* Header: Icon + Badge + Title | Value */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/20 to-blue-500/30 rounded-lg flex items-center justify-center backdrop-blur-sm border border-cyan-400/40">
                  <Wallet className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <div className="text-xs font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent tracking-wider">
                    PORTFOLIO VALUE
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">
                  {formatCurrency(totalPortfolioValue)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-300 transition-all duration-2000 relative"
                  style={{
                    width: animationTriggered ? '85%' : '0%',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between text-xs">
              <span className="text-cyan-300/70">Portfolio Health</span>
              <span className="text-cyan-300 font-medium">Excellent</span>
            </div>
          </div>
        </div>

        {/* Total P&L - Enhanced Design */}
        <div className="group relative overflow-hidden rounded-3xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          {/* Unified Purple Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-purple-400/8 to-violet-500/12 opacity-70"></div>

          {/* Premium Border System */}
          <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400/45 group-hover:border-emerald-300/75 transition-all duration-500"></div>
          <div className="absolute inset-0 rounded-3xl border border-green-400/35 group-hover:shadow-2xl group-hover:shadow-emerald-500/35 transition-all duration-500"></div>

          {/* Content Layer */}
          <div className="relative z-10 p-5">
            {/* Header: Icon + Badge + Title | Value */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/20 to-green-500/30 rounded-lg flex items-center justify-center backdrop-blur-sm border border-emerald-400/40">
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <div className="text-xs font-bold bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent tracking-wider">
                    TOTAL P&L
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-400">
                  {formatCurrency(totalPnL)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 transition-all duration-2000 relative"
                  style={{
                    width: animationTriggered
                      ? `${Math.min(
                          (totalPnL / totalInvested) * 100 * 5,
                          100
                        )}%`
                      : '0%',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between text-xs">
              <span className="text-emerald-300/70">Performance</span>
              <span className="text-emerald-300 font-medium">Excellent</span>
            </div>
          </div>
        </div>

        {/* Open Risk - Enhanced Design */}
        <div className="group relative overflow-hidden rounded-3xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          {/* Unified Purple Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-purple-400/8 to-violet-500/12 opacity-70"></div>

          {/* Premium Border System */}
          <div className="absolute inset-0 rounded-3xl border-2 border-amber-400/45 group-hover:border-amber-300/75 transition-all duration-500"></div>
          <div className="absolute inset-0 rounded-3xl border border-orange-400/35 group-hover:shadow-2xl group-hover:shadow-amber-500/35 transition-all duration-500"></div>

          {/* Content Layer */}
          <div className="relative z-10 p-5">
            {/* Header: Icon + Badge + Title | Value */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400/20 to-orange-500/25 rounded-lg flex items-center justify-center backdrop-blur-sm border border-amber-400/40">
                  <Shield className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-xs font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent tracking-wider">
                    OPEN RISK
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">
                  {openRisk}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 w-full transition-all duration-2000 relative"
                  style={{
                    width: animationTriggered
                      ? `${portfolioInvestedPercent}%`
                      : '0%',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between text-xs">
              <span className="text-amber-300/70">Risk Level</span>
              <span className="text-emerald-300 font-medium">Minimal</span>
            </div>
          </div>
        </div>

        {/* % Invested - Enhanced Design */}
        <div className="group relative overflow-hidden rounded-3xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          {/* Unified Purple Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-purple-400/8 to-violet-500/12 opacity-70"></div>

          {/* Premium Border System */}
          <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/45 group-hover:border-purple-300/75 transition-all duration-500"></div>
          <div className="absolute inset-0 rounded-3xl border border-violet-500/35 group-hover:shadow-2xl group-hover:shadow-purple-500/35 transition-all duration-500"></div>

          {/* Content Layer */}
          <div className="relative z-10 p-5">
            {/* Header: Icon + Badge + Title | Value */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400/20 to-violet-500/30 rounded-lg flex items-center justify-center backdrop-blur-sm border border-purple-400/40">
                  <PieChart className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <div className="text-xs font-bold bg-gradient-to-r from-purple-300 to-violet-300 bg-clip-text text-transparent tracking-wider">
                    % INVESTED
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-purple-400">
                  {portfolioInvestedPercent}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-violet-400 to-purple-300 transition-all duration-2000 relative"
                  style={{
                    width: animationTriggered
                      ? `${portfolioInvestedPercent}%`
                      : '0%',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between text-xs">
              <span className="text-purple-300/70">
                Deployed: {formatCurrency(totalInvested)}
              </span>
              <span className="text-slate-400/70">
                Available: {formatCurrency(totalPortfolioValue - totalInvested)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Positions with Risk Management */}
      <ActivePositionsTable refreshInterval={60000} />
    </div>
  );
};

export default PortfolioSnapshot;
