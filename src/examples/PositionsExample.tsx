import React from 'react';
import ActivePositionsTable from '../components/Portfolio/ActivePositionsTable';

/**
 * Example usage of the new ActivePositionsTable component
 * 
 * This component demonstrates how to integrate the positions table
 * with real-time risk calculations and GTT monitoring.
 */
const PositionsExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Active Positions Risk Management
          </h1>
          <p className="text-slate-400">
            Real-time position monitoring with integrated stop-loss analysis and risk calculations
          </p>
        </div>

        <div className="space-y-6">
          {/* Main Active Positions Table */}
          <ActivePositionsTable 
            refreshInterval={30000} // Refresh every 30 seconds
          />

          {/* Feature Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="backdrop-blur-xl rounded-xl border border-slate-700/30 bg-slate-900/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Risk Calculation</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>• Matches GTTs with positions by instrument token</li>
                <li>• Calculates monetary loss based on SL prices</li>
                <li>• Handles multiple GTTs per position</li>
                <li>• Identifies unprotected quantity</li>
                <li>• Supports both long and short positions</li>
              </ul>
            </div>

            <div className="backdrop-blur-xl rounded-xl border border-slate-700/30 bg-slate-900/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Real-time Data</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>• Live position data from broker API</li>
                <li>• Current GTT status monitoring</li>
                <li>• Automatic refresh every 30 seconds</li>
                <li>• Manual refresh capability</li>
                <li>• Error handling and retry logic</li>
              </ul>
            </div>

            <div className="backdrop-blur-xl rounded-xl border border-slate-700/30 bg-slate-900/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Portfolio Metrics</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>• Position size as % of capital</li>
                <li>• Risk as % of position value</li>
                <li>• Risk as % of total portfolio</li>
                <li>• Protection status indicators</li>
                <li>• Total portfolio risk summary</li>
              </ul>
            </div>
          </div>

          {/* Column Explanation */}
          <div className="backdrop-blur-xl rounded-xl border border-slate-700/30 bg-slate-900/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Column Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-slate-200 mb-2">Basic Position Data</h4>
                <ul className="text-slate-300 space-y-1">
                  <li><strong>Symbol:</strong> Trading symbol with LONG/SHORT indicator</li>
                  <li><strong>Qty:</strong> Absolute quantity held</li>
                  <li><strong>Avg Price:</strong> Average purchase/sale price</li>
                  <li><strong>Position Value:</strong> Total position value (qty × avg price)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-200 mb-2">Risk Management Data</h4>
                <ul className="text-slate-300 space-y-1">
                  <li><strong>SLs (qty@price):</strong> Stop loss coverage breakdown</li>
                  <li><strong>Unprotected Qty:</strong> Quantity without stop loss protection</li>
                  <li><strong>Open Risk (₹):</strong> Maximum potential monetary loss</li>
                  <li><strong>Open Risk % (pos):</strong> Risk as percentage of position value</li>
                  <li><strong>Position Size %:</strong> Position size as percentage of capital</li>
                  <li><strong>PF Risk %:</strong> Risk as percentage of total portfolio</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Test Scenarios */}
          <div className="backdrop-blur-xl rounded-xl border border-slate-700/30 bg-slate-900/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Test Scenarios Covered</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-emerald-400 mb-2">✅ Fully Protected</h4>
                <p className="text-slate-300">Position with GTT covering entire quantity</p>
              </div>
              <div>
                <h4 className="font-medium text-yellow-400 mb-2">⚠️ Partially Protected</h4>
                <p className="text-slate-300">Multiple GTTs covering part of position</p>
              </div>
              <div>
                <h4 className="font-medium text-red-400 mb-2">❌ Unprotected</h4>
                <p className="text-slate-300">Position without any stop loss protection</p>
              </div>
              <div>
                <h4 className="font-medium text-blue-400 mb-2">📊 Multiple SLs</h4>
                <p className="text-slate-300">Several GTTs at different price levels</p>
              </div>
              <div>
                <h4 className="font-medium text-purple-400 mb-2">🔄 Short Positions</h4>
                <p className="text-slate-300">Risk calculation for short positions</p>
              </div>
              <div>
                <h4 className="font-medium text-orange-400 mb-2">🚫 Wrong Side GTTs</h4>
                <p className="text-slate-300">GTTs ignored if wrong direction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionsExample;