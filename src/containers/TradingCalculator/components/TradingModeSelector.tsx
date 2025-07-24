import React from 'react';
import { TrendingUp, PieChart } from 'lucide-react';
import type { TabType } from '../types';

interface TradingModeSelectorProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  updateActiveTab: (tab: TabType) => void;
}

const TradingModeSelector: React.FC<TradingModeSelectorProps> = ({
  activeTab,
  setActiveTab,
  updateActiveTab,
}) => {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4 p-3 bg-black/20 rounded-2xl backdrop-blur-sm border border-purple-500/20">
        {/* Risk Mode Tile */}
        <button
          onClick={() => {
            setActiveTab('risk');
            updateActiveTab('risk');
          }}
          className={`group relative p-3 text-sm font-bold rounded-xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden ${
            activeTab === 'risk'
              ? 'border-red-400 bg-red-500/10 shadow-lg shadow-red-500/30 text-red-300 transform scale-105'
              : 'border-purple-500/30 bg-black/30 text-purple-300 hover:border-red-400/50 hover:bg-red-500/5 hover:text-red-300'
          }`}
        >
          {/* Animated background */}
          <div className="absolute inset-0 opacity-20">
            <div
              className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                activeTab === 'risk'
                  ? 'from-red-600/40 via-pink-600/40 to-orange-600/40 animate-pulse'
                  : 'from-transparent to-transparent'
              }`}
            ></div>
          </div>

          <div className="relative z-10 flex flex-col items-center space-y-2">
            {/* Icon with glow effect */}
            <div className="relative transition-all duration-300 group-hover:scale-110">
              <TrendingUp
                className={`w-6 h-6 transition-colors duration-300 ${
                  activeTab === 'risk'
                    ? 'text-red-400'
                    : 'text-purple-400 group-hover:text-red-400'
                }`}
              />
            </div>
            {/* Title */}
            <div className="text-center">
              <div className="font-bold text-sm mb-1">RISK MODE</div>
              <div className="text-xs opacity-75">High Stakes</div>
            </div>
          </div>
          {/* Achievement indicator */}
          {activeTab === 'risk' && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse">
              <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping opacity-30"></div>
            </div>
          )}
          {/* Shimmer effect */}
          {activeTab === 'risk' && (
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          )}
        </button>

        {/* Allocation Mode Tile */}
        <button
          onClick={() => {
            setActiveTab('allocation');
            updateActiveTab('allocation');
          }}
          className={`group relative p-3 text-sm font-bold rounded-xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden ${
            activeTab === 'allocation'
              ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/30 text-blue-300 transform scale-105'
              : 'border-purple-500/30 bg-black/30 text-purple-300 hover:border-blue-400/50 hover:bg-blue-500/5 hover:text-blue-300'
          }`}
        >
          {/* Animated background */}
          <div className="absolute inset-0 opacity-20">
            <div
              className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                activeTab === 'allocation'
                  ? 'from-blue-600/40 via-cyan-600/40 to-purple-600/40 animate-pulse'
                  : 'from-transparent to-transparent'
              }`}
            ></div>
          </div>

          <div className="relative z-10 flex flex-col items-center space-y-2">
            {/* Icon with glow effect */}
            <div className="relative transition-all duration-300 group-hover:scale-110">
              <PieChart
                className={`w-6 h-6 transition-colors duration-300 ${
                  activeTab === 'allocation'
                    ? 'text-blue-400'
                    : 'text-purple-400 group-hover:text-blue-400'
                }`}
              />
            </div>
            {/* Title */}
            <div className="text-center">
              <div className="font-bold text-sm mb-1">ALLOCATION MODE</div>
              <div className="text-xs opacity-75">Strategic</div>
            </div>
          </div>
          {/* Achievement indicator */}
          {activeTab === 'allocation' && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse">
              <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-ping opacity-30"></div>
            </div>
          )}
          {/* Shimmer effect */}
          {activeTab === 'allocation' && (
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default TradingModeSelector;