import { useState, useEffect, useCallback } from 'react';
import { Download, Info, Calculator } from 'lucide-react';
import type {
  FormData,
  Calculations,
  Target,
  Scenario,
  Preferences,
  ChargesBreakdown,
} from './types';

const TradingCalculator: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    accountBalance: 1000000,
    riskPercentage: 0.25,
    entryPrice: 500,
    stopLoss: 475,
    brokerageCost: 0,
    riskOnInvestment: 5.0,
  });
  const [calculations, setCalculations] = useState<Calculations | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

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

  // Load preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('tradingCalculatorPrefs');
    if (saved) {
      try {
        const prefs: Preferences = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          riskPercentage: prefs.riskPercentage || 1,
          riskOnInvestment: prefs.riskOnInvestment || 5.0,
        }));
        setDarkMode(prefs.darkMode || false);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  // Save preferences
  useEffect(() => {
    const prefs: Preferences = {
      riskPercentage: formData.riskPercentage,
      riskOnInvestment: formData.riskOnInvestment,
      darkMode,
    };
    localStorage.setItem('tradingCalculatorPrefs', JSON.stringify(prefs));
  }, [formData.riskPercentage, formData.riskOnInvestment, darkMode]);

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
    if (riskPercentage <= 0 || riskPercentage > 10)
      newWarnings.push('Risk percentage should be between 0.1% and 10%');
    if (entryPrice <= 0) newWarnings.push('Entry price must be positive');
    if (stopLoss <= 0) newWarnings.push('Stop loss must be positive');
    if (stopLoss >= entryPrice)
      newWarnings.push(
        'Stop loss must be below entry price for long positions'
      );
    if (riskPercentage > 3)
      newWarnings.push('Risk percentage above 3% is considered high risk');

    return newWarnings;
  }, [formData]);

  // Calculate position size and risk metrics
  const calculatePositionSize = useCallback((): Calculations | null => {
    const validationWarnings = validateInputs();
    setWarnings(validationWarnings);

    if (validationWarnings.length > 0) return null;

    const { accountBalance, riskPercentage, entryPrice, stopLoss } = formData;

    const riskAmount = (accountBalance * riskPercentage) / 100;
    const riskPerShare = entryPrice - stopLoss;

    // Calculate position size WITHOUT considering brokerage (pure calculation)
    const positionSize = Math.floor(riskAmount / riskPerShare);

    // Calculate brokerage for this position size
    const chargesBreakdown = calculateBrokerage(entryPrice, positionSize);

    const totalInvestment = positionSize * entryPrice;
    const portfolioPercentage = (totalInvestment / accountBalance) * 100;

    // Calculate breakeven price (entry price + brokerage cost per share)
    const brokerageCostPerShare = chargesBreakdown.totalCharges / positionSize;
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

  // Update calculations when form data changes
  useEffect(() => {
    const result = calculatePositionSize();
    setCalculations(result);
  }, [calculatePositionSize]);

  // Handle input changes with automatic calculations
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string): void => {
      const numValue = parseFloat(value) || 0;

      setFormData((prev) => {
        const newData: FormData = { ...prev, [field]: numValue };

        // // Auto-calculate stop loss when risk on investment or entry price changes
        // if (
        //   field === 'riskOnInvestment' ||
        //   (field === 'entryPrice' && prev.riskOnInvestment)
        // ) {
        //   const entryPrice =
        //     field === 'entryPrice' ? numValue : prev.entryPrice;
        //   const riskPercent =
        //     field === 'riskOnInvestment' ? numValue : prev.riskOnInvestment;

        //   if (entryPrice > 0 && riskPercent > 0) {
        //     newData.stopLoss = entryPrice * (1 - riskPercent / 100);
        //   }
        // }

        // Auto-calculate risk on investment when stop loss or entry price changes
        if (field === 'stopLoss' || (field === 'entryPrice' && prev.stopLoss)) {
          const entryPrice =
            field === 'entryPrice' ? numValue : prev.entryPrice;
          const stopLoss = field === 'stopLoss' ? numValue : prev.stopLoss;

          if (entryPrice > 0 && stopLoss > 0 && stopLoss < entryPrice) {
            newData.riskOnInvestment =
              ((entryPrice - stopLoss) / entryPrice) * 100;
          }
        }

        return newData;
      });
    },
    []
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

    const riskPercentages = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
    return riskPercentages.map((riskPercent) => {
      const riskAmount = (accountBalance * riskPercent) / 100;
      const riskPerShare = entryPrice - stopLoss;

      // Calculate position size with auto brokerage (buy only)
      const initialPositionSize = Math.floor(riskAmount / riskPerShare);
      const charges = calculateBrokerage(entryPrice, initialPositionSize);
      const positionSize = Math.floor(
        (riskAmount - charges.totalCharges) / riskPerShare
      );

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
  }, [formData, calculateBrokerage]);

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
    <div>
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-all duration-300">
        <div className="mx-auto px-16 py-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Input Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                {/* Account Details */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b-2 border-blue-500 pb-2">
                    Account Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Balance / Net Worth (₹)
                        <Info
                          className="inline w-4 h-4 ml-1 text-blue-500 cursor-help"
                          xlinkTitle="Total trading capital available in INR"
                        />
                      </label>
                      <input
                        type="number"
                        value={formData.accountBalance}
                        onChange={(e) =>
                          handleInputChange('accountBalance', e.target.value)
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:text-white transition-all duration-300"
                        min="0"
                        step="10000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Risk Per Trade (Portfolio) (%)
                        <Info
                          className="inline w-4 h-4 ml-1 text-blue-500 cursor-help"
                          xlinkTitle="Percentage of account to risk per trade (recommended: 1-2%)"
                        />
                      </label>
                      <input
                        type="number"
                        value={formData.riskPercentage}
                        onChange={(e) =>
                          handleInputChange('riskPercentage', e.target.value)
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:text-white transition-all duration-300"
                        min="0.25"
                        max="10"
                        step="0.25"
                      />
                    </div>
                  </div>
                </div>

                {/* Trade Setup */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b-2 border-blue-500 pb-2">
                    Trade Setup
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Entry Price (₹)
                        <Info
                          className="inline w-4 h-4 ml-1 text-blue-500 cursor-help"
                          xlinkTitle="Price at which you plan to enter the trade"
                        />
                      </label>
                      <input
                        type="number"
                        value={
                          formData.entryPrice !== 0 ? formData.entryPrice : ''
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange('entryPrice', value);
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:text-white transition-all duration-300"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Stop Loss Price (₹)
                        <Info
                          className="inline w-4 h-4 ml-1 text-blue-500 cursor-help"
                          xlinkTitle="Price at which you'll exit to limit losses (auto-calculated from risk %)"
                        />
                      </label>
                      <input
                        type="number"
                        value={formData.stopLoss !== 0 ? formData.stopLoss : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange('stopLoss', value);
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:text-white transition-all duration-300"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Risk on Investment / per trade (%)
                        <Info
                          className="inline w-4 h-4 ml-1 text-blue-500 cursor-help"
                          xlinkTitle="Percentage risk on this specific trade (auto-calculates stop loss)"
                        />
                      </label>
                      <input
                        disabled
                        type="number"
                        value={formData.riskOnInvestment.toFixed(2)}
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
                          value={
                            calculations?.brokerageCost.toFixed(2) || '0.00'
                          }
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
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-600 rounded-lg">
                    <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      ⚠️ Warning:
                    </div>
                    <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
                      {warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Results */}
                {calculations && (
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 rounded-xl text-center hover:scale-105 transition-transform duration-300">
                      <div className="text-sm opacity-90 mb-1">
                        Position Size
                      </div>
                      <div className="text-2xl font-bold">
                        {calculations.positionSize.toLocaleString()}
                      </div>
                      <div className="text-xs opacity-80">shares/units</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-xl text-center hover:scale-105 transition-transform duration-300">
                      <div className="text-sm opacity-90 mb-1">
                        Total Investment
                      </div>
                      <div className="text-lg font-bold">
                        {formatCurrency(calculations.totalInvestment)}
                      </div>
                      <div className="text-xs opacity-80">
                        {calculations.portfolioPercentage.toFixed(2)}% of
                        portfolio
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-4 rounded-xl text-center hover:scale-105 transition-transform duration-300">
                      <div className="text-sm opacity-90 mb-1">Risk Amount</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(calculations.riskAmount)}
                      </div>
                      <div className="text-xs opacity-80">Maximum loss</div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-4 rounded-xl text-center hover:scale-105 transition-transform duration-300">
                      <div className="text-sm opacity-90 mb-1">
                        Risk per Share
                      </div>
                      <div className="text-lg font-bold">
                        {formatCurrency(calculations.riskPerShare)}
                      </div>
                      <div className="text-xs opacity-80">
                        Entry - Stop Loss
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4 rounded-xl text-center hover:scale-105 transition-transform duration-300">
                      <div className="text-sm opacity-90 mb-1">
                        Total Charges
                      </div>
                      <div className="text-lg font-bold">
                        {formatCurrency(calculations.brokerageCost)}
                      </div>
                      <div className="text-xs opacity-80">Auto-calculated</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-4 rounded-xl text-center hover:scale-105 transition-transform duration-300">
                      <div className="text-sm opacity-90 mb-1">
                        Breakeven Price
                      </div>
                      <div className="text-lg font-bold">
                        {formatCurrency(calculations.breakEvenPrice)}
                      </div>
                      <div className="text-xs opacity-80">Entry + charges</div>
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
                      <table className="w-full">
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
                      Position Sizing Scenarios
                    </h3>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-b-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Risk %
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Position Size
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Investment Required
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Risk Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Portfolio %
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
                                {scenario.riskPercent}%
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
                                {scenario.portfolioPercentage.toFixed(2)}%
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
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <h3 className="text-xl font-semibold text-white mb-3">
              ⚠️ Risk Disclaimer
            </h3>
            <p className="text-white/90 leading-relaxed">
              This calculator is for educational purposes only. Trading involves
              substantial risk of loss. Past performance does not guarantee
              future results. Always consult with a qualified financial advisor
              before making investment decisions. Never risk more than you can
              afford to lose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingCalculator;
