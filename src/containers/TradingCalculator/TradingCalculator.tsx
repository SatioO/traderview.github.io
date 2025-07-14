import React, { useState, useEffect, useCallback } from 'react';
import { Info, Shield, BarChart3, TrendingUp, Zap } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import SettingsModal from '../../components/Settings/SettingsModal';
import { useTradingSettings } from '../../hooks/useTradingSettings';
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

const TradingCalculator: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
    getRiskLevels,
    getAllocationLevels,
    handleAccountBalanceChange: updateAccountBalance,
    handleMarketHealthChange: updateMarketHealth,
    handleActiveTabChange: updateActiveTab,
    handleRiskLevelChange: updateRiskLevel,
    handleAllocationLevelChange: updateAllocationLevel,
  } = useTradingSettings({
    setFormData,
    setActiveTab,
    setIsDarkMode,
  });

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
  const getAllocationIcon = (
    iconName: string
  ): React.ComponentType<{ className?: string }> => {
    const iconMap: Record<
      string,
      React.ComponentType<{ className?: string }>
    > = {
      Shield,
      BarChart3,
      TrendingUp,
      Zap,
    };
    return iconMap[iconName] || Shield;
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

  // Format currency with K/L/Cr suffixes
  const formatCurrencyWithSuffix = useCallback((amount: number): string => {
    if (amount >= 10000000) {
      // 1 crore or more
      return `${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // 1 lakh or more
      return `${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      // 1 thousand or more
      return `${(amount / 1000).toFixed(1)}K`;
    } else {
      return amount.toFixed(0);
    }
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

  const handleAccountBalanceChange = (value: number) => {
    setFormData({ ...formData, accountBalance: value });
    updateAccountBalance(value);
  };

  const handleMarketSizingChange = (health: MarketHealth) => {
    setFormData({ ...formData, marketHealth: health });
    updateMarketHealth(health);
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

        // Auto-calculate 3% stop loss when entry price is entered
        if (field === 'entryPrice' && processedValue && processedValue > 0) {
          newData.stopLoss = parseFloat((processedValue * 0.97).toFixed(2)); // Always calculate 3% below entry price, rounded to 2 decimals
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
    [activeTab]
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

      {/* Compact Professional Header */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="bg-black/60 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg">
          <div className="mx-auto px-4 py-1.5">
            <div className="flex items-center justify-between h-12">
              {/* Left Section - Logo & Quick Nav */}
              <div className="flex items-center space-x-3">
                <div className="group relative">
                  {/* Compact Logo */}
                  <div className="relative bg-gradient-to-br from-cyan-500/15 to-purple-500/15 rounded-lg p-1.5 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-200">
                    <div className="text-lg bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      📈
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Brand & Navigation */}
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    TradeView
                  </div>
                </div>
              </div>

              {/* Right Section - Compact Metrics & Actions */}
              <div className="flex items-center space-x-2">
                {/* Portfolio Value - Compact */}
                <div className="flex items-center space-x-2 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg px-3 py-1 border border-emerald-400/20 hover:border-emerald-400/40 transition-all duration-200">
                  <div className="text-emerald-400">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"></path>
                    </svg>
                  </div>
                  <div className="text-xs font-bold text-emerald-300">
                    {formatCurrencyWithSuffix(formData.accountBalance)}
                  </div>
                </div>

                {/* Enhanced Market Outlook Center - Compact Height */}
                <div className="relative group">
                  <div
                    className={`relative flex items-center space-x-2 backdrop-blur-xl border-2 rounded-xl px-3 py-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      getMarketSizingInfo(formData.marketHealth).color ===
                      'emerald'
                        ? 'bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-blue-500/15 border-emerald-400/40 hover:border-emerald-400/70 hover:shadow-lg hover:shadow-emerald-500/25'
                        : getMarketSizingInfo(formData.marketHealth).color ===
                          'yellow'
                        ? 'bg-gradient-to-r from-yellow-500/15 via-orange-500/10 to-amber-500/15 border-yellow-400/40 hover:border-yellow-400/70 hover:shadow-lg hover:shadow-yellow-500/25'
                        : getMarketSizingInfo(formData.marketHealth).color ===
                          'orange'
                        ? 'bg-gradient-to-r from-orange-500/15 via-red-500/10 to-pink-500/15 border-orange-400/40 hover:border-orange-400/70 hover:shadow-lg hover:shadow-orange-500/25'
                        : 'bg-gradient-to-r from-red-500/15 via-rose-500/10 to-pink-500/15 border-red-400/40 hover:border-red-400/70 hover:shadow-lg hover:shadow-red-500/25'
                    }`}
                  >
                    {/* Market Intelligence Icon */}
                    <div className="relative">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-white"
                        >
                          <path
                            d="M8 8h8M8 12h8M8 16h4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <circle cx="6" cy="8" r="1" fill="currentColor" />
                          <circle cx="18" cy="8" r="1" fill="currentColor" />
                          <circle cx="6" cy="12" r="1" fill="currentColor" />
                          <circle cx="18" cy="12" r="1" fill="currentColor" />
                        </svg>
                        <div
                          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                            getMarketSizingInfo(formData.marketHealth).color ===
                            'emerald'
                              ? 'bg-emerald-400'
                              : getMarketSizingInfo(formData.marketHealth)
                                  .color === 'yellow'
                              ? 'bg-yellow-400'
                              : getMarketSizingInfo(formData.marketHealth)
                                  .color === 'orange'
                              ? 'bg-orange-400'
                              : 'bg-red-400'
                          } animate-pulse`}
                        ></div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="text-xs font-bold text-white">
                        MARKET OUTLOOK
                      </div>
                      <div className="text-xs text-gray-400">
                        {getMarketSizingInfo(
                          formData.marketHealth
                        ).label.replace(' Market', '')}
                      </div>
                    </div>

                    {/* Enhanced Market Outlook Tooltip - Compact Height */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none group-hover:pointer-events-auto z-50 translate-y-2 group-hover:translate-y-0">
                      <div className="bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl border-2 border-purple-400/30 rounded-2xl p-2.5 shadow-2xl min-w-80 max-w-md">
                        {/* Header */}
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="text-white"
                            >
                              <path
                                d="M8 8h8M8 12h8M8 16h4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <circle
                                cx="6"
                                cy="8"
                                r="1.5"
                                fill="currentColor"
                              />
                              <circle
                                cx="18"
                                cy="8"
                                r="1.5"
                                fill="currentColor"
                              />
                              <circle
                                cx="6"
                                cy="12"
                                r="1.5"
                                fill="currentColor"
                              />
                              <circle
                                cx="18"
                                cy="12"
                                r="1.5"
                                fill="currentColor"
                              />
                              <circle
                                cx="6"
                                cy="16"
                                r="1.5"
                                fill="currentColor"
                              />
                              <circle
                                cx="14"
                                cy="16"
                                r="1.5"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              Market Outlook
                            </div>
                            <div className="text-xs text-emerald-300">
                              Position Sizing Intelligence •{' '}
                              <span className="text-emerald-400">ACTIVE</span>
                            </div>
                          </div>
                        </div>

                        {/* Current Configuration */}
                        <div className="mb-2 p-1.5 bg-gradient-to-r from-purple-500/15 to-blue-500/15 border border-purple-400/30 rounded-xl">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="text-xs text-purple-300 font-bold tracking-wider">
                              CURRENT CONFIGURATION
                            </div>
                            <div className="text-xs text-emerald-400 font-bold">
                              {
                                getMarketSizingInfo(formData.marketHealth)
                                  .adjustment
                              }{' '}
                              SIZING
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-base">
                              {getMarketSizingInfo(formData.marketHealth).icon}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-white">
                                {
                                  getMarketSizingInfo(formData.marketHealth)
                                    .label
                                }
                              </div>
                              <div className="text-xs text-gray-400">
                                {
                                  getMarketSizingInfo(formData.marketHealth)
                                    .description
                                }
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-emerald-400">
                                {
                                  getMarketSizingInfo(formData.marketHealth)
                                    .adjustment
                                }
                              </div>
                              <div className="text-xs text-gray-400">
                                Position Size
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* MarketSmith Comparison */}
                        {marketSmithData.condition && (
                          <div className="mb-2 p-1.5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-400/20 rounded-lg">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="text-xs text-emerald-300 font-medium">
                                MARKETSMITH SUGGESTS
                              </div>
                              <div className="text-xs text-gray-400">
                                {marketSmithData.date}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-white">
                                {marketSmithData.condition}
                              </div>
                              {mapMarketSmithToHealth(
                                marketSmithData.condition
                              ) !== formData.marketHealth && (
                                <button
                                  onClick={() => {
                                    const suggestedHealth =
                                      mapMarketSmithToHealth(
                                        marketSmithData.condition
                                      );
                                    handleMarketSizingChange(suggestedHealth);
                                  }}
                                  className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded text-xs text-emerald-300 transition-all duration-300"
                                >
                                  Apply
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Tactical Override Matrix */}
                        <div className="text-center mb-1.5">
                          <div className="text-xs text-gray-400 font-bold tracking-wider">
                            ⚙️ TACTICAL OVERRIDE MATRIX ⚙️
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(
                            [
                              'confirmed-uptrend',
                              'uptrend-under-pressure',
                              'rally-attempt',
                              'downtrend',
                            ] as const
                          ).map((health) => {
                            const sizingInfo = getMarketSizingInfo(health);
                            const isSelected = formData.marketHealth === health;

                            return (
                              <button
                                key={health}
                                onClick={() => handleMarketSizingChange(health)}
                                className={`group relative p-1.5 rounded-lg border transition-all duration-300 text-left ${
                                  isSelected
                                    ? `border-${sizingInfo.color}-400 bg-${sizingInfo.color}-500/20 text-${sizingInfo.color}-200`
                                    : 'border-gray-600/40 bg-gray-500/10 text-gray-400 hover:border-gray-500/60 hover:text-gray-200'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5">
                                  <div className="text-base">
                                    {sizingInfo.icon}
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium leading-tight">
                                      {sizingInfo.label.replace(' Market', '')}
                                    </div>
                                    <div className="text-xs opacity-75 flex items-center leading-tight">
                                      <svg
                                        className="w-3 h-3 mr-1 text-blue-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {sizingInfo.adjustment} Sizing
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse"></div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-slate-900/98 to-slate-800/98 border-l-2 border-t-2 border-purple-400/30 rotate-45"></div>
                    </div>
                  </div>
                </div>

                {/* Trader Profile - Compact */}
                <div className="flex items-center space-x-1.5 bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-lg px-2 py-1 border border-gray-400/20 hover:border-gray-400/40 transition-all duration-200">
                  <div className="w-5 h-5 bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    T
                  </div>
                  <div className="hidden md:block text-xs text-gray-300 font-medium">
                    {formData.accountBalance >= 10000000
                      ? 'Elite'
                      : formData.accountBalance >= 5000000
                      ? 'Pro'
                      : formData.accountBalance >= 1000000
                      ? 'Advanced'
                      : 'Standard'}
                  </div>
                </div>

                {/* Settings - Streamlined */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center space-x-1 bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-lg px-2 py-1 border border-slate-400/20 hover:border-slate-400/40 transition-all duration-200 hover:scale-105"
                >
                  <div className="text-slate-300">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="hidden sm:block text-xs text-slate-300 font-medium">
                    Settings
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Quick Action Button */}
      <div className="fixed bottom-8 right-8 z-30">
        <div className="group relative">
          {/* Main FAB */}
          <button className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full shadow-2xl border-2 border-cyan-400/50 hover:border-cyan-400 transition-all duration-500 hover:scale-110 hover:shadow-cyan-500/50 hover:shadow-2xl">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>

            {/* Icon */}
            <div className="relative flex items-center justify-center text-white text-xl font-bold">
              ⚡
            </div>

            {/* Pulse Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-30"></div>
          </button>

          {/* Quick Actions Menu - Hidden by default */}
          <div className="absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-cyan-400/30 shadow-2xl min-w-48">
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-cyan-500/20 transition-colors duration-300 text-cyan-300 hover:text-cyan-200 text-sm font-medium">
                  🎯 Quick Position
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-purple-500/20 transition-colors duration-300 text-purple-300 hover:text-purple-200 text-sm font-medium">
                  📊 Market Analysis
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-emerald-500/20 transition-colors duration-300 text-emerald-300 hover:text-emerald-200 text-sm font-medium">
                  💰 Portfolio Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gaming Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-cyan-500/30 sticky top-8 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-cyan-500/20 hover:shadow-2xl">
              {/* Enhanced Gaming Wallet Display */}

              {/* Enhanced Gaming Mode Selector */}
              <div className="mb-6">
                <div className="relative flex space-x-3 bg-black/30 p-2 rounded-2xl backdrop-blur-sm border border-purple-500/30 overflow-hidden">
                  {/* Mode switching particle trail */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('risk');
                      updateActiveTab('risk');
                    }}
                    className={`group flex-1 py-4 px-3 text-sm font-bold rounded-xl transition-all duration-500 relative overflow-hidden ${
                      activeTab === 'risk'
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30 transform scale-105 border-2 border-red-400/50'
                        : 'text-purple-300 hover:bg-purple-500/20 hover:text-white hover:scale-102 border-2 border-transparent hover:border-purple-400/30'
                    }`}
                  >
                    {/* Achievement badge */}
                    {activeTab === 'risk' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                        <span className="text-xs">🏆</span>
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col items-center">
                      <span
                        className={`text-lg mb-1 transition-transform duration-300 ${
                          activeTab === 'risk'
                            ? 'animate-bounce'
                            : 'group-hover:scale-110'
                        }`}
                      >
                        ⚡
                      </span>
                      <span>RISK MODE</span>
                      <span className="text-xs opacity-80">High Stakes</span>
                    </div>

                    {/* Enhanced background effects */}
                    {activeTab === 'risk' && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 opacity-20 animate-pulse"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('allocation');
                      updateActiveTab('allocation');
                    }}
                    className={`group flex-1 py-4 px-3 text-sm font-bold rounded-xl transition-all duration-500 relative overflow-hidden ${
                      activeTab === 'allocation'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 transform scale-105 border-2 border-blue-400/50'
                        : 'text-purple-300 hover:bg-purple-500/20 hover:text-white hover:scale-102 border-2 border-transparent hover:border-purple-400/30'
                    }`}
                  >
                    {/* Achievement badge */}
                    {activeTab === 'allocation' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                        <span className="text-xs">🎯</span>
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col items-center">
                      <span
                        className={`text-lg mb-1 transition-transform duration-300 ${
                          activeTab === 'allocation'
                            ? 'animate-bounce'
                            : 'group-hover:scale-110'
                        }`}
                      >
                        🎯
                      </span>
                      <span>ALLOCATION MODE</span>
                      <span className="text-xs opacity-80">Strategic</span>
                    </div>

                    {/* Enhanced background effects */}
                    {activeTab === 'allocation' && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-20 animate-pulse"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                      </>
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
                        <span className="mr-2">⚡</span>
                        Risk Level
                        <div className="inline-flex items-center ml-2">
                          <div className="relative group">
                            <div className="transform transition-transform duration-300 group-hover:scale-110 text-purple-400">
                              <Info className="w-4 h-4" />
                            </div>
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                          </div>
                        </div>
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

                    {/* Enhanced Gaming Risk Level Buttons - Dynamic */}
                    <div
                      className={`grid gap-2 mb-4 p-2 ${
                        getRiskLevels().length <= 4
                          ? 'grid-cols-4'
                          : 'grid-cols-2'
                      }`}
                    >
                      {getRiskLevels().map((riskLevel) => {
                        const isSelected =
                          Number(formData.riskPercentage) ===
                          riskLevel.percentage;
                        const colorClass =
                          riskLevel.id === 'conservative'
                            ? 'emerald'
                            : riskLevel.id === 'balanced'
                            ? 'yellow'
                            : riskLevel.id === 'bold'
                            ? 'orange'
                            : 'red';

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
                            className={`group relative py-4 px-2 text-xs font-bold rounded-xl border-2 transition-all duration-500 hover:scale-105 overflow-hidden ${
                              isSelected
                                ? `border-${colorClass}-400 bg-${colorClass}-500/10 shadow-lg shadow-${colorClass}-500/30 text-${colorClass}-300 transform scale-105`
                                : `border-purple-500/30 bg-black/30 text-purple-300 hover:border-${colorClass}-400/50 hover:bg-${colorClass}-500/5 hover:text-${colorClass}-300`
                            }`}
                            title={riskLevel.description}
                          >
                            {/* Animated border glow for selected state */}
                            {isSelected && (
                              <div
                                className={`absolute inset-0 rounded-xl border-2 border-${colorClass}-400 animate-pulse`}
                              ></div>
                            )}

                            {/* Achievement unlock effect */}
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
                            )}

                            <div className="relative z-10 flex flex-col items-center">
                              {/* Icon with enhanced animations */}
                              <div className="relative">
                                <div
                                  className={`text-lg mb-1 transition-transform duration-300 ${
                                    isSelected
                                      ? 'animate-bounce'
                                      : 'group-hover:scale-110 group-hover:rotate-12'
                                  }`}
                                >
                                  {riskLevel.icon}
                                </div>
                                {isSelected && (
                                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full opacity-100 animate-pulse"></div>
                                )}
                              </div>

                              {/* Percentage with power level effect */}
                              <div
                                className={`text-sm font-bold mb-1 ${
                                  isSelected ? 'animate-pulse' : ''
                                }`}
                              >
                                {riskLevel.percentage}%
                              </div>

                              {/* Name */}
                              <div className="text-xs opacity-60 text-center leading-tight">
                                {riskLevel.name}
                              </div>
                            </div>

                            {/* Enhanced background effects */}
                            {isSelected && (
                              <>
                                <div
                                  className={`absolute inset-0 bg-gradient-to-r from-${colorClass}-600/5 to-${colorClass}-500/5 rounded-xl animate-pulse`}
                                ></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                              </>
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

                    {/* Risk Assessment - Always Visible */}
                    {formData.riskPercentage !== '' &&
                      Number(formData.riskPercentage) > 0 && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-purple-300">
                              Risk Assessment:
                            </span>
                            <span className="text-xs text-purple-400 font-bold">
                              {formatCurrency(
                                (formData.accountBalance *
                                  (Number(formData.riskPercentage) || 0)) /
                                  100
                              )}{' '}
                              at risk
                            </span>
                          </div>

                          {/* Visual risk level representation */}
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-3 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  Number(formData.riskPercentage) >= 3
                                    ? 'bg-gradient-to-r from-red-500 to-red-700 animate-pulse'
                                    : Number(formData.riskPercentage) > 2
                                    ? 'bg-gradient-to-r from-orange-400 to-red-400'
                                    : Number(formData.riskPercentage) > 1
                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                                    : 'bg-gradient-to-r from-green-400 to-emerald-400'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    (Number(formData.riskPercentage) * 100) / 3,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <div
                              className={`text-xs font-bold ${
                                Number(formData.riskPercentage) >= 3
                                  ? 'text-red-400 animate-pulse'
                                  : Number(formData.riskPercentage) > 2
                                  ? 'text-orange-400'
                                  : Number(formData.riskPercentage) > 1
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}
                            >
                              {Number(formData.riskPercentage) >= 3
                                ? 'EXTREME'
                                : Number(formData.riskPercentage) > 2
                                ? 'HIGH'
                                : Number(formData.riskPercentage) > 1
                                ? 'MEDIUM'
                                : 'LOW'}
                            </div>
                          </div>
                        </div>
                      )}
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
                        <div className="inline-flex items-center ml-2">
                          <div className="relative group">
                            <div className="transform transition-transform duration-300 group-hover:scale-110 text-purple-400">
                              <Info className="w-4 h-4" />
                            </div>
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                          </div>
                        </div>
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
                              <div className="relative group">
                                <div
                                  className={`transform transition-transform duration-300 group-hover:scale-110 text-${allocationColors[index]}-400`}
                                >
                                  {React.createElement(
                                    getAllocationIcon(allocationLevel.icon),
                                    {
                                      className: 'w-4 h-4',
                                    }
                                  )}
                                </div>
                                <div
                                  className={`absolute -inset-1 bg-gradient-to-r from-${allocationColors[index]}-500/20 to-${allocationColors[index]}-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse`}
                                ></div>
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

                    {/* Risk Assessment Visualization */}
                    {formData.allocationPercentage !== '' &&
                      Number(formData.allocationPercentage) > 0 &&
                      calculations && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-blue-300">
                              Risk Assessment:
                            </span>
                            <span className="text-xs text-blue-400 font-bold">
                              {formatCurrency(calculations.riskAmount)} at risk
                            </span>
                          </div>

                          {/* Visual risk level representation */}
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-3 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  (Number(formData.allocationPercentage) || 0) >
                                  getAllocationThresholds().high
                                    ? 'bg-gradient-to-r from-red-500 to-red-700 animate-pulse'
                                    : (Number(formData.allocationPercentage) ||
                                        0) > getAllocationThresholds().balanced
                                    ? 'bg-gradient-to-r from-orange-400 to-red-400'
                                    : (Number(formData.allocationPercentage) ||
                                        0) >
                                      getAllocationThresholds().conservative
                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                                    : 'bg-gradient-to-r from-green-400 to-emerald-400'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    ((Number(formData.allocationPercentage) ||
                                      0) *
                                      100) /
                                      getAllocationThresholds().extreme,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <div
                              className={`text-xs font-bold ${
                                (Number(formData.allocationPercentage) || 0) >
                                getAllocationThresholds().high
                                  ? 'text-red-400 animate-pulse'
                                  : (Number(formData.allocationPercentage) ||
                                      0) > getAllocationThresholds().balanced
                                  ? 'text-orange-400'
                                  : (Number(formData.allocationPercentage) ||
                                      0) >
                                    getAllocationThresholds().conservative
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}
                            >
                              {(Number(formData.allocationPercentage) || 0) >
                              getAllocationThresholds().high
                                ? 'EXTREME'
                                : (Number(formData.allocationPercentage) || 0) >
                                  getAllocationThresholds().balanced
                                ? 'HIGH'
                                : (Number(formData.allocationPercentage) || 0) >
                                  getAllocationThresholds().conservative
                                ? 'MEDIUM'
                                : 'LOW'}
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Gaming Price Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-green-300 mb-2">
                      💰 Entry Price
                      <div className="inline-flex items-center ml-1">
                        <div className="relative group">
                          <div className="transform transition-transform duration-300 group-hover:scale-110 text-green-400">
                            <Info className="w-4 h-4" />
                          </div>
                          <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                        </div>
                      </div>
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
                      🛡️ Stop Loss
                      <div className="inline-flex items-center ml-1">
                        <div className="relative group">
                          <div className="transform transition-transform duration-300 group-hover:scale-110 text-red-400">
                            <Info className="w-4 h-4" />
                          </div>
                          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                        </div>
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.stopLoss || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange('stopLoss', value);
                        }}
                        onBlur={(e) => {
                          // Format to 2 decimal places on blur
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            handleInputChange('stopLoss', value.toFixed(2));
                          }
                        }}
                        className="w-full px-4 py-3 pl-10 bg-black/40 border-2 border-red-500/50 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-400/20 text-white placeholder-red-300/50 font-mono transition-all duration-300 focus:shadow-lg focus:shadow-red-500/20"
                        min="0"
                        step="0.01"
                        placeholder="Auto: 3% below entry"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400">
                        ₹
                      </span>
                    </div>
                    {/* Risk Percentage Display */}
                    {formData.entryPrice > 0 &&
                      formData.stopLoss > 0 &&
                      formData.stopLoss < formData.entryPrice && (
                        <div className="mt-2 text-center">
                          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/40 rounded-lg px-3 py-1">
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
                          <div className="text-4xl">🎯</div>
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
                          <div className="text-4xl">💰</div>
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
                          <div className="text-4xl">⚡</div>
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
                          <div className="text-4xl">🛡️</div>
                          <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 rounded-lg px-2 py-1">
                            <div className="text-xs text-orange-300 font-bold">
                              SHIELD
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
                          <div className="text-4xl">💳</div>
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
                            auto-calculated
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
                          <div className="text-2xl">⚔️</div>
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

                  {/* Animated Energy Flow Visualization */}
                  <div className="relative h-16 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-600/30 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-xs text-gray-400 mb-4">
                        PROFIT ENERGY FLOW
                      </div>
                    </div>
                    {/* Moving Energy Bars */}
                    {targets.map((target, index) => (
                      <div
                        key={index}
                        className="absolute bottom-0 bg-gradient-to-t from-cyan-400/80 to-green-400/80 rounded-t-lg animate-pulse"
                        style={{
                          left: `${12 + index * 14}%`,
                          width: '8%',
                          height: `${30 + target.portfolioGainPercentage * 2}%`,
                          animationDelay: `${index * 0.2}s`,
                          animationDuration: '2s',
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default TradingCalculator;
