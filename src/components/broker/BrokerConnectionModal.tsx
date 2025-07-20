import React, { useEffect } from 'react';
import { X, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface BrokerConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BrokerConnectionModal: React.FC<BrokerConnectionModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { availableBrokers, loginWithBroker, userProfile } = useAuth();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const getConnectionStatus = (brokerId: string) => {
    if (!userProfile?.connectedBrokers) return 'disconnected';
    
    const isConnected = userProfile.connectedBrokers.some(
      broker => broker.broker === brokerId
    );
    
    return isConnected ? 'connected' : 'disconnected';
  };

  const getConnectedBrokerInfo = (brokerId: string) => {
    if (!userProfile?.connectedBrokers) return null;
    
    return userProfile.connectedBrokers.find(
      broker => broker.broker === brokerId
    );
  };

  const handleBrokerConnect = (brokerId: string) => {
    try {
      loginWithBroker(brokerId);
      // Modal will stay open until the redirect happens
    } catch (error) {
      console.error('Failed to initiate broker connection:', error);
    }
  };

  const getBrokerConfig = (brokerId: string) => {
    const configs = {
      kite: {
        name: 'Zerodha Kite',
        description: 'Leading discount brokerage in India',
        logo: '🛡️',
        color: '#FF6D28',
        features: ['Low brokerage', 'Advanced charts', 'Portfolio analytics']
      },
      groww: {
        name: 'Groww',
        description: 'User-friendly investment platform',
        logo: '📈',
        color: '#00C896',
        features: ['Zero AMC', 'Easy interface', 'Mutual funds']
      },
      angelone: {
        name: 'Angel One',
        description: 'Full-service brokerage',
        logo: '👼',
        color: '#3B82F6',
        features: ['Research reports', 'Advisory services', 'Mobile first']
      }
    };
    
    return configs[brokerId as keyof typeof configs] || {
      name: brokerId,
      description: 'Trading platform',
      logo: '📊',
      color: '#6366F1',
      features: ['Trading platform']
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-gradient-to-br from-slate-900/98 via-purple-900/95 to-slate-800/98 backdrop-blur-3xl rounded-2xl border border-purple-400/40 shadow-2xl shadow-purple-500/20 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-600/10 rounded-lg border border-purple-400/30">
                <ExternalLink className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Connect Your Broker</h2>
                <p className="text-sm text-slate-400">
                  Link your trading account to import portfolios and execute trades
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Info Banner */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-300">Secure Connection</h3>
                <p className="text-xs text-blue-200/80 mt-1">
                  Your credentials are securely handled through official broker APIs. TraderView never stores your login details.
                </p>
              </div>
            </div>
          </div>

          {/* Broker List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">
              Available Brokers ({availableBrokers.length})
            </h3>

            <div className="grid gap-4">
              {availableBrokers.map((broker) => {
                const config = getBrokerConfig(broker.name);
                const status = getConnectionStatus(broker.name);
                const connectedInfo = getConnectedBrokerInfo(broker.name);

                return (
                  <div
                    key={broker.name}
                    className={`relative p-6 rounded-xl border transition-all duration-200 ${
                      status === 'connected'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-600/30 hover:border-slate-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Broker Logo */}
                        <div 
                          className="p-3 rounded-lg border"
                          style={{
                            backgroundColor: `${config.color}15`,
                            borderColor: `${config.color}40`,
                          }}
                        >
                          <span className="text-2xl">{config.logo}</span>
                        </div>

                        {/* Broker Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-sm font-semibold text-slate-200">
                              {config.name}
                            </h4>
                            {status === 'connected' && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs text-emerald-300 font-medium">
                                  Connected
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-400 mb-3">
                            {config.description}
                          </p>

                          {/* Connection Info */}
                          {status === 'connected' && connectedInfo && (
                            <div className="text-xs text-slate-400 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3 h-3" />
                                <span>
                                  Connected on {new Date(connectedInfo.connectedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                Account: {connectedInfo.brokerUserName}
                              </div>
                            </div>
                          )}

                          {/* Features */}
                          {status !== 'connected' && (
                            <div className="flex flex-wrap gap-2">
                              {config.features.map((feature, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-slate-700/50 border border-slate-600/30 rounded text-xs text-slate-300"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="ml-4">
                        {status === 'connected' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="border-emerald-500/30 text-emerald-300"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Connected
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleBrokerConnect(broker.name)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {availableBrokers.length === 0 && (
                <div className="text-center py-8">
                  <ExternalLink className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No brokers available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              More brokers coming soon. Currently supported: Zerodha Kite
            </p>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerConnectionModal;