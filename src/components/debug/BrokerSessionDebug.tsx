import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const BrokerSessionDebug: React.FC = () => {
  const { hasActiveBrokerSession, testBrokerSession, refreshBrokerSession, isLoading } = useSettings();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 border border-purple-400/40 rounded-lg p-4 backdrop-blur-sm">
      <div className="text-white text-sm space-y-2">
        <div className="font-bold text-purple-300">🔍 Broker Session Debug</div>
        
        <div className="space-y-1">
          <div>Status: <span className={hasActiveBrokerSession ? 'text-green-400' : 'text-red-400'}>
            {hasActiveBrokerSession ? '✅ Active' : '❌ Inactive'}
          </span></div>
          <div>Loading: <span className={isLoading ? 'text-yellow-400' : 'text-gray-400'}>
            {isLoading ? '⏳ Yes' : '✅ No'}
          </span></div>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={testBrokerSession}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs transition-colors"
          >
            Test API
          </button>
          <button
            onClick={refreshBrokerSession}
            className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrokerSessionDebug;