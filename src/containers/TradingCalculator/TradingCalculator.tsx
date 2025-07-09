import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Info,
  AlertTriangle,
  PieChart,
  BarChart3,
  Target as TargetIcon,
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
    entryPrice: 100,
    stopLoss: 95,
    brokerageCost: 0,
    riskOnInvestment: 5.0,
    allocationPercentage: 10.0,
  });
  const [selectedRiskOption, setSelectedRiskOption] = useState<string>('0.25');
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
                        {(formData.accountBalance / 100000).toFixed(1)}L
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gaming Mode Selector */}
              <div className="mb-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">
                    🎮 SELECT MODE
                  </h3>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto"></div>
                </div>
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
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-black" />
                  </div>
                  <h3 className="text-lg font-bold text-purple-400">
                    ⚔️ TRADE SETUP
                  </h3>
                </div>

                {/* Risk-Based Sizing Tab */}
                {activeTab === 'risk' && (
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-3">
                      ⚡ Risk Level Selection
                      <Info
                        className="inline w-4 h-4 ml-1 text-purple-400 cursor-help"
                        xlinkTitle="Choose your risk level - higher risk, higher rewards!"
                      />
                    </label>

                    {/* Gaming Risk Level Buttons */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {[0.25, 0.5, 0.75, 1].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedRiskOption(option.toString());
                            handleInputChange(
                              'riskPercentage',
                              option.toString()
                            );
                          }}
                          className={`py-3 px-2 text-xs font-bold rounded-xl border-2 transition-all duration-500 relative overflow-hidden ${
                            selectedRiskOption === option.toString()
                              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-400/50 shadow-lg shadow-red-500/30 transform scale-105'
                              : 'bg-black/30 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400/50 hover:scale-102'
                          }`}
                        >
                          <div className="relative z-10">
                            <div className="text-lg">🔥</div>
                            <div>{option}%</div>
                          </div>
                          {selectedRiskOption === option.toString() && (
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-20 animate-pulse"></div>
                          )}
                        </button>
                      ))}

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
                        className={`py-3 px-2 text-xs font-bold rounded-xl border-2 transition-all duration-500 relative overflow-hidden ${
                          selectedRiskOption === 'custom'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-400/50 shadow-lg shadow-cyan-500/30 transform scale-105'
                            : 'bg-black/30 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400/50 hover:scale-102'
                        }`}
                      >
                        <div className="relative z-10">
                          <div className="text-lg">⚙️</div>
                          <div>Custom</div>
                        </div>
                        {selectedRiskOption === 'custom' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-20 animate-pulse"></div>
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
                      min="1"
                      max="100"
                      step="1"
                      placeholder="Enter allocation %..."
                    />
                  </div>
                )}

                {/* Gaming Price Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-green-300 mb-2">
                      💰 Entry Price Target
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
                      🛡️ Stop Loss Shield
                      <Info className="inline w-4 h-4 ml-1 text-red-400 cursor-help" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.stopLoss !== 0 ? formData.stopLoss : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange('stopLoss', value);
                        }}
                        className="w-full px-4 py-3 pl-10 bg-black/40 border-2 border-red-500/50 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-400/20 text-white placeholder-red-300/50 font-mono transition-all duration-300 focus:shadow-lg focus:shadow-red-500/20"
                        min="0"
                        step="0.1"
                        placeholder="0.00"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400">
                        ₹
                      </span>
                    </div>
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

              {/* Gaming Achievement Cards */}
              {calculations && (
                <div className="mb-8">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    {/* Position Size Achievement */}
                    <div className="relative bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4 text-center hover:scale-110 hover:border-blue-400/50 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/20 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500"></div>
                      <div className="relative z-10">
                        <div className="text-3xl mb-2">🎯</div>
                        <div className="text-xs text-blue-300 mb-1 font-bold">
                          POSITION LOCKED
                        </div>
                        <div className="text-lg font-bold text-white">
                          {calculations.positionSize.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-200">
                          units secured
                        </div>
                      </div>
                    </div>

                    {/* Investment Achievement */}
                    <div className="relative bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-4 text-center hover:scale-110 hover:border-green-400/50 transition-all duration-500 hover:shadow-lg hover:shadow-green-500/20 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500"></div>
                      <div className="relative z-10">
                        <div className="text-3xl mb-2">💰</div>
                        <div className="text-xs text-green-300 mb-1 font-bold">
                          CAPITAL DEPLOYED
                        </div>
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(calculations.totalInvestment)}
                        </div>
                        <div className="text-xs text-green-200">
                          {calculations.portfolioPercentage.toFixed(1)}%
                          portfolio
                        </div>
                      </div>
                    </div>

                    {/* Risk Achievement */}
                    <div className="relative bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-4 text-center hover:scale-110 hover:border-red-400/50 transition-all duration-500 hover:shadow-lg hover:shadow-red-500/20 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-pink-600 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500"></div>
                      <div className="relative z-10">
                        <div className="text-3xl mb-2">⚡</div>
                        <div className="text-xs text-red-300 mb-1 font-bold">
                          RISK EXPOSURE
                        </div>
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(calculations.riskAmount)}
                        </div>
                        <div className="text-xs text-red-200">max damage</div>
                      </div>
                    </div>

                    {/* Risk Per Share Achievement */}
                    <div className="relative bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-4 text-center hover:scale-110 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/20 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500"></div>
                      <div className="relative z-10">
                        <div className="text-3xl mb-2">⚔️</div>
                        <div className="text-xs text-cyan-300 mb-1 font-bold">
                          RISK/UNIT
                        </div>
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(calculations.riskPerShare)}
                        </div>
                        <div className="text-xs text-cyan-200">per share</div>
                      </div>
                    </div>

                    {/* Charges Achievement */}
                    <div className="relative bg-gradient-to-br from-purple-500/20 to-indigo-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-4 text-center hover:scale-110 hover:border-purple-400/50 transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/20 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500"></div>
                      <div className="relative z-10">
                        <div className="text-3xl mb-2">💳</div>
                        <div className="text-xs text-purple-300 mb-1 font-bold">
                          BROKERAGE
                        </div>
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(calculations.brokerageCost)}
                        </div>
                        <div className="text-xs text-purple-200">auto-calc</div>
                      </div>
                    </div>

                    {/* Breakeven Achievement */}
                    <div className="relative bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-4 text-center hover:scale-110 hover:border-orange-400/50 transition-all duration-500 hover:shadow-lg hover:shadow-orange-500/20 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-red-600 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500"></div>
                      <div className="relative z-10">
                        <div className="text-3xl mb-2">🛡️</div>
                        <div className="text-xs text-orange-300 mb-1 font-bold">
                          BREAK EVEN
                        </div>
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(calculations.breakEvenPrice)}
                        </div>
                        <div className="text-xs text-orange-200">
                          survival line
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* R-Multiple Targets */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl">
                  <div className="flex items-center justify-center space-x-2">
                    <TargetIcon className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      R-Multiple Profit Targets
                    </h3>
                  </div>
                  <p className="text-sm opacity-90 mt-1 text-center">
                    Potential profits based on risk multiples
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-b-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700">
                  {/* Mobile Card View */}
                  <div className="block md:hidden">
                    <div className="space-y-4 p-4">
                      {targets.map((target, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                {target.r}R
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Target
                                </div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(target.targetPrice)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Risk:Reward
                              </div>
                              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                1:{target.r}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Profit
                              </div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(target.netProfit)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Return
                              </div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {target.returnPercentage.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            R-Multiple
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Target Price
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Gross Profit
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Return %
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Risk:Reward
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {targets.map((target, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                  {target.r}R
                                </div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  {target.r}x Risk
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(target.targetPrice)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(target.netProfit)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {target.returnPercentage.toFixed(2)}%
                                </span>
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.min(
                                        target.returnPercentage / 2,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-purple-600 dark:text-purple-400">
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
                  <div className="flex items-center justify-center space-x-2">
                    <PieChart className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      {activeTab === 'risk'
                        ? 'Risk-Based Position Sizing Scenarios'
                        : 'Allocation-Based Position Sizing Scenarios'}
                    </h3>
                  </div>
                  <p className="text-sm opacity-90 mt-1 text-center">
                    {activeTab === 'risk'
                      ? 'Compare different risk levels and their impact'
                      : 'Compare different allocation levels and their risk'}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-b-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700">
                  {/* Mobile Card View */}
                  <div className="block lg:hidden">
                    <div className="space-y-4 p-4">
                      {scenarios.map((scenario, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border-l-4 border-green-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold">
                                {activeTab === 'risk'
                                  ? `${scenario.riskPercent}%`
                                  : `${scenario.portfolioPercentage.toFixed(
                                      0
                                    )}%`}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {activeTab === 'risk'
                                    ? 'Risk Level'
                                    : 'Allocation'}
                                </div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                  {scenario.positionSize.toLocaleString()}{' '}
                                  shares
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {activeTab === 'risk'
                                  ? 'Portfolio %'
                                  : 'Risk %'}
                              </div>
                              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {activeTab === 'risk'
                                  ? `${scenario.portfolioPercentage.toFixed(
                                      2
                                    )}%`
                                  : `${scenario.riskPercent.toFixed(2)}%`}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Investment
                              </div>
                              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {formatCurrency(scenario.totalInvestment)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Risk Amount
                              </div>
                              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(scenario.riskAmount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            {activeTab === 'risk' ? 'Risk %' : 'Allocation %'}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Position Size
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Investment Required
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            {activeTab === 'risk'
                              ? 'Risk Amount'
                              : 'Actual Risk Amount'}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
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
                            className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold">
                                  {activeTab === 'risk'
                                    ? `${scenario.riskPercent}%`
                                    : `${scenario.portfolioPercentage.toFixed(
                                        0
                                      )}%`}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {activeTab === 'risk'
                                      ? 'Risk Level'
                                      : 'Allocation'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {activeTab === 'risk'
                                      ? 'of capital'
                                      : 'of portfolio'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {scenario.positionSize.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                shares/units
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                {formatCurrency(scenario.totalInvestment)}
                              </div>
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                <div
                                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      scenario.portfolioPercentage * 3,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(scenario.riskAmount)}
                              </div>
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                <div
                                  className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      scenario.riskPercent * 20,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {activeTab === 'risk'
                                  ? `${scenario.portfolioPercentage.toFixed(
                                      2
                                    )}%`
                                  : `${scenario.riskPercent.toFixed(2)}%`}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {activeTab === 'risk'
                                  ? 'of portfolio'
                                  : 'of capital'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Gaming Export Station */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={exportToCSV}
                  className="relative group flex items-center space-x-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/50 hover:border-cyan-400/70 text-cyan-300 hover:text-white px-8 py-4 rounded-2xl transition-all duration-500 hover:scale-110 shadow-lg hover:shadow-cyan-500/20 backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-500"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <Download className="w-5 h-5" />
                    <span className="font-bold">📊 EXPORT DATA</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gaming Disclaimer */}
        <div className="mt-8 bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-yellow-500/30 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
              <AlertTriangle className="w-6 h-6 text-black" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              ⚠️ RISK WARNING PROTOCOL
            </h3>
          </div>
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-4">
            <p className="text-yellow-200 leading-relaxed text-sm">
              🎮 This is a simulation tool for educational purposes only. Real
              trading involves substantial risk of loss. Past performance does
              not guarantee future results. Always consult with a qualified
              financial advisor before making investment decisions. Never risk
              more than you can afford to lose. Game responsibly! 🎮
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TradingCalculator;
