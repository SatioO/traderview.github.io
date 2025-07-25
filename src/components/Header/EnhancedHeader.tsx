import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut,
  Settings,
  ChevronDown,
  Edit,
  Plus,
  Minus,
  TrendingUp,
  Zap,
  IndianRupee,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

interface EnhancedHeaderProps {
  isSettingsOpen?: boolean;
  onSettingsToggle: (open: boolean) => void;
  marketHealth?: string;
}

const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
  onSettingsToggle,
}) => {
  const { logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCapitalEdit, setShowCapitalEdit] = useState(false);
  const [tempCapital, setTempCapital] = useState('');
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null>(null);
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
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
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
    return () =>
      window.removeEventListener('openCapitalEdit', handleOpenCapitalEdit);
  }, [settings.accountBalance]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  const handleCapitalSave = async () => {
    const newAmount = parseFloat(tempCapital.replace(/,/g, ''));
    if (!isNaN(newAmount) && newAmount > 0) {
      try {
        await updateSettings({ accountBalance: newAmount });
        setShowCapitalEdit(false);
        setTempCapital('');
      } catch (error) {
        console.error('Failed to update account balance:', error);
        // Keep modal open on error so user can try again
      }
    } else {
      setShowCapitalEdit(false);
      setTempCapital('');
    }
  };

  const handleCapitalEdit = () => {
    setTempCapital(settings.accountBalance.toString());
    setShowCapitalEdit(true);
  };

  const handleSettingsClick = () => {
    setShowUserMenu(false);
    onSettingsToggle(true);
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

  const getUserInitials = (
    user: { firstName?: string; lastName?: string; email?: string } | null
  ): string => {
    if (!user) return 'T';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'T';
  };

  const getUserDisplayName = (
    user: { firstName?: string; lastName?: string; email?: string } | null
  ): string => {
    if (!user) return 'Trader';

    const capitalize = (s?: string) =>
      s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

    const firstName = capitalize(user.firstName);
    const lastName = capitalize(user.lastName);

    return `${firstName} ${lastName}`.trim() || user.email || 'Trader';
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

  const getCapitalLevel = (
    amount: number
  ): { percentage: number; level: string; color: string } => {
    if (amount >= 50000000)
      return {
        percentage: 100,
        level: 'ELITE',
        color: 'from-purple-500 to-pink-500',
      };
    if (amount >= 20000000)
      return {
        percentage: 85,
        level: 'PROFESSIONAL',
        color: 'from-indigo-500 to-purple-500',
      };
    if (amount >= 10000000)
      return {
        percentage: 70,
        level: 'ADVANCED',
        color: 'from-blue-500 to-indigo-500',
      };
    if (amount >= 5000000)
      return {
        percentage: 55,
        level: 'INTERMEDIATE+',
        color: 'from-cyan-500 to-blue-500',
      };
    if (amount >= 2500000)
      return {
        percentage: 40,
        level: 'INTERMEDIATE',
        color: 'from-green-500 to-cyan-500',
      };
    if (amount >= 1000000)
      return {
        percentage: 25,
        level: 'DEVELOPING',
        color: 'from-yellow-500 to-green-500',
      };
    if (amount >= 500000)
      return {
        percentage: 15,
        level: 'BEGINNER+',
        color: 'from-orange-500 to-yellow-500',
      };
    return {
      percentage: 5,
      level: 'BEGINNER',
      color: 'from-red-500 to-orange-500',
    };
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        <div className="backdrop-blur-md border-b border-white/5">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left - Brand/Logo with Floating Effect */}
              <div className="flex items-center space-x-6">
                <div className="relative group cursor-pointer">
                  {/* Dynamic Background Orbs */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"></div>
                  <div
                    className="absolute -left-2 -top-1 w-4 h-4 bg-purple-400/40 rounded-full blur-sm animate-bounce opacity-0 group-hover:opacity-100 transition-all duration-1000"
                    style={{ animationDelay: '0.5s' }}
                  ></div>
                  <div
                    className="absolute -right-1 -bottom-1 w-3 h-3 bg-cyan-400/40 rounded-full blur-sm animate-bounce opacity-0 group-hover:opacity-100 transition-all duration-1000"
                    style={{ animationDelay: '1s' }}
                  ></div>

                  {/* Enhanced Logo */}
                  <div className="relative text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-400 bg-clip-text text-transparent hover:from-purple-300 hover:via-pink-200 hover:to-cyan-300 transition-all duration-500 transform group-hover:scale-105">
                    TraderView
                  </div>

                  {/* Subtle Glow Effect */}
                  <div className="absolute -inset-3 bg-gradient-to-r from-purple-500/8 to-cyan-500/8 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md"></div>

                  {/* Floating Particles */}
                  <div
                    className="absolute top-0 right-0 w-1 h-1 bg-white/60 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-all duration-700"
                    style={{ animationDelay: '0.3s' }}
                  ></div>
                </div>
              </div>

              {/* Right - Trading Capital & User Menu */}
              <div className="flex items-center space-x-4">
                {/* Floating Trading Capital Display */}
                <div className="hidden sm:block">
                  <div className="group relative z-30">
                    <button
                      onClick={handleCapitalEdit}
                      className="relative flex items-center space-x-4 py-3"
                    >
                      {/* Enhanced Capital Icon with Premium Effects */}
                      <div className="relative">
                        {/* Multi-layered Glow Effects */}
                        <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-md animate-pulse opacity-60"></div>
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 rounded-full animate-spin"
                          style={{ animationDuration: '8s' }}
                        ></div>
                        <div className="absolute inset-0 bg-emerald-300/20 rounded-full blur-lg animate-ping opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

                        {/* Icon with Enhanced Effects */}
                        <IndianRupee className="relative w-6 h-6 text-emerald-300 group-hover:text-emerald-200 transition-all duration-300 drop-shadow-lg transform group-hover:scale-110 group-hover:rotate-6" />

                        {/* Floating Micro Particles */}
                        <div
                          className="absolute -top-1 -right-1 w-1 h-1 bg-emerald-300/80 rounded-full animate-bounce opacity-0 group-hover:opacity-100 transition-all duration-500"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                        <div
                          className="absolute -bottom-1 -left-1 w-0.5 h-0.5 bg-green-300/80 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-all duration-700"
                          style={{ animationDelay: '0.8s' }}
                        ></div>
                      </div>

                      {/* Floating Capital Amount */}
                      <div className="relative flex flex-col items-start">
                        <div className="flex items-center space-x-3">
                          <span className="text-white/90 font-bold text-xl tracking-tight drop-shadow-sm group-hover:text-white transition-colors">
                            {formatCurrencyShort(settings.accountBalance)}
                          </span>
                          <div
                            className={`relative px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg border border-white/20 bg-gradient-to-r ${
                              getCapitalLevel(settings.accountBalance).color
                            }`}
                          >
                            <div className="absolute inset-0 bg-white/10 rounded-full"></div>
                            <span className="relative ">
                              {getCapitalLevel(settings.accountBalance).level}
                            </span>
                          </div>
                        </div>
                        <div className="text-emerald-300/70 text-xs font-medium tracking-wide">
                          Trading Capital
                        </div>
                      </div>

                      {/* Subtle Edit Icon */}
                      <div className="relative group/edit">
                        {/* Gentle Glow Effect */}
                        <div className="absolute inset-0 bg-emerald-400/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                        {/* Simple Icon Container */}
                        <div className="relative p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                          <Edit className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200 transition-all duration-300 transform group-hover:scale-110" />
                        </div>

                        {/* Simple Tooltip */}
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-emerald-400/30 shadow-lg backdrop-blur-sm">
                          Edit Capital
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-emerald-400/30"></div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Floating Mobile Capital */}
                <div className="sm:hidden">
                  <button
                    onClick={handleCapitalEdit}
                    className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 hover:scale-125 transform-gpu group"
                  >
                    {/* Floating Background Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"></div>
                    <div className="absolute inset-0 border border-emerald-400/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                    {/* Floating Pulse Effects */}
                    <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-pulse opacity-60"></div>
                    <div className="absolute inset-0 bg-emerald-400/10 rounded-full animate-ping"></div>

                    {/* Icon with Drop Shadow */}
                    <IndianRupee className="relative w-6 h-6 text-emerald-300 group-hover:text-emerald-200 transition-all duration-300 drop-shadow-lg" />

                    {/* Floating Level Indicator */}
                    <div
                      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r ${
                        getCapitalLevel(settings.accountBalance).color
                      } border-2 border-white/30 shadow-lg animate-pulse`}
                    ></div>
                  </button>
                </div>

                {/* Floating Settings Button */}
                <button
                  onClick={handleSettingsClick}
                  className="relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500 hover:scale-125 transform-gpu group"
                >
                  {/* Floating Pulse on Hover */}
                  {/* <div className="absolute inset-0 bg-gray-400/20 rounded-full animate-pulse opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div> */}
                  <div className="absolute inset-0 bg-gray-400/10 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Icon with Drop Shadow */}
                  <Settings className="relative w-6 h-6 text-gray-300 group-hover:text-white transition-all duration-300 " />
                </button>

                {/* Floating User Avatar Menu */}
                <div className="relative z-30" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="relative flex items-center space-x-3 px-3 py-2 rounded-2xl"
                  >
                    {/* Enhanced Floating Avatar */}
                    <div className="relative group/avatar">
                      {/* Multi-layered Background Effects */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-cyan-500/40 rounded-full blur-lg animate-pulse opacity-60 group-hover:opacity-90 transition-all duration-700"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-70 transition-all duration-1000 animate-ping"></div>

                      {/* Enhanced Avatar with Improved Gradient */}
                      <div className="relative w-11 h-11 bg-gradient-to-br from-purple-600 via-rose-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/40 group-hover:border-white/70 transition-all duration-500 shadow-2xl transform group-hover:scale-110 group-hover:rotate-3">
                        {/* Inner Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                        {/* Avatar Content */}
                        <span className="relative z-10 transform group-hover:scale-105 transition-all duration-300">
                          {getUserInitials(user)}
                        </span>

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full transform -skew-x-12 animate-pulse"></div>
                        </div>
                      </div>

                      {/* Enhanced Floating Online Indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white/60 animate-pulse shadow-xl group-hover:scale-125 transition-all duration-300">
                        <div className="absolute inset-0 bg-green-300/50 rounded-full animate-ping"></div>
                        <div className="absolute inset-0.5 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      </div>

                      {/* Floating Particles Around Avatar */}
                      <div
                        className="absolute -top-1 -left-1 w-2 h-2 bg-purple-400/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-800 animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <div
                        className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-cyan-400/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-600 animate-ping"
                        style={{ animationDelay: '0.5s' }}
                      ></div>
                      <div
                        className="absolute -bottom-1 -left-1 w-1 h-1 bg-pink-400/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"
                        style={{ animationDelay: '0.8s' }}
                      ></div>
                    </div>

                    {/* Enhanced Floating User Info */}
                    <div className="hidden md:block text-left relative group/userinfo">
                      {/* Subtle Background Glow */}
                      <div className="absolute inset-0 bg-white/5 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                      <div className="relative p-1">
                        <div className="text-sm font-medium text-white/90 group-hover:text-white drop-shadow-sm transition-all duration-500 transform group-hover:scale-105">
                          {getUserDisplayName(user)}
                        </div>
                        <div className="text-xs text-white/60 group-hover:text-white/80 transition-all duration-300 transform group-hover:translate-x-1">
                          Professional Trader
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Floating Dropdown Arrow */}
                    <div className="relative group/arrow">
                      {/* Enhanced Background Effects */}
                      <div className="absolute inset-0 bg-white/15 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-cyan-400/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                      {/* Enhanced Arrow with Smooth Transitions */}
                      <ChevronDown
                        className={`relative w-4 h-4 text-white/70 group-hover:text-white transition-all duration-700 ease-out drop-shadow-lg transform ${
                          showUserMenu
                            ? 'rotate-180 scale-125 text-cyan-300'
                            : 'group-hover:scale-110'
                        }`}
                      />

                      {/* Subtle Pulse Effect When Menu is Open */}
                      {showUserMenu && (
                        <div className="absolute inset-0 bg-cyan-400/20 rounded-full animate-ping"></div>
                      )}
                    </div>
                  </button>

                  {/* Enhanced Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 top-full mt-4 w-80 min-w-80 max-w-96 opacity-0 animate-in slide-in-from-top-2 fade-in duration-500"
                      style={{ opacity: 1 }}
                    >
                      <div className="relative">
                        {/* Enhanced Background with Better Visibility */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-black/90 to-gray-800/95 rounded-3xl backdrop-blur-3xl border border-purple-400/40 shadow-2xl"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 to-cyan-500/10 rounded-3xl"></div>
                        {/* Subtle Inner Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl"></div>

                        <div className="relative overflow-hidden rounded-3xl">
                          {/* Floating User Info Header */}
                          <div className="relative p-6 border-b border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 backdrop-blur-sm"></div>
                            <div className="relative flex items-center space-x-4">
                              <div className="relative group/dropdown-avatar">
                                {/* Enhanced Background Effects */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-cyan-500/40 rounded-full blur-lg animate-pulse opacity-60 group-hover:opacity-90 transition-all duration-700"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/25 to-blue-400/25 rounded-full blur-xl opacity-0 group-hover:opacity-80 transition-all duration-1000"></div>

                                {/* Enhanced Avatar with Premium Gradient */}
                                <div className="relative w-14 h-14 bg-gradient-to-br from-purple-600 via-rose-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/40 shadow-2xl transform group-hover:scale-105 transition-all duration-500">
                                  {/* Multi-layer Inner Effects */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

                                  {/* Avatar Content */}
                                  <span className="relative z-10 transform group-hover:scale-110 transition-all duration-300 drop-shadow-lg">
                                    {getUserInitials(user)}
                                  </span>

                                  {/* Premium Shimmer */}
                                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-800">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full transform -rotate-45 animate-pulse"></div>
                                  </div>
                                </div>

                                {/* Enhanced Online Indicator */}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white/60 animate-pulse shadow-xl group-hover:scale-125 transition-all duration-300">
                                  <div className="absolute inset-0 bg-green-300/60 rounded-full animate-ping"></div>
                                  <div className="absolute inset-0.5 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                                </div>

                                {/* Floating Micro Particles */}
                                <div
                                  className="absolute -top-2 -left-2 w-2 h-2 bg-purple-400/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-800 animate-bounce"
                                  style={{ animationDelay: '0.1s' }}
                                ></div>
                                <div
                                  className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-cyan-400/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-600 animate-ping"
                                  style={{ animationDelay: '0.4s' }}
                                ></div>
                                <div
                                  className="absolute -bottom-2 -left-1 w-1 h-1 bg-pink-400/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"
                                  style={{ animationDelay: '0.7s' }}
                                ></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white drop-shadow-sm truncate">
                                  {getUserDisplayName(user)}
                                </div>
                                <div
                                  className="text-sm text-white/70 truncate"
                                  title={user?.email}
                                >
                                  {user?.email}
                                </div>
                                <div className="text-xs text-purple-300 font-medium mt-1">
                                  Professional Trader
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Floating Menu Items */}
                          <div className="relative p-2 space-y-1">
                            {/* Settings */}
                            <button
                              onClick={handleSettingsClick}
                              className="relative w-full flex items-center space-x-4 px-4 py-3 text-left rounded-2xl transition-all duration-300 hover:scale-105 group"
                            >
                              <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"></div>
                              <div className="absolute inset-0 border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                              <div className="relative">
                                <div className="absolute inset-0 bg-gray-400/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                                <div className="relative p-2 rounded-xl">
                                  <Settings className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors drop-shadow-sm" />
                                </div>
                              </div>
                              <div className="relative">
                                <div className="font-medium text-white/90 group-hover:text-white drop-shadow-sm">
                                  Settings
                                </div>
                                <div className="text-xs text-white/60 group-hover:text-white/80">
                                  Preferences & configuration
                                </div>
                              </div>
                            </button>

                            {/* Logout */}
                            <button
                              onClick={handleLogout}
                              className="relative w-full flex items-center space-x-4 px-4 py-3 text-left rounded-2xl transition-all duration-300 hover:scale-105 group"
                            >
                              <div className="absolute inset-0 bg-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"></div>
                              <div className="absolute inset-0 border border-red-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                              <div className="relative">
                                <div className="absolute inset-0 bg-red-400/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                                <div className="relative p-2 rounded-xl">
                                  <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors drop-shadow-sm" />
                                </div>
                              </div>
                              <div className="relative">
                                <div className="font-medium text-white/90 group-hover:text-white drop-shadow-sm">
                                  Logout
                                </div>
                                <div className="text-xs text-white/60 group-hover:text-white/80">
                                  Sign out of your account
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Animated Border Effects */}
        <div className="relative h-[3px] w-full overflow-hidden">
          {/* Primary Gradient Wave */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent animate-pulse"></div>

          {/* Secondary Gradient Wave */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>

          {/* Traveling Light Effect */}
          <div
            className="absolute top-0 h-full w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse opacity-60"
            style={{
              animation: 'slide 3s ease-in-out infinite',
              animationDelay: '2s',
            }}
          ></div>

          {/* Subtle Shimmer */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-300/20 to-transparent animate-pulse"
            style={{ animationDelay: '0.5s' }}
          ></div>
        </div>

        {/* Custom Animation Keyframes */}
        <style>{`
          @keyframes slide {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 0.6; }
            100% { transform: translateX(100vw); opacity: 0; }
          }
        `}</style>
      </header>

      {/* Enhanced Capital Edit Modal */}
      <Modal
        isOpen={showCapitalEdit}
        onClose={() => setShowCapitalEdit(false)}
        title="💰 Configure Trading Capital"
      >
        <div className="space-y-6">
          {/* Header with current level */}
          <div className="text-center space-y-3">
            <p className="text-gray-300 text-sm leading-relaxed">
              Configure your trading capital for optimal position sizing and
              advanced risk management
            </p>
            {tempCapital && (
              <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-slate-800/50 to-gray-800/50 border border-white/10 rounded-full px-4 py-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span
                  className={`text-sm font-bold bg-gradient-to-r ${
                    getCapitalLevel(parseFloat(tempCapital) || 0).color
                  } bg-clip-text text-transparent`}
                >
                  {getCapitalLevel(parseFloat(tempCapital) || 0).level} TRADER
                </span>
                <div
                  className={`w-2 h-2 rounded-full bg-gradient-to-r ${
                    getCapitalLevel(parseFloat(tempCapital) || 0).color
                  } animate-pulse`}
                ></div>
              </div>
            )}
          </div>

          {/* Current Amount Display */}
          <div className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 border border-white/10 rounded-2xl p-6">
            <div className="text-center space-y-3">
              <div className="text-3xl font-bold text-white">
                {tempCapital
                  ? formatCurrency(parseFloat(tempCapital))
                  : formatCurrency(settings.accountBalance)}
              </div>
              <div className="text-lg text-cyan-300 font-semibold">
                {tempCapital
                  ? formatCurrencyShort(parseFloat(tempCapital))
                  : formatCurrencyShort(settings.accountBalance)}
              </div>

              {/* Progress bar showing capital level */}
              {tempCapital && (
                <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${
                      getCapitalLevel(parseFloat(tempCapital) || 0).color
                    } transition-all duration-500`}
                    style={{
                      width: `${
                        getCapitalLevel(parseFloat(tempCapital) || 0).percentage
                      }%`,
                    }}
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
              💡 <strong>Tip:</strong> Your trading capital affects position
              sizing recommendations. Set it to match your actual available
              trading funds for optimal risk management.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EnhancedHeader;
