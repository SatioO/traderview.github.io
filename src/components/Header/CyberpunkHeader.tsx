import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, ChevronDown, DollarSign, Edit, Plus, Minus, TrendingUp, Zap, Activity, User, Wallet, BarChart3, Shield, Flame, Scale, PieChart, Target, Command } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import SettingsModal from '../Settings/SettingsModal';
import BrokerStatusIndicator from '../broker/BrokerStatusIndicator';

interface CyberpunkHeaderProps {
  isSettingsOpen?: boolean;
  onSettingsToggle?: (open: boolean) => void;
  marketHealth?: string;
}

const CyberpunkHeader: React.FC<CyberpunkHeaderProps> = ({ 
  isSettingsOpen = false, 
  onSettingsToggle,
  marketHealth = 'bullish'
}) => {
  const { logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCapitalEdit, setShowCapitalEdit] = useState(false);
  const [localSettingsOpen, setLocalSettingsOpen] = useState(false);
  const [tempCapital, setTempCapital] = useState('');
  const [user, setUser] = useState<any>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for capital edit events from other components
  useEffect(() => {
    const handleOpenCapitalEdit = () => {
      setTempCapital(settings.accountBalance.toString());
      setShowCapitalEdit(true);
    };

    window.addEventListener('openCapitalEdit', handleOpenCapitalEdit);
    return () => window.removeEventListener('openCapitalEdit', handleOpenCapitalEdit);
  }, [settings.accountBalance]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  const handleCapitalSave = () => {
    const newAmount = parseFloat(tempCapital.replace(/,/g, ''));
    if (!isNaN(newAmount) && newAmount > 0) {
      updateSettings({ accountBalance: newAmount });
    }
    setShowCapitalEdit(false);
    setTempCapital('');
  };

  const handleCapitalEdit = () => {
    setTempCapital(settings.accountBalance.toString());
    setShowCapitalEdit(true);
  };

  const handleSettingsClick = () => {
    setShowUserMenu(false);
    if (onSettingsToggle) {
      onSettingsToggle(true);
    } else {
      setLocalSettingsOpen(true);
    }
  };

  const handleSettingsClose = () => {
    if (onSettingsToggle) {
      onSettingsToggle(false);
    } else {
      setLocalSettingsOpen(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `${settings.currencySymbol}${amount.toLocaleString('en-IN')}`;
  };

  const formatCurrencyShort = (amount: number): string => {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const getUserInitials = (user: any): string => {
    if (!user) return 'T';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'T';
  };

  const getUserDisplayName = (user: any): string => {
    if (!user) return 'Trader';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Trader';
  };

  // Market outlook configuration matching the gaming aesthetic
  const getMarketSizingInfo = (health: string) => {
    switch (health) {
      case 'bullish':
      case 'confirmed-uptrend':
        return {
          icon: '🚀',
          label: 'BULLISH',
          description: 'Strong upward momentum',
          color: 'emerald',
          bgGradient: 'from-emerald-500/20 via-green-500/15 to-teal-500/20',
          borderColor: 'border-emerald-500/40 hover:border-emerald-400/60',
          shadowColor: 'hover:shadow-emerald-500/30',
          glowColor: 'bg-emerald-400',
          textColor: 'text-emerald-300',
          adjustment: 'Full'
        };
      case 'bearish':
      case 'downtrend':
        return {
          icon: '📉',
          label: 'BEARISH',
          description: 'Declining market trend',
          color: 'red',
          bgGradient: 'from-red-500/20 via-rose-500/15 to-pink-500/20',
          borderColor: 'border-red-500/40 hover:border-red-400/60',
          shadowColor: 'hover:shadow-red-500/30',
          glowColor: 'bg-red-400',
          textColor: 'text-red-300',
          adjustment: '-75%'
        };
      case 'neutral':
      case 'rally-attempt':
        return {
          icon: '📊',
          label: 'NEUTRAL',
          description: 'Sideways consolidation',
          color: 'yellow',
          bgGradient: 'from-yellow-500/20 via-amber-500/15 to-orange-500/20',
          borderColor: 'border-yellow-500/40 hover:border-yellow-400/60',
          shadowColor: 'hover:shadow-yellow-500/30',
          glowColor: 'bg-yellow-400',
          textColor: 'text-yellow-300',
          adjustment: '-25%'
        };
      case 'volatile':
      case 'uptrend-under-pressure':
        return {
          icon: '⚡',
          label: 'VOLATILE',
          description: 'High price swings',
          color: 'orange',
          bgGradient: 'from-orange-500/20 via-red-500/15 to-pink-500/20',
          borderColor: 'border-orange-500/40 hover:border-orange-400/60',
          shadowColor: 'hover:shadow-orange-500/30',
          glowColor: 'bg-orange-400',
          textColor: 'text-orange-300',
          adjustment: '-50%'
        };
      default:
        return {
          icon: '📈',
          label: 'ANALYZING',
          description: 'Assessing conditions',
          color: 'blue',
          bgGradient: 'from-blue-500/20 via-indigo-500/15 to-purple-500/20',
          borderColor: 'border-blue-500/40 hover:border-blue-400/60',
          shadowColor: 'hover:shadow-blue-500/30',
          glowColor: 'bg-blue-400',
          textColor: 'text-blue-300',
          adjustment: 'Auto'
        };
    }
  };

  // Capital level styling matching the gaming theme
  const getCapitalLevel = (amount: number) => {
    if (amount >= 50000000) return { 
      level: 'ELITE', 
      color: 'purple', 
      gradient: 'from-purple-500/20 via-pink-500/15 to-violet-500/20',
      border: 'border-purple-400/40 hover:border-purple-400/60',
      glow: 'hover:shadow-purple-500/30'
    };
    if (amount >= 20000000) return { 
      level: 'PROFESSIONAL', 
      color: 'indigo',
      gradient: 'from-indigo-500/20 via-blue-500/15 to-purple-500/20',
      border: 'border-indigo-400/40 hover:border-indigo-400/60',
      glow: 'hover:shadow-indigo-500/30'
    };
    if (amount >= 10000000) return { 
      level: 'ADVANCED', 
      color: 'blue',
      gradient: 'from-blue-500/20 via-cyan-500/15 to-indigo-500/20',
      border: 'border-blue-400/40 hover:border-blue-400/60',
      glow: 'hover:shadow-blue-500/30'
    };
    if (amount >= 5000000) return { 
      level: 'INTERMEDIATE+', 
      color: 'cyan',
      gradient: 'from-cyan-500/20 via-blue-500/15 to-teal-500/20',
      border: 'border-cyan-400/40 hover:border-cyan-400/60',
      glow: 'hover:shadow-cyan-500/30'
    };
    if (amount >= 2500000) return { 
      level: 'INTERMEDIATE', 
      color: 'emerald',
      gradient: 'from-emerald-500/20 via-green-500/15 to-cyan-500/20',
      border: 'border-emerald-400/40 hover:border-emerald-400/60',
      glow: 'hover:shadow-emerald-500/30'
    };
    if (amount >= 1000000) return { 
      level: 'DEVELOPING', 
      color: 'green',
      gradient: 'from-green-500/20 via-emerald-500/15 to-teal-500/20',
      border: 'border-green-400/40 hover:border-green-400/60',
      glow: 'hover:shadow-green-500/30'
    };
    if (amount >= 500000) return { 
      level: 'BEGINNER+', 
      color: 'yellow',
      gradient: 'from-yellow-500/20 via-amber-500/15 to-orange-500/20',
      border: 'border-yellow-400/40 hover:border-yellow-400/60',
      glow: 'hover:shadow-yellow-500/30'
    };
    return { 
      level: 'BEGINNER', 
      color: 'orange',
      gradient: 'from-orange-500/20 via-red-500/15 to-pink-500/20',
      border: 'border-orange-400/40 hover:border-orange-400/60',
      glow: 'hover:shadow-orange-500/30'
    };
  };

  // Preset amounts for quick selection
  const presetAmounts = [
    { label: '1L', value: 100000 },
    { label: '5L', value: 500000 },
    { label: '10L', value: 1000000 },
    { label: '25L', value: 2500000 },
    { label: '50L', value: 5000000 },
    { label: '1Cr', value: 10000000 },
    { label: '2Cr', value: 20000000 },
    { label: '5Cr', value: 50000000 },
  ];

  const handlePresetSelect = (amount: number) => {
    setTempCapital(amount.toString());
  };

  const handleIncrement = (step: number) => {
    const current = parseFloat(tempCapital) || 0;
    const newAmount = Math.max(0, current + step);
    setTempCapital(newAmount.toString());
  };

  const marketInfo = getMarketSizingInfo(marketHealth);
  const capitalLevel = getCapitalLevel(settings.accountBalance);

  return (
    <>
      {/* Cyberpunk Gaming Header */}
      <header className="sticky top-0 z-50 w-full">
        {/* Background with Cyberpunk Effects */}
        <div className="relative bg-black/60 backdrop-blur-xl border-b border-cyan-500/20">
          {/* Animated Background Particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-2 left-8 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-60"></div>
            <div className="absolute top-4 right-12 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40 delay-1000"></div>
            <div className="absolute bottom-2 left-20 w-1 h-1 bg-emerald-400 rounded-full animate-ping opacity-50 delay-2000"></div>
            <div className="absolute bottom-3 right-32 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-30 delay-3000"></div>
          </div>

          {/* Main Header Content */}
          <div className="relative max-w-7xl mx-auto px-6">
            <div className="h-20 flex items-center justify-between">
              
              {/* Left Section: Brand & Broker Status */}
              <div className="flex items-center space-x-6">
                {/* Gaming Brand */}
                <div className="group relative">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/60 transition-all duration-300">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                        TradeView
                      </h1>
                      <div className="text-xs text-cyan-400 font-medium">
                        ⚡ COMMAND CENTER
                      </div>
                    </div>
                  </div>
                </div>

                {/* Broker Status - Gaming Style */}
                <div className="hidden md:block">
                  <BrokerStatusIndicator />
                </div>
              </div>

              {/* Center Section: Market Command Hub */}
              <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl mx-8">
                <div className="group relative w-full max-w-2xl">
                  {/* Market Command Center */}
                  <div className={`relative bg-gradient-to-br ${marketInfo.bgGradient} backdrop-blur-xl rounded-3xl border-2 ${marketInfo.borderColor} ${marketInfo.shadowColor} hover:shadow-2xl transition-all duration-500 overflow-hidden`}>
                    {/* Animated Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    {/* Command Center Content */}
                    <div className="relative p-6">
                      <div className="flex items-center justify-between">
                        
                        {/* Left: Market Status */}
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className={`w-4 h-4 rounded-full ${marketInfo.glowColor} animate-pulse shadow-lg`}></div>
                            <div className={`absolute inset-0 w-4 h-4 rounded-full ${marketInfo.glowColor} animate-ping opacity-75`}></div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl animate-bounce">{marketInfo.icon}</div>
                            <div>
                              <div className="text-xs text-gray-400 font-bold tracking-wider">
                                🎯 MARKET OUTLOOK
                              </div>
                              <div className={`text-sm font-bold ${marketInfo.textColor}`}>
                                {marketInfo.label}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Center: Separator */}
                        <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-400/60 to-transparent animate-pulse"></div>

                        {/* Right: Market Analysis */}
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-400 font-medium tracking-wider">
                              CONDITION
                            </div>
                            <div className={`text-sm font-bold ${marketInfo.textColor}`}>
                              {marketInfo.description}
                            </div>
                          </div>
                          
                          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-400/60 to-transparent animate-pulse"></div>
                          
                          <div className="text-center">
                            <div className="text-xs text-gray-400 font-medium tracking-wider">
                              SIZING
                            </div>
                            <div className={`text-sm font-bold ${marketInfo.textColor}`}>
                              {marketInfo.adjustment}
                            </div>
                          </div>

                          <div className="flex flex-col items-center space-y-1">
                            <Activity className="w-5 h-5 text-gray-400 animate-pulse" />
                            <div className="text-xs text-gray-500">LIVE</div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: User Controls */}
              <div className="flex items-center space-x-4">
                
                {/* Trading Capital - Gaming Style */}
                <button
                  onClick={handleCapitalEdit}
                  className={`hidden sm:flex items-center space-x-3 px-4 py-3 bg-gradient-to-br ${capitalLevel.gradient} backdrop-blur-xl rounded-2xl border-2 ${capitalLevel.border} ${capitalLevel.glow} hover:shadow-2xl transition-all duration-500 hover:scale-105 group overflow-hidden`}
                >
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  <div className="relative flex items-center space-x-3">
                    <div className="relative">
                      <Wallet className="w-5 h-5 text-emerald-400" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-emerald-300">
                        {formatCurrencyShort(settings.accountBalance)}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        {capitalLevel.level}
                      </div>
                    </div>
                    <Edit className="w-3 h-3 text-gray-500 group-hover:text-gray-400 transition-colors" />
                  </div>
                </button>

                {/* User Command Panel */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-blue-500/20 backdrop-blur-xl rounded-2xl border-2 border-emerald-500/40 hover:border-emerald-400/60 hover:shadow-emerald-500/30 hover:shadow-2xl transition-all duration-500 hover:scale-105 group overflow-hidden"
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    <div className="relative flex items-center space-x-3">
                      {/* User Avatar */}
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-emerald-400/30 shadow-lg">
                          {getUserInitials(user)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
                      </div>
                      
                      {/* User Info */}
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-bold text-emerald-300 flex items-center">
                          <Command className="w-3 h-3 mr-1" />
                          {getUserDisplayName(user)}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                          🟢 ONLINE • ACTIVE
                        </div>
                      </div>
                      
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-all duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* User Command Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-96 bg-black/90 backdrop-blur-xl border-2 border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/20 overflow-hidden">
                      {/* Command Header */}
                      <div className="p-6 bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-blue-500/20 border-b border-cyan-500/20">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl border-2 border-emerald-400/30">
                              {getUserInitials(user)}
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse"></div>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-emerald-300 text-lg flex items-center">
                              <Shield className="w-4 h-4 mr-2" />
                              {getUserDisplayName(user)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {user?.email}
                            </div>
                            <div className="text-xs text-emerald-400 font-bold mt-1 flex items-center">
                              <Flame className="w-3 h-3 mr-1" />
                              Capital: {formatCurrency(settings.accountBalance)} • {capitalLevel.level}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Command Menu Items */}
                      <div className="p-4 space-y-2">
                        {/* Settings Command */}
                        <button
                          onClick={handleSettingsClick}
                          className="w-full flex items-center space-x-4 px-4 py-3 text-left hover:bg-cyan-500/10 rounded-2xl transition-all duration-300 group border border-transparent hover:border-cyan-500/30"
                        >
                          <div className="p-2 bg-cyan-500/20 rounded-xl group-hover:bg-cyan-500/30 transition-colors">
                            <Settings className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <div className="font-bold text-cyan-300">System Settings</div>
                            <div className="text-xs text-gray-400">Configure trading parameters</div>
                          </div>
                        </button>

                        {/* Trading Capital Command (Mobile) */}
                        <div className="sm:hidden">
                          <button
                            onClick={handleCapitalEdit}
                            className="w-full flex items-center space-x-4 px-4 py-3 text-left hover:bg-emerald-500/10 rounded-2xl transition-all duration-300 group border border-transparent hover:border-emerald-500/30"
                          >
                            <div className="p-2 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors">
                              <Wallet className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="font-bold text-emerald-300">Trading Capital</div>
                              <div className="text-xs text-emerald-400">{formatCurrency(settings.accountBalance)}</div>
                            </div>
                          </button>
                        </div>

                        {/* Market Command (Mobile) */}
                        <div className="lg:hidden">
                          <div className="w-full flex items-center space-x-4 px-4 py-3 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10">
                            <div className="p-2 bg-purple-500/20 rounded-xl">
                              <Target className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <div className="font-bold text-purple-300">Market Command</div>
                              <div className={`text-xs font-bold ${marketInfo.textColor}`}>
                                {marketInfo.icon} {marketInfo.label} - {marketInfo.description}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>

                        {/* Logout Command */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-4 px-4 py-3 text-left hover:bg-red-500/10 rounded-2xl transition-all duration-300 group border border-transparent hover:border-red-500/30"
                        >
                          <div className="p-2 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors">
                            <LogOut className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <div className="font-bold text-red-300">System Logout</div>
                            <div className="text-xs text-gray-400">Terminate trading session</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Cyberpunk Border */}
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-pulse"></div>
        </div>
      </header>

      {/* Enhanced Capital Edit Modal - Gaming Style */}
      <Modal
        isOpen={showCapitalEdit}
        onClose={() => setShowCapitalEdit(false)}
        title="💰 Configure Trading Capital"
      >
        <div className="space-y-6">
          {/* Gaming Header */}
          <div className="text-center space-y-3 p-4 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-blue-500/10 rounded-2xl border border-emerald-500/20">
            <p className="text-gray-300 text-sm">
              🎮 <strong>COMMAND CENTER:</strong> Configure your trading capital for optimal position sizing and risk management
            </p>
            {tempCapital && (
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className={`text-sm font-bold bg-gradient-to-r from-${getCapitalLevel(parseFloat(tempCapital) || 0).color}-400 to-${getCapitalLevel(parseFloat(tempCapital) || 0).color}-300 bg-clip-text text-transparent`}>
                  {getCapitalLevel(parseFloat(tempCapital) || 0).level} TRADER
                </span>
              </div>
            )}
          </div>

          {/* Current Amount Display - Gaming Style */}
          <div className={`bg-gradient-to-br ${getCapitalLevel(parseFloat(tempCapital) || settings.accountBalance).gradient} backdrop-blur-xl border-2 ${getCapitalLevel(parseFloat(tempCapital) || settings.accountBalance).border} rounded-3xl p-6 overflow-hidden relative`}>
            {/* Animated Particles */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-2 left-4 w-1 h-1 bg-emerald-400 rounded-full animate-ping opacity-60"></div>
              <div className="absolute top-8 right-6 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-40 delay-1000"></div>
              <div className="absolute bottom-6 left-8 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-50 delay-2000"></div>
            </div>
            
            <div className="relative text-center space-y-3">
              <div className="text-4xl font-bold text-white">
                {tempCapital ? formatCurrency(parseFloat(tempCapital)) : formatCurrency(settings.accountBalance)}
              </div>
              <div className="text-xl text-emerald-300 font-bold">
                {tempCapital ? formatCurrencyShort(parseFloat(tempCapital)) : formatCurrencyShort(settings.accountBalance)}
              </div>
              <div className={`text-sm font-bold text-${getCapitalLevel(parseFloat(tempCapital) || settings.accountBalance).color}-300`}>
                🎯 {getCapitalLevel(parseFloat(tempCapital) || settings.accountBalance).level} LEVEL
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons - Gaming Style */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-300 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>⚡ QUICK SELECT ARSENAL</span>
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {presetAmounts.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`group relative px-4 py-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden ${
                    parseFloat(tempCapital) === preset.value
                      ? 'bg-gradient-to-br from-cyan-500/30 via-purple-500/20 to-pink-500/30 border-cyan-400/60 text-cyan-300 shadow-lg shadow-cyan-500/30'
                      : 'bg-black/40 border-gray-600/30 text-gray-300 hover:border-cyan-500/50 hover:bg-cyan-500/10'
                  }`}
                >
                  {parseFloat(tempCapital) === preset.value && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                  )}
                  <div className="relative text-sm font-bold">{preset.label}</div>
                  {parseFloat(tempCapital) === preset.value && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Fine-tune Controls - Gaming Style */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-300 flex items-center space-x-2">
              <Scale className="w-4 h-4 text-purple-400" />
              <span>🎛️ PRECISION CONTROLS</span>
            </h3>
            <div className="flex items-center space-x-3">
              {/* Decrement buttons */}
              <button
                onClick={() => handleIncrement(-1000000)}
                className="p-3 bg-gradient-to-br from-red-500/20 via-pink-500/10 to-orange-500/20 hover:from-red-500/30 hover:via-pink-500/20 hover:to-orange-500/30 border-2 border-red-500/30 hover:border-red-400/50 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-red-500/30"
                title="-10L"
              >
                <Minus className="w-5 h-5 text-red-400" />
              </button>
              <button
                onClick={() => handleIncrement(-100000)}
                className="p-2 bg-gradient-to-br from-orange-500/20 via-yellow-500/10 to-red-500/20 hover:from-orange-500/30 hover:via-yellow-500/20 hover:to-red-500/30 border-2 border-orange-500/30 hover:border-orange-400/50 rounded-xl transition-all duration-300 hover:scale-105"
                title="-1L"
              >
                <Minus className="w-4 h-4 text-orange-400" />
              </button>
              
              {/* Manual input */}
              <div className="flex-1">
                <Input
                  type="number"
                  value={tempCapital}
                  onChange={(e) => setTempCapital(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full text-center bg-black/40 border-2 border-cyan-500/30 focus:border-cyan-400/60 rounded-xl text-white placeholder-gray-500"
                  min="1000"
                  step="1000"
                />
              </div>
              
              {/* Increment buttons */}
              <button
                onClick={() => handleIncrement(100000)}
                className="p-2 bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-cyan-500/20 hover:from-emerald-500/30 hover:via-green-500/20 hover:to-cyan-500/30 border-2 border-emerald-500/30 hover:border-emerald-400/50 rounded-xl transition-all duration-300 hover:scale-105"
                title="+1L"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
              </button>
              <button
                onClick={() => handleIncrement(1000000)}
                className="p-3 bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-purple-500/20 hover:from-blue-500/30 hover:via-cyan-500/20 hover:to-purple-500/30 border-2 border-blue-500/30 hover:border-blue-400/50 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/30"
                title="+10L"
              >
                <Plus className="w-5 h-5 text-blue-400" />
              </button>
            </div>
          </div>

          {/* Action Buttons - Gaming Style */}
          <div className="flex space-x-4 pt-4">
            <Button
              onClick={handleCapitalSave}
              className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white px-8 py-4 flex-1 font-bold rounded-2xl border border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300"
            >
              🚀 DEPLOY CAPITAL
            </Button>
            <Button
              onClick={() => setShowCapitalEdit(false)}
              variant="outline"
              className="px-8 py-4 border-2 border-gray-600/50 hover:border-gray-500/70 rounded-2xl bg-black/40 hover:bg-black/60 transition-all duration-300"
            >
              Cancel
            </Button>
          </div>

          {/* Gaming Tips */}
          <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 border-2 border-blue-500/20 rounded-2xl p-4">
            <p className="text-sm text-blue-300">
              🎮 <strong>PRO TIP:</strong> Your trading capital directly impacts position sizing algorithms. Configure it to match your actual available funds for optimal risk-reward calculations.
            </p>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={onSettingsToggle ? isSettingsOpen : localSettingsOpen}
        onClose={handleSettingsClose}
      />
    </>
  );
};

export default CyberpunkHeader;