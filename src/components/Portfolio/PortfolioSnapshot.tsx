import React from 'react';
import { TrendingUp, PieChart, Shield, Layers, Wallet, BarChart3, Target, Activity } from 'lucide-react';
import ActivePositionsTable from './ActivePositionsTable';
import { usePortfolioMetrics } from '../../hooks/usePortfolioMetrics';

const PortfolioSnapshot: React.FC = () => {
  const { metrics, loading, error } = usePortfolioMetrics(60000);

  const formatCurrency = (amount: number): string => {
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (Math.abs(amount) >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${Math.round(amount).toLocaleString()}`;
  };

  const formatPnL = (amount: number): string => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${formatCurrency(amount)}`;
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

      {/* Comprehensive Trading Metrics - 7 Key Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        {/* Total Trades */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 rounded-2xl border border-cyan-400/30 group-hover:border-cyan-300/50 transition-all duration-500"></div>
          
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400/20 to-blue-500/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="text-xl font-bold text-white">
                {loading ? '...' : metrics.totalTrades}
              </div>
            </div>
            <div className="text-xs font-semibold text-cyan-300 tracking-wider">TOTAL TRADES</div>
            <div className="text-xs text-slate-400 mt-1">All time</div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 rounded-2xl border border-emerald-400/30 group-hover:border-emerald-300/50 transition-all duration-500"></div>
          
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400/20 to-green-500/30 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-xl font-bold text-emerald-400">
                {loading ? '...' : metrics.openPositions}
              </div>
            </div>
            <div className="text-xs font-semibold text-emerald-300 tracking-wider">OPEN POSITIONS</div>
            <div className="text-xs text-slate-400 mt-1">Currently active</div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 rounded-2xl border border-blue-400/30 group-hover:border-blue-300/50 transition-all duration-500"></div>
          
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400/20 to-cyan-500/30 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-300" />
              </div>
              <div className="text-xl font-bold text-blue-400">
                {loading ? '...' : `${metrics.winRate.toFixed(0)}%`}
              </div>
            </div>
            <div className="text-xs font-semibold text-blue-300 tracking-wider">WIN RATE</div>
            <div className="text-xs text-slate-400 mt-1">Closed trades</div>
          </div>
        </div>

        {/* Realised P&L */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 rounded-2xl border border-green-400/30 group-hover:border-green-300/50 transition-all duration-500"></div>
          
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400/20 to-emerald-500/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-300" />
              </div>
              <div className={`text-xl font-bold ${
                loading ? 'text-slate-400' : 
                metrics.realisedPnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {loading ? '...' : formatPnL(metrics.realisedPnl)}
              </div>
            </div>
            <div className="text-xs font-semibold text-green-300 tracking-wider">REALISED P&L</div>
            <div className="text-xs text-slate-400 mt-1">Closed positions</div>
          </div>
        </div>

        {/* Unrealised P&L */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 rounded-2xl border border-yellow-400/30 group-hover:border-yellow-300/50 transition-all duration-500"></div>
          
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400/20 to-orange-500/30 rounded-lg flex items-center justify-center">
                <PieChart className="w-4 h-4 text-yellow-300" />
              </div>
              <div className={`text-xl font-bold ${
                loading ? 'text-slate-400' : 
                metrics.unrealisedPnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {loading ? '...' : formatPnL(metrics.unrealisedPnl)}
              </div>
            </div>
            <div className="text-xs font-semibold text-yellow-300 tracking-wider">UNREALISED P&L</div>
            <div className="text-xs text-slate-400 mt-1">Open positions</div>
          </div>
        </div>

        {/* Open Heat (Total PF Risk) */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 rounded-2xl border border-orange-400/30 group-hover:border-orange-300/50 transition-all duration-500"></div>
          
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400/20 to-red-500/30 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-orange-300" />
              </div>
              <div className={`text-xl font-bold ${
                loading ? 'text-slate-400' : 
                metrics.openHeat < 2 ? 'text-green-400' : 
                metrics.openHeat < 5 ? 'text-orange-400' : 'text-red-400'
              }`}>
                {loading ? '...' : `${
                  metrics.openHeat < 0.1 
                    ? metrics.openHeat.toFixed(2)
                    : metrics.openHeat.toFixed(1)
                }%`}
              </div>
            </div>
            <div className="text-xs font-semibold text-orange-300 tracking-wider">OPEN HEAT</div>
            <div className="text-xs text-slate-400 mt-1">Portfolio risk</div>
          </div>
        </div>

        {/* % Invested */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-600/15 to-indigo-900/40 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 rounded-2xl border border-purple-400/30 group-hover:border-purple-300/50 transition-all duration-500"></div>
          
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400/20 to-violet-500/30 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-purple-300" />
              </div>
              <div className={`text-xl font-bold ${
                loading ? 'text-slate-400' : 
                metrics.percentInvested > 80 ? 'text-red-400' : 
                metrics.percentInvested > 60 ? 'text-orange-400' : 'text-purple-400'
              }`}>
                {loading ? '...' : `${metrics.percentInvested.toFixed(0)}%`}
              </div>
            </div>
            <div className="text-xs font-semibold text-purple-300 tracking-wider">% INVESTED</div>
            <div className="text-xs text-slate-400 mt-1">Capital deployed</div>
          </div>
        </div>
      </div>

      {/* Active Positions with Risk Management */}
      <ActivePositionsTable refreshInterval={60000} />
    </div>
  );
};

export default PortfolioSnapshot;
