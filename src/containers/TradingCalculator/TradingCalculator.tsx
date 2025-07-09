import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Info,
  Calculator,
  AlertTriangle,
  IndianRupee,
  PieChart,
  BarChart3,
  TrendingUp,
  Target as TargetIcon,
  CreditCard,
} from 'lucide-react';
import type {
  FormData,
  Calculations,
  Target,
  Scenario,
  Preferences,
  ChargesBreakdown,
  TabType,
} from './types';

const TradingCalculator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    accountBalance: 1000000,
    riskPercentage: 0.25,
    entryPrice: 500,
    stopLoss: 475,
    brokerageCost: 0,
    riskOnInvestment: 5.0,
    allocationPercentage: 10.0,
  });
  const [activeTab, setActiveTab] = useState<TabType>('risk');
  const [calculations, setCalculations] = useState<Calculations | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

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
      const positionSize = Math.floor(riskAmount / riskPerShare);

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
    }, [formData, validateInputs, calculateBrokerage]);

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
      const positionSize = Math.floor(allocationAmount / entryPrice);

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
    }, [formData, validateInputs, calculateBrokerage]);

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

      return {
        r,
        targetPrice,
        netProfit,
        returnPercentage,
        chargesBreakdown: calculations.chargesBreakdown, // Same buy-side charges
      };
    });
  }, [calculations]);

  // Generate position sizing scenarios
  const generateScenarios = useCallback((): Scenario[] => {
    const { accountBalance, entryPrice, stopLoss } = formData;
    if (!accountBalance || !entryPrice || !stopLoss || stopLoss >= entryPrice)
      return [];

    if (activeTab === 'risk') {
      const riskPercentages = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
      return riskPercentages.map((riskPercent) => {
        const riskAmount = (accountBalance * riskPercent) / 100;
        const riskPerShare = entryPrice - stopLoss;

        const positionSize = Math.floor(riskAmount / riskPerShare);

        const totalInvestment = positionSize * entryPrice;
        const portfolioPercentage = (totalInvestment / accountBalance) * 100;

        return {
          riskPercent,
          positionSize,
          totalInvestment,
          riskAmount,
          portfolioPercentage,
        };
      });
    } else {
      const allocationPercentages = [5, 10, 15, 20, 25, 30];
      return allocationPercentages.map((allocPercent) => {
        const allocationAmount = (accountBalance * allocPercent) / 100;
        const positionSize = Math.floor(allocationAmount / entryPrice);

        const totalInvestment = positionSize * entryPrice;
        const portfolioPercentage = (totalInvestment / accountBalance) * 100;

        // Calculate actual risk for this allocation
        const riskPerShare = entryPrice - stopLoss;
        const riskAmount = positionSize * riskPerShare;
        const riskPercent = (riskAmount / accountBalance) * 100;

        return {
          riskPercent,
          positionSize,
          totalInvestment,
          riskAmount,
          portfolioPercentage,
        };
      });
    }
  }, [formData, activeTab]);

  // Export to CSV
  const exportToCSV = useCallback((): void => {
    if (!calculations) return;

    let csv = 'Metric,Value\n';
    csv += `Account Balance,${calculations.accountBalance}\n`;
    csv += `Risk Percentage,${calculations.riskPercentage}%\n`;
    csv += `Entry Price,${calculations.entryPrice}\n`;
    csv += `Stop Loss,${calculations.stopLoss}\n`;
    csv += `Position Size,${calculations.positionSize}\n`;
    csv += `Total Investment,${calculations.totalInvestment}\n`;
    csv += `Risk Amount,${calculations.riskAmount}\n`;
    csv += `Portfolio Percentage,${calculations.portfolioPercentage.toFixed(
      2
    )}%\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trading_calculation.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [calculations]);

  const targets = generateTargets();
  const scenarios = generateScenarios();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-all duration-500"
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-300/15 to-purple-300/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-300/15 to-cyan-300/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-pink-300/10 to-orange-300/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center py-4"></div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto  px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="xl:col-span-1">
            <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-blue-200/30 dark:border-gray-700/30 sticky top-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01]">
              {/* Account Details */}
              <div className="mb-10">
                <div className="space-y-6">
                  <div className="relative group">
                    <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <span className="mr-2">Account Balance</span>
                      <Info className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-help transition-colors" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.accountBalance}
                        onChange={(e) =>
                          handleAccountBalanceChange(parseFloat(e.target.value))
                        }
                        className="w-full px-6 py-4 pl-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 border-2 border-blue-200 dark:border-gray-600 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 dark:text-white transition-all duration-300 text-lg font-semibold hover:shadow-lg focus:shadow-xl transform focus:scale-[1.02] text-gray-800"
                        min="0"
                        step="10000"
                        placeholder="1,000,000"
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 bg-blue-500 rounded-lg">
                        <IndianRupee className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 font-medium">
                        INR
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Selection */}
              <div className="mb-8">
                <div className="relative bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-gray-700 dark:to-gray-800 p-2 rounded-2xl shadow-inner">
                  <div className="flex relative">
                    <button
                      onClick={() => setActiveTab('risk')}
                      className={`flex-1 py-4 px-6 text-sm font-bold rounded-xl transition-all duration-500 relative z-10 ${
                        activeTab === 'risk'
                          ? 'text-white shadow-xl transform scale-105'
                          : 'text-gray-700 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>Risk-Based</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('allocation')}
                      className={`flex-1 py-4 px-6 text-sm font-bold rounded-xl transition-all duration-500 relative z-10 ${
                        activeTab === 'allocation'
                          ? 'text-white shadow-xl transform scale-105'
                          : 'text-gray-700 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <PieChart className="w-4 h-4" />
                        <span>Allocation-Based</span>
                      </div>
                    </button>
                  </div>
                  {/* Animated Background */}
                  <div
                    className={`absolute top-2 bottom-2 w-1/2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-xl shadow-lg transition-all duration-500 ease-out ${
                      activeTab === 'risk' ? 'left-2' : 'left-1/2'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="space-y-6">
                  {/* Risk-Based Sizing Tab */}
                  {activeTab === 'risk' && (
                    <div className="transform transition-all duration-500 ease-out">
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-700/30 shadow-lg">
                        <label className="text-sm font-bold text-red-700 dark:text-red-300 mb-3 flex items-center">
                          <span className="mr-2">Risk on Capital (%)</span>
                          <Info className="w-4 h-4 text-red-500 hover:text-red-600 cursor-help transition-colors" />
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={
                              formData.riskPercentage === ''
                                ? ''
                                : formData.riskPercentage
                            }
                            onChange={(e) =>
                              handleInputChange(
                                'riskPercentage',
                                e.target.value
                              )
                            }
                            className="w-full px-6 py-4 bg-white/80 dark:bg-gray-800/80 border-2 border-red-200 dark:border-red-600 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-200/50 dark:text-white transition-all duration-300 text-lg font-semibold placeholder-red-400 hover:shadow-lg focus:shadow-xl transform focus:scale-[1.02]"
                            min="0.25"
                            max="10"
                            step="0.25"
                            placeholder="e.g., 2.5"
                          />
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 font-bold">
                            %
                          </div>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                          💡 Recommended: 1-2% for conservative trading
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Allocation-Based Sizing Tab */}
                  {activeTab === 'allocation' && (
                    <div className="transform transition-all duration-500 ease-out">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-700/30 shadow-lg">
                        <label className="block text-sm font-bold text-green-700 dark:text-green-300 mb-3 flex items-center">
                          <span className="mr-2">Portfolio Allocation (%)</span>
                          <Info className="w-4 h-4 text-green-500 hover:text-green-600 cursor-help transition-colors" />
                        </label>
                        <div className="relative">
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
                            className="w-full px-6 py-4 bg-white/80 dark:bg-gray-800/80 border-2 border-green-200 dark:border-green-600 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-200/50 dark:text-white transition-all duration-300 text-lg font-semibold placeholder-green-400 hover:shadow-lg focus:shadow-xl transform focus:scale-[1.02]"
                            min="1"
                            max="100"
                            step="1"
                            placeholder="e.g., 15"
                          />
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 font-bold">
                            %
                          </div>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                          🎯 Diversification recommended: 5-20% per position
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="relative group">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <span className="mr-2">Entry Price</span>
                        <Info className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-help transition-colors" />
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
                          className="w-full px-6 py-4 pl-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 dark:text-white transition-all duration-300 text-lg font-semibold placeholder-blue-400 hover:shadow-lg focus:shadow-xl transform focus:scale-[1.02]"
                          min="0"
                          step="0.1"
                          placeholder="500.00"
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 bg-blue-500 rounded-lg">
                          <IndianRupee className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="relative group">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <span className="mr-2">Stop Loss Price</span>
                        <Info className="w-4 h-4 text-orange-500 hover:text-orange-600 cursor-help transition-colors" />
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={
                            formData.stopLoss !== 0 ? formData.stopLoss : ''
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            handleInputChange('stopLoss', value);
                          }}
                          className="w-full px-6 py-4 pl-12 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-600 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200/50 dark:text-white transition-all duration-300 text-lg font-semibold placeholder-orange-400 hover:shadow-lg focus:shadow-xl transform focus:scale-[1.02]"
                          min="0"
                          step="0.1"
                          placeholder="475.00"
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 bg-orange-500 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {activeTab === 'risk'
                        ? 'Risk on Investment / per trade (%)'
                        : 'Actual Risk on Capital (%)'}
                      <Info
                        className="inline w-4 h-4 ml-1 text-blue-500 cursor-help"
                        xlinkTitle={
                          activeTab === 'risk'
                            ? 'Percentage risk on this specific trade (auto-calculates stop loss)'
                            : 'Actual risk percentage based on your allocation and stop loss'
                        }
                      />
                    </label>
                    <input
                      disabled
                      type="number"
                      value={
                        activeTab === 'risk'
                          ? formData.riskOnInvestment.toFixed(2)
                          : calculations?.riskPercentage.toFixed(2) || '0.00'
                      }
                      onChange={(e) =>
                        handleInputChange('riskOnInvestment', e.target.value)
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                      min="0.1"
                      max="50"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brokerage Cost (₹) - Auto Calculated (Buy Side)
                      <Info
                        className="inline w-4 h-4 ml-1 text-blue-500 cursor-help"
                        xlinkTitle="Automatically calculated for delivery equity buy side: STT, Transaction charges, SEBI charges, GST, and Stamp duty"
                      />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={calculations?.brokerageCost.toFixed(2) || '0.00'}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                        readOnly
                      />
                      <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {calculations?.chargesBreakdown && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs">
                        <div className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          Buy Side Charges:
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-blue-700 dark:text-blue-300">
                          <div>STT: ₹{calculations.chargesBreakdown.stt}</div>
                          <div>
                            Transaction: ₹
                            {calculations.chargesBreakdown.transactionCharges}
                          </div>
                          <div>
                            SEBI: ₹{calculations.chargesBreakdown.sebiCharges}
                          </div>
                          <div>GST: ₹{calculations.chargesBreakdown.gst}</div>
                          <div className="col-span-2">
                            Stamp Duty: ₹
                            {calculations.chargesBreakdown.stampDuty}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="xl:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/30 hover:shadow-3xl transition-all duration-300">
              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-600 rounded-2xl shadow-lg animate-pulse">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-amber-500 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="font-bold text-amber-800 dark:text-amber-200 text-lg">
                      Attention Required
                    </div>
                  </div>
                  <ul className="text-amber-700 dark:text-amber-300 space-y-2">
                    {warnings.map((warning, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Results */}
              {calculations && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                  <div className="group bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:rotate-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <BarChart3 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Position Size</h3>
                        <p className="text-sm opacity-90">Shares to buy</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold mb-2">
                      {calculations.positionSize.toLocaleString()}
                    </div>
                    <div className="text-sm opacity-80">shares/units</div>
                  </div>

                  <div className="group bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:-rotate-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <IndianRupee className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Total Investment</h3>
                        <p className="text-sm opacity-90">
                          {calculations.portfolioPercentage.toFixed(2)}% of
                          portfolio
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {formatCurrency(calculations.totalInvestment)}
                    </div>
                    <div className="text-sm opacity-80">Required capital</div>
                  </div>

                  <div className="group bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:rotate-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Risk Amount</h3>
                        <p className="text-sm opacity-90">
                          {activeTab === 'risk'
                            ? 'Maximum loss'
                            : `${calculations.riskPercentage.toFixed(
                                2
                              )}% of capital`}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {formatCurrency(calculations.riskAmount)}
                    </div>
                    <div className="text-sm opacity-80">Potential loss</div>
                  </div>

                  <div className="group bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:-rotate-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <TrendingUp className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Risk per Share</h3>
                        <p className="text-sm opacity-90">Entry - Stop Loss</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {formatCurrency(calculations.riskPerShare)}
                    </div>
                    <div className="text-sm opacity-80">Per share risk</div>
                  </div>

                  <div className="group bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-600 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:rotate-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <CreditCard className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Total Charges</h3>
                        <p className="text-sm opacity-90">Auto-calculated</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {formatCurrency(calculations.brokerageCost)}
                    </div>
                    <div className="text-sm opacity-80">Trading fees</div>
                  </div>

                  <div className="group bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:-rotate-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <TargetIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Breakeven Price</h3>
                        <p className="text-sm opacity-90">Entry + charges</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {formatCurrency(calculations.breakEvenPrice)}
                    </div>
                    <div className="text-sm opacity-80">Break-even point</div>
                  </div>
                </div>
              )}

              {/* R-Multiple Targets */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl">
                  <h3 className="text-lg font-semibold text-center">
                    R-Multiple Profit Targets
                  </h3>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-b-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            R-Multiple
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Target Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Gross Profit
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Return %
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Risk:Reward
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {targets.map((target, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              {target.r}R
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {formatCurrency(target.targetPrice)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(target.netProfit)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                              {target.returnPercentage.toFixed(2)}%
                            </td>

                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              1:{target.r}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Position Sizing Scenarios here */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-xl">
                  <h3 className="text-lg font-semibold text-center">
                    {activeTab === 'risk'
                      ? 'Risk-Based Position Sizing Scenarios'
                      : 'Allocation-Based Position Sizing Scenarios'}
                  </h3>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-b-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {activeTab === 'risk' ? 'Risk %' : 'Allocation %'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Position Size
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Investment Required
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {activeTab === 'risk'
                              ? 'Risk Amount'
                              : 'Actual Risk Amount'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {activeTab === 'risk'
                              ? 'Portfolio %'
                              : 'Actual Risk %'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {scenarios.map((scenario, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              {activeTab === 'risk'
                                ? `${scenario.riskPercent}%`
                                : `${scenario.portfolioPercentage.toFixed(0)}%`}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {scenario.positionSize.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {formatCurrency(scenario.totalInvestment)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                              {formatCurrency(scenario.riskAmount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {activeTab === 'risk'
                                ? `${scenario.portfolioPercentage.toFixed(2)}%`
                                : `${scenario.riskPercent.toFixed(2)}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={exportToCSV}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Risk Disclaimer
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            This calculator is for educational purposes only. Trading involves
            substantial risk of loss. Past performance does not guarantee future
            results. Always consult with a qualified financial advisor before
            making investment decisions. Never risk more than you can afford to
            lose.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TradingCalculator;
