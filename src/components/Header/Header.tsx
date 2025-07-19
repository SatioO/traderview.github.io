import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, ChevronDown, DollarSign, Link, Edit, Plus, Minus, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import SettingsModal from '../Settings/SettingsModal';

interface HeaderProps {
  isSettingsOpen?: boolean;
  onSettingsToggle?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isSettingsOpen = false, 
  onSettingsToggle 
}) => {
  const { logout, availableBrokers, loginWithBroker } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCapitalEdit, setShowCapitalEdit] = useState(false);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
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

  const handleConnectBroker = (brokerName: string) => {
    loginWithBroker(brokerName);
    setShowBrokerModal(false);
    setShowUserMenu(false);
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

  // Preset amounts for quick selection
  const presetAmounts = [
    { label: '1L', value: 100000, color: 'bg-blue-500' },
    { label: '5L', value: 500000, color: 'bg-green-500' },
    { label: '10L', value: 1000000, color: 'bg-yellow-500' },
    { label: '25L', value: 2500000, color: 'bg-orange-500' },
    { label: '50L', value: 5000000, color: 'bg-red-500' },
    { label: '1Cr', value: 10000000, color: 'bg-purple-500' },
    { label: '2Cr', value: 20000000, color: 'bg-pink-500' },
    { label: '5Cr', value: 50000000, color: 'bg-indigo-500' },
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

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        <div className="bg-black/30 backdrop-blur-xl border-b border-white/5">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Left - Brand/Logo */}
              <div className="flex items-center space-x-4">
                <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  TradeView
                </div>
              </div>

              {/* Center - Trading Capital Display */}
              <div className="hidden sm:flex items-center">
                <div className="group relative">
                  <button
                    onClick={handleCapitalEdit}
                    className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:via-green-500/20 hover:to-teal-500/20 border border-emerald-500/20 hover:border-emerald-400/40 rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold tracking-wide">
                      {formatCurrency(settings.accountBalance)}
                    </span>
                    <Edit className="w-3 h-3 text-emerald-400/60 group-hover:text-emerald-300 transition-colors" />
                  </button>
                  
                  {/* Capital Edit Tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/80 text-xs text-gray-300 px-2 py-1 rounded border border-white/10">
                      Click to edit trading capital
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - User Avatar Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 bg-gradient-to-r from-slate-800/40 to-gray-800/40 hover:from-slate-700/60 hover:to-gray-700/60 border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 transition-all duration-300 hover:scale-105 group"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/20 group-hover:border-white/40 transition-all duration-300">
                      {getUserInitials(user)}
                    </div>
                    {/* Online Indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
                  </div>
                  
                  {/* User Name */}
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                      {getUserDisplayName(user)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Online
                    </div>
                  </div>
                  
                  {/* Dropdown Arrow */}
                  <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-white transition-all duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-purple-500/10 overflow-hidden">
                    {/* User Info Header */}
                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/20">
                          {getUserInitials(user)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {getUserDisplayName(user)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {/* Connect Broker */}
                      <button
                        onClick={() => setShowBrokerModal(true)}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/5 transition-colors group"
                      >
                        <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                          <Link className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">Connect Broker</div>
                          <div className="text-xs text-gray-400">Link your trading account</div>
                        </div>
                      </button>

                      {/* Settings */}
                      <button
                        onClick={handleSettingsClick}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/5 transition-colors group"
                      >
                        <div className="p-2 bg-gray-500/20 rounded-lg group-hover:bg-gray-500/30 transition-colors">
                          <Settings className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">Settings</div>
                          <div className="text-xs text-gray-400">Preferences & configuration</div>
                        </div>
                      </button>

                      {/* Trading Capital (Mobile) */}
                      <div className="sm:hidden">
                        <button
                          onClick={handleCapitalEdit}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/5 transition-colors group"
                        >
                          <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">Trading Capital</div>
                            <div className="text-xs text-emerald-400">{formatCurrency(settings.accountBalance)}</div>
                          </div>
                        </button>
                      </div>

                      <hr className="my-2 border-white/10" />

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-500/10 transition-colors group"
                      >
                        <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                          <LogOut className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">Logout</div>
                          <div className="text-xs text-gray-400">Sign out of your account</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Animated border effect */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse"></div>
      </header>

      {/* Enhanced Capital Edit Modal */}
      <Modal
        isOpen={showCapitalEdit}
        onClose={() => setShowCapitalEdit(false)}
        title="🚀 Set Your Trading Capital"
      >
        <div className="space-y-6">
          {/* Header with current level */}
          <div className="text-center space-y-2">
            <p className="text-gray-300 text-sm">
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
          <div className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 border border-white/10 rounded-2xl p-6">
            <div className="text-center space-y-3">
              <div className="text-3xl font-bold text-white">
                {tempCapital ? formatCurrency(parseFloat(tempCapital)) : formatCurrency(settings.accountBalance)}
              </div>
              <div className="text-lg text-cyan-300 font-semibold">
                {tempCapital ? formatCurrencyShort(parseFloat(tempCapital)) : formatCurrencyShort(settings.accountBalance)}
              </div>
              
              {/* Progress bar showing capital level */}
              {tempCapital && (
                <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
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
            <h3 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Quick Select</span>
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`group relative px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-105 ${
                    parseFloat(tempCapital) === preset.value
                      ? `${preset.color} border-white/30 text-white shadow-lg`
                      : 'bg-gray-800/50 border-gray-600/30 text-gray-300 hover:border-gray-500/50'
                  }`}
                >
                  <div className="text-xs font-bold">{preset.label}</div>
                  {parseFloat(tempCapital) === preset.value && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Fine-tune Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Fine Tune</h3>
            <div className="flex items-center space-x-2">
              {/* Decrement buttons */}
              <button
                onClick={() => handleIncrement(-1000000)}
                className="p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105"
                title="-10L"
              >
                <Minus className="w-4 h-4 text-red-400" />
              </button>
              <button
                onClick={() => handleIncrement(-100000)}
                className="p-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg transition-all duration-200 hover:scale-105"
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
                  className="w-full text-center bg-black/30 border-gray-600/30 focus:border-cyan-500/50"
                  min="1000"
                  step="1000"
                />
              </div>
              
              {/* Increment buttons */}
              <button
                onClick={() => handleIncrement(100000)}
                className="p-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-all duration-200 hover:scale-105"
                title="+1L"
              >
                <Plus className="w-3 h-3 text-green-400" />
              </button>
              <button
                onClick={() => handleIncrement(1000000)}
                className="p-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-all duration-200 hover:scale-105"
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
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-3 flex-1 font-semibold"
            >
              💰 Update Capital
            </Button>
            <Button
              onClick={() => setShowCapitalEdit(false)}
              variant="outline"
              className="px-6 py-3 border-gray-600/30 hover:border-gray-500/50"
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

      {/* Connect Broker Modal */}
      <Modal
        isOpen={showBrokerModal}
        onClose={() => setShowBrokerModal(false)}
        title="Connect Your Broker"
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Connect your broker account to enable live trading and real-time data.
          </p>
          <div className="grid gap-3">
            {availableBrokers?.map((broker) => (
              <Button
                key={broker.name}
                onClick={() => handleConnectBroker(broker.name)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Connect {broker.name}
              </Button>
            ))}
            {(!availableBrokers || availableBrokers.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-400">No brokers available</p>
              </div>
            )}
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

export default Header;