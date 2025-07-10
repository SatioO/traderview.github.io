import { useState, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
import type {
  FormData,
  Calculations,
  Target,
  Preferences,
  ChargesBreakdown,
  TabType,
  MarketHealth,
} from './types';

const TradingCalculator: React.FC = () => {
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
  const [selectedRiskOption, setSelectedRiskOption] = useState<string>('0.25');
  const [activeTab, setActiveTab] = useState<TabType>('risk');
  const [calculations, setCalculations] = useState<Calculations | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isMarketHealthExpanded, setIsMarketHealthExpanded] = useState<boolean>(false);

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

  // Load preferences and dark mode on mount
  useEffect(() => {
    const saved = localStorage.getItem('accountInfo');
    if (saved) {
      try {
        const prefs: Preferences = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          accountBalance: prefs.accountBalance || 1000000,
          marketHealth: prefs.marketHealth || 'confirmed-uptrend',
        }));
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    const darkMode =
      savedDarkMode === 'true' ||
      (savedDarkMode === null &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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
  const getMarketHealthAdjustment = useCallback(
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
  const getMarketHealthInfo = useCallback((marketHealth: MarketHealth) => {
    switch (marketHealth) {
      case 'confirmed-uptrend':
        return {
          label: 'Confirmed Uptrend',
          icon: '🚀',
          color: 'emerald',
          description: 'Strong bullish momentum - Full position sizing',
          healthLevel: 100,
          adjustment: 'Full',
        };
      case 'uptrend-under-pressure':
        return {
          label: 'Uptrend Under Pressure',
          icon: '⚠️',
          color: 'yellow',
          description: 'Weakening momentum - Reduced position sizing',
          healthLevel: 75,
          adjustment: '-25%',
        };
      case 'rally-attempt':
        return {
          label: 'Rally Attempt',
          icon: '🔄',
          color: 'orange',
          description: 'Uncertain direction - Conservative sizing',
          healthLevel: 50,
          adjustment: '-50%',
        };
      case 'downtrend':
        return {
          label: 'Downtrend',
          icon: '📉',
          color: 'red',
          description: 'Bearish conditions - Minimal position sizing',
          healthLevel: 25,
          adjustment: '-75%',
        };
      default:
        return {
          label: 'Unknown',
          icon: '❓',
          color: 'gray',
          description: 'Market status unclear',
          healthLevel: 50,
          adjustment: '0%',
        };
    }
  }, []);

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

      const riskAmount = (accountBalance * riskPercentage) / 100;
      const riskPerShare = entryPrice - stopLoss;

      // Calculate position size WITHOUT considering brokerage (pure calculation)
      const basePositionSize = Math.floor(riskAmount / riskPerShare);

      // Apply market health adjustment
      const marketHealthAdjustment = getMarketHealthAdjustment(
        formData.marketHealth
      );
      const adjustedPositionSize = basePositionSize * marketHealthAdjustment;
      const positionSize = Math.max(1, Math.floor(adjustedPositionSize)); // Ensure minimum position size of 1

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
      getMarketHealthAdjustment,
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

      // Apply market health adjustment
      const marketHealthAdjustment = getMarketHealthAdjustment(
        formData.marketHealth
      );
      const adjustedPositionSize = basePositionSize * marketHealthAdjustment;
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
      getMarketHealthAdjustment,
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
    const prefs: Preferences = {
      accountBalance: value,
      marketHealth: formData.marketHealth,
    };
    localStorage.setItem('accountInfo', JSON.stringify(prefs));
  };

  const handleMarketHealthChange = (health: MarketHealth) => {
    setFormData({ ...formData, marketHealth: health });
    const prefs: Preferences = {
      accountBalance: formData.accountBalance,
      marketHealth: health,
    };
    localStorage.setItem('accountInfo', JSON.stringify(prefs));
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

      {/* Main Content */}
      <main className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gaming Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-cyan-500/30 sticky top-8 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-cyan-500/20 hover:shadow-2xl">
              {/* Gaming Wallet Display */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl p-4 border border-emerald-500/30 backdrop-blur-sm">
                  <div className="relative">
                    <label className="block text-sm font-medium text-emerald-300 mb-2">
                      Trading Capital
                      <Info className="inline w-4 h-4 ml-1 text-emerald-400 cursor-help" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.accountBalance}
                        onChange={(e) =>
                          handleAccountBalanceChange(parseFloat(e.target.value))
                        }
                        className="w-full px-4 py-3 pl-10 bg-black/30 border-2 border-emerald-500/50 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-emerald-300/50 font-mono text-lg transition-all duration-300 focus:shadow-lg focus:shadow-emerald-500/20"
                        min="0"
                        step="10000"
                        placeholder="Enter credits..."
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400">
                        ₹
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400 text-sm">
                        {formatCurrencyWithSuffix(formData.accountBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Health Indicator - Collapsible */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm overflow-hidden">
                  {/* Collapsible Header - Always Visible */}
                  <button
                    onClick={() => setIsMarketHealthExpanded(!isMarketHealthExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-blue-500/10 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">
                        {getMarketHealthInfo(formData.marketHealth).icon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white text-left">
                          {getMarketHealthInfo(formData.marketHealth).label}
                        </div>
                        <div className="text-xs text-blue-300 text-left">
                          📊 Market Health - {getMarketHealthInfo(formData.marketHealth).adjustment} sizing
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Health Level Indicator */}
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-${
                            getMarketHealthInfo(formData.marketHealth).color
                          }-500 to-${
                            getMarketHealthInfo(formData.marketHealth).color
                          }-400 transition-all duration-1000`}
                          style={{
                            width: `${
                              getMarketHealthInfo(formData.marketHealth).healthLevel
                            }%`,
                          }}
                        ></div>
                      </div>
                      
                      {/* Expand/Collapse Icon */}
                      <div className={`text-blue-300 transition-transform duration-300 ${
                        isMarketHealthExpanded ? 'rotate-180' : 'rotate-0'
                      }`}>
                        ▼
                      </div>
                    </div>
                  </button>

                  {/* Expandable Content */}
                  <div className={`transition-all duration-500 ease-in-out ${
                    isMarketHealthExpanded 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
                  } overflow-hidden`}>
                    <div className="p-4 pt-0">
                      <div className="mb-4 text-xs text-blue-300">
                        Select market condition for position size adjustment:
                      </div>
                      
                      {/* Market Health Options Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {(
                          [
                            'confirmed-uptrend',
                            'uptrend-under-pressure',
                            'rally-attempt',
                            'downtrend',
                          ] as const
                        ).map((health) => {
                          const healthInfo = getMarketHealthInfo(health);
                          const isSelected = formData.marketHealth === health;

                          return (
                            <button
                              key={health}
                              onClick={() => {
                                handleMarketHealthChange(health);
                                setIsMarketHealthExpanded(false); // Auto-collapse after selection
                              }}
                              className={`group relative p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                                isSelected
                                  ? `border-${healthInfo.color}-400 bg-${healthInfo.color}-500/10 shadow-lg shadow-${healthInfo.color}-500/30 text-${healthInfo.color}-300 transform scale-105`
                                  : `border-gray-500/30 bg-black/30 text-gray-300 hover:border-${healthInfo.color}-400/50 hover:bg-${healthInfo.color}-500/5 hover:text-${healthInfo.color}-300`
                              }`}
                            >
                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                              )}
                              
                              <div className="flex items-center space-x-2">
                                <div className={`text-lg transition-transform duration-300 ${
                                  isSelected ? 'animate-bounce' : 'group-hover:scale-110'
                                }`}>
                                  {healthInfo.icon}
                                </div>
                                
                                <div className="flex-1 text-left">
                                  <div className="text-xs font-bold mb-1">
                                    {healthInfo.label}
                                  </div>
                                  <div className="text-xs opacity-75">
                                    {healthInfo.adjustment} sizing
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Current Selection Description */}
                      <div className="mt-4 p-3 bg-black/40 rounded-lg border border-gray-600/30">
                        <div className="text-xs text-gray-400">
                          {getMarketHealthInfo(formData.marketHealth).description}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gaming Mode Selector */}
              <div className="mb-6">
                <div className="flex space-x-3 bg-black/30 p-2 rounded-2xl backdrop-blur-sm border border-purple-500/30">
                  <button
                    onClick={() => setActiveTab('risk')}
                    className={`flex-1 py-4 px-3 text-sm font-bold rounded-xl transition-all duration-500 relative overflow-hidden ${
                      activeTab === 'risk'
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30 transform scale-105 border-2 border-red-400/50'
                        : 'text-purple-300 hover:bg-purple-500/20 hover:text-white hover:scale-102 border-2 border-transparent hover:border-purple-400/30'
                    }`}
                  >
                    <div className="relative z-10 flex flex-col items-center">
                      <span className="text-lg mb-1">⚡</span>
                      <span>RISK MODE</span>
                      <span className="text-xs opacity-80">High Stakes</span>
                    </div>
                    {activeTab === 'risk' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 opacity-20 animate-pulse"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('allocation')}
                    className={`flex-1 py-4 px-3 text-sm font-bold rounded-xl transition-all duration-500 relative overflow-hidden ${
                      activeTab === 'allocation'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 transform scale-105 border-2 border-blue-400/50'
                        : 'text-purple-300 hover:bg-purple-500/20 hover:text-white hover:scale-102 border-2 border-transparent hover:border-purple-400/30'
                    }`}
                  >
                    <div className="relative z-10 flex flex-col items-center">
                      <span className="text-lg mb-1">🎯</span>
                      <span>ALLOCATION MODE</span>
                      <span className="text-xs opacity-80">Strategic</span>
                    </div>
                    {activeTab === 'allocation' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-20 animate-pulse"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* Gaming Battle Setup */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30 backdrop-blur-sm">
                {/* Risk-Based Sizing Tab */}
                {activeTab === 'risk' && (
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-3">
                      ⚡ Risk Level
                      <Info
                        className="inline w-4 h-4 ml-1 text-purple-400 cursor-help"
                        xlinkTitle="Strategic allocation of your portfolio to this trade"
                      />
                    </label>

                    {/* Gaming Risk Level Buttons */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {[0.25, 0.5, 0.75, 1].map((option, index) => {
                        const riskIcons = ['🌱', '🔥', '⚡', '💀'];
                        const riskLabels = [
                          'SAFE',
                          'MODERATE',
                          'AGGRESSIVE',
                          'EXTREME',
                        ];
                        const riskColors = [
                          'emerald',
                          'yellow',
                          'orange',
                          'red',
                        ];
                        const isSelected =
                          selectedRiskOption === option.toString();

                        return (
                          <button
                            key={option}
                            onClick={() => {
                              setSelectedRiskOption(option.toString());
                              handleInputChange(
                                'riskPercentage',
                                option.toString()
                              );
                            }}
                            className={`group relative py-4 px-2 text-xs font-bold rounded-xl border-2 transition-all duration-500 hover:scale-105 ${
                              isSelected
                                ? `border-${riskColors[index]}-400 bg-${riskColors[index]}-500/10 shadow-lg shadow-${riskColors[index]}-500/30 text-${riskColors[index]}-300 transform scale-105`
                                : `border-purple-500/30 bg-black/30 text-purple-300 hover:border-${riskColors[index]}-400/50 hover:bg-${riskColors[index]}-500/5 hover:text-${riskColors[index]}-300`
                            }`}
                          >
                            {/* Animated border glow for selected state */}
                            {isSelected && (
                              <div
                                className={`absolute inset-0 rounded-xl border-2 border-${riskColors[index]}-400 animate-pulse`}
                              ></div>
                            )}

                            <div className="relative z-10 flex flex-col items-center">
                              {/* Icon with bounce animation */}
                              <div
                                className={`text-lg mb-1 transition-transform duration-300 ${
                                  isSelected
                                    ? 'animate-bounce'
                                    : 'group-hover:scale-110'
                                }`}
                              >
                                {riskIcons[index]}
                              </div>

                              {/* Percentage */}
                              <div className="text-sm font-bold mb-1">
                                {option}%
                              </div>

                              {/* Risk level label */}
                              <div className="text-xs opacity-75 font-medium">
                                {riskLabels[index]}
                              </div>
                            </div>

                            {/* Subtle background pulse for selected state */}
                            {isSelected && (
                              <div
                                className={`absolute inset-0 bg-gradient-to-r from-${riskColors[index]}-600/5 to-${riskColors[index]}-500/5 rounded-xl animate-pulse`}
                              ></div>
                            )}
                          </button>
                        );
                      })}

                      {/* Custom Option */}
                      <button
                        onClick={() => {
                          setSelectedRiskOption('custom');
                          if (
                            formData.riskPercentage === '' ||
                            [0.25, 0.5, 0.75, 1].includes(
                              Number(formData.riskPercentage)
                            )
                          ) {
                            handleInputChange('riskPercentage', '');
                          }
                        }}
                        className={`group relative py-4 px-2 text-xs font-bold rounded-xl border-2 transition-all duration-500 hover:scale-105 ${
                          selectedRiskOption === 'custom'
                            ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/30 text-cyan-300 transform scale-105'
                            : 'border-purple-500/30 bg-black/30 text-purple-300 hover:border-cyan-400/50 hover:bg-cyan-500/5 hover:text-cyan-300'
                        }`}
                      >
                        {/* Animated border glow for selected state */}
                        {selectedRiskOption === 'custom' && (
                          <div className="absolute inset-0 rounded-xl border-2 border-cyan-400 animate-pulse"></div>
                        )}

                        <div className="relative z-10 flex flex-col items-center">
                          {/* Icon with rotation animation */}
                          <div
                            className={`text-lg mb-1 transition-transform duration-500 ${
                              selectedRiskOption === 'custom'
                                ? 'animate-spin'
                                : 'group-hover:rotate-12'
                            }`}
                          >
                            ⚙️
                          </div>

                          {/* Label */}
                          <div className="text-xs font-bold mb-1">CUSTOM</div>

                          {/* Subtitle */}
                          <div className="text-xs opacity-75 font-medium">
                            MANUAL
                          </div>
                        </div>

                        {/* Subtle background pulse for selected state */}
                        {selectedRiskOption === 'custom' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/5 to-blue-600/5 rounded-xl animate-pulse"></div>
                        )}
                      </button>
                    </div>

                    {/* Custom Input Field */}
                    {selectedRiskOption === 'custom' && (
                      <div className="animate-fadeIn">
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
                          className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-500/50 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white placeholder-cyan-300/50 font-mono transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/20"
                          min="0.25"
                          max="10"
                          step="0.25"
                          placeholder="Enter custom risk %..."
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Allocation-Based Sizing Tab */}
                {activeTab === 'allocation' && (
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-3">
                      🎯 Portfolio Allocation Level
                      <Info
                        className="inline w-4 h-4 ml-1 text-purple-400 cursor-help"
                        xlinkTitle="Strategic allocation of your portfolio to this trade"
                      />
                    </label>
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
                      className="w-full px-4 py-3 bg-black/40 border-2 border-blue-500/50 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-white placeholder-blue-300/50 font-mono text-lg transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/20"
                      min="5"
                      max="100"
                      step="5"
                      placeholder="Enter allocation %..."
                    />
                  </div>
                )}

                {/* Gaming Price Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-green-300 mb-2">
                      💰 Entry Price
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
                      🛡️ Stop Loss
                      <Info className="inline w-4 h-4 ml-1 text-red-400 cursor-help" />
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
                            {calculations.riskPercentage}% portfolio impact
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
    </div>
  );
};

export default TradingCalculator;
