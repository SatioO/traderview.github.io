import React, { useState, useEffect, useCallback } from 'react';
import {
  Info,
  Shield,
  Zap,
  Package,
  Banknote,
  Flame,
  Scale,
  Receipt,
  AlertTriangle,
  TrendingUp,
  PieChart,
  ArrowUp,
  OctagonX,
  Plus,
  Minus,
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { useTradingSettings } from '../../hooks/useTradingSettings';
import { useSettings } from '../../contexts/SettingsContext';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SettingsModal from '../../components/Settings/SettingsModal';
import EnhancedHeader from '../../components/Header/EnhancedHeader';
import type {
  FormData,
  Calculations,
  Target,
  ChargesBreakdown,
  TabType,
  MarketHealth,
} from './types';

const firebaseConfig = {
  apiKey: 'AIzaSyCgaB_xeab-FEImuUNkTX6oYpdXa48Ztjc',
  authDomain: 'traderview-d3103.firebaseapp.com',
  projectId: 'traderview-d3103',
  storageBucket: 'traderview-d3103.firebasestorage.app',
  messagingSenderId: '902654818714',
  appId: '1:902654818714:web:4d462e4247dacb2aa4a223',
  measurementId: 'G-SPLVKEDZHE',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);

// Helper function to get risk level icons
const getRiskLevelIcon = (): React.ComponentType<{ className?: string }> => {
  // All risk levels use Shield icon (same as allocation levels)
  return Shield;
};

const TradingCalculator: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showCapitalEdit, setShowCapitalEdit] = useState(false);
  const [tempCapital, setTempCapital] = useState('');
  const [showMarketOutlookModal, setShowMarketOutlookModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    accountBalance: 1000000,
    riskPercentage: 0.25,
    entryPrice: 100,
    stopLoss: 95,
    brokerageCost: 0,
    riskOnInvestment: 5.0,
    allocationPercentage: 10.0,
    marketHealth: 'confirmed-uptrend',
  });
  const [activeTab, setActiveTab] = useState<TabType>('risk');
  const [calculations, setCalculations] = useState<Calculations | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [stopLossMode, setStopLossMode] = useState<'price' | 'percentage'>(
    'price'
  );
  const [stopLossPercentage, setStopLossPercentage] = useState<number>(3);
  const [marketSmithData, setMarketSmithData] = useState<{
    condition: string;
    date: string;
    isLoading: boolean;
    error: string | null;
  }>({
    condition: '',
    date: '',
    isLoading: false,
    error: null,
  });

  // Settings integration
  const {
    settings,
    getRiskLevels,
    getAllocationLevels,
    handleMarketHealthChange: updateMarketHealth,
    handleActiveTabChange: updateActiveTab,
    handleRiskLevelChange: updateRiskLevel,
    handleAllocationLevelChange: updateAllocationLevel,
  } = useTradingSettings({
    setFormData,
    setActiveTab,
    setIsDarkMode,
  });

  // Settings context for capital management
  const { settings: settingsContext, updateSettings } = useSettings();

  // Get allocation level thresholds for risk assessment
  const getAllocationThresholds = () => {
    const levels = getAllocationLevels();
    return {
      conservative:
        levels.find((l) => l.id === 'conservative')?.percentage || 10,
      balanced: levels.find((l) => l.id === 'balanced')?.percentage || 20,
      high: levels.find((l) => l.id === 'high')?.percentage || 30,
      extreme: levels.find((l) => l.id === 'extreme')?.percentage || 40,
    };
  };

  // Helper function to get Lucide icon component from icon name
  const getAllocationIcon = (): React.ComponentType<{ className?: string }> => {
    // All allocation levels use Shield icon (same as risk levels)
    return Shield;
  };

  // Calculate brokerage automatically for delivery equity (buy only)
  const calculateBrokerage = useCallback(
    (buyPrice: number, positionSize: number): ChargesBreakdown => {
      const turnoverBuy = buyPrice * positionSize;

      // Charges for delivery equity (buy only)
      const stt = 0.001 * turnoverBuy; // 0.1% on buy side only for delivery
      const transactionCharges = 0.0000297 * turnoverBuy; // 0.00297% NSE on buy side
      const sebiCharges = (10 / 1e7) * turnoverBuy; // ₹10 / crore on buy side
      const gst = 0.18 * (transactionCharges + sebiCharges); // 18% on txn + sebi only
      const stampDuty = 0.00015 * turnoverBuy; // 0.015% on buy only

      const totalCharges =
        stt + transactionCharges + sebiCharges + gst + stampDuty;

      return {
        stt: Number(stt.toFixed(2)),
        transactionCharges: Number(transactionCharges.toFixed(2)),
        sebiCharges: Number(sebiCharges.toFixed(2)),
        gst: Number(gst.toFixed(2)),
        stampDuty: Number(stampDuty.toFixed(2)),
        totalCharges: Number(totalCharges.toFixed(2)),
      };
    },
    []
  );

  // Apply dark mode to document when it changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Format currency in INR
  const formatCurrency = useCallback((amount: number): string => {
    return (
      '₹' +
      amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }, []);

  // Get market health adjustment factor
  const getMarketSizingAdjustment = useCallback(
    (marketHealth: MarketHealth): number => {
      switch (marketHealth) {
        case 'confirmed-uptrend':
          return 1.0; // Full position size
        case 'uptrend-under-pressure':
          return 0.75; // Reduce by 25%
        case 'rally-attempt':
          return 0.5; // Reduce by 50%
        case 'downtrend':
          return 0.25; // Reduce by 75%
        default:
          return 1.0;
      }
    },
    []
  );

  // Get market health display info
  const getMarketSizingInfo = useCallback((marketHealth: MarketHealth) => {
    switch (marketHealth) {
      case 'confirmed-uptrend':
        return {
          label: 'Confirmed Uptrend',
          icon: '🚀',
          color: 'emerald',
          description: 'Strong bullish momentum - Full position sizing',
          sizingLevel: 100,
          adjustment: '100%',
        };
      case 'uptrend-under-pressure':
        return {
          label: 'Uptrend Under Pressure',
          icon: '🔥',
          color: 'yellow',
          description: 'Weakening momentum - Reduced position sizing',
          sizingLevel: 75,
          adjustment: '75%',
        };
      case 'rally-attempt':
        return {
          label: 'Rally Attempt',
          icon: '⚖️',
          color: 'orange',
          description: 'Uncertain direction - Conservative sizing',
          sizingLevel: 50,
          adjustment: '50%',
        };
      case 'downtrend':
        return {
          label: 'Downtrend',
          icon: '🩸',
          color: 'red',
          description: 'Bearish conditions - Minimal position sizing',
          sizingLevel: 25,
          adjustment: '25%',
        };
      default:
        return {
          label: 'Unknown',
          icon: '❓',
          color: 'gray',
          description: 'Market status unclear',
          sizingLevel: 50,
          adjustment: '50%',
        };
    }
  }, []);

  // Fetch MarketSmith market condition
  const fetchMarketSmithData = useCallback(async () => {
    setMarketSmithData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Use a CORS proxy since we're accessing an external site
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl =
        'https://marketsmithindia.com/mstool/marketconditionhistory.jsp';

      const response = await fetch(
        `${proxyUrl}${encodeURIComponent(targetUrl)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();

      // Parse the HTML to extract market condition
      // Look for market condition data in the page
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Try to find market condition - this may need adjustment based on actual page structure
      let condition = 'Unknown';
      let date = new Date().toLocaleDateString();

      // Look for common patterns in MarketSmith pages
      const conditionElements = doc.querySelectorAll('td, span, div');

      for (const element of conditionElements) {
        const text = element.textContent?.trim().toLowerCase() || '';

        if (
          text.includes('confirmed uptrend') ||
          text.includes('confirmed up-trend')
        ) {
          condition = 'Confirmed Uptrend';
          break;
        } else if (text.includes('uptrend under pressure')) {
          condition = 'Uptrend Under Pressure';
          break;
        } else if (text.includes('rally attempt')) {
          condition = 'Rally Attempt';
          break;
        } else if (text.includes('downtrend') || text.includes('down trend')) {
          condition = 'Downtrend';
          break;
        }
      }

      // Try to extract date if available
      const datePattern = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;
      const dateMatch = html.match(datePattern);
      if (dateMatch) {
        date = dateMatch[0];
      }

      setMarketSmithData({
        condition,
        date,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching MarketSmith data:', error);
      setMarketSmithData((prev) => ({
        ...prev,
        isLoading: false,
        error:
          'Unable to fetch MarketSmith data. Please check your internet connection or try again later.',
      }));
    }
  }, []);

  // Map MarketSmith condition to our market sizing
  const mapMarketSmithToHealth = useCallback(
    (condition: string): MarketHealth => {
      const lowerCondition = condition.toLowerCase();

      if (
        lowerCondition.includes('confirmed uptrend') ||
        lowerCondition.includes('confirmed up-trend')
      ) {
        return 'confirmed-uptrend';
      } else if (lowerCondition.includes('uptrend under pressure')) {
        return 'uptrend-under-pressure';
      } else if (lowerCondition.includes('rally attempt')) {
        return 'rally-attempt';
      } else if (
        lowerCondition.includes('downtrend') ||
        lowerCondition.includes('down trend')
      ) {
        return 'downtrend';
      }

      // Default to confirmed uptrend if unknown
      return 'confirmed-uptrend';
    },
    []
  );

  // Auto-fetch MarketSmith data on mount
  useEffect(() => {
    fetchMarketSmithData();
  }, [fetchMarketSmithData]);

  // Initialize stop loss percentage with user settings
  useEffect(() => {
    setStopLossPercentage(settings.defaultStopLossPercentage);
  }, [settings.defaultStopLossPercentage]);

  // Recalculate stop loss price when percentage changes and entry price exists
  useEffect(() => {
    if (formData.entryPrice > 0 && stopLossPercentage > 0) {
      const multiplier = (100 - stopLossPercentage) / 100;
      const newStopLoss = parseFloat(
        (formData.entryPrice * multiplier).toFixed(2)
      );
      setFormData((prev) => ({
        ...prev,
        stopLoss: newStopLoss,
      }));
    }
  }, [stopLossPercentage, formData.entryPrice]);

  // Validate inputs
  const validateInputs = useCallback((): string[] => {
    const { accountBalance, riskPercentage, entryPrice, stopLoss } = formData;
    const newWarnings: string[] = [];

    if (accountBalance <= 0)
      newWarnings.push('Account balance must be positive');
    if (riskPercentage === '' || riskPercentage <= 0 || riskPercentage > 10)
      newWarnings.push('Risk percentage should be between 0.1% and 10%');
    if (entryPrice <= 0) newWarnings.push('Entry price must be positive');
    if (stopLoss <= 0) newWarnings.push('Stop loss must be positive');
    if (stopLoss >= entryPrice)
      newWarnings.push(
        'Stop loss must be below entry price for long positions'
      );
    if (typeof riskPercentage === 'number' && riskPercentage > 3)
      newWarnings.push('Risk percentage above 3% is considered high risk');

    return newWarnings;
  }, [formData]);

  // Calculate position size based on risk-based sizing
  const calculateRiskBasedPositionSize =
    useCallback((): Calculations | null => {
      const validationWarnings = validateInputs();
      setWarnings(validationWarnings);

      if (validationWarnings.length > 0) return null;

      const { accountBalance, riskPercentage, entryPrice, stopLoss } = formData;

      // Return null if riskPercentage is empty
      if (riskPercentage === '') return null;

      const baseRiskAmount = (accountBalance * riskPercentage) / 100;
      const riskPerShare = entryPrice - stopLoss;

      // Calculate position size WITHOUT considering brokerage (pure calculation)
      const basePositionSize = Math.floor(baseRiskAmount / riskPerShare);

      // Apply market sizing adjustment
      const marketSizingAdjustment = getMarketSizingAdjustment(
        formData.marketHealth
      );
      const adjustedPositionSize = basePositionSize * marketSizingAdjustment;
      const positionSize = Math.max(1, Math.floor(adjustedPositionSize)); // Ensure minimum position size of 1

      // Calculate adjusted risk amount based on market health sizing
      const riskAmount = baseRiskAmount * marketSizingAdjustment;

      // Calculate brokerage for this position size
      const chargesBreakdown = calculateBrokerage(entryPrice, positionSize);

      const totalInvestment = positionSize * entryPrice;
      const portfolioPercentage = (totalInvestment / accountBalance) * 100;

      // Calculate breakeven price (entry price + brokerage cost per share)
      const brokerageCostPerShare =
        chargesBreakdown.totalCharges / positionSize;
      const breakEvenPrice = entryPrice + brokerageCostPerShare;

      return {
        accountBalance,
        riskPercentage,
        riskAmount,
        entryPrice,
        stopLoss,
        brokerageCost: chargesBreakdown.totalCharges,
        riskPerShare,
        positionSize,
        totalInvestment,
        portfolioPercentage,
        chargesBreakdown,
        breakEvenPrice,
      };
    }, [
      formData,
      validateInputs,
      calculateBrokerage,
      getMarketSizingAdjustment,
    ]);

  // Calculate position size based on allocation-based sizing
  const calculateAllocationBasedPositionSize =
    useCallback((): Calculations | null => {
      const validationWarnings = validateInputs();
      setWarnings(validationWarnings);

      if (validationWarnings.length > 0) return null;

      const { accountBalance, allocationPercentage, entryPrice, stopLoss } =
        formData;

      // Return null if allocationPercentage is empty
      if (allocationPercentage === '') return null;

      const allocationAmount = (accountBalance * allocationPercentage) / 100;
      const basePositionSize = Math.floor(allocationAmount / entryPrice);

      // Apply market sizing adjustment
      const marketSizingAdjustment = getMarketSizingAdjustment(
        formData.marketHealth
      );
      const adjustedPositionSize = basePositionSize * marketSizingAdjustment;
      const positionSize = Math.max(1, Math.floor(adjustedPositionSize)); // Ensure minimum position size of 1

      // Calculate brokerage for this position size
      const chargesBreakdown = calculateBrokerage(entryPrice, positionSize);

      const totalInvestment = positionSize * entryPrice;
      const portfolioPercentage = (totalInvestment / accountBalance) * 100;

      // Calculate actual risk
      const riskPerShare = entryPrice - stopLoss;
      const riskAmount = positionSize * riskPerShare;
      const riskPercentage = (riskAmount / accountBalance) * 100;

      // Calculate breakeven price (entry price + brokerage cost per share)
      const brokerageCostPerShare =
        chargesBreakdown.totalCharges / positionSize;
      const breakEvenPrice = entryPrice + brokerageCostPerShare;

      return {
        accountBalance,
        riskPercentage,
        riskAmount,
        entryPrice,
        stopLoss,
        brokerageCost: chargesBreakdown.totalCharges,
        riskPerShare,
        positionSize,
        totalInvestment,
        portfolioPercentage,
        chargesBreakdown,
        breakEvenPrice,
      };
    }, [
      formData,
      validateInputs,
      calculateBrokerage,
      getMarketSizingAdjustment,
    ]);

  // Calculate position size based on active tab
  const calculatePositionSize = useCallback((): Calculations | null => {
    return activeTab === 'risk'
      ? calculateRiskBasedPositionSize()
      : calculateAllocationBasedPositionSize();
  }, [
    activeTab,
    calculateRiskBasedPositionSize,
    calculateAllocationBasedPositionSize,
  ]);

  // Update calculations when form data or active tab changes
  useEffect(() => {
    const result = calculatePositionSize();
    setCalculations(result);
  }, [calculatePositionSize, activeTab]);

  const handleMarketSizingChange = (health: MarketHealth) => {
    setFormData({ ...formData, marketHealth: health });
    updateMarketHealth(health);
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

  const handleCapitalSave = () => {
    const newAmount = parseFloat(tempCapital.replace(/,/g, ''));
    if (!isNaN(newAmount) && newAmount > 0) {
      updateSettings({ accountBalance: newAmount });
      setFormData({ ...formData, accountBalance: newAmount });
    }
    setShowCapitalEdit(false);
    setTempCapital('');
  };

  const handleIncrement = (step: number) => {
    const current = parseFloat(tempCapital) || 0;
    const newAmount = Math.max(0, current + step);
    setTempCapital(newAmount.toString());
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

  // Handle input changes with automatic calculations
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string): void => {
      let processedValue: number | '' = parseFloat(value) || 0;

      // Handle empty string for riskPercentage and allocationPercentage
      if (
        (field === 'riskPercentage' || field === 'allocationPercentage') &&
        value === ''
      ) {
        processedValue = '';
      }

      setFormData((prev) => {
        const newData: FormData = { ...prev, [field]: processedValue };

        // Auto-calculate stop loss when entry price is entered (using user's default percentage)
        if (field === 'entryPrice' && processedValue && processedValue > 0) {
          const defaultStopLossPercentage =
            settings.defaultStopLossPercentage || 3; // Use user setting or default to 3%
          const multiplier = (100 - defaultStopLossPercentage) / 100; // Convert percentage to multiplier
          newData.stopLoss = parseFloat(
            (processedValue * multiplier).toFixed(2)
          ); // Calculate stop loss based on user preference

          // Reset stop loss percentage to default when entry price changes
          setStopLossPercentage(defaultStopLossPercentage);
        }

        // Auto-calculate risk on investment when stop loss or entry price changes (for risk-based sizing)
        if (
          activeTab === 'risk' &&
          (field === 'stopLoss' || (field === 'entryPrice' && prev.stopLoss))
        ) {
          const entryPrice =
            field === 'entryPrice'
              ? (processedValue as number)
              : prev.entryPrice;
          const stopLoss =
            field === 'stopLoss' ? (processedValue as number) : prev.stopLoss;

          if (entryPrice > 0 && stopLoss > 0 && stopLoss < entryPrice) {
            newData.riskOnInvestment =
              ((entryPrice - stopLoss) / entryPrice) * 100;
          }
        }

        return newData;
      });
    },
    [activeTab, settings.defaultStopLossPercentage]
  );

  // Generate R-multiple targets
  const generateTargets = useCallback((): Target[] => {
    if (!calculations) return [];

    const rMultiples = [1, 2, 3, 4, 5, 6];
    return rMultiples.map((r) => {
      const targetPrice =
        calculations.entryPrice + r * calculations.riskPerShare;
      const grossProfit =
        (targetPrice - calculations.entryPrice) * calculations.positionSize;

      // For delivery equity, we only consider buy-side charges in our calculator
      // Exit charges would be separate when actually selling
      const netProfit = grossProfit; // No additional exit charges for position sizing calculation
      const returnPercentage = (netProfit / calculations.totalInvestment) * 100;
      const portfolioGainPercentage =
        (netProfit / calculations.accountBalance) * 100;

      return {
        r,
        targetPrice,
        netProfit,
        returnPercentage,
        portfolioGainPercentage,
        chargesBreakdown: calculations.chargesBreakdown, // Same buy-side charges
      };
    });
  }, [calculations]);

  const targets = generateTargets();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      {/* Enhanced Header with Market Outlook */}
      <EnhancedHeader
        isSettingsOpen={isSettingsOpen}
        onSettingsToggle={setIsSettingsOpen}
      />
      {/* Gaming Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-3000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      ></div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gaming Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-cyan-500/30 sticky top-8 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-cyan-500/20 hover:shadow-2xl">
              {/* Market Outlook - Fixed Compact Design */}
              <div className="mb-6">
                <div
                  className="flex items-center justify-between px-3 py-3 rounded-2xl bg-black/30 border border-green-500/20 cursor-pointer hover:border-green-400/40 transition-all duration-300 hover:bg-black/40"
                  onClick={() => setShowMarketOutlookModal(true)}
                >
                  {/* Left - Status & Title */}
                  <div className="flex items-center space-x-3">
                    {/* Creative Market Icon */}
                    <div className="relative">
                      <svg
                        className={`w-5 h-5 transition-colors duration-300 ${
                          formData.marketHealth === 'confirmed-uptrend'
                            ? 'text-green-400'
                            : formData.marketHealth === 'uptrend-under-pressure'
                            ? 'text-yellow-400'
                            : formData.marketHealth === 'rally-attempt'
                            ? 'text-orange-400'
                            : 'text-red-400'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      {/* Subtle glow effect */}
                      <div
                        className={`absolute inset-0 blur-sm opacity-30 ${
                          formData.marketHealth === 'confirmed-uptrend'
                            ? 'bg-green-400'
                            : formData.marketHealth === 'uptrend-under-pressure'
                            ? 'bg-yellow-400'
                            : formData.marketHealth === 'rally-attempt'
                            ? 'bg-orange-400'
                            : 'bg-red-400'
                        }`}
                      ></div>
                    </div>
                    <span className="text-white font-medium text-sm">
                      MARKET OUTLOOK
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-8 bg-gray-600/40"></div>

                  {/* Center - Condition */}
                  <div className="text-center">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">
                      CONDITION
                    </div>
                    <div
                      className={`font-semibold text-sm ${
                        formData.marketHealth === 'confirmed-uptrend'
                          ? 'text-green-300'
                          : formData.marketHealth === 'uptrend-under-pressure'
                          ? 'text-yellow-300'
                          : formData.marketHealth === 'rally-attempt'
                          ? 'text-orange-300'
                          : 'text-red-300'
                      }`}
                    >
                      {getMarketSizingInfo(formData.marketHealth).label}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-8 bg-gray-600/40"></div>

                  {/* Right - Sizing & Arrow */}
                  <div className="flex items-center space-x-2">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">
                        SIZING
                      </div>
                      <div className="text-orange-400 font-bold text-sm">
                        {getMarketSizingInfo(formData.marketHealth).adjustment}
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-white/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Creative Tile-Style Mode Selector */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 p-3 bg-black/20 rounded-2xl backdrop-blur-sm border border-purple-500/20">
                  {/* Risk Mode Tile */}
                  <button
                    onClick={() => {
                      setActiveTab('risk');
                      updateActiveTab('risk');
                    }}
                    className={`group relative p-4 text-sm font-bold rounded-xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden ${
                      activeTab === 'risk'
                        ? 'border-red-400 bg-red-500/10 shadow-lg shadow-red-500/30 text-red-300 transform scale-105'
                        : 'border-purple-500/30 bg-black/30 text-purple-300 hover:border-red-400/50 hover:bg-red-500/5 hover:text-red-300'
                    }`}
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 opacity-20">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                          activeTab === 'risk'
                            ? 'from-red-600/40 via-pink-600/40 to-orange-600/40 animate-pulse'
                            : 'from-transparent to-transparent'
                        }`}
                      ></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center space-y-2">
                      {/* Icon with glow effect */}
                      <div
                        className={`relative transition-all duration-300 group-hover:scale-110`}
                      >
                        <TrendingUp
                          className={`w-6 h-6 transition-colors duration-300 ${
                            activeTab === 'risk'
                              ? 'text-red-400'
                              : 'text-purple-400 group-hover:text-red-400'
                          }`}
                        />
                      </div>

                      {/* Title */}
                      <div className="text-center">
                        <div className="font-bold text-sm mb-1">RISK MODE</div>
                        <div className="text-xs opacity-75">High Stakes</div>
                      </div>
                    </div>

                    {/* Achievement indicator */}
                    {activeTab === 'risk' && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse">
                        <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping opacity-30"></div>
                      </div>
                    )}

                    {/* Shimmer effect */}
                    {activeTab === 'risk' && (
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                    )}
                  </button>

                  {/* Allocation Mode Tile */}
                  <button
                    onClick={() => {
                      setActiveTab('allocation');
                      updateActiveTab('allocation');
                    }}
                    className={`group relative p-4 text-sm font-bold rounded-xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden ${
                      activeTab === 'allocation'
                        ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/30 text-blue-300 transform scale-105'
                        : 'border-purple-500/30 bg-black/30 text-purple-300 hover:border-blue-400/50 hover:bg-blue-500/5 hover:text-blue-300'
                    }`}
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 opacity-20">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                          activeTab === 'allocation'
                            ? 'from-blue-600/40 via-cyan-600/40 to-purple-600/40 animate-pulse'
                            : 'from-transparent to-transparent'
                        }`}
                      ></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center space-y-2">
                      {/* Icon with glow effect */}
                      <div
                        className={`relative transitio
                          n-all duration-300 'group-hover:scale-110`}
                      >
                        <PieChart
                          className={`w-6 h-6 transition-colors duration-300 ${
                            activeTab === 'allocation'
                              ? 'text-blue-400'
                              : 'text-purple-400 group-hover:text-blue-400'
                          }`}
                        />
                      </div>

                      {/* Title */}
                      <div className="text-center">
                        <div className="font-bold text-sm mb-1">
                          ALLOCATION MODE
                        </div>
                        <div className="text-xs opacity-75">Strategic</div>
                      </div>
                    </div>

                    {/* Achievement indicator */}
                    {activeTab === 'allocation' && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse">
                        <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-ping opacity-30"></div>
                      </div>
                    )}

                    {/* Shimmer effect */}
                    {activeTab === 'allocation' && (
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Gaming Battle Setup */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30 backdrop-blur-sm">
                {/* Enhanced Risk-Based Sizing Tab */}
                {activeTab === 'risk' && (
                  <div className="relative overflow-hidden">
                    {/* Risk Level Header with Dynamic Meter */}
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-purple-300 flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Risk Level
                        <Info
                          className="inline w-4 h-4 ml-2 text-purple-400 cursor-help"
                          xlinkTitle="Strategic allocation of your portfolio to this trade"
                        />
                      </label>

                      {/* Real-time Risk Meter */}
                      <div className="flex items-center space-x-4">
                        <div className="text-xs text-purple-300">
                          THREAT LEVEL
                        </div>
                        <div className="relative w-16 h-2 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                ((Number(formData.riskPercentage) || 0) * 100) /
                                  3,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            (Number(formData.riskPercentage) || 0) >= 3
                              ? 'text-red-400 animate-pulse'
                              : (Number(formData.riskPercentage) || 0) > 2
                              ? 'text-orange-400'
                              : (Number(formData.riskPercentage) || 0) > 1
                              ? 'text-yellow-400'
                              : 'text-green-400'
                          }`}
                        >
                          {(Number(formData.riskPercentage) || 0) >= 3
                            ? 'EXTREME'
                            : (Number(formData.riskPercentage) || 0) > 2
                            ? 'HIGH'
                            : (Number(formData.riskPercentage) || 0) > 1
                            ? 'MED'
                            : 'LOW'}
                        </div>
                      </div>
                    </div>

                    {/* Risk Level Buttons - Matching Allocation Style */}
                    <div className="grid grid-cols-4 gap-2 mb-4 p-2">
                      {getRiskLevels().map((riskLevel, index) => {
                        const riskColors = [
                          'emerald',
                          'yellow',
                          'orange',
                          'red',
                        ];
                        const isSelected =
                          Number(formData.riskPercentage) ===
                          riskLevel.percentage;

                        return (
                          <button
                            key={riskLevel.id}
                            onClick={() => {
                              handleInputChange(
                                'riskPercentage',
                                riskLevel.percentage.toString()
                              );
                              updateRiskLevel(riskLevel.id);
                            }}
                            className={`group relative py-3 px-2 text-xs font-bold rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                              isSelected
                                ? `border-${riskColors[index]}-400 bg-${riskColors[index]}-500/10 shadow-lg shadow-${riskColors[index]}-500/30 text-${riskColors[index]}-300 transform scale-105`
                                : `border-purple-500/30 bg-black/30 text-purple-300 hover:border-${riskColors[index]}-400/50 hover:bg-${riskColors[index]}-500/5 hover:text-${riskColors[index]}-300`
                            }`}
                            title={riskLevel.description}
                          >
                            <div className="flex flex-col items-center space-y-1">
                              <div
                                className={`text-${riskColors[index]}-400 transition-colors duration-300`}
                              >
                                {React.createElement(getRiskLevelIcon(), {
                                  className: 'w-4 h-4',
                                })}
                              </div>
                              <div className="text-sm font-bold">
                                {riskLevel.percentage}%
                              </div>
                              <div className="text-xs opacity-75">
                                {riskLevel.name
                                  .replace(' play', '')
                                  .replace(' approach', '')
                                  .replace(' strategy', '')
                                  .replace(' risk', '')}
                              </div>
                            </div>

                            {isSelected && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Enhanced Input Field - Always Visible */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur-sm"></div>
                      <input
                        type="number"
                        value={
                          formData.riskPercentage === ''
                            ? ''
                            : formData.riskPercentage
                        }
                        onChange={(e) => {
                          handleInputChange('riskPercentage', e.target.value);
                        }}
                        className="relative w-full px-4 py-3 bg-black/40 border-2 border-purple-500/50 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-purple-300/50 font-mono text-lg transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/20"
                        min="0.25"
                        max="10"
                        step="0.25"
                        placeholder="Enter risk %..."
                      />
                    </div>
                  </div>
                )}

                {/* Enhanced Allocation-Based Sizing Tab */}
                {activeTab === 'allocation' && (
                  <div className="relative overflow-hidden">
                    {/* Allocation Header with Portfolio Visualization */}
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-purple-300 flex items-center">
                        <span className="mr-2">🎯</span>
                        Portfolio Allocation Level
                        <Info
                          className="inline w-4 h-4 ml-2 text-purple-400 cursor-help"
                          xlinkTitle="Strategic allocation of your portfolio to this trade"
                        />
                      </label>

                      {/* Real-time Allocation Meter */}
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-blue-300">ALLOCATION</div>
                        <div className="relative w-16 h-2 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                Number(formData.allocationPercentage) || 0,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            (Number(formData.allocationPercentage) || 0) >
                            getAllocationThresholds().high
                              ? 'text-red-400'
                              : (Number(formData.allocationPercentage) || 0) >
                                getAllocationThresholds().balanced
                              ? 'text-yellow-400'
                              : 'text-green-400'
                          }`}
                        >
                          {(Number(formData.allocationPercentage) || 0) >
                          getAllocationThresholds().high
                            ? 'HIGH'
                            : (Number(formData.allocationPercentage) || 0) >
                              getAllocationThresholds().balanced
                            ? 'MED'
                            : 'LOW'}
                        </div>
                      </div>
                    </div>

                    {/* Quick Allocation Buttons */}
                    <div className="grid grid-cols-4 gap-2 mb-4 p-2">
                      {getAllocationLevels().map((allocationLevel, index) => {
                        const allocationColors = [
                          'emerald',
                          'blue',
                          'orange',
                          'red',
                        ];
                        const isSelected =
                          Number(formData.allocationPercentage) ===
                          allocationLevel.percentage;

                        return (
                          <button
                            key={allocationLevel.id}
                            onClick={() => {
                              handleInputChange(
                                'allocationPercentage',
                                allocationLevel.percentage.toString()
                              );
                              updateAllocationLevel(allocationLevel.id);
                            }}
                            className={`group relative py-3 px-2 text-xs font-bold rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                              isSelected
                                ? `border-${allocationColors[index]}-400 bg-${allocationColors[index]}-500/10 shadow-lg shadow-${allocationColors[index]}-500/30 text-${allocationColors[index]}-300 transform scale-105`
                                : `border-purple-500/30 bg-black/30 text-purple-300 hover:border-${allocationColors[index]}-400/50 hover:bg-${allocationColors[index]}-500/5 hover:text-${allocationColors[index]}-300`
                            }`}
                          >
                            <div className="flex flex-col items-center space-y-1">
                              <div
                                className={`text-${allocationColors[index]}-400 transition-colors duration-300`}
                              >
                                {React.createElement(getAllocationIcon(), {
                                  className: 'w-4 h-4',
                                })}
                              </div>
                              <div className="text-sm font-bold">
                                {allocationLevel.percentage}%
                              </div>
                              <div className="text-xs opacity-75">
                                {allocationLevel.name.replace(
                                  ' allocation',
                                  ''
                                )}
                              </div>
                            </div>

                            {isSelected && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Enhanced Input Field */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl blur-sm"></div>
                      <input
                        type="number"
                        value={
                          formData.allocationPercentage === ''
                            ? ''
                            : formData.allocationPercentage
                        }
                        onChange={(e) =>
                          handleInputChange(
                            'allocationPercentage',
                            e.target.value
                          )
                        }
                        className="relative w-full px-4 py-3 bg-black/40 border-2 border-blue-500/50 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-white placeholder-blue-300/50 font-mono text-lg transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/20"
                        min="5"
                        max="100"
                        step="5"
                        placeholder="Enter allocation %..."
                      />
                    </div>
                  </div>
                )}

                {/* Gaming Price Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-green-300 mb-2">
                      <ArrowUp className="inline w-4 h-4 mr-1 text-green-400" />
                      Entry Price
                      <Info className="inline w-4 h-4 ml-1 text-green-400 cursor-help" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={
                          formData.entryPrice !== 0 ? formData.entryPrice : ''
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange('entryPrice', value);
                        }}
                        className="w-full px-4 py-3 pl-10 bg-black/40 border-2 border-green-500/50 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-400/20 text-white placeholder-green-300/50 font-mono transition-all duration-300 focus:shadow-lg focus:shadow-green-500/20"
                        min="0"
                        step="0.1"
                        placeholder="0.00"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
                        ₹
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-red-300 mb-2">
                      <OctagonX className="inline w-4 h-4 mr-1 text-red-400" />
                      Stop Loss
                      <Info className="inline w-4 h-4 ml-1 text-red-400 cursor-help" />
                    </label>

                    {stopLossMode === 'price' ? (
                      // Price Mode
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.stopLoss || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleInputChange('stopLoss', value);
                              // Auto-calculate percentage
                              if (
                                formData.entryPrice > 0 &&
                                parseFloat(value) > 0
                              ) {
                                const percentage =
                                  ((formData.entryPrice - parseFloat(value)) /
                                    formData.entryPrice) *
                                  100;
                                setStopLossPercentage(
                                  Math.round(percentage * 100) / 100
                                );
                              }
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value > 0) {
                                handleInputChange('stopLoss', value.toFixed(2));
                              }
                            }}
                            className="w-full px-4 py-3 pl-10 pr-20 bg-black/40 border-2 border-red-500/50 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-400/20 text-white placeholder-red-300/50 font-mono transition-all duration-300 focus:shadow-lg focus:shadow-red-500/20"
                            min="0"
                            step="0.01"
                            placeholder="Enter stop loss price"
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400">
                            ₹
                          </span>

                          {/* Mode Toggle on same row */}
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex bg-black/60 rounded-lg p-1 border border-red-500/30">
                            <button
                              type="button"
                              onClick={() => setStopLossMode('price')}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                                stopLossMode === 'price'
                                  ? 'bg-red-500/30 text-red-300 border border-red-400/50'
                                  : 'text-red-400/70 hover:text-red-300'
                              }`}
                            >
                              ₹
                            </button>
                            <button
                              type="button"
                              onClick={() => setStopLossMode('percentage')}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                                // @ts-expect-error - TypeScript incorrectly flags this as impossible comparison
                                stopLossMode === 'percentage'
                                  ? 'bg-red-500/30 text-red-300 border border-red-400/50'
                                  : 'text-red-400/70 hover:text-red-300'
                              }`}
                            >
                              %
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Percentage Mode
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="number"
                            value={stopLossPercentage || ''}
                            onChange={(e) => {
                              const percentage = parseFloat(e.target.value);
                              setStopLossPercentage(percentage);
                              // Auto-calculate price
                              if (formData.entryPrice > 0 && percentage > 0) {
                                const stopPrice =
                                  formData.entryPrice * (1 - percentage / 100);
                                handleInputChange(
                                  'stopLoss',
                                  stopPrice.toFixed(2)
                                );
                              }
                            }}
                            className="w-full px-4 py-3 pl-10 pr-20 bg-black/40 border-2 border-red-500/50 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-400/20 text-white placeholder-red-300/50 font-mono transition-all duration-300 focus:shadow-lg focus:shadow-red-500/20"
                            min="0"
                            max="50"
                            step="0.1"
                            placeholder="Enter risk %"
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400">
                            %
                          </span>

                          {/* Mode Toggle on same row */}
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex bg-black/60 rounded-lg p-1 border border-red-500/30">
                            <button
                              type="button"
                              onClick={() => setStopLossMode('price')}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                                // @ts-expect-error - TypeScript incorrectly flags this as impossible comparison
                                stopLossMode === 'price'
                                  ? 'bg-red-500/30 text-red-300 border border-red-400/50'
                                  : 'text-red-400/70 hover:text-red-300'
                              }`}
                            >
                              ₹
                            </button>
                            <button
                              type="button"
                              onClick={() => setStopLossMode('percentage')}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                                stopLossMode === 'percentage'
                                  ? 'bg-red-500/30 text-red-300 border border-red-400/50'
                                  : 'text-red-400/70 hover:text-red-300'
                              }`}
                            >
                              %
                            </button>
                          </div>
                        </div>

                        {/* Quick Preset Buttons - From Settings */}
                        <div className="flex justify-center flex-wrap gap-2">
                          {settings.stopLossLevels
                            .filter((level) =>
                              ['tight', 'normal', 'loose', 'wide'].includes(
                                level.id
                              )
                            )
                            .map((level) => (
                              <button
                                key={level.id}
                                type="button"
                                onClick={() => {
                                  setStopLossPercentage(level.percentage);
                                  if (formData.entryPrice > 0) {
                                    const stopPrice =
                                      formData.entryPrice *
                                      (1 - level.percentage / 100);
                                    handleInputChange(
                                      'stopLoss',
                                      stopPrice.toFixed(2)
                                    );
                                  }
                                }}
                                className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 transition-all duration-200 hover:scale-105"
                              >
                                {level.percentage}%
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Label Based on Mode */}
                    {formData.entryPrice > 0 &&
                      formData.stopLoss > 0 &&
                      formData.stopLoss < formData.entryPrice && (
                        <div className="mt-3 text-center">
                          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/40 rounded-lg px-3 py-1">
                            {stopLossMode === 'price' ? (
                              <>
                                <span className="text-xs text-yellow-300">
                                  ⚠️ Trade Risk:
                                </span>
                                <span className="text-sm font-bold text-orange-300">
                                  {(
                                    ((formData.entryPrice - formData.stopLoss) /
                                      formData.entryPrice) *
                                    100
                                  ).toFixed(2)}
                                  %
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs text-yellow-300">
                                  💰 Stop Loss:
                                </span>
                                <span className="text-sm font-bold text-orange-300">
                                  ₹{formData.stopLoss}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gaming Results Arena */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-500">
              {/* Gaming Alert System */}
              {warnings.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-2xl backdrop-blur-sm animate-pulse">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                      <span className="text-black font-bold">!</span>
                    </div>
                    <div className="font-bold text-orange-300">
                      🚨 SYSTEM ALERTS
                    </div>
                  </div>
                  <ul className="text-orange-200 text-sm space-y-1 ml-10">
                    {warnings.map((warning, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="text-orange-400">▶</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Enhanced Achievement Dashboard - Coinbase-Style Security Focus */}
              {calculations && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {/* Position Size Achievement with Progress */}
                    <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-blue-500/20 hover:border-blue-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                      {/* Robinhood-style celebration particles */}
                      <div className="absolute inset-0 overflow-hidden rounded-3xl">
                        <div className="absolute top-2 left-2 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                        <div className="absolute top-4 right-6 w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping delay-100"></div>
                        <div className="absolute bottom-6 left-8 w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping delay-200"></div>
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-4xl">
                            <Package className="w-10 h-10 text-blue-400" />
                          </div>
                          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 rounded-lg px-2 py-1">
                            <div className="text-xs text-blue-300 font-bold">
                              LOCKED
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-xs text-blue-300 mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1"></span>
                            POSITION SIZE
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">
                            {calculations.positionSize.toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-200">
                            units secured
                          </div>
                        </div>

                        {/* Achievement progress bar */}
                        <div className="relative h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 rounded-full w-full transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-blue-500/30"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Investment with Portfolio Allocation */}
                    <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-green-500/20 hover:border-green-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-emerald-600/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                      <div className="absolute inset-0 overflow-hidden rounded-3xl">
                        <div className="absolute top-3 left-4 w-1 h-1 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                        <div className="absolute bottom-4 right-6 w-1 h-1 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping delay-150"></div>
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-4xl">
                            <Banknote className="w-10 h-10 text-green-400" />
                          </div>
                          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-lg px-2 py-1">
                            <div className="text-xs text-green-300 font-bold">
                              DEPLOYED
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-xs text-green-300 mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                            CAPITAL INVESTMENT
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(calculations.totalInvestment)}
                          </div>
                          <div className="text-xs text-green-200">
                            {calculations.portfolioPercentage.toFixed(1)}% of
                            portfolio
                          </div>
                        </div>

                        {/* Portfolio allocation meter */}
                        <div className="relative h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-full transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-green-500/30"
                            style={{
                              width: `${Math.min(
                                calculations.portfolioPercentage * 3,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Analysis with Warning System */}
                    <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-red-500/20 hover:border-red-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-pink-600/10 to-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                      <div className="absolute inset-0 overflow-hidden rounded-3xl">
                        <div className="absolute top-2 right-4 w-1 h-1 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                        <div className="absolute bottom-6 left-6 w-1 h-1 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping delay-100"></div>
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-4xl">
                            <Flame className="w-10 h-10 text-red-400" />
                          </div>
                          <div
                            className={`border rounded-lg px-2 py-1 ${
                              calculations.riskPercentage > 2
                                ? 'bg-gradient-to-r from-red-500/30 to-orange-500/30 border-red-500/50'
                                : 'bg-gradient-to-r from-yellow-500/20 to-red-500/20 border-yellow-500/40'
                            }`}
                          >
                            <div
                              className={`text-xs font-bold ${
                                calculations.riskPercentage > 2
                                  ? 'text-red-300'
                                  : 'text-yellow-300'
                              }`}
                            >
                              {calculations.riskPercentage > 2
                                ? 'HIGH'
                                : 'MODERATE'}
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-xs text-red-300 mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1"></span>
                            RISK EXPOSURE
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(calculations.riskAmount)}
                          </div>
                          <div className="text-xs text-red-200">
                            {calculations.riskPercentage.toFixed(2)}% portfolio
                            impact
                          </div>
                        </div>

                        {/* Risk level indicator */}
                        <div className="relative h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 rounded-full transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-red-500/30"
                            style={{
                              width: `${Math.min(
                                calculations.riskPercentage * 20,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Breakeven Analysis */}
                    <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-orange-500/20 hover:border-orange-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-amber-600/10 to-yellow-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-4xl">
                            <Scale className="w-10 h-10 text-orange-400" />
                          </div>
                          <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 rounded-lg px-2 py-1">
                            <div className="text-xs text-orange-300 font-bold">
                              BALANCE
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-xs text-orange-300 mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-1"></span>
                            BREAKEVEN PRICE
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(calculations.breakEvenPrice)}
                          </div>
                          <div className="text-xs text-orange-200">
                            survival line
                          </div>
                        </div>

                        <div className="relative h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 rounded-full w-3/4 transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-orange-500/30"></div>
                        </div>
                      </div>
                    </div>

                    {/* Brokerage Cost Analysis */}
                    <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-indigo-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-4xl">
                            <Receipt className="w-10 h-10 text-purple-400" />
                          </div>
                          <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 rounded-lg px-2 py-1">
                            <div className="text-xs text-purple-300 font-bold">
                              AUTO
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-xs text-purple-300 mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1"></span>
                            BROKERAGE COST
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(calculations.brokerageCost)}
                          </div>
                          <div className="text-xs text-purple-200">
                            buy side (auto-calculated)
                          </div>
                        </div>

                        <div className="relative h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 rounded-full w-1/4 transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-purple-500/30"></div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Per Share Detail */}
                    <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-teal-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-4xl">
                            <AlertTriangle className="w-10 h-10 text-cyan-400" />
                          </div>
                          <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 rounded-lg px-2 py-1">
                            <div className="text-xs text-cyan-300 font-bold">
                              UNIT
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-xs text-cyan-300 mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-1"></span>
                            RISK PER SHARE
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(calculations.riskPerShare)}
                          </div>
                          <div className="text-xs text-cyan-200">
                            per unit risk
                          </div>
                        </div>

                        <div className="relative h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-400 rounded-full w-2/3 transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-cyan-500/30"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Animated Profit Command Center */}
              <div className="mb-6">
                {/* Gaming-style Profit Dashboard */}
                <div className="relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/30 overflow-hidden">
                  {/* Animated Background Grid */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-grid-pattern animate-pulse"></div>
                  </div>

                  {/* Interactive Profit Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                    {targets.map((target, index) => {
                      const colors = [
                        'from-green-400 to-emerald-600',
                        'from-blue-400 to-cyan-600',
                        'from-purple-400 to-violet-600',
                        'from-pink-400 to-rose-600',
                        'from-orange-400 to-yellow-600',
                        'from-red-400 to-pink-600',
                      ];
                      const borderColors = [
                        'border-green-400/40',
                        'border-blue-400/40',
                        'border-purple-400/40',
                        'border-pink-400/40',
                        'border-orange-400/40',
                        'border-red-400/40',
                      ];
                      const glowColors = [
                        'shadow-green-400/30',
                        'shadow-blue-400/30',
                        'shadow-purple-400/30',
                        'shadow-pink-400/30',
                        'shadow-orange-400/30',
                        'shadow-red-400/30',
                      ];

                      return (
                        <div
                          key={index}
                          className={`group relative bg-gradient-to-br from-black/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-4 border-2 ${borderColors[index]} hover:border-white/50 transition-all duration-500 cursor-pointer hover:scale-105 ${glowColors[index]} hover:shadow-xl`}
                          style={{
                            animationDelay: `${index * 0.1}s`,
                          }}
                        >
                          {/* Animated Power Level Indicator */}
                          <div className="absolute top-2 right-2 flex space-x-1">
                            {Array.from({ length: target.r }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"
                                style={{
                                  animationDelay: `${i * 0.2}s`,
                                }}
                              ></div>
                            ))}
                          </div>

                          {/* R-Multiple Badge */}
                          <div className="flex items-center justify-center mb-3">
                            <div
                              className={`w-12 h-12 bg-gradient-to-r ${colors[index]} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:animate-pulse`}
                            >
                              {target.r}R
                            </div>
                          </div>

                          {/* Critical Information - Always Visible */}
                          <div className="space-y-3">
                            {/* Profit Display */}
                            <div className="text-center">
                              <div className="text-xs text-green-300 mb-1">
                                💰 PROFIT
                              </div>
                              <div className="text-sm font-bold text-green-400">
                                {formatCurrency(target.netProfit)}
                              </div>
                            </div>

                            {/* Portfolio Impact with Animated Bar */}
                            <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-400/30 rounded-lg p-2">
                              <div className="text-xs text-orange-200 mb-1">
                                📊 PF IMPACT
                              </div>
                              <div className="text-sm font-bold text-orange-300 mb-2">
                                +{target.portfolioGainPercentage.toFixed(2)}%
                              </div>
                              {/* Animated Progress Bar */}
                              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full transition-all duration-2000 ease-out"
                                  style={{
                                    width: `${Math.min(
                                      target.portfolioGainPercentage * 10,
                                      100
                                    )}%`,
                                    animationDelay: `${index * 0.3}s`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* ROI Display */}
                            <div className="text-center">
                              <div className="text-xs text-blue-300 mb-1">
                                🎯 ROI
                              </div>
                              <div className="text-sm font-bold text-blue-400">
                                {target.returnPercentage.toFixed(1)}%
                              </div>
                            </div>

                            {/* Target Price */}
                            <div className="text-center">
                              <div className="text-xs text-purple-300 mb-1">
                                🎯 TARGET
                              </div>
                              <div className="text-xs font-bold text-white">
                                {formatCurrency(target.targetPrice)}
                              </div>
                            </div>
                          </div>

                          {/* Animated Power Up Effect */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Capital Edit Modal */}
      <Modal
        isOpen={showCapitalEdit}
        onClose={() => setShowCapitalEdit(false)}
        title="🚀 Set Your Trading Capital"
      >
        <div className="space-y-6">
          {/* Header with current level */}
          <div className="text-center space-y-2">
            <p className="text-gray-300 text-sm">
              Configure your trading capital for accurate position sizing and
              risk management
            </p>
            {tempCapital && (
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span
                  className={`text-sm font-semibold bg-gradient-to-r ${
                    getCapitalLevel(parseFloat(tempCapital) || 0).color
                  } bg-clip-text text-transparent`}
                >
                  {getCapitalLevel(parseFloat(tempCapital) || 0).level}
                </span>
              </div>
            )}
          </div>

          {/* Current Amount Display */}
          <div className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 border border-white/10 rounded-2xl p-6">
            <div className="text-center space-y-3">
              <div className="text-3xl font-bold text-white">
                {tempCapital
                  ? formatCurrency(parseFloat(tempCapital))
                  : formatCurrency(settingsContext.accountBalance)}
              </div>
              <div className="text-lg text-cyan-300 font-semibold">
                {tempCapital
                  ? formatCurrencyShort(parseFloat(tempCapital))
                  : formatCurrencyShort(settingsContext.accountBalance)}
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

      {/* Market Outlook Modal */}
      {showMarketOutlookModal && (
        <Modal
          isOpen={showMarketOutlookModal}
          onClose={() => setShowMarketOutlookModal(false)}
          title="Market Command Center"
          maxWidth="xl"
        >
          <div className="space-y-4">
            {/* Current Strategy - Ultra Compact */}
            <div className="bg-gradient-to-r from-slate-800/40 to-purple-900/40 rounded-lg p-4 border border-purple-400/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Current Strategy
                    </h3>
                    <p className="text-gray-400 text-xs">Active positioning</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">LIVE</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-400 mb-1">CONDITION</div>
                  <div
                    className={`font-bold text-sm ${
                      formData.marketHealth === 'confirmed-uptrend'
                        ? 'text-green-400'
                        : formData.marketHealth === 'uptrend-under-pressure'
                        ? 'text-yellow-400'
                        : formData.marketHealth === 'rally-attempt'
                        ? 'text-orange-400'
                        : 'text-red-400'
                    }`}
                  >
                    {getMarketSizingInfo(formData.marketHealth).label}
                  </div>
                </div>

                <div className="border-x border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-1">
                    POSITION SIZE
                  </div>
                  <div className="text-orange-400 font-bold text-sm">
                    {getMarketSizingInfo(formData.marketHealth).adjustment}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-1">RISK LEVEL</div>
                  <div className="text-purple-400 font-bold text-sm">
                    {(() => {
                      const percentage = parseInt(
                        getMarketSizingInfo(formData.marketHealth).adjustment
                      );
                      return percentage >= 100
                        ? 'HIGH'
                        : percentage >= 50
                        ? 'MED'
                        : percentage >= 25
                        ? 'LOW'
                        : 'MIN';
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendation - Compact */}
            <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg p-4 border border-indigo-400/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      AI Recommendation
                    </h3>
                    <p className="text-indigo-300 text-xs">
                      Machine learning analysis
                    </p>
                  </div>
                </div>
              </div>

              {marketSmithData.isLoading ? (
                <div className="flex items-center space-x-2 py-2">
                  <div className="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full"></div>
                  <span className="text-indigo-300 text-sm">
                    AI analyzing...
                  </span>
                </div>
              ) : marketSmithData.error ? (
                <div className="text-yellow-400 text-sm py-2">
                  ⚠️ AI temporarily unavailable
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-black/30 rounded p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-indigo-400 font-medium">
                          AI SUGGESTS
                        </div>
                        <div className="text-white font-semibold text-sm">
                          {marketSmithData.condition}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Updated {marketSmithData.date}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const mappedHealth = mapMarketSmithToHealth(
                      marketSmithData.condition
                    );
                    const isAlreadyApplied =
                      mappedHealth === formData.marketHealth;
                    return (
                      <div className="flex gap-3">
                        {isAlreadyApplied ? (
                          <div className="flex-1 bg-green-600/20 border border-green-400/40 text-green-300 py-2 px-3 rounded text-sm font-medium flex items-center justify-center space-x-2">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>AI Recommendation Active</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                handleMarketSizingChange(mappedHealth)
                              }
                              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 px-3 rounded font-medium transition-all text-sm"
                            >
                              Apply AI Recommendation
                            </button>
                            <div className="bg-black/30 rounded px-3 py-2 text-center border border-gray-600/50">
                              <div className="text-xs text-gray-400">SIZE</div>
                              <div className="text-white font-bold text-sm">
                                {getMarketSizingInfo(mappedHealth).adjustment}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Market Conditions - Streamlined */}
            <div className="bg-black/30 rounded-lg p-4 border border-gray-600/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">
                  Market Conditions
                </h3>
                <span className="text-xs text-gray-400">Select strategy</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    key: 'confirmed-uptrend',
                    label: 'Confirmed Uptrend',
                    color: 'green',
                    icon: '📈',
                    desc: 'Strong momentum',
                  },
                  {
                    key: 'uptrend-under-pressure',
                    label: 'Uptrend Under Pressure',
                    color: 'yellow',
                    icon: '⚡',
                    desc: 'Facing resistance',
                  },
                  {
                    key: 'rally-attempt',
                    label: 'Rally Attempt',
                    color: 'orange',
                    icon: '🎯',
                    desc: 'Testing recovery',
                  },
                  {
                    key: 'downtrend',
                    label: 'Downtrend',
                    color: 'red',
                    icon: '🛡️',
                    desc: 'Capital protection',
                  },
                ].map(({ key, label, color, icon, desc }) => (
                  <button
                    key={key}
                    onClick={() =>
                      handleMarketSizingChange(key as MarketHealth)
                    }
                    className={`relative p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      formData.marketHealth === key
                        ? `border-${color}-400 bg-${color}-500/10 shadow-lg`
                        : 'border-gray-600/50 bg-gray-800/20 hover:border-gray-500/70'
                    }`}
                  >
                    {formData.marketHealth === key && (
                      <div className="absolute top-2 right-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            color === 'green'
                              ? 'bg-green-400'
                              : color === 'yellow'
                              ? 'bg-yellow-400'
                              : color === 'orange'
                              ? 'bg-orange-400'
                              : 'bg-red-400'
                          } animate-pulse`}
                        ></div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{icon}</span>
                        <div className="text-left">
                          <div
                            className={`font-bold text-xs ${
                              formData.marketHealth === key
                                ? color === 'green'
                                  ? 'text-green-300'
                                  : color === 'yellow'
                                  ? 'text-yellow-300'
                                  : color === 'orange'
                                  ? 'text-orange-300'
                                  : 'text-red-300'
                                : 'text-white'
                            }`}
                          >
                            {label.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-400">{desc}</div>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs">
                        <div>
                          <span className="text-gray-500">Size: </span>
                          <span
                            className={`font-bold ${
                              color === 'green'
                                ? 'text-green-400'
                                : color === 'yellow'
                                ? 'text-yellow-400'
                                : color === 'orange'
                                ? 'text-orange-400'
                                : 'text-red-400'
                            }`}
                          >
                            {
                              getMarketSizingInfo(key as MarketHealth)
                                .adjustment
                            }
                          </span>
                        </div>

                        {formData.marketHealth !== key && (
                          <div>
                            {(() => {
                              const currentSizing = getMarketSizingInfo(
                                formData.marketHealth
                              );
                              const buttonSizing = getMarketSizingInfo(
                                key as MarketHealth
                              );
                              const currentPercent = parseInt(
                                currentSizing.adjustment
                              );
                              const buttonPercent = parseInt(
                                buttonSizing.adjustment
                              );
                              const diff = buttonPercent - currentPercent;

                              if (diff > 0) {
                                return (
                                  <span className="text-green-400 text-xs">
                                    +{diff}%
                                  </span>
                                );
                              } else if (diff < 0) {
                                return (
                                  <span className="text-red-400 text-xs">
                                    {diff}%
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default TradingCalculator;
