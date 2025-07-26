import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  PieChart,
  Target,
  Shield,
  Clock,
  ArrowUp,
  Layers,
  Globe,
  Wallet,
  Sparkles,
} from 'lucide-react';

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
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number>(-1);
  const { totalInvested, openRisk, totalPortfolioValue, positions } =
    staticPortfolioData;

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

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).closest('.positions-table')) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setFocusedRowIndex((prev) =>
              Math.min(prev + 1, positions.length - 1)
            );
            break;
          case 'ArrowUp':
            e.preventDefault();
            setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            setSelectedRowIndex(focusedRowIndex);
            break;
          case 'Escape':
            e.preventDefault();
            setFocusedRowIndex(-1);
            setSelectedRowIndex(-1);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedRowIndex, positions.length]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const getLocationBadge = (location: string) => {
    if (location === 'Pivot') {
      return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30 text-yellow-300';
    }
    return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-300';
  };

  return (
    <div className="space-y-8">
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

      {/* Active Positions - Transparent Glass Design */}
      <div className="backdrop-blur-xl rounded-2xl border border-slate-700/30 overflow-hidden relative">
        {/* Clean Header */}
        <div className="px-6 py-4 bg-slate-900/20 border-b border-slate-700/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-800/40 rounded-xl border border-slate-600/30">
                <Layers className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Active Positions
                </h2>
                <p className="text-slate-400 text-sm">
                  {positions.length} open positions
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full">
              <span className="text-sm font-semibold text-emerald-300">
                All Protected
              </span>
            </div>
          </div>
        </div>

        {/* Optimized Table Header with Perfect Column Widths */}
        <div className="px-6 py-3 bg-slate-900/10 border-b border-slate-700/20">
          <div
            className="grid gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"
            style={{
              gridTemplateColumns: '2fr 1fr 1fr 1.2fr 0.8fr 1.2fr 1.5fr 1.5fr',
            }}
          >
            <div className="flex items-center space-x-2">
              <Activity className="w-3 h-3" />
              <span>Ticker</span>
            </div>
            <div>Status</div>
            <div>Days</div>
            <div>Trade Mgt</div>
            <div className="text-center">Risk</div>
            <div className="text-center">Size %</div>
            <div>Group</div>
            <div className="text-right">P&L %</div>
          </div>
        </div>

        {/* Keyboard Navigation Help */}
        {focusedRowIndex >= 0 && (
          <div className="absolute top-2 right-2 z-10 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-lg px-3 py-2 text-xs text-slate-300 pointer-events-none animate-fade-in">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Exit</span>
            </div>
          </div>
        )}

        {/* Enhanced Scrollable Container with Keyboard Navigation */}
        <div
          className="positions-table max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-600/30 hover:scrollbar-thumb-slate-500/50 focus-within:scrollbar-thumb-slate-500/70 relative"
          tabIndex={0}
          role="grid"
          aria-label="Active positions table - Use arrow keys to navigate, Enter to select, Escape to exit"
          onFocus={() => setFocusedRowIndex(0)}
          onBlur={() => setFocusedRowIndex(-1)}
        >
          <div className="divide-y divide-slate-700/20">
            {positions.map((position, index) => {
              const isSelected = selectedRowIndex === index;
              const isFocused = focusedRowIndex === index;
              const isHovered = hoveredRowIndex === index;

              return (
                <div
                  key={`${position.ticker}-${index}`}
                  className={`
                    px-6 py-4 transition-all duration-300 cursor-pointer relative
                    ${
                      animationTriggered
                        ? 'opacity-100 transform translate-y-0'
                        : 'opacity-0 transform translate-y-4'
                    }
                    ${
                      isSelected
                        ? 'bg-cyan-500/10 border-l-2 border-cyan-500'
                        : ''
                    }
                    ${
                      isFocused
                        ? 'bg-slate-800/20 ring-2 ring-cyan-500/50 ring-inset'
                        : ''
                    }
                    ${isHovered ? 'bg-slate-800/15' : ''}
                    hover:bg-slate-800/15 focus:outline-none
                  `}
                  style={{ transitionDelay: `${600 + index * 200}ms` }}
                  tabIndex={0}
                  role="row"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHoveredRowIndex(index)}
                  onMouseLeave={() => setHoveredRowIndex(-1)}
                  onClick={() => setSelectedRowIndex(index)}
                  onFocus={() => setFocusedRowIndex(index)}
                >
                  {/* Focus indicator */}
                  {isFocused && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-500 opacity-80"></div>
                  )}

                  <div
                    className="grid gap-4 items-center"
                    style={{
                      gridTemplateColumns:
                        '2fr 1fr 1fr 1.2fr 0.8fr 1.2fr 1.5fr 1.5fr',
                    }}
                  >
                    {/* Enhanced Ticker with Tooltip */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          position.status === 'Open'
                            ? 'bg-cyan-400 animate-pulse'
                            : 'bg-slate-500'
                        }`}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-bold text-white text-sm truncate cursor-help"
                          title={position.ticker}
                        >
                          {position.ticker}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          ₹{position.currentPrice?.toFixed(2) || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Compact Status with Animation */}
                    <div>
                      <div
                        className={`
                          inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
                          ${
                            position.status === 'Open'
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          }
                        `}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                            position.status === 'Open'
                              ? 'bg-emerald-400'
                              : 'bg-red-400'
                          }`}
                        ></div>
                        <span>{position.status}</span>
                      </div>
                    </div>

                    {/* Compact Days Held */}
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-300 font-medium text-sm whitespace-nowrap">
                        {position.daysHeld}d
                      </span>
                    </div>

                    {/* Enhanced Trade Management */}
                    <div>
                      <div
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-500/15 rounded-full text-xs font-medium text-emerald-400 hover:bg-emerald-500/25 transition-colors duration-200 cursor-help"
                        title="Stop Loss moved to Breakeven"
                      >
                        <Shield className="w-3 h-3" />
                        <span className="truncate">
                          {position.tradeManagement}
                        </span>
                      </div>
                    </div>

                    {/* Centered Open Risk */}
                    <div className="text-center">
                      <div className="text-sm font-semibold text-slate-300">
                        {position.openRisk}%
                      </div>
                    </div>

                    {/* Enhanced Size % with Better Progress Bar */}
                    <div className="text-center">
                      <div className="text-sm font-bold text-orange-400 mb-1">
                        {position.sizePercent}%
                      </div>
                      <div className="w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-400 h-full rounded-full transition-all duration-1000 relative"
                          style={{
                            width: animationTriggered
                              ? `${Math.min(position.sizePercent * 10, 100)}%`
                              : '0%',
                            transitionDelay: `${800 + index * 200}ms`,
                          }}
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Group with Better Layout */}
                    <div className="min-w-0">
                      <div
                        className="text-xs font-medium text-slate-300 mb-1 truncate cursor-help"
                        title={position.group}
                      >
                        {position.group}
                      </div>
                      <div
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${getLocationBadge(
                          position.location
                        )} hover:opacity-80`}
                      >
                        <Target className="w-2 h-2 flex-shrink-0" />
                        <span className="truncate">{position.location}</span>
                      </div>
                    </div>

                    {/* Enhanced P&L with Better Typography */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-400 flex items-center justify-end space-x-1 mb-1">
                        <ArrowUp className="w-4 h-4 flex-shrink-0" />
                        <span className="tabular-nums">
                          {position.pnlPercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-xs text-emerald-300 font-mono">
                        +
                        {formatCurrency(
                          ((position.currentPrice || 0) -
                            (position.entryPrice || 0)) *
                            (position.quantity || 0)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clean Footer */}
        <div className="px-6 py-4 bg-slate-900/10 border-t border-slate-700/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-medium text-sm">
                  Portfolio Health: Excellent
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300 font-medium text-sm">
                  {positions.length} Active Positions
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">
                Total Unrealized P&L
              </div>
              <div className="text-xl font-bold text-emerald-400">
                +{formatCurrency(totalPnL)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSnapshot;
