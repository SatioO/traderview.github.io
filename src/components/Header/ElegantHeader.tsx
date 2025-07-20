import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, ChevronDown, DollarSign, Edit, Plus, Minus, TrendingUp, Zap, Activity, User, Wallet, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import SettingsModal from '../Settings/SettingsModal';
import BrokerStatusIndicator from '../broker/BrokerStatusIndicator';

interface ElegantHeaderProps {
  isSettingsOpen?: boolean;
  onSettingsToggle?: (open: boolean) => void;
  marketHealth?: string;
}

const ElegantHeader: React.FC<ElegantHeaderProps> = ({ 
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

  // Market outlook configuration with elegant design
  const getMarketInfo = (health: string) => {
    switch (health) {
      case 'bullish':
      case 'confirmed-uptrend':
        return {
          icon: '🚀',
          label: 'BULLISH',
          description: 'Strong upward momentum',
          color: '#10b981',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          textColor: 'text-emerald-400',
          dotColor: 'bg-emerald-400'
        };
      case 'bearish':
      case 'downtrend':
        return {
          icon: '📉',
          label: 'BEARISH',
          description: 'Declining market trend',
          color: '#ef4444',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          dotColor: 'bg-red-400'
        };
      case 'neutral':
      case 'rally-attempt':
        return {
          icon: '📊',
          label: 'NEUTRAL',
          description: 'Sideways consolidation',
          color: '#f59e0b',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          textColor: 'text-amber-400',
          dotColor: 'bg-amber-400'
        };
      case 'volatile':
      case 'uptrend-under-pressure':
        return {
          icon: '⚡',
          label: 'VOLATILE',
          description: 'High price swings',
          color: '#f97316',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          textColor: 'text-orange-400',
          dotColor: 'bg-orange-400'
        };
      default:
        return {
          icon: '📈',
          label: 'ANALYZING',
          description: 'Assessing conditions',
          color: '#3b82f6',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-400',
          dotColor: 'bg-blue-400'
        };
    }
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

  const getCapitalLevel = (amount: number): { percentage: number; level: string; color: string } => {
    if (amount >= 50000000) return { percentage: 100, level: 'ELITE', color: 'from-purple-500 to-pink-500' };
    if (amount >= 20000000) return { percentage: 85, level: 'PROFESSIONAL', color: 'from-indigo-500 to-purple-500' };
    if (amount >= 10000000) return { percentage: 70, level: 'ADVANCED', color: 'from-blue-500 to-indigo-500' };
    if (amount >= 5000000) return { percentage: 55, level: 'INTERMEDIATE+', color: 'from-cyan-500 to-blue-500' };
    if (amount >= 2500000) return { percentage: 40, level: 'INTERMEDIATE', color: 'from-green-500 to-cyan-500' };
    if (amount >= 1000000) return { percentage: 25, level: 'DEVELOPING', color: 'from-yellow-500 to-green-500' };
    if (amount >= 500000) return { percentage: 15, level: 'BEGINNER+', color: 'from-orange-500 to-yellow-500' };
    return { percentage: 5, level: 'BEGINNER', color: 'from-red-500 to-orange-500' };
  };

  const marketInfo = getMarketInfo(marketHealth);

  return (
    <>
      {/* Elegant Header with Unified Design System */}
      <header className="sticky top-0 z-50 w-full">
        {/* Main Header Container */}
        <div className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="h-16 flex items-center justify-between">
              
              {/* Left Section: Brand & Navigation */}
              <div className="flex items-center space-x-8">
                {/* Brand */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    TradeView
                  </h1>
                </div>

                {/* Broker Status - Integrated Design */}
                <div className="hidden md:flex">
                  <BrokerStatusIndicator />
                </div>
              </div>

              {/* Center Section: Market Intelligence Hub */}
              <div className="hidden lg:flex items-center justify-center flex-1 max-w-md mx-8">
                <div className={`flex items-center space-x-4 px-6 py-3 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${marketInfo.bgColor} ${marketInfo.borderColor}`}>
                  {/* Market Status Indicator */}
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${marketInfo.dotColor} animate-pulse`}></div>
                      <div className={`absolute inset-0 w-3 h-3 rounded-full ${marketInfo.dotColor} animate-ping opacity-75`}></div>
                    </div>
                    <div className="text-lg">{marketInfo.icon}</div>
                  </div>

                  {/* Market Info */}
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${marketInfo.textColor}`}>
                      {marketInfo.label}
                    </div>
                    <div className="text-xs text-slate-400">
                      {marketInfo.description}
                    </div>
                  </div>

                  {/* Activity Indicator */}
                  <Activity className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Right Section: User Controls */}
              <div className="flex items-center space-x-4">
                {/* Trading Capital Display */}
                <button
                  onClick={handleCapitalEdit}
                  className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/50 rounded-lg transition-all duration-200 hover:scale-[1.02] group"
                >
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-200">
                      {formatCurrencyShort(settings.accountBalance)}
                    </div>
                    <div className="text-xs text-slate-400">Capital</div>
                  </div>
                  <Edit className="w-3 h-3 text-slate-500 group-hover:text-slate-400 transition-colors" />
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 px-3 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/50 rounded-lg transition-all duration-200 hover:scale-[1.02] group"
                  >
                    {/* User Avatar */}
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {getUserInitials(user)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950"></div>
                    </div>
                    
                    {/* User Info */}
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-xs text-slate-400">
                        Online
                      </div>
                    </div>
                    
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-all duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
                      {/* User Info Header */}
                      <div className="p-6 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-b border-slate-700/50">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {getUserInitials(user)}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-100">
                              {getUserDisplayName(user)}
                            </div>
                            <div className="text-sm text-slate-400">
                              {user?.email}
                            </div>
                            <div className="text-xs text-emerald-400 font-medium mt-1">
                              Capital: {formatCurrency(settings.accountBalance)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        {/* Settings */}
                        <button
                          onClick={handleSettingsClick}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-800/50 rounded-lg transition-colors group"
                        >
                          <div className="p-2 bg-slate-700/50 rounded-lg group-hover:bg-slate-700/70 transition-colors">
                            <Settings className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">Settings</div>
                            <div className="text-xs text-slate-400">Preferences & configuration</div>
                          </div>
                        </button>

                        {/* Trading Capital (Mobile) */}
                        <div className="sm:hidden">
                          <button
                            onClick={handleCapitalEdit}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-800/50 rounded-lg transition-colors group"
                          >
                            <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                              <Wallet className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-200">Trading Capital</div>
                              <div className="text-xs text-emerald-400">{formatCurrency(settings.accountBalance)}</div>
                            </div>
                          </button>
                        </div>

                        {/* Market Status (Mobile) */}
                        <div className="lg:hidden">
                          <div className="w-full flex items-center space-x-3 px-4 py-3">
                            <div className={`p-2 rounded-lg ${marketInfo.bgColor}`}>
                              <div className="text-lg">{marketInfo.icon}</div>
                            </div>
                            <div>
                              <div className="font-medium text-slate-200">Market Outlook</div>
                              <div className={`text-xs font-semibold ${marketInfo.textColor}`}>
                                {marketInfo.label} - {marketInfo.description}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="my-2 h-px bg-slate-700/50"></div>

                        {/* Logout */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-500/10 rounded-lg transition-colors group"
                        >
                          <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                            <LogOut className="w-4 h-4 text-red-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">Logout</div>
                            <div className="text-xs text-slate-400">Sign out of your account</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Subtle bottom border with gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent"></div>
      </header>

      {/* Enhanced Capital Edit Modal */}
      <Modal
        isOpen={showCapitalEdit}
        onClose={() => setShowCapitalEdit(false)}
        title="💰 Set Your Trading Capital"
      >
        <div className="space-y-6">
          {/* Header with current level */}
          <div className="text-center space-y-3">
            <p className="text-slate-400 text-sm">
              Configure your trading capital for accurate position sizing and risk management
            </p>
            {tempCapital && (
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className={`text-sm font-semibold bg-gradient-to-r ${getCapitalLevel(parseFloat(tempCapital) || 0).color} bg-clip-text text-transparent`}>
                  {getCapitalLevel(parseFloat(tempCapital) || 0).level}
                </span>
              </div>
            )}
          </div>

          {/* Current Amount Display */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-center space-y-3">
              <div className="text-3xl font-bold text-slate-100">
                {tempCapital ? formatCurrency(parseFloat(tempCapital)) : formatCurrency(settings.accountBalance)}
              </div>
              <div className="text-lg text-cyan-400 font-semibold">
                {tempCapital ? formatCurrencyShort(parseFloat(tempCapital)) : formatCurrencyShort(settings.accountBalance)}
              </div>
              
              {/* Progress bar showing capital level */}
              {tempCapital && (
                <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${getCapitalLevel(parseFloat(tempCapital) || 0).color} transition-all duration-500`}
                    style={{ width: `${getCapitalLevel(parseFloat(tempCapital) || 0).percentage}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Quick Select</span>
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-105 ${
                    parseFloat(tempCapital) === preset.value
                      ? 'bg-violet-500 border-violet-400 text-white shadow-lg'
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:border-slate-500/70'
                  }`}
                >
                  <div className="text-xs font-bold">{preset.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fine-tune Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Fine Tune</h3>
            <div className="flex items-center space-x-2">
              {/* Decrement buttons */}
              <button
                onClick={() => handleIncrement(-1000000)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105"
                title="-10L"
              >
                <Minus className="w-4 h-4 text-red-400" />
              </button>
              <button
                onClick={() => handleIncrement(-100000)}
                className="p-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg transition-all duration-200 hover:scale-105"
                title="-1L"
              >
                <Minus className="w-3 h-3 text-orange-400" />
              </button>
              
              {/* Manual input */}
              <div className="flex-1">
                <Input
                  type="number"
                  value={tempCapital}
                  onChange={(e) => setTempCapital(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full text-center bg-slate-800/30 border-slate-600/30 focus:border-cyan-500/50"
                  min="1000"
                  step="1000"
                />
              </div>
              
              {/* Increment buttons */}
              <button
                onClick={() => handleIncrement(100000)}
                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-all duration-200 hover:scale-105"
                title="+1L"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
              </button>
              <button
                onClick={() => handleIncrement(1000000)}
                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all duration-200 hover:scale-105"
                title="+10L"
              >
                <Plus className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleCapitalSave}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 flex-1 font-semibold"
            >
              💰 Update Capital
            </Button>
            <Button
              onClick={() => setShowCapitalEdit(false)}
              variant="outline"
              className="px-6 py-3 border-slate-600/30 hover:border-slate-500/50"
            >
              Cancel
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              💡 <strong>Tip:</strong> Your trading capital affects position sizing recommendations. Set it to match your actual available trading funds for optimal risk management.
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

export default ElegantHeader;