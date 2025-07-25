import React, { useState, useEffect, useCallback } from 'react';
import {
  Info,
  Package,
  Zap,
  Banknote,
  Flame,
  Scale,
  Receipt,
  AlertTriangle,
  TrendingUp,
  ArrowUp,
  OctagonX,
  Plus,
  Minus,
  Send,
} from 'lucide-react';
import { useOrderPlacement } from '../../hooks/useOrderPlacement';
import { orderService } from '../../services/orderService';
import { FloatingOrderNotification } from '../../components/OrderPlacement/FloatingOrderNotification';
import { useTradingSettings } from '../../hooks/useTradingSettings';
import { useSettings } from '../../contexts/SettingsContext';
import { useTrading } from '../../contexts/TradingContext';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SettingsModal from '../../components/Settings/SettingsModal';
import EnhancedHeader from '../../components/Header/EnhancedHeader';
import BrokerConnectionPanel from '../../components/broker/BrokerConnectionPanel';
import InstrumentAutocomplete from '../../components/trading/InstrumentAutocomplete';
import type {
  FormData,
  Calculations,
  Target,
  ChargesBreakdown,
  TabType,
  MarketHealth,
} from './types';
import { BROKERAGE_RATES } from './constants';
import MarketOutlookSection from './components/MarketOutlookSection';
import TradingModeSelector from './components/TradingModeSelector';
import RiskLevelSelector from './components/RiskLevelSelector';
import AllocationLevelSelector from './components/AllocationLevelSelector';

