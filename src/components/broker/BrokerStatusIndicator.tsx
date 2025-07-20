import React, { useState } from 'react';
import { ExternalLink, CheckCircle, Plus, Wifi } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BrokerConnectionModal from './BrokerConnectionModal';

interface BrokerStatusIndicatorProps {
  className?: string;
}

const BrokerStatusIndicator: React.FC<BrokerStatusIndicatorProps> = ({ 
  className = '' 
}) => {
  const { userProfile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const connectedBrokers = userProfile?.connectedBrokers || [];
  const hasConnectedBrokers = connectedBrokers.length > 0;

  const getBrokerDisplayName = (brokerId: string) => {
    const names = {
      kite: 'Kite',
      groww: 'Groww',
      angelone: 'Angel One'
    };
    return names[brokerId as keyof typeof names] || brokerId;
  };

  const getBrokerIcon = (brokerId: string) => {
    const icons = {
      kite: '🛡️',
      groww: '📈',
      angelone: '👼'
    };
    return icons[brokerId as keyof typeof icons] || '📊';
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {hasConnectedBrokers ? (
          // Connected state - show broker info
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-1">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-emerald-300">
                {connectedBrokers.length === 1 
                  ? getBrokerDisplayName(connectedBrokers[0].broker)
                  : `${connectedBrokers.length} Brokers`
                }
              </div>
              <div className="text-xs text-emerald-400/80">
                Connected
              </div>
            </div>
            
            {/* Show connected broker icons */}
            <div className="flex -space-x-1">
              {connectedBrokers.slice(0, 3).map((broker, index) => (
                <div
                  key={broker._id}
                  className="w-6 h-6 bg-slate-800 border-2 border-emerald-500/30 rounded-full flex items-center justify-center text-xs"
                  style={{ zIndex: 10 - index }}
                >
                  {getBrokerIcon(broker.broker)}
                </div>
              ))}
              {connectedBrokers.length > 3 && (
                <div className="w-6 h-6 bg-slate-700 border-2 border-emerald-500/30 rounded-full flex items-center justify-center text-xs text-slate-300">
                  +{connectedBrokers.length - 3}
                </div>
              )}
            </div>
            
            <ExternalLink className="w-3 h-3 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
          </button>
        ) : (
          // Disconnected state - show connect button
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all duration-200 group"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-purple-300">
                Connect Broker
              </div>
              <div className="text-xs text-purple-400/80">
                Link trading account
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-purple-400/60 group-hover:text-purple-400 transition-colors" />
          </button>
        )}

        {/* Connection Status Dot */}
        <div className="absolute -top-1 -right-1">
          <div className={`w-3 h-3 rounded-full border-2 border-slate-900 ${
            hasConnectedBrokers 
              ? 'bg-emerald-400 animate-pulse' 
              : 'bg-slate-500'
          }`} />
        </div>
      </div>

      {/* Broker Connection Modal */}
      <BrokerConnectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default BrokerStatusIndicator;