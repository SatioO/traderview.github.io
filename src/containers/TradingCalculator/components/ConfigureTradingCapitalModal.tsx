import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Plus, Minus } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import type { FormData } from '../types';

interface ConfigureTradingCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSave: (newBalance: number) => void;
  updateSettings: (settings: { accountBalance: number }) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  formData: FormData;
  formatCurrency: (amount: number) => string;
  formatCurrencyShort: (amount: number) => string;
}

interface PresetAmount {
  label: string;
  value: number;
  color: string;
}

interface CapitalLevel {
  percentage: number;
  level: string;
  color: string;
}

const ConfigureTradingCapitalModal: React.FC<ConfigureTradingCapitalModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onSave,
  updateSettings,
  setFormData,
  formData,
  formatCurrency,
  formatCurrencyShort,
}) => {
  const [tempCapital, setTempCapital] = useState('');

  // Initialize tempCapital with current balance when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempCapital(currentBalance.toString());
    }
  }, [isOpen, currentBalance]);

  // Preset amounts for quick selection
  const presetAmounts: PresetAmount[] = [
    { label: '1L', value: 100000, color: 'bg-blue-500' },
    { label: '5L', value: 500000, color: 'bg-green-500' },
    { label: '10L', value: 1000000, color: 'bg-yellow-500' },
    { label: '25L', value: 2500000, color: 'bg-orange-500' },
    { label: '50L', value: 5000000, color: 'bg-red-500' },
    { label: '1Cr', value: 10000000, color: 'bg-purple-500' },
    { label: '2Cr', value: 20000000, color: 'bg-pink-500' },
    { label: '5Cr', value: 50000000, color: 'bg-indigo-500' },
  ];

  // Get capital level based on amount
  const getCapitalLevel = (amount: number): CapitalLevel => {
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

  // Handle preset selection
  const handlePresetSelect = (amount: number) => {
    setTempCapital(amount.toString());
  };

  // Handle increment/decrement
  const handleIncrement = (step: number) => {
    const current = parseFloat(tempCapital) || 0;
    const newAmount = Math.max(0, current + step);
    setTempCapital(newAmount.toString());
  };

  // Handle saving the capital
  const handleCapitalSave = () => {
    const newAmount = parseFloat(tempCapital.replace(/,/g, ''));
    if (!isNaN(newAmount) && newAmount > 0) {
      updateSettings({ accountBalance: newAmount });
      setFormData({ ...formData, accountBalance: newAmount });
      onSave(newAmount);
    }
    onClose();
    setTempCapital('');
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
    setTempCapital('');
  };

  const currentAmount = parseFloat(tempCapital) || 0;
  const capitalLevel = getCapitalLevel(currentAmount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
                className={`text-sm font-semibold bg-gradient-to-r ${capitalLevel.color} bg-clip-text text-transparent`}
              >
                {capitalLevel.level}
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
                : formatCurrency(currentBalance)}
            </div>
            <div className="text-lg text-cyan-300 font-semibold">
              {tempCapital
                ? formatCurrencyShort(parseFloat(tempCapital))
                : formatCurrencyShort(currentBalance)}
            </div>

            {/* Progress bar showing capital level */}
            {tempCapital && (
              <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${capitalLevel.color} transition-all duration-500`}
                  style={{
                    width: `${capitalLevel.percentage}%`,
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

        {/* Manual Input with Increment/Decrement */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Custom Amount</h3>
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
            onClick={handleClose}
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
  );
};

export default ConfigureTradingCapitalModal;