const TradingCalculator: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showCapitalEdit, setShowCapitalEdit] = useState(false);
  const [tempCapital, setTempCapital] = useState('');
  const [showMarketOutlookPanel, setShowMarketOutlookPanel] = useState(false);
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
  // Settings context for capital management
  const {
    settings: settingsContext,
    updateSettings,
    hasActiveBrokerSession,
    isLoading: isLoadingSettings,
  } = useSettings();

  const [entryPriceMode, setEntryPriceMode] = useState<'lmt' | 'mkt'>(
    hasActiveBrokerSession ? 'mkt' : 'lmt'
  );

  // Settings integration
  const {
    settings,
    getRiskLevels,
    getAllocationLevels,
    handleActiveTabChange: updateActiveTab,
    handleRiskLevelChange: updateRiskLevel,
    handleAllocationLevelChange: updateAllocationLevel,
    handleMarketHealthChange,
  } = useTradingSettings({
    setFormData,
    setActiveTab,
    setIsDarkMode,
  });

  // Trading context for instrument quotes and price data
  const {
    state: { selectedInstrument, isLoadingQuote },
    currentPrice,
  } = useTrading();

  // Order placement management
  const {
    isPlacing,
    isSuccess,
    isError,
    placeOrder,
    resetStatus,
    lastOrderResponse,
    lastError,
  } = useOrderPlacement();

  // Calculate brokerage automatically for delivery equity (buy only)
  const calculateBrokerage = useCallback(
    (buyPrice: number, positionSize: number): ChargesBreakdown => {
      const turnoverBuy = buyPrice * positionSize;

      // Charges for delivery equity (buy only)
      const stt = BROKERAGE_RATES.STT * turnoverBuy;
      const transactionCharges =
        BROKERAGE_RATES.TRANSACTION_CHARGES * turnoverBuy;
      const sebiCharges = BROKERAGE_RATES.SEBI_CHARGES * turnoverBuy;
      const gst = BROKERAGE_RATES.GST * (transactionCharges + sebiCharges);
      const stampDuty = BROKERAGE_RATES.STAMP_DUTY * turnoverBuy;

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

  // Auto-populate entry price when instrument quote is loaded
  useEffect(() => {
    if (currentPrice && selectedInstrument) {
      // Always update entry price with live price when quote is available
      // This ensures calculations are always based on current market price
      setFormData((prev) => ({
        ...prev,
        entryPrice: currentPrice,
      }));
    }
  }, [currentPrice, selectedInstrument]);

  // Check if current entry price matches the live price (auto-populated)
  const isEntryPriceAutoPopulated =
    currentPrice && Math.abs(formData.entryPrice - currentPrice) < 0.01;

  // Format currency in INR
  const formatCurrency = useCallback((amount: number | undefined): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₹0.00';
    }
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

  // Removed MarketSmith API integration for cleaner UX

  // Removed auto-fetch for MarketSmith data

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

  const formatCurrencyShort = (amount: number | undefined): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0';
    }
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const handleCapitalSave = async () => {
    const newAmount = parseFloat(tempCapital.replace(/,/g, ''));
    if (!isNaN(newAmount) && newAmount > 0) {
      try {
        await updateSettings({ accountBalance: newAmount });
        setFormData({ ...formData, accountBalance: newAmount });
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

  // Handle order placement
  const handlePlaceOrder = useCallback(async () => {
    if (!selectedInstrument || !calculations) {
      return;
    }

    try {
      // Create order request from current form data
      const orderRequest = orderService.createOrderRequest(
        selectedInstrument,
        formData,
        entryPriceMode,
        calculations
      );

      // Start the order placement process
      await placeOrder('kite', orderRequest);
    } catch (error) {
      console.error('Order placement failed:', error);
    }
  }, [selectedInstrument, calculations, formData, entryPriceMode, placeOrder]);

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
              <MarketOutlookSection
                formData={formData}
                showMarketOutlookPanel={showMarketOutlookPanel}
                setShowMarketOutlookPanel={setShowMarketOutlookPanel}
                setFormData={setFormData}
                onMarketHealthChange={handleMarketHealthChange}
              />

              {/* Compact Broker Connection Panel */}
              <BrokerConnectionPanel />

              <TradingModeSelector
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                updateActiveTab={updateActiveTab}
              />

              {/* Instrument Selection */}
              {hasActiveBrokerSession && (
                <InstrumentAutocomplete className="mb-6" />
              )}

              {/* Gaming Battle Setup */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30 backdrop-blur-sm">
                {/* Enhanced Risk-Based Sizing Tab */}
                {activeTab === 'risk' && (
                  <RiskLevelSelector
                    formData={formData}
                    handleInputChange={handleInputChange}
                    getRiskLevels={getRiskLevels}
                    updateRiskLevel={updateRiskLevel}
                  />
                )}

                {/* Enhanced Allocation-Based Sizing Tab */}
                {activeTab === 'allocation' && (
                  <AllocationLevelSelector
                    formData={formData}
                    handleInputChange={handleInputChange}
                    getAllocationLevels={getAllocationLevels}
                    updateAllocationLevel={updateAllocationLevel}
                  />
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
                        className={`w-full px-4 py-3 pl-10 pr-20 border-2 rounded-xl text-white font-mono transition-all duration-300 focus:shadow-lg ${
                          entryPriceMode === 'mkt'
                            ? 'bg-gray-800/40 border-gray-500/50 text-gray-400 placeholder-gray-500/70 cursor-not-allowed'
                            : isLoadingQuote
                            ? 'bg-black/40 border-yellow-500/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 placeholder-green-300/50'
                            : isEntryPriceAutoPopulated
                            ? 'bg-black/40 border-blue-500/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:shadow-blue-500/20 placeholder-green-300/50'
                            : 'bg-black/40 border-green-500/50 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 focus:shadow-green-500/20 placeholder-green-300/50'
                        }`}
                        min="0"
                        step="0.1"
                        placeholder={
                          entryPriceMode === 'mkt'
                            ? '0.00'
                            : isLoadingQuote
                            ? 'Loading price...'
                            : '0.00'
                        }
                        disabled={isLoadingQuote || entryPriceMode === 'mkt'}
                      />
                      <span
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                          entryPriceMode === 'mkt'
                            ? 'text-gray-300'
                            : 'text-green-400'
                        }`}
                      >
                        ₹
                      </span>

                      {/* Mode Toggle on same row */}
                      {hasActiveBrokerSession && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex bg-black/60 rounded-md p-0.5 border border-green-500/30">
                          <button
                            type="button"
                            onClick={() => setEntryPriceMode('mkt')}
                            className={`px-1.5 py-0.5 text-xs font-medium rounded-sm transition-all duration-200 ${
                              entryPriceMode === 'mkt'
                                ? 'bg-gray-600/40 text-gray-300 border border-gray-500/60 shadow-sm'
                                : 'text-green-400/70 hover:text-green-300'
                            }`}
                          >
                            MKT
                          </button>
                          <button
                            type="button"
                            onClick={() => setEntryPriceMode('lmt')}
                            className={`px-1.5 py-0.5 text-xs font-medium rounded-sm transition-all duration-200 ${
                              entryPriceMode === 'lmt'
                                ? 'bg-green-500/30 text-green-300 border border-green-400/50 shadow-sm'
                                : 'text-green-400/70 hover:text-green-300'
                            }`}
                          >
                            LMT
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <label className="flex items-center justify-between text-sm font-medium text-red-300 mb-2">
                      <div className="flex items-center">
                        <OctagonX className="inline w-4 h-4 mr-1 text-red-400" />
                        Stop Loss
                        <Info className="inline w-4 h-4 ml-1 text-red-400 cursor-help" />
                      </div>
                      {formData.entryPrice > 0 &&
                        formData.stopLoss > 0 &&
                        formData.stopLoss < formData.entryPrice && (
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1 text-xs">
                              {stopLossMode === 'price' ? (
                                <>
                                  <span className="text-yellow-300">Risk:</span>
                                  <span className="font-bold text-orange-300">
                                    {(
                                      ((formData.entryPrice -
                                        formData.stopLoss) /
                                        formData.entryPrice) *
                                      100
                                    ).toFixed(2)}
                                    %
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-yellow-300">SL:</span>
                                  <span className="font-bold text-orange-300">
                                    ₹{formData.stopLoss.toFixed(2)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
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
                  </div>
                </div>

                {/* Order Placement Section */}
                {hasActiveBrokerSession && (
                  <div className="mt-6">
                    {/* Lightning-Fast Order Button */}

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isPlacing
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-wait'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white hover:scale-[1.01] shadow-lg hover:shadow-purple-500/20'
                      }`}
                      disabled={
                        !selectedInstrument ||
                        !formData.entryPrice ||
                        !formData.stopLoss ||
                        isPlacing
                      }
                    >
                      {isPlacing ? (
                        <>
                          <div className="flex space-x-1">
                            <div
                              className="w-1 h-1 bg-white rounded-full animate-pulse"
                              style={{ animationDelay: '0ms' }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-white rounded-full animate-pulse"
                              style={{ animationDelay: '150ms' }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-white rounded-full animate-pulse"
                              style={{ animationDelay: '300ms' }}
                            ></div>
                          </div>
                          <span>Executing Order</span>
                        </>
                      ) : !selectedInstrument ? (
                        <>
                          <Package className="w-5 h-5" />
                          <span>Select Instrument</span>
                        </>
                      ) : !formData.entryPrice ? (
                        <>
                          <ArrowUp className="w-5 h-5" />
                          <span>Set Entry Price</span>
                        </>
                      ) : !formData.stopLoss ? (
                        <>
                          <OctagonX className="w-5 h-5" />
                          <span>Set Stop Loss</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>
                            Place{' '}
                            {entryPriceMode === 'mkt' ? 'Market' : 'Limit'}{' '}
                            Order
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
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
              <div className="mb-0">
                {/* Gaming-style Profit Dashboard */}
                <div className="relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/30 overflow-hidden">
                  {/* Animated Background Grid */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-grid-pattern animate-pulse"></div>
                  </div>

                  {/* Interactive Profit Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                {isLoadingSettings ? (
                  <div className="text-gray-400">Loading...</div>
                ) : tempCapital ? (
                  formatCurrency(parseFloat(tempCapital))
                ) : (
                  formatCurrency(settingsContext.accountBalance)
                )}
              </div>
              <div className="text-lg text-cyan-300 font-semibold">
                {isLoadingSettings ? (
                  <div className="text-gray-400">---</div>
                ) : tempCapital ? (
                  formatCurrencyShort(parseFloat(tempCapital))
                ) : (
                  formatCurrencyShort(settingsContext.accountBalance)
                )}
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Floating Order Notifications */}
      {isSuccess && lastOrderResponse && (
        <FloatingOrderNotification
          type="success"
          orderResponse={lastOrderResponse}
          onClose={resetStatus}
        />
      )}

      {isError && lastError && (
        <FloatingOrderNotification
          type="error"
          error={lastError}
          onClose={resetStatus}
          onRetry={handlePlaceOrder}
        />
      )}
    </div>
  );
};

export default TradingCalculator;
