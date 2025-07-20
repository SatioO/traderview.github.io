import React, { useEffect, useState } from 'react';
import { X, ExternalLink, CheckCircle, Clock, AlertCircle, TrendingUp, Zap, Shield, Wifi, Star, Globe, Lock, Users } from 'lucide-react';
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
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [connectionStep, setConnectionStep] = useState<'select' | 'connecting' | 'success'>('select');

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
        description: 'India\'s largest discount brokerage platform',
        logo: '🛡️',
        color: '#FF6D28',
        bgGradient: 'from-orange-500/10 via-red-500/5 to-orange-500/10',
        borderColor: 'border-orange-400/30 hover:border-orange-400/50',
        features: ['₹0 equity delivery', 'Advanced charting', 'API access', 'Portfolio analytics'],
        rating: 4.8,
        users: '1.5M+',
        established: '2010',
        security: 'Bank-grade encryption'
      },
      groww: {
        name: 'Groww',
        description: 'Simple & powerful investment platform',
        logo: '📈',
        color: '#00C896',
        bgGradient: 'from-emerald-500/10 via-green-500/5 to-teal-500/10',
        borderColor: 'border-emerald-400/30 hover:border-emerald-400/50',
        features: ['Zero AMC', 'Paperless KYC', 'Mutual funds', 'Easy interface'],
        rating: 4.6,
        users: '1M+',
        established: '2016',
        security: '256-bit SSL encryption'
      },
      angelone: {
        name: 'Angel One',
        description: 'Full-service digital brokerage',
        logo: '👼',
        color: '#3B82F6',
        bgGradient: 'from-blue-500/10 via-indigo-500/5 to-blue-500/10',
        borderColor: 'border-blue-400/30 hover:border-blue-400/50',
        features: ['Research reports', 'Advisory services', 'SmartAPI', 'Mobile first'],
        rating: 4.5,
        users: '800K+',
        established: '1996',
        security: 'Multi-factor authentication'
      }
    };
    
    return configs[brokerId as keyof typeof configs] || {
      name: brokerId,
      description: 'Trading platform',
      logo: '📊',
      color: '#6366F1',
      bgGradient: 'from-purple-500/10 via-indigo-500/5 to-purple-500/10',
      borderColor: 'border-purple-400/30 hover:border-purple-400/50',
      features: ['Trading platform'],
      rating: 4.0,
      users: 'N/A',
      established: 'N/A',
      security: 'Secure connection'
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Cinematic Trading Environment Overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl">
        {/* Multi-layered Trading Dashboard Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {/* Dynamic Depth Layers */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Layer 1: Deep Background Grid */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.4)_1px,transparent_1px)] bg-[size:100px_100px] animate-grid-drift"></div>
            </div>

            {/* Layer 2: Mid-ground Chart Network */}
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" viewBox="0 0 1200 800">
                {/* Animated Trading Chart Lines */}
                <path
                  d="M0,400 Q150,200 300,250 T600,180 T900,150 T1200,120"
                  stroke="url(#primaryGradient)"
                  strokeWidth="3"
                  fill="none"
                  className="animate-chart-draw"
                />
                <path
                  d="M0,500 Q200,350 400,400 T800,320 T1200,280"
                  stroke="url(#secondaryGradient)"
                  strokeWidth="2"
                  fill="none"
                  className="animate-chart-draw-delayed"
                />

                {/* Trading Connection Nodes */}
                <circle cx="300" cy="250" r="4" fill="rgba(168,85,247,0.8)" className="animate-node-pulse">
                  <animate attributeName="r" values="4;8;4" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="600" cy="180" r="3" fill="rgba(6,182,212,0.8)" className="animate-node-pulse-delayed">
                  <animate attributeName="r" values="3;6;3" dur="2.5s" repeatCount="indefinite" />
                </circle>

                <defs>
                  <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(168,85,247)" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="rgb(236,72,153)" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity="0.5" />
                  </linearGradient>
                  <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Layer 3: Trading Particles & Energy Fields */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Energy Orbs */}
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-radial from-purple-500/30 via-purple-500/10 to-transparent rounded-full blur-xl animate-energy-pulse"></div>
              <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-gradient-radial from-cyan-500/25 via-cyan-500/8 to-transparent rounded-full blur-2xl animate-energy-pulse-delayed"></div>
              <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-radial from-green-500/35 via-green-500/12 to-transparent rounded-full blur-xl animate-energy-pulse-slow"></div>

              {/* Floating Trading Particles */}
              <div className="absolute top-40 left-80 w-1 h-1 bg-purple-400/80 rounded-full animate-data-particle"></div>
              <div className="absolute top-80 right-96 w-0.5 h-0.5 bg-cyan-400/80 rounded-full animate-data-particle-delayed"></div>
              <div className="absolute bottom-60 left-96 w-1 h-1 bg-green-400/80 rounded-full animate-data-particle-slow"></div>
              <div className="absolute bottom-80 right-80 w-0.5 h-0.5 bg-yellow-400/80 rounded-full animate-data-particle-fast"></div>
            </div>

            {/* Layer 4: Environmental Lighting */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 animate-ambient-shift"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Cinematic Atmosphere */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/8 via-transparent to-cyan-500/8 pointer-events-none animate-atmospheric-drift" />

      {/* Depth of Field Blur Effect */}
      <div className="fixed inset-0 bg-gradient-radial from-transparent via-transparent to-black/20 pointer-events-none" />

      <div className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900/98 via-purple-900/95 to-slate-800/98 backdrop-blur-3xl rounded-[2rem] border border-purple-400/40 max-h-[90vh] overflow-hidden transform transition-all duration-700 ease-out animate-terminal-float mx-auto shadow-[0_0_50px_rgba(168,85,247,0.3)]">
        
        {/* Floating Premium Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-8 left-12 w-2 h-2 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full animate-ping opacity-60"></div>
          <div className="absolute top-6 right-16 w-1 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-ping opacity-40 delay-1000"></div>
          <div className="absolute bottom-12 left-20 w-1 h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-ping opacity-50 delay-2000"></div>
          <div className="absolute bottom-8 right-12 w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-ping opacity-45 delay-3000"></div>
        </div>

        {/* Dynamic light bar */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
        
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-black/10 pointer-events-none rounded-[2rem]" />

        {/* Header */}
        <div className="relative p-8 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="relative z-10 p-3 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-800/80 backdrop-blur-xl rounded-xl border border-purple-400/30 group-hover:border-purple-400/50 transition-all duration-300">
                  <ExternalLink className="w-6 h-6 text-slate-300 group-hover:text-purple-300 transition-all duration-300" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black bg-gradient-to-r from-slate-100 via-purple-200 to-slate-100 bg-clip-text text-transparent tracking-tight">
                  🚀 Connect Your Broker
                </h2>
                <div className="mx-auto px-3 py-1 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-400/30 rounded-full w-fit mt-2">
                  <span className="text-xs font-bold text-purple-300 tracking-wider">
                    SECURE TRADING GATEWAY
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          
          {/* Header with current stats */}
          <div className="text-center space-y-4">
            <p className="text-slate-300 text-sm">
              Connect with India's most trusted brokers for seamless trading experience
            </p>
            
            {/* Stats Row */}
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-semibold">Bank-Grade Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-300 font-semibold">Instant Connection</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-300 font-semibold">Zero Data Storage</span>
              </div>
            </div>
          </div>

          {/* Quick Select Header */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Choose Your Trading Platform</span>
            </h3>
            
            {/* Premium Broker Cards */}
            <div className="grid gap-4">
              {availableBrokers.map((broker) => {
                const config = getBrokerConfig(broker.name);
                const status = getConnectionStatus(broker.name);
                const connectedInfo = getConnectedBrokerInfo(broker.name);
                const isSelected = selectedBroker === broker.name;

                return (
                  <div
                    key={broker.name}
                    className={`group relative bg-gradient-to-r ${config.bgGradient} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                      status === 'connected'
                        ? 'border-emerald-400/40 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
                        : isSelected
                        ? `${config.borderColor} ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20`
                        : `${config.borderColor}`
                    }`}
                    onClick={() => setSelectedBroker(broker.name)}
                  >
                    {/* Floating Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute top-4 left-8 w-1 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full animate-ping opacity-60"></div>
                      <div className="absolute top-3 right-10 w-1 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-ping opacity-40 delay-1000"></div>
                      <div className="absolute bottom-5 left-12 w-1 h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-ping opacity-50 delay-2000"></div>
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {/* Enhanced Logo */}
                          <div className="relative">
                            <div 
                              className="p-4 rounded-xl border-2 transition-all duration-300 group-hover:scale-105"
                              style={{
                                backgroundColor: `${config.color}20`,
                                borderColor: `${config.color}60`,
                              }}
                            >
                              <span className="text-3xl">{config.logo}</span>
                            </div>
                            {status === 'connected' && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse border-2 border-slate-900"></div>
                            )}
                          </div>

                          {/* Broker Details */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-bold text-slate-200">
                                {config.name}
                              </h4>
                              {status === 'connected' && (
                                <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  <span className="text-xs text-emerald-300 font-medium">
                                    Connected
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-sm text-slate-400 mb-3">
                              {config.description}
                            </p>

                            {/* Rating & Stats */}
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-yellow-300 font-semibold">{config.rating}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3 text-cyan-400" />
                                <span className="text-xs text-cyan-300 font-semibold">{config.users}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Globe className="w-3 h-3 text-purple-400" />
                                <span className="text-xs text-purple-300 font-semibold">Est. {config.established}</span>
                              </div>
                            </div>

                            {/* Connection Info for Connected Brokers */}
                            {status === 'connected' && connectedInfo && (
                              <div className="text-xs text-slate-400 space-y-1 mb-3">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3 h-3" />
                                  <span>Connected on {new Date(connectedInfo.connectedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Shield className="w-3 h-3" />
                                  <span>Account: {connectedInfo.brokerUserName}</span>
                                </div>
                              </div>
                            )}

                            {/* Features Pills */}
                            {status !== 'connected' && (
                              <div className="flex flex-wrap gap-2">
                                {config.features.map((feature, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-slate-800/60 border border-slate-600/40 rounded-lg text-xs text-slate-300 font-medium"
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
                              className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Connected
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleBrokerConnect(broker.name)}
                              className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all duration-200 hover:scale-105 ${
                                isSelected ? 'ring-2 ring-purple-400/50' : ''
                              }`}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Connect Now
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Security Badge */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-600/30">
                        <div className="flex items-center space-x-2">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-400">{config.security}</span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-purple-300 font-semibold">Selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {availableBrokers.length === 0 && (
                <div className="text-center py-12">
                  <ExternalLink className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg font-semibold">No Brokers Available</p>
                  <p className="text-slate-500 text-sm mt-2">More trading platforms coming soon!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="p-8 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center justify-between">
            {/* Security Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex-1 mr-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-300">🔒 Privacy Guaranteed</h3>
                  <p className="text-xs text-blue-200/80 mt-1">
                    TradeView uses official broker APIs. Your credentials are never stored and handled securely through OAuth2.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="px-6 py-3 border-slate-600/30 hover:border-slate-500/50"
              >
                Maybe Later
              </Button>
            </div>
          </div>
          
          {/* Coming Soon Banner */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              🚀 <span className="text-purple-300 font-semibold">Coming Soon:</span> Upstox, 5Paisa, IIFL Securities & more!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerConnectionModal;