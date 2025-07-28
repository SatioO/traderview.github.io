import React, { useState } from 'react';
import TradingOrderForm from './TradingOrderForm';
import GTTManagement from './GTTManagement';

interface EnhancedTradingPanelProps {
  className?: string;
  calculatedPositionSize?: number;
  entryPrice?: number;
  stopLossPrice?: number;
  onOrderPlaced?: (orderId: string) => void;
  onOrderError?: (error: string) => void;
}

type TabType = 'orders' | 'gtt';

const EnhancedTradingPanel: React.FC<EnhancedTradingPanelProps> = ({
  className = '',
  calculatedPositionSize,
  entryPrice,
  stopLossPrice,
  onOrderPlaced,
  onOrderError,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');

  const tabs = [
    {
      id: 'orders' as TabType,
      label: 'Place Order',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      id: 'gtt' as TabType,
      label: 'GTT Orders',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl border border-violet-400/20 backdrop-blur-sm ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-violet-400/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-white bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border-b-2 border-violet-400'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'orders' && (
          <TradingOrderForm
            calculatedPositionSize={calculatedPositionSize}
            entryPrice={entryPrice}
            stopLossPrice={stopLossPrice}
            onOrderPlaced={onOrderPlaced}
            onOrderError={onOrderError}
          />
        )}

        {activeTab === 'gtt' && (
          <GTTManagement />
        )}
      </div>

      {/* Info Footer */}
      <div className="px-6 py-3 border-t border-violet-400/10 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Auto GTT Integration</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Real-time Updates</span>
            </div>
          </div>
          <div className="text-slate-500">
            {activeTab === 'orders' 
              ? 'Orders with stop loss automatically create GTT triggers'
              : 'Manage your Good Till Triggered orders'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTradingPanel;