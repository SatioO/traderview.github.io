import React from 'react';
import EnhancedTradingPanel from '../components/trading/EnhancedTradingPanel';

/**
 * Example usage of the GTT-integrated trading system
 * 
 * This example demonstrates how to use the enhanced trading panel that automatically
 * creates GTT (Good Till Triggered) orders when placing orders with stop loss prices.
 * 
 * Features demonstrated:
 * 1. Automatic GTT creation for stop loss orders
 * 2. Enhanced error handling with detailed feedback
 * 3. GTT management interface
 * 4. Real-time status updates
 */

const GTTIntegrationExample: React.FC = () => {
  // Example: Integration with existing trading logic
  const handleOrderPlaced = (orderId: string) => {
    console.log('Order placed successfully:', orderId);
    // Handle order placement success
    // This will now also include GTT creation if stop loss was provided
  };

  const handleOrderError = (error: string) => {
    console.error('Order placement failed:', error);
    // Handle order placement error
    // Error message will include GTT-specific information if applicable
  };

  // Example trading parameters
  const tradingParams = {
    calculatedPositionSize: 10000, // ₹10,000 position size
    entryPrice: 2400, // Entry at ₹2400
    stopLossPrice: 2300, // Stop loss at ₹2300 (will create GTT automatically)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
            GTT-Integrated Trading System
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Place orders with automatic GTT creation for stop loss and target management. 
            Monitor and manage all your GTT triggers in real-time.
          </p>
        </div>

        {/* Enhanced Trading Panel */}
        <EnhancedTradingPanel
          calculatedPositionSize={tradingParams.calculatedPositionSize}
          entryPrice={tradingParams.entryPrice}
          stopLossPrice={tradingParams.stopLossPrice}
          onOrderPlaced={handleOrderPlaced}
          onOrderError={handleOrderError}
          className="max-w-2xl mx-auto"
        />

        {/* Documentation Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl border border-violet-400/20 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-green-400 mb-2">✓ Automatic GTT Creation</h3>
                <p className="text-sm text-slate-300">
                  When you place an order with a stop loss price, the system automatically creates 
                  a GTT trigger to execute the stop loss order when the price condition is met.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-blue-400 mb-2">✓ Enhanced Error Handling</h3>
                <p className="text-sm text-slate-300">
                  Detailed feedback on both order placement and GTT creation status. 
                  If GTT creation fails, you'll be notified while your main order still executes.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-violet-400 mb-2">✓ GTT Management</h3>
                <p className="text-sm text-slate-300">
                  View, monitor, and delete all your active GTT triggers in real-time. 
                  Track trigger conditions and associated orders easily.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-cyan-400 mb-2">✓ Real-time Updates</h3>
                <p className="text-sm text-slate-300">
                  GTT status updates automatically. Monitor trigger conditions, 
                  execution status, and manage your risk effectively.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Integration Notes */}
        <div className="bg-slate-800/30 rounded-lg border border-slate-600/30 p-4">
          <h3 className="font-medium text-slate-200 mb-3">Integration Notes</h3>
          <div className="space-y-2 text-sm text-slate-400">
            <div>• Orders are placed first, then GTT triggers are created automatically</div>
            <div>• GTT creation failure doesn't affect the main order execution</div>
            <div>• All GTT operations use the Kite Connect API endpoints</div>
            <div>• Error handling provides detailed feedback for both operations</div>
            <div>• Real-time status updates keep you informed of all changes</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GTTIntegrationExample;