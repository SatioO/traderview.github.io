import React, { useState } from 'react';
import {
  X,
  Settings,
  AlertTriangle,
  TrendingUp,
  Zap,
  Target,
  Activity,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSettings, type RiskLevel } from '../../contexts/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, updateRiskLevel } = useSettings();
  const [editedLevels, setEditedLevels] = useState<Record<string, string>>({});
  const [editedCapital, setEditedCapital] = useState<string | undefined>(
    undefined
  );
  const [validationErrors, setValidationErrors] = useState<{
    capital?: string;
    riskLevels?: Record<string, string>;
    duplicates?: string[];
  }>({});
  const [shakeAnimations, setShakeAnimations] = useState<
    Record<string, boolean>
  >({});
  const [orderConflicts, setOrderConflicts] = useState<
    Record<string, { type: 'decrease' | 'increase'; conflictWith: string }>
  >({});

  if (!isOpen) return null;

  const validateRiskLevels = (levels: Record<string, string>) => {
    const errors: Record<string, string> = {};
    const duplicates: string[] = [];
    const values: number[] = [];
    const processedValues: { [key: string]: number } = {};
    const conflicts: Record<
      string,
      { type: 'decrease' | 'increase'; conflictWith: string }
    > = {};

    try {
      // Get all risk level values (including unchanged ones)
      const allLevels = { ...levels };
      settings.riskLevels.forEach((level) => {
        if (
          ['conservative', 'balanced', 'bold', 'maximum'].includes(level.id)
        ) {
          // If no edited value exists, use the original value
          if (!allLevels[level.id] && allLevels[level.id] !== '') {
            allLevels[level.id] = level.percentage.toString();
          }
        }
      });

      // Check each risk level
      Object.entries(allLevels).forEach(([levelId, value]) => {
        // Safety check for undefined/null values
        if (value === undefined || value === null) {
          return;
        }

        const stringValue = String(value).trim();

        // Check if empty
        if (stringValue === '') {
          errors[levelId] = 'Value required';
          return;
        }

        const numValue = Number(stringValue);

        // Check if valid number
        if (isNaN(numValue) || !isFinite(numValue)) {
          errors[levelId] = 'Invalid number';
          return;
        }

        // Check range (0 < value <= 3)
        if (numValue <= 0) {
          errors[levelId] = 'Must be greater than 0';
        } else if (numValue > 3) {
          errors[levelId] = 'Maximum value is 3%';
        } else {
          processedValues[levelId] = numValue;
          values.push(numValue);
        }
      });

      // Check for duplicates among valid values
      if (values.length > 1) {
        const uniqueValues = new Set(values);
        if (values.length !== uniqueValues.size) {
          // Find which values are duplicated
          const valueCount: Record<number, string[]> = {};
          Object.entries(processedValues).forEach(([levelId, value]) => {
            if (!valueCount[value]) valueCount[value] = [];
            valueCount[value].push(levelId);
          });

          Object.entries(valueCount).forEach(([value, levelIds]) => {
            if (levelIds.length > 1) {
              levelIds.forEach((levelId) => {
                if (!errors[levelId]) {
                  // Don't override existing errors
                  errors[levelId] = `Duplicate value: ${value}%`;
                  duplicates.push(levelId);
                }
              });
            }
          });
        }
      }

      // Check ascending order with bidirectional conflict tracking
      const orderedLevels = ['conservative', 'balanced', 'bold', 'maximum'];
      const orderedValues: { id: string; value: number }[] = [];

      orderedLevels.forEach((levelId) => {
        if (processedValues[levelId] !== undefined) {
          orderedValues.push({ id: levelId, value: processedValues[levelId] });
        }
      });

      // Validate ascending order with creative conflict handling
      for (let i = 1; i < orderedValues.length; i++) {
        const current = orderedValues[i];
        const previous = orderedValues[i - 1];

        if (current.value <= previous.value) {
          // Instead of just erroring the current field, track conflicts for both
          if (!errors[current.id] && !errors[previous.id]) {
            // Left tile (previous) should DECREASE to be less than right
            conflicts[previous.id] = {
              type: 'decrease',
              conflictWith: current.id,
            };
            // Right tile (current) should INCREASE to be greater than left
            conflicts[current.id] = {
              type: 'increase',
              conflictWith: previous.id,
            };

            // Still add traditional error message for footer counting
            errors[current.id] = `Must be greater than ${previous.value}%`;
          }
        }
      }
    } catch (error) {
      console.error('Error in validateRiskLevels:', error);
    }

    return { errors, duplicates, conflicts };
  };

  const validateCapital = (value: string) => {
    try {
      // Safety check for undefined/null values
      if (value === undefined || value === null) {
        return 'Trading capital is required';
      }

      const stringValue = String(value).trim();

      if (stringValue === '') {
        return 'Trading capital is required';
      }

      const numValue = Number(stringValue);
      if (isNaN(numValue) || !isFinite(numValue)) {
        return 'Invalid amount';
      }

      if (numValue < 10000) {
        return 'Minimum capital is ₹10,000';
      }

      return null;
    } catch (error) {
      console.error('Error in validateCapital:', error);
      return 'Invalid amount';
    }
  };

  const handlePercentageChange = (levelId: string, value: string) => {
    try {
      // Update the value
      const newLevels = { ...editedLevels, [levelId]: value };
      setEditedLevels(newLevels);

      // Validate all risk levels
      const { errors, duplicates, conflicts } = validateRiskLevels(newLevels);

      // Update validation errors and order conflicts
      setValidationErrors((prev) => ({
        ...prev,
        riskLevels: errors,
        duplicates,
      }));
      setOrderConflicts(conflicts);

      // Trigger shake animation for errors
      if (errors[levelId] || duplicates.includes(levelId)) {
        setShakeAnimations((prev) => ({ ...prev, [levelId]: true }));
        setTimeout(() => {
          setShakeAnimations((prev) => ({ ...prev, [levelId]: false }));
        }, 600);
      }
    } catch (error) {
      console.error('Error in handlePercentageChange:', error);
    }
  };

  const handleCapitalChange = (value: string) => {
    try {
      setEditedCapital(value);

      // Validate capital
      const error = validateCapital(value);
      setValidationErrors((prev) => ({
        ...prev,
        capital: error || undefined,
      }));

      // Trigger shake animation for capital errors
      if (error) {
        setShakeAnimations((prev) => ({ ...prev, capital: true }));
        setTimeout(() => {
          setShakeAnimations((prev) => ({ ...prev, capital: false }));
        }, 600);
      }
    } catch (error) {
      console.error('Error in handleCapitalChange:', error);
    }
  };

  const handleSave = () => {
    // Final validation before save
    if (hasValidationErrors) {
      return;
    }

    // Update risk levels with new percentages
    settings.riskLevels.forEach((level) => {
      if (editedLevels[level.id] !== undefined) {
        const updatedLevel: RiskLevel = {
          ...level,
          percentage: Number(editedLevels[level.id]),
        };
        updateRiskLevel(updatedLevel);
      }
    });

    // Update trading capital if changed
    if (editedCapital !== undefined) {
      updateSettings({ accountBalance: Number(editedCapital) });
    }

    onClose();
  };

  const getDisplayValue = (level: RiskLevel) => {
    if (editedLevels[level.id] !== undefined) {
      return editedLevels[level.id];
    }
    return level.percentage.toString();
  };

  const getDisplayCapital = () => {
    return editedCapital !== undefined
      ? editedCapital
      : settings.accountBalance.toString();
  };

  const hasCapitalChanged = editedCapital !== undefined;
  const hasChanges = Object.keys(editedLevels).length > 0 || hasCapitalChanged;

  // Check if there are any validation errors
  const hasValidationErrors =
    validationErrors.capital ||
    (validationErrors.riskLevels &&
      Object.keys(validationErrors.riskLevels).length > 0) ||
    (validationErrors.duplicates && validationErrors.duplicates.length > 0);

  const canSave = hasChanges && !hasValidationErrors;

  // Get the default risk levels (not custom ones)
  const defaultRiskLevels = settings.riskLevels.filter((level) =>
    ['conservative', 'balanced', 'bold', 'maximum'].includes(level.id)
  );

  // Global error summary
  const getErrorSummary = () => {
    const errors: {
      type: string;
      message: string;
      field?: string;
      severity: 'high' | 'medium' | 'low';
    }[] = [];

    try {
      // Capital errors
      if (validationErrors.capital) {
        errors.push({
          type: 'capital',
          message: validationErrors.capital,
          field: 'Trading Capital',
          severity: 'high',
        });
      }

      // Risk level errors
      if (
        validationErrors.riskLevels &&
        typeof validationErrors.riskLevels === 'object'
      ) {
        Object.entries(validationErrors.riskLevels).forEach(
          ([levelId, error]) => {
            if (error && typeof error === 'string') {
              const level = defaultRiskLevels.find((l) => l.id === levelId);
              const isDuplicate = error.includes('Duplicate');
              const isMaximumRange = error.includes('Maximum value is 3%');
              const isOrderError =
                error.includes('Must be greater than') && error.includes('%');
              const isRange =
                isMaximumRange || error.includes('Must be greater than 0');

              errors.push({
                type: isDuplicate
                  ? 'duplicate'
                  : isOrderError
                  ? 'order'
                  : isRange
                  ? 'range'
                  : 'invalid',
                message: error,
                field: level?.name || levelId,
                severity: isDuplicate
                  ? 'medium'
                  : isOrderError
                  ? 'high'
                  : isRange
                  ? 'high'
                  : 'low',
              });
            }
          }
        );
      }

      return errors.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error) {
      console.error('Error in getErrorSummary:', error);
      return [];
    }
  };

  const errorSummary = getErrorSummary();
  const errorCounts = {
    total: errorSummary?.length || 0,
    capital: errorSummary?.filter((e) => e.type === 'capital').length || 0,
    risk:
      errorSummary?.filter(
        (e) =>
          e.type !== 'capital' && e.type !== 'duplicate' && e.type !== 'order'
      ).length || 0,
    order: errorSummary?.filter((e) => e.type === 'order').length || 0,
    duplicates: errorSummary?.filter((e) => e.type === 'duplicate').length || 0,
  };

  const getCapitalLevel = (amount: number) => {
    if (amount >= 10000000)
      return {
        level: 'ELITE',
        color: 'from-violet-500 via-purple-500 to-fuchsia-500',
        bgGradient: 'from-violet-500/10 via-purple-500/5 to-fuchsia-500/10',
        borderColor: 'border-violet-400/30 hover:border-violet-400/50',
        textColor: 'text-violet-200',
        badgeColor:
          'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-violet-400/40',
        progress: 100,
      };
    if (amount >= 1000000)
      return {
        level: 'ADVANCED',
        color: 'from-cyan-400 via-blue-500 to-indigo-500',
        bgGradient: 'from-cyan-400/10 via-blue-500/5 to-indigo-500/10',
        borderColor: 'border-cyan-400/30 hover:border-cyan-400/50',
        textColor: 'text-cyan-200',
        badgeColor:
          'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border-cyan-400/40',
        progress: 75,
      };
    if (amount >= 100000)
      return {
        level: 'INTERMEDIATE',
        color: 'from-emerald-400 via-green-500 to-teal-500',
        bgGradient: 'from-emerald-400/10 via-green-500/5 to-teal-500/10',
        borderColor: 'border-emerald-400/30 hover:border-emerald-400/50',
        textColor: 'text-emerald-200',
        badgeColor:
          'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/40',
        progress: 50,
      };
    return {
      level: 'BEGINNER',
      color: 'from-amber-400 via-orange-500 to-red-500',
      bgGradient: 'from-amber-400/10 via-orange-500/5 to-red-500/10',
      borderColor: 'border-amber-400/30 hover:border-amber-400/50',
      textColor: 'text-amber-200',
      badgeColor:
        'bg-gradient-to-r from-amber-500/20 to-red-500/20 border-amber-400/40',
      progress: 25,
    };
  };

  const capitalInfo = getCapitalLevel(
    Number(getDisplayCapital()) || settings.accountBalance
  );

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        // Close modal if clicking on backdrop
        if (e.target === e.currentTarget) {
          // Reset any unsaved changes before closing
          setEditedLevels({});
          setEditedCapital(undefined);
          setValidationErrors({});
          setOrderConflicts({});
          setShakeAnimations({});
          onClose();
        }
      }}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-teal-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>

      {/* Premium Settings Modal */}
      <div
        className="relative bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-800/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-700/50 hover:border-slate-600/60 transition-all duration-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Elegant border glow */}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-emerald-500/10 opacity-0 hover:opacity-100 transition-opacity duration-700"></div>

        {/* Premium Header */}
        <div className="relative bg-gradient-to-r from-slate-800/60 via-slate-900/80 to-slate-800/60 border-b border-slate-700/50 overflow-hidden">
          {/* Sophisticated background animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5 animate-pulse"></div>

          {/* Refined floating elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-3 left-8 w-1 h-1 bg-violet-400/60 rounded-full animate-ping"></div>
            <div className="absolute top-2 right-12 w-1 h-1 bg-cyan-400/60 rounded-full animate-ping delay-1000"></div>
            <div className="absolute bottom-3 left-16 w-1 h-1 bg-emerald-400/60 rounded-full animate-ping delay-2000"></div>
          </div>

          <div className="relative flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              {/* Elegant status indicator */}
              <div className="relative">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/30"></div>
                <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-ping opacity-40"></div>
              </div>

              {/* Sophisticated title section */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl border border-slate-600/50">
                  <Settings className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent tracking-wide">
                    SETTINGS
                  </h2>
                  <p className="text-sm text-slate-400 font-medium tracking-wider">
                    CONFIG CENTER
                  </p>
                </div>
              </div>
            </div>

            {/* Refined header actions */}
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-emerald-300 tracking-wider">
                    ACTIVE
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  // Reset any unsaved changes before closing
                  setEditedLevels({});
                  setEditedCapital(undefined);
                  setValidationErrors({});
                  setOrderConflicts({});
                  setShakeAnimations({});
                  onClose();
                }}
                className="group relative p-2.5 bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-red-500/20 hover:to-red-600/20 border border-slate-600/50 hover:border-red-500/50 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Premium Content */}
        <div className="p-6 space-y-6">
          {/* Enhanced Trading Capital Matrix */}
          <div className="relative">
            {/* Sophisticated Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent tracking-wider">
                  Trading Capital Matrix
                </span>
              </div>
            </div>

            {/* Capital Power Card */}
            <div className="relative">
              {/* Dynamic Background Gradient */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${capitalInfo.bgGradient} opacity-50`}
              ></div>

              <div
                className={`group relative bg-gradient-to-br from-slate-800/60 via-slate-900/80 to-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 overflow-hidden ${
                  validationErrors.capital
                    ? 'border-red-500/60 ring-2 ring-red-500/40 shadow-lg shadow-red-500/20 bg-red-500/5'
                    : hasCapitalChanged
                    ? `${capitalInfo.borderColor} shadow-lg shadow-emerald-500/10`
                    : `${capitalInfo.borderColor}`
                }`}
                style={{
                  animation: shakeAnimations.capital
                    ? 'shake 0.6s ease-in-out'
                    : validationErrors.capital
                    ? 'pulse-error 2s ease-in-out infinite'
                    : undefined,
                }}
              >
                {/* Premium Floating Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-4 left-8 w-1 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-ping opacity-60"></div>
                  <div className="absolute top-3 right-10 w-1 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-ping opacity-40 delay-1000"></div>
                  <div className="absolute bottom-5 left-12 w-1 h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-ping opacity-50 delay-2000"></div>
                  <div className="absolute bottom-4 right-6 w-1 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-ping opacity-45 delay-3000"></div>
                </div>

                {/* Premium Capital Input */}
                <div className="relative">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        TRADING CAPITAL AMOUNT
                      </span>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400 font-bold text-xl animate-pulse">
                      ₹
                    </div>
                    <input
                      type="number"
                      min="10000"
                      max="100000000"
                      step="1000"
                      value={getDisplayCapital()}
                      onChange={(e) => handleCapitalChange(e.target.value)}
                      className={`w-full border-2 rounded-xl pl-10 pr-20 py-4 text-white font-bold text-xl focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                        validationErrors.capital
                          ? 'bg-red-900/40 border-red-400/80 text-red-200 focus:border-red-300/90 focus:ring-2 focus:ring-red-400/40 shadow-lg shadow-red-500/20'
                          : hasCapitalChanged
                          ? 'bg-black/30 border-emerald-500/60 focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/30 focus:shadow-lg focus:shadow-emerald-500/20'
                          : 'bg-black/20 border-slate-600/50 focus:border-slate-500/70 focus:ring-2 focus:ring-slate-500/20 hover:bg-black/30 group-hover:border-emerald-400/40'
                      }`}
                      style={{
                        animation: validationErrors.capital
                          ? 'pulse-error 2s ease-in-out infinite'
                          : undefined,
                      }}
                      placeholder="Enter capital amount"
                    />

                    {/* Live formatted display */}
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div
                        className={`text-sm font-bold ${capitalInfo.textColor} bg-slate-800/60 px-3 py-1 rounded-lg border border-slate-600/50`}
                      >
                        {formatCurrency(
                          Number(getDisplayCapital()) || settings.accountBalance
                        )}
                      </div>
                    </div>

                    {/* Input enhancement glow */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  {/* Quick amount buttons */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[100000, 500000, 1000000, 5000000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleCapitalChange(amount.toString())}
                        className="px-3 py-2 bg-gradient-to-r from-slate-700/40 to-slate-600/40 hover:from-emerald-600/30 hover:to-teal-600/30 border border-slate-600/50 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 text-xs font-medium rounded-lg transition-all duration-300 hover:scale-105"
                      >
                        ₹{formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Risk Matrix */}
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg">
                  <Target className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent tracking-wider">
                  Risk Tolerance Matrix
                </span>
              </div>

              {/* Live Risk Range Indicator */}
              <div className="flex items-center space-x-2">
                <div className="text-xs text-slate-400 font-medium">RANGE</div>
                <div className="px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-red-500/20 border border-slate-600/50 rounded-lg">
                  <span className="text-xs font-bold text-slate-300">
                    {Math.min(
                      ...defaultRiskLevels.map(
                        (l) => Number(getDisplayValue(l)) || 0
                      )
                    ).toFixed(2)}
                    % -{' '}
                    {Math.max(
                      ...defaultRiskLevels.map(
                        (l) => Number(getDisplayValue(l)) || 0
                      )
                    ).toFixed(2)}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Progressive Risk Level Cards */}
            <div className="relative">
              {/* Background Gradient Track */}
              <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500/30 via-amber-500/30 via-orange-500/30 to-red-500/30 rounded-full"></div>

              <div className="relative flex items-center justify-center space-x-2">
                {defaultRiskLevels.map((level, index) => {
                  const displayValue = getDisplayValue(level);
                  const hasError = validationErrors.riskLevels?.[level.id];
                  const isShaking = shakeAnimations[level.id];
                  const orderConflict = orderConflicts[level.id];
                  const hasOrderConflict = !!orderConflict;
                  const errorType = hasError?.includes('Duplicate')
                    ? 'duplicate'
                    : hasError?.includes('Maximum')
                    ? 'high'
                    : hasOrderConflict
                    ? 'order'
                    : hasError
                    ? 'invalid'
                    : null;

                  const levelColors = {
                    conservative: {
                      bg: 'from-emerald-500/10 via-green-500/5 to-teal-500/10',
                      border:
                        'border-emerald-400/30 hover:border-emerald-400/50',
                      text: 'text-emerald-300',
                      accent: 'text-emerald-400',
                      inputBg: 'bg-emerald-500/10',
                      inputBorder: 'border-emerald-400/40',
                      icon: '🌱',
                    },
                    balanced: {
                      bg: 'from-amber-500/10 via-yellow-500/5 to-orange-500/10',
                      border: 'border-amber-400/30 hover:border-amber-400/50',
                      text: 'text-amber-300',
                      accent: 'text-amber-400',
                      inputBg: 'bg-amber-500/10',
                      inputBorder: 'border-amber-400/40',
                      icon: '🔥',
                    },
                    bold: {
                      bg: 'from-orange-500/10 via-red-500/5 to-pink-500/10',
                      border: 'border-orange-400/30 hover:border-orange-400/50',
                      text: 'text-orange-300',
                      accent: 'text-orange-400',
                      inputBg: 'bg-orange-500/10',
                      inputBorder: 'border-orange-400/40',
                      icon: '⚡',
                    },
                    maximum: {
                      bg: 'from-red-500/10 via-pink-500/5 to-rose-500/10',
                      border: 'border-red-400/30 hover:border-red-400/50',
                      text: 'text-red-300',
                      accent: 'text-red-400',
                      inputBg: 'bg-red-500/10',
                      inputBorder: 'border-red-400/40',
                      icon: '💀',
                    },
                  };

                  const colors =
                    levelColors[level.id as keyof typeof levelColors] ||
                    levelColors['conservative'];

                  return (
                    <React.Fragment key={level.id}>
                      {/* Risk Level Card */}
                      <div className="relative flex-shrink-0">
                        {/* Enhanced Risk Level Card */}
                        <div
                          className={`group relative bg-gradient-to-br ${
                            colors.bg
                          } rounded-xl p-3 border transition-all duration-300 hover:scale-105 overflow-hidden w-32 h-36 ${
                            hasError
                              ? errorType === 'duplicate'
                                ? 'ring-2 ring-purple-500/60 border-purple-500/70 shadow-lg shadow-purple-500/20 bg-purple-500/10'
                                : errorType === 'high'
                                ? 'ring-2 ring-red-500/60 border-red-500/70 shadow-lg shadow-red-500/20 bg-red-500/10'
                                : errorType === 'order'
                                ? orderConflict?.type === 'decrease'
                                  ? 'ring-2 ring-amber-500/60 border-amber-500/70 shadow-lg shadow-amber-500/20 bg-amber-500/10'
                                  : 'ring-2 ring-cyan-500/60 border-cyan-500/70 shadow-lg shadow-cyan-500/20 bg-cyan-500/10'
                                : 'ring-2 ring-orange-500/60 border-orange-500/70 shadow-lg shadow-orange-500/20 bg-orange-500/10'
                              : colors.border
                          }`}
                          style={{
                            animation: isShaking
                              ? 'shake 0.6s ease-in-out'
                              : hasError
                              ? 'pulse-error 2s ease-in-out infinite'
                              : undefined,
                          }}
                        >
                          {/* Creative Order Conflict Indicator */}
                          {hasOrderConflict && (
                            <div className="absolute -top-2 -right-2 z-10">
                              <div
                                className={`p-1.5 rounded-full shadow-lg animate-bounce ${
                                  orderConflict?.type === 'decrease'
                                    ? 'bg-gradient-to-r from-amber-500/80 to-orange-500/80 border border-amber-400/90'
                                    : 'bg-gradient-to-r from-cyan-500/80 to-blue-500/80 border border-cyan-400/90'
                                }`}
                              >
                                {orderConflict?.type === 'decrease' ? (
                                  <ChevronDown className="w-3 h-3 text-white" />
                                ) : (
                                  <ChevronUp className="w-3 h-3 text-white" />
                                )}
                              </div>
                            </div>
                          )}
                          {/* Card Content - Icon, Input, Label */}
                          <div className="flex flex-col items-center justify-center text-center space-y-2 h-full">
                            {/* Enhanced Icon with Pulse */}
                            <div className="relative">
                              <div className="text-3xl transform transition-transform duration-300 group-hover:scale-110">
                                {colors.icon}
                              </div>
                              {hasError && (
                                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full animate-pulse"></div>
                              )}
                            </div>

                            {/* Advanced Input with Visual Feedback */}
                            <div className="relative group">
                              <input
                                type="number"
                                min="0.01"
                                max="3"
                                step="0.01"
                                value={displayValue}
                                onChange={(e) =>
                                  handlePercentageChange(
                                    level.id,
                                    e.target.value
                                  )
                                }
                                className={`w-16 h-8 border-2 rounded-xl px-2 pr-5 text-center font-bold text-sm focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                                  hasError
                                    ? errorType === 'duplicate'
                                      ? 'bg-purple-900/40 border-purple-400/80 text-purple-200 focus:border-purple-300/90 focus:ring-2 focus:ring-purple-400/40 shadow-lg shadow-purple-500/20'
                                      : errorType === 'high'
                                      ? 'bg-red-900/40 border-red-400/80 text-red-200 focus:border-red-300/90 focus:ring-2 focus:ring-red-400/40 shadow-lg shadow-red-500/20'
                                      : errorType === 'order'
                                      ? orderConflict?.type === 'decrease'
                                        ? 'bg-amber-900/40 border-amber-400/80 text-amber-200 focus:border-amber-300/90 focus:ring-2 focus:ring-amber-400/40 shadow-lg shadow-amber-500/20'
                                        : 'bg-cyan-900/40 border-cyan-400/80 text-cyan-200 focus:border-cyan-300/90 focus:ring-2 focus:ring-cyan-400/40 shadow-lg shadow-cyan-500/20'
                                      : 'bg-orange-900/40 border-orange-400/80 text-orange-200 focus:border-orange-300/90 focus:ring-2 focus:ring-orange-400/40 shadow-lg shadow-orange-500/20'
                                    : `bg-black/20 ${colors.inputBorder} ${colors.accent} focus:border-current/90 focus:ring-2 focus:ring-current/30 hover:bg-black/30 group-hover:border-current/70`
                                }`}
                                style={{
                                  animation: hasError
                                    ? 'pulse-error 2s ease-in-out infinite'
                                    : undefined,
                                }}
                                placeholder="0.25"
                              />
                              <div
                                className={`absolute right-1.5 top-1/2 transform -translate-y-1/2 text-xs font-bold ${colors.accent} opacity-70 pointer-events-none transition-opacity group-hover:opacity-90`}
                              >
                                %
                              </div>

                              {/* Input Enhancement Glow */}
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>

                            {/* Enhanced Label with Dynamic State */}
                            <div className="space-y-1">
                              <div
                                className={`text-xs font-medium ${colors.text} leading-tight px-1 transition-colors duration-300`}
                              >
                                {level.name}
                              </div>

                              {/* Live Value Preview */}
                              <div className="flex items-center justify-center space-x-1">
                                <div
                                  className={`w-1 h-1 rounded-full ${colors.accent.replace(
                                    'text-',
                                    'bg-'
                                  )} opacity-60`}
                                ></div>
                                <span
                                  className={`text-xs font-bold ${colors.accent} opacity-80`}
                                >
                                  {Number(displayValue) > 0
                                    ? `${Number(displayValue).toFixed(2)}%`
                                    : '--'}
                                </span>
                                <div
                                  className={`w-1 h-1 rounded-full ${colors.accent.replace(
                                    'text-',
                                    'bg-'
                                  )} opacity-60`}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Compact Connection Node */}
                      {index < defaultRiskLevels.length - 1 && (
                        <div className="relative flex items-center justify-center px-1">
                          {/* Directional Node */}
                          <div className="relative z-10 group">
                            <div className="w-4 h-4 bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600/60 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-slate-500/80">
                              <ChevronLeft className="w-2 h-2 text-slate-400 group-hover:text-slate-300" />
                            </div>
                            <div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-full animate-ping opacity-20"></div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Premium Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    hasValidationErrors
                      ? 'bg-red-400'
                      : hasChanges
                      ? 'bg-emerald-400'
                      : 'bg-slate-500'
                  }`}
                ></div>
                <span
                  className={`text-xs font-medium tracking-wider ${
                    hasValidationErrors
                      ? 'text-red-400'
                      : hasChanges
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  {hasValidationErrors
                    ? `${errorCounts.total} VALIDATION ERROR${
                        errorCounts.total !== 1 ? 'S' : ''
                      }`
                    : hasChanges
                    ? 'CHANGES DETECTED'
                    : 'NO CHANGES'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`group relative px-6 py-2.5 font-bold text-sm rounded-xl transition-all duration-300 overflow-hidden ${
                  canSave
                    ? 'bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:via-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105'
                    : hasValidationErrors
                    ? 'bg-gradient-to-r from-red-700 to-red-600 text-red-200 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>
                    {hasValidationErrors
                      ? 'Fix Errors to Save'
                      : hasChanges
                      ? 'Save Changes'
                      : 'No Changes'}
                  </span>
                  {canSave && <Activity className="w-4 h-4" />}
                  {hasValidationErrors && <AlertTriangle className="w-4 h-4" />}
                </span>
                {canSave && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-cyan-400/10 to-blue-400/10 animate-pulse"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes pulse-error {
          0%, 100% { 
            border-color: rgba(239, 68, 68, 0.6);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% { 
            border-color: rgba(239, 68, 68, 0.8);
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsModal;
