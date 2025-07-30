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
import '../../components/ui/AdvancedAnimations.css';
import { useTradingSettings } from '../../hooks/useTradingSettings';
import { useSettings } from '../../contexts/SettingsContext';
import { useTrading } from '../../contexts/TradingContext';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SettingsModal from '../../components/Settings/SettingsModal';
import Header from '../../components/Header';
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
import PortfolioSnapshot from '../../components/Portfolio/PortfolioSnapshot';

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
  const [stopLossPercentage, setStopLossPercentage] = useState<number>(3);
  // Settings context for capital management
  const {
    settings: settingsContext,
    updateSettings,
    hasActiveBrokerSession,
    isLoading: isLoadingSettings,
  } = useSettings();

  const stopLossMode = settingsContext.stopLossMode || 'price';

  const handleStopLossModeChange = (mode: 'price' | 'percentage') => {
    updateSettings({ stopLossMode: mode });
  };

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

  // Track loading state for price fetching
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);

  // Safe warning setter that prevents updates during loading
  const setSafeWarnings = useCallback((newWarnings: string[]) => {
    if (!isLoadingQuote && !isLoadingPrice && !isAutoPopulating) {
      setWarnings(newWarnings);
    }
  }, [isLoadingQuote, isLoadingPrice, isAutoPopulating]);

  // Monitor when instrument changes to show loading state
  useEffect(() => {
    if (selectedInstrument && !currentPrice) {
      setIsLoadingPrice(true);
      // Clear warnings during loading to prevent flickering
      setWarnings([]);
    } else if (currentPrice) {
      // Add a small delay before setting loading to false to prevent validation flash
      const timer = setTimeout(() => {
        setIsLoadingPrice(false);
      }, 150); // Wait for auto-population to complete
      
      return () => clearTimeout(timer);
    }
  }, [selectedInstrument, currentPrice]);

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

  // Auto-populate entry price and stop loss when instrument quote is loaded
  useEffect(() => {
    if (currentPrice && selectedInstrument) {
      setIsAutoPopulating(true);
      
      // Always update entry price with live price when quote is available
      // This ensures calculations are always based on current market price
      const defaultStopLossPercentage = settings.defaultStopLossPercentage || 3;
      const multiplier = (100 - defaultStopLossPercentage) / 100;
      const calculatedStopLoss = parseFloat((currentPrice * multiplier).toFixed(2));
      
      setFormData((prev) => ({
        ...prev,
        entryPrice: currentPrice,
        stopLoss: calculatedStopLoss,
      }));
      
      // Update stop loss percentage for display
      setStopLossPercentage(defaultStopLossPercentage);
      
      // Clear auto-populating flag after a brief delay to prevent validation flash
      const timer = setTimeout(() => {
        setIsAutoPopulating(false);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [currentPrice, selectedInstrument, settings.defaultStopLossPercentage]);

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

  // Initialize stop loss percentage with user settings
  useEffect(() => {
    setStopLossPercentage(settings.defaultStopLossPercentage);
  }, [settings.defaultStopLossPercentage]);

  // Recalculate stop loss price when percentage changes and entry price exists (only in percentage mode)
  useEffect(() => {
    if (stopLossMode === 'percentage' && formData.entryPrice > 0 && stopLossPercentage > 0) {
      const multiplier = (100 - stopLossPercentage) / 100;
      const newStopLoss = parseFloat(
        (formData.entryPrice * multiplier).toFixed(2)
      );
      setFormData((prev) => ({
        ...prev,
        stopLoss: newStopLoss,
      }));
    }
  }, [stopLossPercentage, formData.entryPrice, stopLossMode]);

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
      // Skip validation during loading to prevent warning flicker
      if (isLoadingQuote || isLoadingPrice || isAutoPopulating) {
        return null;
      }

      const validationWarnings = validateInputs();
      setSafeWarnings(validationWarnings);

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
      isLoadingQuote,
      isLoadingPrice,
      isAutoPopulating,
      setSafeWarnings,
    ]);

  // Calculate position size based on allocation-based sizing
  const calculateAllocationBasedPositionSize =
    useCallback((): Calculations | null => {
      // Skip validation during loading to prevent warning flicker
      if (isLoadingQuote || isLoadingPrice || isAutoPopulating) {
        return null;
      }

      const validationWarnings = validateInputs();
      setSafeWarnings(validationWarnings);

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
      isLoadingQuote,
      isLoadingPrice,
      isAutoPopulating,
      setSafeWarnings,
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
    // Skip calculations during loading to prevent warning flicker
    if (isLoadingQuote || isLoadingPrice || isAutoPopulating) {
      return;
    }
    
    const result = calculatePositionSize();
    setCalculations(result);
  }, [calculatePositionSize, activeTab, isLoadingQuote, isLoadingPrice, isAutoPopulating]);

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

  // Handle order placement with GTT integration
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

      console.log('🎯 TradingCalculator: Placing order with GTT integration:', {
        instrument: selectedInstrument.tradingsymbol,
        stopLossPrice: formData.stopLoss,
        stopLossPercentage,
        stopLossMode,
        currentPrice: formData.entryPrice,
        orderRequest,
      });

      // Use regular order placement with stop loss metadata (GTT handled by backend)
      await placeOrder('kite', orderRequest, {
        mode: stopLossMode,
        percentage: stopLossPercentage,
        originalPrice: formData.entryPrice,
        stopLossPrice: formData.stopLoss,
      });
    } catch (error) {
      console.error('Order placement failed:', error);
    }
  }, [
    selectedInstrument,
    calculations,
    formData,
    entryPriceMode,
    stopLossMode,
    stopLossPercentage,
    placeOrder,
  ]);

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

        // Auto-calculate stop loss when entry price is entered (only in percentage mode)
        if (field === 'entryPrice' && processedValue && processedValue > 0 && stopLossMode === 'percentage') {
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
    [activeTab, settings.defaultStopLossPercentage, stopLossMode]
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
      <Header
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
                            : isLoadingQuote || isLoadingPrice
                            ? 'bg-black/40 border-yellow-500/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 placeholder-green-300/50 cursor-not-allowed'
                            : isEntryPriceAutoPopulated
                            ? 'bg-black/40 border-blue-500/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:shadow-blue-500/20 placeholder-green-300/50'
                            : 'bg-black/40 border-green-500/50 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 focus:shadow-green-500/20 placeholder-green-300/50'
                        }`}
                        min="0"
                        step="0.1"
                        placeholder={
                          entryPriceMode === 'mkt'
                            ? '0.00'
                            : isLoadingQuote || isLoadingPrice
                            ? 'Loading price...'
                            : '0.00'
                        }
                        disabled={
                          isLoadingQuote ||
                          isLoadingPrice ||
                          entryPriceMode === 'mkt'
                        }
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
                              // Auto-calculate percentage (only update percentage when in price mode for display purposes)
                              if (
                                formData.entryPrice > 0 &&
                                parseFloat(value) > 0 &&
                                stopLossMode === 'price'
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
                            className={`w-full px-4 py-3 pl-10 pr-20 bg-black/40 border-2 rounded-xl text-white placeholder-red-300/50 font-mono transition-all duration-300 focus:shadow-lg ${
                              isLoadingQuote || isLoadingPrice
                                ? 'border-yellow-500/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 cursor-not-allowed'
                                : 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 focus:shadow-red-500/20'
                            }`}
                            min="0"
                            step="0.01"
                            placeholder={
                              isLoadingQuote || isLoadingPrice
                                ? 'Loading price...'
                                : 'Enter stop loss price'
                            }
                            disabled={isLoadingQuote || isLoadingPrice}
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400">
                            ₹
                          </span>

                          {/* Mode Toggle on same row */}
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex bg-black/60 rounded-lg p-1 border border-red-500/30">
                            <button
                              type="button"
                              onClick={() => handleStopLossModeChange('price')}
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
                              onClick={() =>
                                handleStopLossModeChange('percentage')
                              }
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
                            className={`w-full px-4 py-3 pl-10 pr-20 bg-black/40 border-2 rounded-xl text-white placeholder-red-300/50 font-mono transition-all duration-300 focus:shadow-lg ${
                              isLoadingQuote || isLoadingPrice
                                ? 'border-yellow-500/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 cursor-not-allowed'
                                : 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 focus:shadow-red-500/20'
                            }`}
                            min="0"
                            max="50"
                            step="0.1"
                            placeholder={
                              isLoadingQuote || isLoadingPrice
                                ? 'Loading price...'
                                : 'Enter risk %'
                            }
                            disabled={isLoadingQuote || isLoadingPrice}
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400">
                            %
                          </span>

                          {/* Mode Toggle on same row */}
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex bg-black/60 rounded-lg p-1 border border-red-500/30">
                            <button
                              type="button"
                              onClick={() => handleStopLossModeChange('price')}
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
                              onClick={() =>
                                handleStopLossModeChange('percentage')
                              }
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
                        isLoadingQuote ||
                        isLoadingPrice ||
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
                      ) : isLoadingQuote || isLoadingPrice ? (
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
                          <span>Fetching Quote...</span>
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
          {(!hasActiveBrokerSession || selectedInstrument) && (
            <div className="lg:col-span-2">
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-500">
                {/* Gaming Alert System */}
                {warnings.length > 0 && !isLoadingQuote && !isLoadingPrice && !isAutoPopulating && (
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

                {/* 🎮 Epic Loading Experience - Gaming Quote Fetcher */}
                {false && selectedInstrument && (
                  <div className="mb-6 relative overflow-hidden">
                    {/* Holographic Background Effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-purple-900/30 to-pink-900/20 animate-pulse rounded-3xl"></div>
                    <div
                      className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-emerald-500/5 animate-pulse rounded-3xl"
                      style={{ animationDelay: '1s' }}
                    ></div>

                    {/* Floating Particles */}
                    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className={`absolute w-1 h-1 bg-gradient-to-r ${
                            i % 4 === 0
                              ? 'from-cyan-400 to-blue-500'
                              : i % 4 === 1
                              ? 'from-purple-400 to-pink-500'
                              : i % 4 === 2
                              ? 'from-emerald-400 to-teal-500'
                              : 'from-yellow-400 to-orange-500'
                          } rounded-full animate-bounce opacity-60`}
                          style={{
                            left: `${10 + i * 7}%`,
                            top: `${15 + (i % 3) * 25}%`,
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: `${2 + (i % 3)}s`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="relative bg-black/60 backdrop-blur-2xl rounded-3xl p-8 border-2 border-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 shadow-2xl">
                      <div className="flex flex-col items-center justify-center space-y-8">
                        {/* 🌟 Central Quantum Loading Orb */}
                        <div className="relative">
                          {/* Outer Energy Rings */}
                          <div className="absolute -inset-8">
                            <div
                              className="w-32 h-32 border-2 border-cyan-400/20 rounded-full animate-spin"
                              style={{ animationDuration: '3s' }}
                            ></div>
                            <div
                              className="absolute inset-2 w-28 h-28 border-2 border-purple-400/20 rounded-full animate-spin"
                              style={{
                                animationDirection: 'reverse',
                                animationDuration: '2s',
                              }}
                            ></div>
                            <div
                              className="absolute inset-4 w-24 h-24 border-2 border-pink-400/20 rounded-full animate-spin"
                              style={{ animationDuration: '4s' }}
                            ></div>
                          </div>

                          {/* Core Pulsing Orb */}
                          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-400 rounded-full animate-pulse shadow-2xl shadow-purple-500/50">
                            <div className="w-full h-full bg-gradient-to-tr from-white/20 to-transparent rounded-full animate-ping"></div>
                          </div>

                          {/* Energy Bolts */}
                          <div
                            className="absolute inset-0 animate-spin"
                            style={{ animationDuration: '1.5s' }}
                          >
                            {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
                              <div
                                key={i}
                                className="absolute w-1 h-4 bg-gradient-to-t from-transparent to-cyan-400 rounded-full"
                                style={{
                                  transform: `rotate(${rotation}deg) translateY(-40px)`,
                                  transformOrigin: '50% 40px',
                                  animationDelay: `${i * 0.1}s`,
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* 📊 Trading Calculations Status */}
                        <div className="text-center space-y-4 relative">
                          {/* Main Title */}
                          <div className="relative">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-300 via-blue-300 to-purple-300 bg-clip-text text-transparent animate-pulse">
                              📈 CALCULATING POSITION SIZE 📈
                            </h3>
                            <div className="absolute -inset-2 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 blur-xl rounded-lg animate-pulse"></div>
                          </div>

                          {/* Instrument & Price Info */}
                          <div className="flex items-center justify-center space-x-3 p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-green-500/30">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                            <span className="text-slate-300">
                              Fetching live price for
                            </span>
                            <span className="font-mono text-xl font-bold text-green-300 tracking-wider animate-pulse">
                              {selectedInstrument?.tradingsymbol}
                            </span>
                            <div className="flex space-x-1">
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-blue-300 font-semibold animate-pulse">
                                {selectedInstrument?.exchange}
                              </span>
                            </div>
                          </div>

                          {/* Trading Calculation Steps */}
                          <div className="space-y-2 w-full max-w-md">
                            {[
                              { label: 'Live Price Feed', icon: '💰' },
                              { label: 'Risk Assessment', icon: '⚡' },
                              { label: 'Position Sizing', icon: '📊' },
                              { label: 'Profit Targets', icon: '🎯' },
                            ].map((stage, i) => (
                              <div
                                key={stage.label}
                                className="flex items-center space-x-3"
                              >
                                <span className="text-lg">{stage.icon}</span>
                                <span className="text-xs text-slate-400 w-24 text-left font-medium">
                                  {stage.label}
                                </span>
                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full animate-pulse"
                                    style={{
                                      width: `${75 + i * 5}%`,
                                      animationDelay: `${i * 0.2}s`,
                                      animationDuration: '1.5s',
                                    }}
                                  />
                                </div>
                                <div
                                  className="w-3 h-3 border border-green-400 rounded-full animate-spin"
                                  style={{ animationDelay: `${i * 0.1}s` }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 🎯 Position Sizing Dashboard Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
                          {[
                            {
                              icon: '📦',
                              label: 'Position Size',
                              desc: 'Calculating units...',
                              color: 'blue',
                            },
                            {
                              icon: '💵',
                              label: 'Investment',
                              desc: 'Total capital required',
                              color: 'green',
                            },
                            {
                              icon: '🔥',
                              label: 'Risk Exposure',
                              desc: 'Maximum loss amount',
                              color: 'red',
                            },
                            {
                              icon: '⚖️',
                              label: 'Breakeven',
                              desc: 'Profit threshold price',
                              color: 'orange',
                            },
                            {
                              icon: '💎',
                              label: 'Brokerage',
                              desc: 'Trading costs',
                              color: 'purple',
                            },
                            {
                              icon: '⚡',
                              label: 'Risk Per Unit',
                              desc: 'Loss per share',
                              color: 'cyan',
                            },
                          ].map((tile, i) => (
                            <div
                              key={tile.label}
                              className="relative group bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-slate-500/20 hover:border-slate-400/50 transition-all duration-700 overflow-hidden"
                              style={{ animationDelay: `${i * 0.1}s` }}
                            >
                              {/* Shimmer Effect */}
                              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>

                              {/* Content */}
                              <div className="relative z-10 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div
                                    className="text-2xl animate-bounce"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                  >
                                    {tile.icon}
                                  </div>
                                  <div className="px-2 py-1 bg-slate-500/20 border border-slate-400/30 rounded text-xs text-slate-300 font-bold animate-pulse">
                                    CALC
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="text-xs text-slate-400 font-medium">
                                    {tile.label.toUpperCase()}
                                  </div>
                                  <div className="h-6 bg-gradient-to-r from-slate-600/30 to-slate-500/30 rounded animate-pulse flex items-center justify-center">
                                    <span className="text-xs text-slate-300 animate-pulse">
                                      ₹ ---
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 animate-pulse">
                                    {tile.desc}
                                  </div>
                                </div>

                                {/* Calculation Progress */}
                                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full transition-all duration-2000 ease-out animate-pulse"
                                    style={{
                                      width: `${60 + i * 8}%`,
                                      animationDelay: `${i * 0.3}s`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Corner Indicator */}
                              <div
                                className="absolute -top-2 -right-2 w-4 h-4 bg-green-400/30 rounded-full blur-sm animate-ping"
                                style={{ animationDelay: `${i * 0.4}s` }}
                              ></div>
                            </div>
                          ))}
                        </div>

                        {/* 🎊 Completion Message */}
                        <div className="text-center p-4 bg-gradient-to-r from-green-900/20 via-blue-900/20 to-purple-900/20 rounded-xl border border-green-500/30">
                          <p className="text-green-300 text-sm font-medium animate-pulse">
                            📊 Finalizing position size calculations based on
                            live market data...
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Achievement Dashboard - Coinbase-Style Security Focus */}
                {calculations && (
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {/* Position Size Achievement with Progress */}
                      <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-blue-500/20 hover:border-blue-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden micro-glow micro-scale">
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
                            <div
                              className={`bg-gradient-to-r border rounded-lg px-2 py-1 ${
                                isLoadingQuote || isLoadingPrice
                                  ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40'
                                  : 'from-blue-500/20 to-purple-500/20 border-blue-500/40'
                              }`}
                            >
                              <div
                                className={`text-xs font-bold ${
                                  isLoadingQuote || isLoadingPrice
                                    ? 'text-yellow-300 animate-pulse'
                                    : 'text-blue-300'
                                }`}
                              >
                                {isLoadingQuote || isLoadingPrice
                                  ? 'CALC...'
                                  : 'LOCKED'}
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-blue-300 mb-1 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1"></span>
                              POSITION SIZE
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="relative">
                                  {/* Skeleton shimmer effect */}
                                  <div className="flex items-center space-x-2">
                                    <div className="relative overflow-hidden bg-gradient-to-r from-slate-600/20 via-slate-500/40 to-slate-600/20 rounded-md h-8 w-24">
                                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                      <div className="flex space-x-1">
                                        {[...Array(3)].map((_, i) => (
                                          <div
                                            key={i}
                                            className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"
                                            style={{
                                              animationDelay: `${i * 0.15}s`,
                                            }}
                                          />
                                        ))}
                                      </div>
                                      <div className="text-xs text-blue-300/60 ">
                                        SIZING
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="animate-slideInFromLeft data-loaded success-flash">
                                  {calculations.positionSize.toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-blue-200">
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="flex items-center space-x-2">
                                  <div className="flex space-x-1">
                                    {['analyzing', 'market', 'data'].map(
                                      (word, i) => (
                                        <span
                                          key={word}
                                          className="animate-pulse opacity-40"
                                          style={{
                                            animationDelay: `${i * 0.3}s`,
                                            animationDuration: '1.5s',
                                          }}
                                        >
                                          {word}
                                        </span>
                                      )
                                    )}
                                  </div>
                                  <div className="w-2 h-2 border border-blue-400/50 rounded-full animate-ping"></div>
                                </div>
                              ) : (
                                <div className="animate-fadeInScale">
                                  units secured
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Achievement progress bar */}
                          <div className="relative h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full overflow-hidden micro-bounce">
                            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 rounded-full w-full transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-blue-500/30 group-hover:animate-pulseGlow"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* Investment with Portfolio Allocation */}
                      <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-green-500/20 hover:border-green-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden micro-glow micro-scale">
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
                            <div
                              className={`bg-gradient-to-r border rounded-lg px-2 py-1 ${
                                isLoadingQuote || isLoadingPrice
                                  ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40'
                                  : 'from-green-500/20 to-emerald-500/20 border-green-500/40'
                              }`}
                            >
                              <div
                                className={`text-xs font-bold ${
                                  isLoadingQuote || isLoadingPrice
                                    ? 'text-yellow-300 animate-pulse'
                                    : 'text-green-300'
                                }`}
                              >
                                {isLoadingQuote || isLoadingPrice
                                  ? 'CALC...'
                                  : 'DEPLOYED'}
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-green-300 mb-1 flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                              CAPITAL INVESTMENT
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="relative">
                                  <div className="flex items-center space-x-2">
                                    {/* Morphing currency display */}
                                    <div className="relative overflow-hidden">
                                      <div className="flex items-center space-x-1">
                                        <span className="text-green-400 animate-pulse">
                                          ₹
                                        </span>
                                        <div className="flex space-x-0.5">
                                          {[...Array(6)].map((_, i) => (
                                            <div
                                              key={i}
                                              className="w-4 h-8 bg-gradient-to-t from-slate-600/20 via-slate-400/40 to-slate-600/20 rounded-sm animate-pulse"
                                              style={{
                                                animationDelay: `${i * 0.1}s`,
                                                animationDuration: '1.2s',
                                              }}
                                            >
                                              <div
                                                className="w-full h-full bg-gradient-to-t from-green-500/20 via-green-400/30 to-green-500/20 rounded-sm animate-pulse"
                                                style={{
                                                  animationDelay: `${
                                                    i * 0.2 + 0.5
                                                  }s`,
                                                }}
                                              ></div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Animated bars indicating calculation */}
                                    <div className="flex flex-col space-y-0.5">
                                      {[...Array(3)].map((_, i) => (
                                        <div
                                          key={i}
                                          className="h-1 bg-gradient-to-r from-green-400/40 to-emerald-400/40 rounded-full animate-pulse"
                                          style={{
                                            width: `${12 + i * 4}px`,
                                            animationDelay: `${i * 0.2}s`,
                                            animationDuration: '1.5s',
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="animate-slideInFromLeft data-loaded success-flash">
                                  {formatCurrency(calculations.totalInvestment)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-green-200">
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="flex items-center space-x-1">
                                  {['calculating', 'capital', 'required'].map(
                                    (word, i) => (
                                      <span
                                        key={word}
                                        className="animate-pulse opacity-60"
                                        style={{
                                          animationDelay: `${i * 0.25}s`,
                                          animationDuration: '1.8s',
                                        }}
                                      >
                                        {word}
                                      </span>
                                    )
                                  )}
                                  <div
                                    className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"
                                    style={{ animationDelay: '0.8s' }}
                                  ></div>
                                </div>
                              ) : (
                                <div className="animate-fadeInScale">
                                  {`${calculations.portfolioPercentage.toFixed(
                                    1
                                  )}% of portfolio`}
                                </div>
                              )}
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
                      <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-red-500/20 hover:border-red-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden micro-glow micro-scale">
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
                                isLoadingQuote || isLoadingPrice
                                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/40'
                                  : calculations.riskPercentage > 2
                                  ? 'bg-gradient-to-r from-red-500/30 to-orange-500/30 border-red-500/50'
                                  : 'bg-gradient-to-r from-yellow-500/20 to-red-500/20 border-yellow-500/40'
                              }`}
                            >
                              <div
                                className={`text-xs font-bold ${
                                  isLoadingQuote || isLoadingPrice
                                    ? 'text-yellow-300 animate-pulse'
                                    : calculations.riskPercentage > 2
                                    ? 'text-red-300'
                                    : 'text-yellow-300'
                                }`}
                              >
                                {isLoadingQuote || isLoadingPrice
                                  ? 'CALC...'
                                  : calculations.riskPercentage > 2
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
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="relative">
                                  <div className="flex items-center space-x-2">
                                    {/* Digital-style loading bars */}
                                    <div className="flex items-end space-x-1">
                                      {[...Array(5)].map((_, i) => (
                                        <div
                                          key={i}
                                          className="bg-gradient-to-t from-red-600/30 via-red-400/50 to-red-600/30 rounded-sm animate-pulse"
                                          style={{
                                            width: '3px',
                                            height: `${12 + i * 3}px`,
                                            animationDelay: `${i * 0.15}s`,
                                            animationDuration: '1.3s',
                                          }}
                                        />
                                      ))}
                                    </div>
                                    {/* Pulsing indicators */}
                                    <div className="flex flex-col space-y-1">
                                      {[...Array(2)].map((_, i) => (
                                        <div
                                          key={i}
                                          className="w-4 h-1 bg-gradient-to-r from-red-500/40 to-orange-500/40 rounded-full animate-pulse"
                                          style={{
                                            animationDelay: `${i * 0.3}s`,
                                            animationDuration: '1.6s',
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="animate-slideInFromLeft data-loaded success-flash">
                                  {formatCurrency(calculations.riskAmount)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-red-200">
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="flex items-center space-x-1">
                                  {['analyzing', 'risk', 'exposure'].map(
                                    (word, i) => (
                                      <span
                                        key={word}
                                        className="animate-pulse opacity-50"
                                        style={{
                                          animationDelay: `${i * 0.35}s`,
                                          animationDuration: '2s',
                                        }}
                                      >
                                        {word}
                                      </span>
                                    )
                                  )}
                                  <div
                                    className="w-1.5 h-1.5 border border-red-400/60 rounded-full animate-ping"
                                    style={{ animationDelay: '1s' }}
                                  ></div>
                                </div>
                              ) : (
                                <div className="animate-fadeInScale">
                                  {`${calculations.riskPercentage.toFixed(
                                    2
                                  )}% portfolio impact`}
                                </div>
                              )}
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
                      <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-orange-500/20 hover:border-orange-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden micro-glow micro-scale">
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
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="relative">
                                  <div className="flex items-center space-x-2">
                                    {/* Balance scale animation */}
                                    <div className="relative">
                                      <div className="flex items-center space-x-1">
                                        <span className="text-orange-400 animate-pulse">
                                          ₹
                                        </span>
                                        {/* Morphing numbers */}
                                        <div className="flex space-x-0.5">
                                          {[...Array(5)].map((_, i) => (
                                            <div
                                              key={i}
                                              className="w-3 h-6 bg-gradient-to-t from-orange-600/20 via-orange-400/40 to-orange-600/20 rounded-sm animate-pulse"
                                              style={{
                                                animationDelay: `${i * 0.12}s`,
                                                animationDuration: '1.4s',
                                                transform: `scaleY(${
                                                  0.7 + Math.sin(i * 0.5) * 0.3
                                                })`,
                                              }}
                                            >
                                              <div
                                                className="w-full h-full bg-gradient-to-t from-orange-500/30 via-amber-400/40 to-orange-500/30 rounded-sm animate-pulse"
                                                style={{
                                                  animationDelay: `${
                                                    i * 0.15 + 0.3
                                                  }s`,
                                                }}
                                              ></div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Equilibrium indicators */}
                                    <div className="flex flex-col items-center space-y-0.5">
                                      <div
                                        className="w-6 h-0.5 bg-gradient-to-r from-orange-400/40 to-amber-400/40 rounded-full animate-pulse"
                                        style={{ animationDelay: '0.2s' }}
                                      ></div>
                                      <div
                                        className="w-4 h-0.5 bg-gradient-to-r from-amber-400/40 to-yellow-400/40 rounded-full animate-pulse"
                                        style={{ animationDelay: '0.4s' }}
                                      ></div>
                                      <div
                                        className="w-6 h-0.5 bg-gradient-to-r from-yellow-400/40 to-orange-400/40 rounded-full animate-pulse"
                                        style={{ animationDelay: '0.6s' }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="animate-slideInFromLeft data-loaded success-flash">
                                  {formatCurrency(calculations.breakEvenPrice)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-orange-200">
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="flex items-center space-x-1">
                                  {['calculating', 'equilibrium', 'point'].map(
                                    (word, i) => (
                                      <span
                                        key={word}
                                        className="animate-pulse opacity-60"
                                        style={{
                                          animationDelay: `${i * 0.3}s`,
                                          animationDuration: '1.6s',
                                        }}
                                      >
                                        {word}
                                      </span>
                                    )
                                  )}
                                  <div
                                    className="w-1.5 h-1.5 border border-orange-400/50 rounded-full animate-spin"
                                    style={{ animationDelay: '0.9s' }}
                                  ></div>
                                </div>
                              ) : (
                                <div className="animate-fadeInScale">
                                  survival line
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="relative h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 rounded-full w-3/4 transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-orange-500/30"></div>
                          </div>
                        </div>
                      </div>

                      {/* Brokerage Cost Analysis */}
                      <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden micro-glow micro-scale">
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
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="relative">
                                  <div className="flex items-center space-x-2">
                                    {/* Receipt-style loading animation */}
                                    <div className="relative">
                                      <div className="flex items-center space-x-1">
                                        <span className="text-purple-400 animate-pulse">
                                          ₹
                                        </span>
                                        {/* Calculating digits */}
                                        <div className="flex space-x-0.5">
                                          {[...Array(4)].map((_, i) => (
                                            <div
                                              key={i}
                                              className="relative overflow-hidden"
                                            >
                                              <div
                                                className="w-3 h-6 bg-gradient-to-t from-purple-600/20 via-purple-400/40 to-purple-600/20 rounded-sm animate-pulse"
                                                style={{
                                                  animationDelay: `${i * 0.1}s`,
                                                  animationDuration: '1.3s',
                                                }}
                                              >
                                                <div
                                                  className="absolute inset-0 -translate-y-full bg-gradient-to-t from-transparent via-purple-300/30 to-transparent animate-slide-down"
                                                  style={{
                                                    animationDelay: `${
                                                      i * 0.2
                                                    }s`,
                                                  }}
                                                ></div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Fee calculation indicators */}
                                    <div className="flex flex-col space-y-0.5">
                                      <div className="flex space-x-1">
                                        {[...Array(3)].map((_, i) => (
                                          <div
                                            key={i}
                                            className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"
                                            style={{
                                              animationDelay: `${i * 0.15}s`,
                                            }}
                                          />
                                        ))}
                                      </div>
                                      <div className="text-xs text-purple-300/60 ">
                                        CALC
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="animate-slideInFromLeft data-loaded success-flash">
                                  {formatCurrency(calculations.brokerageCost)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-purple-200">
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="flex items-center space-x-1">
                                  {['processing', 'fees', 'structure'].map(
                                    (word, i) => (
                                      <span
                                        key={word}
                                        className="animate-pulse opacity-50"
                                        style={{
                                          animationDelay: `${i * 0.28}s`,
                                          animationDuration: '1.7s',
                                        }}
                                      >
                                        {word}
                                      </span>
                                    )
                                  )}
                                  <div
                                    className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                                    style={{ animationDelay: '0.85s' }}
                                  ></div>
                                </div>
                              ) : (
                                <div className="animate-fadeInScale">
                                  buy side (auto-calculated)
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="relative h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 rounded-full w-1/4 transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-purple-500/30"></div>
                          </div>
                        </div>
                      </div>

                      {/* Risk Per Share Detail */}
                      <div className="group relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-700 hover:scale-105 cursor-pointer overflow-hidden micro-glow micro-scale">
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
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="relative">
                                  <div className="flex items-center space-x-2">
                                    {/* Unit risk calculation animation */}
                                    <div className="relative">
                                      <div className="flex items-center space-x-1">
                                        <span className="text-cyan-400 animate-pulse">
                                          ₹
                                        </span>
                                        {/* Per-unit calculation display */}
                                        <div className="flex space-x-0.5">
                                          {[...Array(3)].map((_, i) => (
                                            <div key={i} className="relative">
                                              <div
                                                className="w-4 h-6 bg-gradient-to-t from-cyan-600/20 via-cyan-400/40 to-cyan-600/20 rounded-sm animate-pulse"
                                                style={{
                                                  animationDelay: `${
                                                    i * 0.15
                                                  }s`,
                                                  animationDuration: '1.2s',
                                                }}
                                              >
                                                {/* Electric-style effect */}
                                                <div
                                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent animate-pulse"
                                                  style={{
                                                    animationDelay: `${
                                                      i * 0.2 + 0.4
                                                    }s`,
                                                  }}
                                                ></div>
                                              </div>
                                              {/* Unit separator */}
                                              {i < 2 && (
                                                <div
                                                  className="absolute -right-1 top-1/2 w-0.5 h-0.5 bg-cyan-400/60 rounded-full animate-ping"
                                                  style={{
                                                    animationDelay: `${
                                                      i * 0.3
                                                    }s`,
                                                  }}
                                                ></div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Risk level indicators */}
                                    <div className="flex items-center space-x-1">
                                      {[...Array(3)].map((_, i) => (
                                        <div
                                          key={i}
                                          className="w-2 h-3 bg-gradient-to-t from-cyan-600/30 to-cyan-400/60 rounded-sm animate-pulse"
                                          style={{
                                            animationDelay: `${i * 0.2}s`,
                                            animationDuration: '1.4s',
                                            height: `${8 + i * 4}px`,
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="animate-slideInFromLeft data-loaded success-flash">
                                  {formatCurrency(calculations.riskPerShare)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-cyan-200">
                              {isLoadingQuote || isLoadingPrice ? (
                                <div className="flex items-center space-x-1">
                                  {['analyzing', 'unit', 'exposure'].map(
                                    (word, i) => (
                                      <span
                                        key={word}
                                        className="animate-pulse opacity-60"
                                        style={{
                                          animationDelay: `${i * 0.32}s`,
                                          animationDuration: '1.8s',
                                        }}
                                      >
                                        {word}
                                      </span>
                                    )
                                  )}
                                  <div
                                    className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                                    style={{ animationDelay: '0.95s' }}
                                  ></div>
                                </div>
                              ) : (
                                <div className="animate-fadeInScale">
                                  per unit risk
                                </div>
                              )}
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
          )}

          {/* Portfolio Snapshot Panel - Right Side */}
          {hasActiveBrokerSession && !selectedInstrument && (
            <div className="lg:col-span-2">
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-cyan-500/30 sticky top-8 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-cyan-500/20 hover:shadow-2xl">
                <PortfolioSnapshot />
              </div>
            </div>
          )}
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
