import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Settings,
  AlertTriangle,
  TrendingUp,
  Target,
  Activity,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
  LogOut,
  Users,
  ExternalLink,
  Wifi,
} from 'lucide-react';
import SessionManager from '../auth/SessionManager';
import BrokerConnectionModal from '../broker/BrokerConnectionModal';
import {
  useSettings,
  type RiskLevel,
  type AllocationLevel,
  type StopLossLevel,
} from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'account' | 'risk' | 'stopLoss' | 'brokers' | 'sessions';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    updateRiskLevel,
    updateAllocationLevel,
    updateStopLossLevel,
  } = useSettings();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [editedLevels, setEditedLevels] = useState<Record<string, string>>({});
  const [editedAllocationLevels, setEditedAllocationLevels] = useState<
    Record<string, string>
  >({});
  const [editedStopLossLevels, setEditedStopLossLevels] = useState<
    Record<string, string>
  >({});
  const [editedCapital, setEditedCapital] = useState<string | undefined>(
    undefined
  );
  const [localSettings, setLocalSettings] = useState(settings);
  const [validationErrors, setValidationErrors] = useState<{
    capital?: string;
    riskLevels?: Record<string, string>;
    allocationLevels?: Record<string, string>;
    stopLossLevels?: Record<string, string>;
    duplicates?: string[];
    allocationDuplicates?: string[];
    stopLossDuplicates?: string[];
    stopLoss?: string;
  }>({});
  const [shakeAnimations, setShakeAnimations] = useState<
    Record<string, boolean>
  >({});
  const [orderConflicts, setOrderConflicts] = useState<
    Record<string, { type: 'decrease' | 'increase'; conflictWith: string }>
  >({});
  const [stopLossOrderConflicts, setStopLossOrderConflicts] = useState<
    Record<string, { type: 'decrease' | 'increase'; conflictWith: string }>
  >({});
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);

  // Update local settings when settings prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Keyboard shortcuts handler - needs to be after hooks but before early return
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC to close
      if (event.key === 'Escape') {
        event.preventDefault();
        // Reset any unsaved changes before closing
        setEditedLevels({});
        setEditedAllocationLevels({});
        setEditedStopLossLevels({});
        setEditedCapital(undefined);
        setValidationErrors({});
        setOrderConflicts({});
        setStopLossOrderConflicts({});
        setShakeAnimations({});
        onClose();
        return;
      }

      // ⌘S or Ctrl+S to save
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        // Check if save button is enabled (has changes and no validation errors)
        const saveButton = document.querySelector(
          '[data-save-button]'
        ) as HTMLButtonElement;
        if (saveButton && !saveButton.disabled) {
          saveButton.click();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Helper function to get allocation level icons
  const getAllocationIcon = (): React.ComponentType<{ className?: string }> => {
    // All allocation levels use Shield icon (same as risk levels)
    return Shield;
  };

  // Helper function to get risk level icons
  const getRiskIcon = (): React.ComponentType<{ className?: string }> => {
    // All risk levels use Shield icon (same as allocation levels)
    return Shield;
  };

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
      localSettings.riskLevels.forEach((level) => {
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

  const validateStopLoss = (value: number) => {
    try {
      if (value === undefined || value === null || isNaN(value)) {
        return 'Stop loss percentage is required';
      }
      if (value <= 0) {
        return 'Stop loss must be greater than 0%';
      }
      if (value > 8) {
        return 'Maximum stop loss is 8% for risk management';
      }
      return null;
    } catch (error) {
      console.error('Error in validateStopLoss:', error);
      return 'Invalid stop loss percentage';
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

  // Validate allocation levels (similar to risk levels)
  const validateAllocationLevels = (levels: Record<string, string>) => {
    const errors: Record<string, string> = {};
    const duplicates: string[] = [];
    const values: number[] = [];
    const processedValues: { [key: string]: number } = {};

    try {
      // Get all allocation level values (including unchanged ones)
      const allLevels = { ...levels };
      localSettings.allocationLevels.forEach((level) => {
        if (
          ['conservative', 'balanced', 'high', 'extreme'].includes(level.id)
        ) {
          // If no edited value exists, use the original value
          if (!allLevels[level.id] && allLevels[level.id] !== '') {
            allLevels[level.id] = level.percentage.toString();
          }
        }
      });

      // Check each allocation level
      Object.entries(allLevels).forEach(([levelId, value]) => {
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

        // Check range (5 <= value <= 50)
        if (numValue < 5) {
          errors[levelId] = 'Minimum value is 5%';
        } else if (numValue > 50) {
          errors[levelId] = 'Maximum value is 50%';
        } else {
          processedValues[levelId] = numValue;
          values.push(numValue);
        }
      });

      // Check for duplicates among valid values
      if (values.length > 1) {
        const uniqueValues = new Set(values);
        if (values.length !== uniqueValues.size) {
          const valueCount: Record<number, string[]> = {};
          Object.entries(processedValues).forEach(([levelId, value]) => {
            if (!valueCount[value]) valueCount[value] = [];
            valueCount[value].push(levelId);
          });

          Object.entries(valueCount).forEach(([value, levelIds]) => {
            if (levelIds.length > 1) {
              levelIds.forEach((levelId) => {
                if (!errors[levelId]) {
                  errors[levelId] = `Duplicate value: ${value}%`;
                  duplicates.push(levelId);
                }
              });
            }
          });
        }
      }

      // Check ascending order
      const orderedLevels = ['conservative', 'balanced', 'high', 'extreme'];
      const orderedValues: { id: string; value: number }[] = [];

      orderedLevels.forEach((levelId) => {
        if (processedValues[levelId] !== undefined) {
          orderedValues.push({ id: levelId, value: processedValues[levelId] });
        }
      });

      for (let i = 1; i < orderedValues.length; i++) {
        const current = orderedValues[i];
        const previous = orderedValues[i - 1];

        if (current.value <= previous.value) {
          if (!errors[current.id] && !errors[previous.id]) {
            errors[current.id] = `Must be greater than ${previous.value}%`;
          }
        }
      }
    } catch (error) {
      console.error('Error in validateAllocationLevels:', error);
    }

    return { errors, duplicates };
  };

  const handleAllocationChange = (levelId: string, value: string) => {
    try {
      // Update the value
      const newLevels = { ...editedAllocationLevels, [levelId]: value };
      setEditedAllocationLevels(newLevels);

      // Validate all allocation levels
      const { errors, duplicates } = validateAllocationLevels(newLevels);

      // Update validation errors
      setValidationErrors((prev) => ({
        ...prev,
        allocationLevels: errors,
        allocationDuplicates: duplicates,
      }));

      // Trigger shake animation for errors
      if (errors[levelId] || duplicates.includes(levelId)) {
        setShakeAnimations((prev) => ({ ...prev, [levelId]: true }));
        setTimeout(() => {
          setShakeAnimations((prev) => ({ ...prev, [levelId]: false }));
        }, 600);
      }
    } catch (error) {
      console.error('Error in handleAllocationChange:', error);
    }
  };

  // Validate stop loss levels (similar to risk levels)
  const validateStopLossLevels = (levels: Record<string, string>) => {
    const errors: Record<string, string> = {};
    const duplicates: string[] = [];
    const values: number[] = [];
    const processedValues: { [key: string]: number } = {};
    const conflicts: Record<
      string,
      { type: 'decrease' | 'increase'; conflictWith: string }
    > = {};

    try {
      // Get all stop loss level values (including unchanged ones)
      const allLevels = { ...levels };
      localSettings.stopLossLevels.forEach((level) => {
        if (['tight', 'normal', 'loose', 'wide'].includes(level.id)) {
          // If no edited value exists, use the original value
          if (!allLevels[level.id] && allLevels[level.id] !== '') {
            allLevels[level.id] = level.percentage.toString();
          }
        }
      });

      // Check each stop loss level
      Object.entries(allLevels).forEach(([levelId, value]) => {
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

        // Check range (0.1 <= value <= 8)
        if (numValue < 0.1) {
          errors[levelId] = 'Minimum 0.1%';
          return;
        }

        if (numValue > 8) {
          errors[levelId] = 'Maximum 8%';
          return;
        }

        processedValues[levelId] = numValue;
        values.push(numValue);
      });

      // Check for duplicates
      const valueCount: { [key: string]: string[] } = {};
      Object.entries(processedValues).forEach(([levelId, value]) => {
        const key = value.toString();
        if (!valueCount[key]) {
          valueCount[key] = [];
        }
        valueCount[key].push(levelId);
      });

      Object.entries(valueCount).forEach(([value, levelIds]) => {
        if (levelIds.length > 1) {
          levelIds.forEach((levelId) => {
            duplicates.push(levelId);
            errors[levelId] = `Duplicate value: ${value}%`;
          });
        }
      });

      // Check order conflicts (tight < normal < loose < wide)
      const levelOrder = ['tight', 'normal', 'loose', 'wide'];

      for (let i = 0; i < levelOrder.length - 1; i++) {
        const currentLevel = levelOrder[i];
        const nextLevel = levelOrder[i + 1];

        const currentValue = processedValues[currentLevel];
        const nextValue = processedValues[nextLevel];

        if (currentValue !== undefined && nextValue !== undefined) {
          if (currentValue >= nextValue) {
            // Current level should be less than next level
            conflicts[currentLevel] = {
              type: 'increase',
              conflictWith: nextLevel,
            };
            conflicts[nextLevel] = {
              type: 'decrease',
              conflictWith: currentLevel,
            };
          }
        }
      }

      return { errors, duplicates, conflicts };
    } catch (error) {
      console.error('Error in validateStopLossLevels:', error);
      return { errors: {}, duplicates: [], conflicts: {} };
    }
  };

  const handleStopLossChange = (levelId: string, value: string) => {
    try {
      // Update the value
      const newLevels = { ...editedStopLossLevels, [levelId]: value };
      setEditedStopLossLevels(newLevels);

      // Validate all stop loss levels
      const { errors, duplicates, conflicts } =
        validateStopLossLevels(newLevels);

      // Update validation errors and order conflicts
      setValidationErrors((prev) => ({
        ...prev,
        stopLossLevels: errors,
        stopLossDuplicates: duplicates,
      }));
      setStopLossOrderConflicts(conflicts);

      // Trigger shake animation for errors
      if (errors[levelId] || duplicates.includes(levelId)) {
        setShakeAnimations((prev) => ({ ...prev, [levelId]: true }));
        setTimeout(() => {
          setShakeAnimations((prev) => ({ ...prev, [levelId]: false }));
        }, 600);
      }
    } catch (error) {
      console.error('Error in handleStopLossChange:', error);
    }
  };

  const handleSave = () => {
    // Final validation before save
    if (hasValidationErrors) {
      return;
    }

    // Update risk levels with new percentages
    localSettings.riskLevels.forEach((level) => {
      if (editedLevels[level.id] !== undefined) {
        const updatedLevel: RiskLevel = {
          ...level,
          percentage: Number(editedLevels[level.id]),
        };
        updateRiskLevel(updatedLevel);
      }
    });

    // Update allocation levels with new percentages
    localSettings.allocationLevels.forEach((level) => {
      if (editedAllocationLevels[level.id] !== undefined) {
        const updatedLevel: AllocationLevel = {
          ...level,
          percentage: Number(editedAllocationLevels[level.id]),
        };
        updateAllocationLevel(updatedLevel);
      }
    });

    // Update stop loss levels with new percentages
    localSettings.stopLossLevels.forEach((level) => {
      if (editedStopLossLevels[level.id] !== undefined) {
        const updatedLevel: StopLossLevel = {
          ...level,
          percentage: Number(editedStopLossLevels[level.id]),
        };
        updateStopLossLevel(updatedLevel);
      }
    });

    // Update trading capital if changed
    if (editedCapital !== undefined) {
      updateSettings({ accountBalance: Number(editedCapital) });
    }

    // Update stop loss setting if changed
    if (
      localSettings.defaultStopLossPercentage !==
      settings.defaultStopLossPercentage
    ) {
      updateSettings({
        defaultStopLossPercentage: localSettings.defaultStopLossPercentage,
      });
    }

    // Clear local edits after saving
    setEditedLevels({});
    setEditedAllocationLevels({});
    setEditedStopLossLevels({});
    setEditedCapital(undefined);
    setValidationErrors({});
    setOrderConflicts({});
    setShakeAnimations({});

    onClose();
  };

  const getDisplayValue = (level: RiskLevel) => {
    if (editedLevels[level.id] !== undefined) {
      return editedLevels[level.id];
    }
    return level.percentage.toString();
  };

  const getAllocationDisplayValue = (level: AllocationLevel) => {
    if (editedAllocationLevels[level.id] !== undefined) {
      return editedAllocationLevels[level.id];
    }
    return level.percentage.toString();
  };

  const getStopLossDisplayValue = (level: StopLossLevel) => {
    if (editedStopLossLevels[level.id] !== undefined) {
      return editedStopLossLevels[level.id];
    }
    return level.percentage.toString();
  };

  const getDisplayCapital = () => {
    return editedCapital !== undefined
      ? editedCapital
      : localSettings.accountBalance.toString();
  };

  const hasCapitalChanged = editedCapital !== undefined;
  const hasStopLossChanged =
    localSettings.defaultStopLossPercentage !==
    settings.defaultStopLossPercentage;
  const hasChanges =
    Object.keys(editedLevels).length > 0 ||
    Object.keys(editedAllocationLevels).length > 0 ||
    Object.keys(editedStopLossLevels).length > 0 ||
    hasCapitalChanged ||
    hasStopLossChanged;

  // Check if there are any validation errors
  const hasValidationErrors =
    validationErrors.capital ||
    validationErrors.stopLoss ||
    (validationErrors.riskLevels &&
      Object.keys(validationErrors.riskLevels).length > 0) ||
    (validationErrors.allocationLevels &&
      Object.keys(validationErrors.allocationLevels).length > 0) ||
    (validationErrors.stopLossLevels &&
      Object.keys(validationErrors.stopLossLevels).length > 0) ||
    (validationErrors.duplicates && validationErrors.duplicates.length > 0) ||
    (validationErrors.allocationDuplicates &&
      validationErrors.allocationDuplicates.length > 0) ||
    (validationErrors.stopLossDuplicates &&
      validationErrors.stopLossDuplicates.length > 0) ||
    Object.keys(orderConflicts).length > 0 ||
    Object.keys(stopLossOrderConflicts).length > 0;

  const canSave = hasChanges && !hasValidationErrors;

  // Get the default risk levels (not custom ones)
  const defaultRiskLevels = localSettings.riskLevels.filter((level) =>
    ['conservative', 'balanced', 'bold', 'maximum'].includes(level.id)
  );

  // Get the default allocation levels
  const defaultAllocationLevels = localSettings.allocationLevels.filter(
    (level) =>
      ['conservative', 'balanced', 'high', 'extreme'].includes(level.id)
  );

  // Global error summary
  const getErrorSummary = () => {
    const errors: {
      type: string;
      message: string;
      field?: string;
      severity: 'high' | 'medium' | 'low';
    }[] = [];
    const duplicateGroups: Set<string> = new Set();

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

              if (isDuplicate) {
                // Group duplicates - only add once per unique duplicate value
                const duplicateKey = `risk-${error}`;
                if (!duplicateGroups.has(duplicateKey)) {
                  duplicateGroups.add(duplicateKey);
                  errors.push({
                    type: 'duplicate',
                    message: error.replace('Duplicate value:', 'Risk levels have duplicate value:'),
                    field: 'Risk Levels',
                    severity: 'medium',
                  });
                }
              } else {
                errors.push({
                  type: isOrderError
                    ? 'order'
                    : isRange
                    ? 'range'
                    : 'invalid',
                  message: error,
                  field: level?.name || levelId,
                  severity: isOrderError
                    ? 'high'
                    : isRange
                    ? 'high'
                    : 'low',
                });
              }
            }
          }
        );
      }

      // Allocation level errors
      if (
        validationErrors.allocationLevels &&
        typeof validationErrors.allocationLevels === 'object'
      ) {
        Object.entries(validationErrors.allocationLevels).forEach(
          ([levelId, error]) => {
            if (error && typeof error === 'string') {
              const level = defaultAllocationLevels.find(
                (l) => l.id === levelId
              );
              const isDuplicate = error.includes('Duplicate');
              const isMaximumRange = error.includes('Maximum value is 50%');
              const isMinimumRange = error.includes('Minimum value is 5%');
              const isOrderError =
                error.includes('Must be greater than') && error.includes('%');
              const isRange =
                isMaximumRange ||
                isMinimumRange ||
                error.includes('Must be greater than 0');

              if (isDuplicate) {
                // Group duplicates - only add once per unique duplicate value
                const duplicateKey = `allocation-${error}`;
                if (!duplicateGroups.has(duplicateKey)) {
                  duplicateGroups.add(duplicateKey);
                  errors.push({
                    type: 'duplicate',
                    message: error.replace('Duplicate value:', 'Allocation levels have duplicate value:'),
                    field: 'Allocation Levels',
                    severity: 'medium',
                  });
                }
              } else {
                errors.push({
                  type: isOrderError
                    ? 'order'
                    : isRange
                    ? 'range'
                    : 'invalid',
                  message: error,
                  field: level?.name || levelId,
                  severity: isOrderError
                    ? 'high'
                    : isRange
                    ? 'high'
                    : 'low',
                });
              }
            }
          }
        );
      }

      // Stop Loss level errors
      if (
        validationErrors.stopLossLevels &&
        typeof validationErrors.stopLossLevels === 'object'
      ) {
        Object.entries(validationErrors.stopLossLevels).forEach(
          ([levelId, error]) => {
            if (error && typeof error === 'string') {
              const level = localSettings.stopLossLevels.find(
                (l) => l.id === levelId
              );
              const isDuplicate = error.includes('Duplicate');
              const isMaximumRange = error.includes('Maximum value is 8%');
              const isMinimumRange = error.includes('Minimum value is 0.1%');
              const isOrderError =
                error.includes('Must be greater than') && error.includes('%');
              const isRange =
                isMaximumRange ||
                isMinimumRange ||
                error.includes('Must be greater than 0');

              if (isDuplicate) {
                // Group duplicates - only add once per unique duplicate value
                const duplicateKey = `stopLoss-${error}`;
                if (!duplicateGroups.has(duplicateKey)) {
                  duplicateGroups.add(duplicateKey);
                  errors.push({
                    type: 'duplicate',
                    message: error.replace('Duplicate value:', 'Stop loss levels have duplicate value:'),
                    field: 'Stop Loss Levels',
                    severity: 'medium',
                  });
                }
              } else {
                errors.push({
                  type: isOrderError
                    ? 'order'
                    : isRange
                    ? 'range'
                    : 'invalid',
                  message: error,
                  field: level?.name || levelId,
                  severity: isOrderError
                    ? 'high'
                    : isRange
                    ? 'high'
                    : 'low',
                });
              }
            }
          }
        );
      }

      // Stop Loss Order Conflicts (only add if not caused by duplicates)
      Object.entries(stopLossOrderConflicts).forEach(([levelId, conflict]) => {
        const level = localSettings.stopLossLevels.find(
          (l) => l.id === levelId
        );
        
        // Check if this order conflict is caused by duplicate values
        const isDuplicateCaused = validationErrors.stopLossDuplicates?.includes(levelId) || 
                                  validationErrors.stopLossDuplicates?.includes(conflict.conflictWith);
        
        // Only add order conflict error if it's not caused by duplicates
        if (!isDuplicateCaused) {
          errors.push({
            type: 'order',
            message: `Stop loss order conflict: ${
              conflict.type === 'decrease'
                ? 'Value should be higher'
                : 'Value should be lower'
            } than ${conflict.conflictWith}`,
            field: level?.name || levelId,
            severity: 'high',
          });
        }
      });

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
          e.type !== 'capital' &&
          e.type !== 'duplicate' &&
          e.type !== 'order' &&
          !e.field?.toLowerCase().includes('allocation')
      ).length || 0,
    allocation:
      errorSummary?.filter(
        (e) =>
          e.field?.toLowerCase().includes('allocation') ||
          (e.type !== 'capital' &&
            e.type !== 'duplicate' &&
            e.type !== 'order' &&
            defaultAllocationLevels.some((level) => e.field === level.name))
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
    Number(getDisplayCapital()) || localSettings.accountBalance
  );

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const modalContent = (
    <div
      className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center z-[99999] p-4"
      onClick={(e) => {
        // Close modal if clicking on backdrop
        if (e.target === e.currentTarget) {
          // Reset any unsaved changes before closing
          setEditedLevels({});
          setEditedAllocationLevels({});
          setEditedStopLossLevels({});
          setEditedCapital(undefined);
          setValidationErrors({});
          setOrderConflicts({});
          setShakeAnimations({});
          onClose();
        }
      }}
      style={{ pointerEvents: 'auto' }}
    >
      {/* World-Class Cinematic Backdrop */}
      <div className="absolute inset-0 overflow-hidden opacity-95">
        {/* Revolutionary depth layers */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl"></div>

        {/* Dynamic holographic grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
            linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px)
          `,
            backgroundSize: '60px 60px',
            animation: 'grid-float 20s ease-in-out infinite',
          }}
        ></div>

        {/* Immersive ambient lighting */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[400px] bg-gradient-radial from-blue-500/8 via-purple-500/4 to-transparent rounded-full blur-3xl animate-ambient-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-gradient-radial from-emerald-500/8 via-cyan-500/4 to-transparent rounded-full blur-3xl animate-ambient-pulse-delayed"></div>
        <div className="absolute top-1/2 left-0 w-[400px] h-[600px] bg-gradient-radial from-violet-500/6 via-fuchsia-500/3 to-transparent rounded-full blur-3xl animate-ambient-drift"></div>

        {/* Floating data fragments */}
        <div className="absolute top-1/4 left-1/3 w-32 h-24 border border-cyan-400/10 rounded-lg backdrop-blur-sm animate-data-float transform-gpu">
          <div className="absolute inset-2 border border-cyan-400/20 rounded animate-pulse"></div>
          <div className="absolute top-3 left-3 w-2 h-2 bg-cyan-400/60 rounded-full animate-ping"></div>
        </div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-32 border border-emerald-400/10 rounded-lg backdrop-blur-sm animate-data-float-reverse transform-gpu">
          <div
            className="absolute inset-2 border border-emerald-400/20 rounded animate-pulse"
            style={{ animationDelay: '0.5s' }}
          ></div>
          <div
            className="absolute bottom-3 right-3 w-2 h-2 bg-emerald-400/60 rounded-full animate-ping"
            style={{ animationDelay: '0.7s' }}
          ></div>
        </div>

        {/* Neural pathways */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="neural1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
              <stop offset="30%" stopColor="#06B6D4" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M0,300 Q200,200 400,250 T800,200 Q1000,180 1200,220"
            stroke="url(#neural1)"
            strokeWidth="2"
            fill="none"
            filter="url(#glow)"
            className="animate-neural-flow"
          />
          <path
            d="M200,500 Q400,400 600,450 T1000,400 Q1200,380 1400,420"
            stroke="url(#neural1)"
            strokeWidth="1.5"
            fill="none"
            filter="url(#glow)"
            className="animate-neural-flow-delayed"
          />
        </svg>

        {/* Quantum particles */}
        <div className="absolute top-20 left-20 w-1 h-1 bg-blue-400 rounded-full animate-quantum-drift shadow-lg shadow-blue-400/50"></div>
        <div className="absolute top-40 right-40 w-1 h-1 bg-purple-400 rounded-full animate-quantum-drift-reverse shadow-lg shadow-purple-400/50"></div>
        <div className="absolute bottom-60 left-60 w-1 h-1 bg-emerald-400 rounded-full animate-quantum-spiral shadow-lg shadow-emerald-400/50"></div>
        <div className="absolute bottom-40 right-20 w-1 h-1 bg-cyan-400 rounded-full animate-quantum-orbit shadow-lg shadow-cyan-400/50"></div>
      </div>

      {/* Spectacular Settings Modal */}
      <div
        className="relative bg-gradient-to-br from-slate-800/70 via-indigo-900/80 to-slate-800/70 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[80vh] mx-auto border border-slate-600/40 transition-all duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Masterclass Header Design */}
        <div className="relative overflow-hidden">
          {/* Revolutionary glass morphism background */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-slate-900/30 to-black/20 backdrop-blur-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-black/10"></div>

          {/* Dynamic light bar */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-light-sweep"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-600/30 to-transparent"></div>

          <div className="relative flex items-center px-8 py-8">
            {/* Iconic Brand Experience */}
            <div className="flex items-center space-x-6 flex-1">
              {/* Quantum Logo */}
              <div className="relative group cursor-pointer">
                {/* Orbital rings */}
                <div className="absolute inset-0 w-16 h-16 border border-cyan-400/20 rounded-full animate-orbital-slow"></div>
                <div className="absolute inset-1 w-14 h-14 border border-purple-400/15 rounded-full animate-orbital-medium"></div>
                <div className="absolute inset-2 w-12 h-12 border border-emerald-400/15 rounded-full animate-orbital-fast"></div>

                {/* Core icon */}
                <div className="relative z-10 p-4 bg-gradient-to-br from-slate-800/60 via-slate-900/80 to-black/60 backdrop-blur-xl rounded-2xl border border-slate-700/40 group-hover:border-cyan-400/40 transition-all duration-500 group-hover:scale-105">
                  <Settings className="w-8 h-8 text-slate-300 group-hover:text-cyan-300 transition-all duration-500 group-hover:rotate-90" />

                  {/* Energy pulse */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/0 via-cyan-400/0 to-cyan-400/0 group-hover:from-cyan-400/10 group-hover:via-cyan-400/5 group-hover:to-cyan-400/10 transition-all duration-500"></div>
                </div>

                {/* Particle trail */}
                <div className="absolute top-6 left-6 w-1 h-1 bg-cyan-400/60 rounded-full animate-particle-trail opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-8 left-8 w-0.5 h-0.5 bg-purple-400/60 rounded-full animate-particle-trail-delayed opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Cinematic Typography */}
              <div className="space-y-2">
                <div className="flex items-baseline space-x-3">
                  <h1 className="text-2xl font-black bg-gradient-to-r from-slate-100 via-cyan-200 to-slate-100 bg-clip-text text-transparent tracking-tight relative">
                    TradeView
                    <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                  </h1>
                  <div className="px-2 py-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-full">
                    <span className="text-xs font-bold text-cyan-300 tracking-wider">
                      SETTINGS
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 font-medium tracking-wide opacity-80">
                  Advanced trading configuration & risk management
                </p>
              </div>
            </div>

            {/* Adaptive Action Zone */}
            <div className="flex items-center space-x-4">
              {/* Contextual shortcuts */}
              <div className="hidden lg:flex items-center space-x-2 opacity-60 hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/40">
                  <kbd className="text-xs text-slate-400 font-mono">ESC</kbd>
                  <span className="text-xs text-slate-500">to close</span>
                </div>
                <div className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/40">
                  <kbd className="text-xs text-slate-400 font-mono">⌘</kbd>
                  <kbd className="text-xs text-slate-400 font-mono">S</kbd>
                  <span className="text-xs text-slate-500">to save</span>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                className="relative group p-3 hover:bg-red-800/60 rounded-2xl transition-all duration-300 border border-transparent hover:border-red-600/40 hover:scale-105"
              >
                <LogOut className="relative w-6 h-6 text-slate-400 group-hover:text-red-300 transition-all duration-300" />

                {/* Logout tooltip */}
                <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-xl rounded-lg border border-slate-700/40 text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                  {user
                    ? `Sign out (${user.firstName} ${user.lastName})`
                    : 'Sign out'}
                </div>
              </button>

              {/* Intelligent close button */}
              <button
                onClick={() => {
                  setEditedLevels({});
                  setEditedAllocationLevels({});
                  setEditedStopLossLevels({});
                  setEditedCapital(undefined);
                  setValidationErrors({});
                  setOrderConflicts({});
                  setShakeAnimations({});
                  onClose();
                }}
                className="relative group p-3 hover:bg-slate-800/60 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-600/40 hover:scale-105"
              >
                {/* Warning glow for unsaved changes */}
                {hasChanges && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/10 via-amber-400/20 to-amber-400/10 animate-pulse"></div>
                )}

                <X className="relative w-6 h-6 text-slate-400 group-hover:text-white transition-all duration-300 group-hover:rotate-90" />

                {/* Smart tooltip */}
                <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-xl rounded-lg border border-slate-700/40 text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                  {hasChanges
                    ? 'Close (unsaved changes will be lost)'
                    : 'Close settings'}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Premium Content with Tabs */}
        <div className="flex">
          {/* Left Sidebar - Tabs */}
          <div className="w-64 border-r border-slate-700/40 p-6">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                  activeTab === 'account'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 shadow-lg shadow-emerald-500/20'
                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Trading Account</div>
                  <div className="text-xs opacity-80">
                    Capital & Portfolio Settings
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('risk')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                  activeTab === 'risk'
                    ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/40 text-orange-300 shadow-lg shadow-orange-500/20'
                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="p-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Risk Matrix</div>
                  <div className="text-xs opacity-80">
                    Risk & Allocation Levels
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('stopLoss')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                  activeTab === 'stopLoss'
                    ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/40 text-red-300 shadow-lg shadow-red-500/20'
                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg">
                  <X className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Stop Loss</div>
                  <div className="text-xs opacity-80">Stop Loss Management</div>
                </div>
              </button>
              
              {/* Broker Connections Tab */}
              <button
                onClick={() => setActiveTab('brokers')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                  activeTab === 'brokers'
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/40 text-blue-300 shadow-lg shadow-blue-500/20'
                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Broker Connections</div>
                  <div className="text-xs opacity-80">Trading Account Links</div>
                </div>
              </button>
              
              {/* Session Management Tab */}
              <button
                onClick={() => setActiveTab('sessions')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                  activeTab === 'sessions'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-lg">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Active Sessions</div>
                  <div className="text-xs opacity-80">Device & Security</div>
                </div>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-6 space-y-8 max-h-[80vh] overflow-y-auto">
            {activeTab === 'account' && (
              <>
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
                      className={`group relative bg-gradient-to-br from-slate-800/60 via-slate-900/80 to-slate-800/60 backdrop-blur-xl rounded-xl p-6 border transition-all duration-300 ${
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
                            onChange={(e) =>
                              handleCapitalChange(e.target.value)
                            }
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
                                Number(getDisplayCapital()) ||
                                  localSettings.accountBalance
                              )}
                            </div>
                          </div>

                          {/* Input enhancement glow */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>

                        {/* Clean Quick Amount Selection */}
                        <div className="mt-4 space-y-3">
                          <div className="text-xs font-medium text-slate-400 mb-3">
                            Quick Select
                          </div>

                          <div className="grid grid-cols-5 gap-2">
                            {[
                              { amount: 1000000, label: '10L' },
                              { amount: 2000000, label: '20L' },
                              { amount: 2500000, label: '25L' },
                              { amount: 5000000, label: '50L' },
                              { amount: 10000000, label: '1CR' },
                            ].map((item, index) => {
                              const isSelected =
                                Number(getDisplayCapital()) === item.amount;
                              const isCrore = item.label === '1CR';

                              return (
                                <button
                                  key={item.amount}
                                  onClick={() =>
                                    handleCapitalChange(item.amount.toString())
                                  }
                                  className={`group relative px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 overflow-hidden ${
                                    isSelected
                                      ? isCrore
                                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/50 text-amber-300 shadow-lg shadow-amber-500/20 animate-pulse'
                                        : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/50 text-emerald-300 shadow-lg shadow-emerald-500/20 animate-pulse'
                                      : 'bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-700/40 hover:border-slate-500/60 hover:text-white'
                                  }`}
                                  style={{
                                    animationDelay: `${index * 100}ms`,
                                    animation:
                                      'slideInUp 0.4s ease-out forwards',
                                  }}
                                >
                                  {/* Subtle shimmer effect on hover */}
                                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out"></div>

                                  {/* Premium glow for 1CR */}
                                  {isCrore && (
                                    <>
                                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/10 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                      <div className="absolute inset-0 border border-amber-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </>
                                  )}

                                  {/* Content with micro-interaction */}
                                  <span className="relative z-10 group-hover:tracking-wide transition-all duration-300">
                                    ₹{item.label}
                                  </span>

                                  {/* Bottom highlight bar */}
                                  <div
                                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r transition-all duration-300 ${
                                      isSelected
                                        ? isCrore
                                          ? 'from-amber-400 to-orange-400 w-full'
                                          : 'from-emerald-400 to-teal-400 w-full'
                                        : 'from-slate-400 to-slate-500 w-0 group-hover:w-full'
                                    }`}
                                  ></div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Management Section */}
                <div className="relative">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg">
                        <Users className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-sm font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent tracking-wider">
                        Security & Sessions
                      </span>
                    </div>
                  </div>

                  {/* Session Management Card */}
                  <div className="relative p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-600/40 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-purple-400/30 rounded-lg">
                          <Shield className="w-6 h-6 text-purple-300" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-200">
                            Active Sessions
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Manage devices signed in to your account
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsSessionManagerOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-lg text-sm font-medium text-purple-300 hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-400/50 transition-all duration-200"
                      >
                        Manage Sessions
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'risk' && (
              <>
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
                      <div className="text-xs text-slate-400 font-medium">
                        RANGE
                      </div>
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
                    <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500/30 via-amber-500/30 to-red-500/30 rounded-full"></div>

                    <div className="relative flex items-center justify-center space-x-2">
                      {defaultRiskLevels.map((level, index) => {
                        const displayValue = getDisplayValue(level);
                        const hasError =
                          validationErrors.riskLevels?.[level.id];
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
                          },
                          balanced: {
                            bg: 'from-amber-500/10 via-yellow-500/5 to-orange-500/10',
                            border:
                              'border-amber-400/30 hover:border-amber-400/50',
                            text: 'text-amber-300',
                            accent: 'text-amber-400',
                            inputBg: 'bg-amber-500/10',
                            inputBorder: 'border-amber-400/40',
                          },
                          bold: {
                            bg: 'from-orange-500/10 via-red-500/5 to-pink-500/10',
                            border:
                              'border-orange-400/30 hover:border-orange-400/50',
                            text: 'text-orange-300',
                            accent: 'text-orange-400',
                            inputBg: 'bg-orange-500/10',
                            inputBorder: 'border-orange-400/40',
                          },
                          maximum: {
                            bg: 'from-red-500/10 via-pink-500/5 to-rose-500/10',
                            border: 'border-red-400/30 hover:border-red-400/50',
                            text: 'text-red-300',
                            accent: 'text-red-400',
                            inputBg: 'bg-red-500/10',
                            inputBorder: 'border-red-400/40',
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

                                {/* Subtle shimmer effect on hover */}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out"></div>

                                {/* Card Content - Icon, Input, Label */}
                                <div className="flex flex-col items-center justify-center text-center space-y-2 h-full">
                                  {/* Enhanced Icon with Pulse */}
                                  <div className="relative">
                                    <div
                                      className={`transform transition-transform duration-300 group-hover:scale-110 ${colors.accent}`}
                                    >
                                      {React.createElement(getRiskIcon(), {
                                        className: 'w-8 h-8',
                                      })}
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
                                          ? `${Number(displayValue).toFixed(
                                              2
                                            )}%`
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
                                    <ChevronRight className="w-2 h-2 text-slate-400 group-hover:text-slate-300" />
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

                {/* Enhanced Portfolio Allocation Matrix */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-lg">
                        <Activity className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent tracking-wider">
                        Portfolio Allocation Matrix
                      </span>
                    </div>

                    {/* Live Allocation Range Indicator */}
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-slate-400 font-medium">
                        RANGE
                      </div>
                      <div className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-slate-600/50 rounded-lg">
                        <span className="text-xs font-bold text-slate-300">
                          {Math.min(
                            ...defaultAllocationLevels.map(
                              (l) => Number(getAllocationDisplayValue(l)) || 0
                            )
                          )}
                          % -{' '}
                          {Math.max(
                            ...defaultAllocationLevels.map(
                              (l) => Number(getAllocationDisplayValue(l)) || 0
                            )
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progressive Allocation Level Cards */}
                  <div className="relative">
                    {/* Background Gradient Track */}
                    <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500/30 via-blue-500/30 to-red-500/30 rounded-full"></div>

                    <div className="relative flex items-center justify-center space-x-2">
                      {defaultAllocationLevels.map((level, index) => {
                        const displayValue = getAllocationDisplayValue(level);
                        const hasError =
                          validationErrors.allocationLevels?.[level.id];
                        const isShaking = shakeAnimations[level.id];

                        const levelColors = {
                          conservative: {
                            bg: 'from-emerald-500/10 via-green-500/5 to-teal-500/10',
                            border:
                              'border-emerald-400/30 hover:border-emerald-400/50',
                            text: 'text-emerald-300',
                            accent: 'text-emerald-400',
                            inputBorder: 'border-emerald-400/40',
                          },
                          balanced: {
                            bg: 'from-blue-500/10 via-cyan-500/5 to-indigo-500/10',
                            border:
                              'border-blue-400/30 hover:border-blue-400/50',
                            text: 'text-blue-300',
                            accent: 'text-blue-400',
                            inputBorder: 'border-blue-400/40',
                          },
                          high: {
                            bg: 'from-orange-500/10 via-red-500/5 to-pink-500/10',
                            border:
                              'border-orange-400/30 hover:border-orange-400/50',
                            text: 'text-orange-300',
                            accent: 'text-orange-400',
                            inputBorder: 'border-orange-400/40',
                          },
                          extreme: {
                            bg: 'from-red-500/10 via-pink-500/5 to-rose-500/10',
                            border: 'border-red-400/30 hover:border-red-400/50',
                            text: 'text-red-300',
                            accent: 'text-red-400',
                            inputBorder: 'border-red-400/40',
                          },
                        };

                        const colors =
                          levelColors[level.id as keyof typeof levelColors] ||
                          levelColors['conservative'];

                        return (
                          <React.Fragment key={level.id}>
                            {/* Allocation Level Card */}
                            <div className="relative flex-shrink-0">
                              <div
                                className={`group relative bg-gradient-to-br ${
                                  colors.bg
                                } rounded-xl p-3 border transition-all duration-300 hover:scale-105 overflow-hidden w-32 h-36 ${
                                  hasError
                                    ? 'ring-2 ring-red-500/60 border-red-500/70 shadow-lg shadow-red-500/20 bg-red-500/10'
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
                                {/* Subtle shimmer effect on hover */}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out"></div>

                                {/* Card Content - Icon, Input, Label */}
                                <div className="flex flex-col items-center justify-center text-center space-y-2 h-full">
                                  {/* Enhanced Icon with Pulse */}
                                  <div className="relative">
                                    <div
                                      className={`transform transition-transform duration-300 group-hover:scale-110 ${colors.accent}`}
                                    >
                                      {React.createElement(
                                        getAllocationIcon(),
                                        {
                                          className: 'w-8 h-8',
                                        }
                                      )}
                                    </div>
                                    {hasError && (
                                      <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full animate-pulse"></div>
                                    )}
                                  </div>

                                  {/* Advanced Input with Visual Feedback */}
                                  <div className="relative group">
                                    <input
                                      type="number"
                                      min="5"
                                      max="50"
                                      step="5"
                                      value={displayValue}
                                      onChange={(e) =>
                                        handleAllocationChange(
                                          level.id,
                                          e.target.value
                                        )
                                      }
                                      className={`w-16 h-8 border-2 rounded-xl px-2 pr-5 text-center font-bold text-sm focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                                        hasError
                                          ? 'bg-red-900/40 border-red-400/80 text-red-200 focus:border-red-300/90 focus:ring-2 focus:ring-red-400/40 shadow-lg shadow-red-500/20'
                                          : `bg-black/20 ${colors.inputBorder} ${colors.accent} focus:border-current/90 focus:ring-2 focus:ring-current/30 hover:bg-black/30 group-hover:border-current/70`
                                      }`}
                                      style={{
                                        animation: hasError
                                          ? 'pulse-error 2s ease-in-out infinite'
                                          : undefined,
                                      }}
                                      placeholder="20"
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
                                          ? `${Number(displayValue)}%`
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
                            {index < defaultAllocationLevels.length - 1 && (
                              <div className="relative flex items-center justify-center px-1">
                                {/* Directional Node */}
                                <div className="relative z-10 group">
                                  <div className="w-4 h-4 bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600/60 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-slate-500/80">
                                    <ChevronRight className="w-2 h-2 text-slate-400 group-hover:text-slate-300" />
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
              </>
            )}

            {activeTab === 'stopLoss' && (
              <>
                {/* Optimized Stop Loss Management */}
                <div className="relative">
                  {/* Main Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg">
                        <X className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <span className="text-sm font-bold bg-gradient-to-r from-red-300 to-pink-300 bg-clip-text text-transparent tracking-wider">
                          Stop Loss Management
                        </span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Range: 0.1% - 8%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Default Stop Loss Section - Integrated */}
                  <div className="relative mb-6 p-4 bg-gradient-to-r from-slate-800/60 to-slate-900/80 border border-slate-600/40 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-4 h-4 text-red-400" />
                        <div>
                          <span className="text-sm font-medium text-slate-300">
                            Default Stop Loss
                          </span>
                          <div className="text-xs text-slate-400">
                            Applied automatically in trading calculator
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <input
                            type="number"
                            min="0.1"
                            max="8"
                            step="0.1"
                            value={
                              localSettings.defaultStopLossPercentage === 0
                                ? ''
                                : localSettings.defaultStopLossPercentage.toString()
                            }
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (inputValue === '') {
                                setLocalSettings((prev) => ({
                                  ...prev,
                                  defaultStopLossPercentage: 0,
                                }));
                                // Validate empty value
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  stopLoss: 'Stop loss percentage is required',
                                }));
                                return;
                              }

                              const value = parseFloat(inputValue);
                              if (!isNaN(value)) {
                                setLocalSettings((prev) => ({
                                  ...prev,
                                  defaultStopLossPercentage: value,
                                }));

                                // Validate stop loss
                                const error = validateStopLoss(value);
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  stopLoss: error || undefined,
                                }));
                              }
                            }}
                            className={`w-20 h-10 px-3 pr-7 bg-slate-800/50 border-2 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 text-sm font-bold text-center ${
                              validationErrors.stopLoss
                                ? 'border-red-500 focus:ring-red-500/50'
                                : 'border-slate-600 focus:border-red-400 focus:ring-red-500/20'
                            }`}
                            placeholder="3.0"
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span className="text-xs font-bold text-slate-400">
                              %
                            </span>
                          </div>
                        </div>

                        {/* Live Preview */}
                        <div className="px-3 py-2 bg-gradient-to-r from-slate-700/60 to-slate-600/60 border border-slate-500/40 rounded-lg">
                          <div className="text-xs text-slate-300">
                            ₹1000 → ₹
                            {(
                              1000 *
                              (1 -
                                localSettings.defaultStopLossPercentage / 100)
                            ).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {validationErrors.stopLoss && (
                      <div className="flex items-center space-x-2 mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-300">
                          {validationErrors.stopLoss}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Access Tiles */}
                  <div className="relative mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-slate-300">
                        Customizable Presets
                      </span>
                      <span className="text-xs text-slate-400">
                        Override default for individual trades
                      </span>
                    </div>

                    {/* Stop Loss Level Cards - Matching Risk Matrix Design */}
                    <div className="relative">
                      {/* Background Gradient Track */}
                      <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500/30 via-amber-500/30 to-red-500/30 rounded-full"></div>

                      <div className="relative flex items-center justify-center space-x-2">
                        {localSettings.stopLossLevels
                          .filter((level) =>
                            ['tight', 'normal', 'loose', 'wide'].includes(
                              level.id
                            )
                          )
                          .map((level, index) => {
                            const displayValue = getStopLossDisplayValue(level);
                            const hasError =
                              validationErrors.stopLossLevels?.[level.id];
                            const isShaking = shakeAnimations[level.id];
                            const orderConflict =
                              stopLossOrderConflicts[level.id];
                            const hasOrderConflict = !!orderConflict;
                            const isDuplicate =
                              validationErrors.stopLossDuplicates?.includes(
                                level.id
                              );
                            const errorType = isDuplicate
                              ? 'duplicate'
                              : hasError?.includes('Maximum')
                              ? 'high'
                              : hasOrderConflict
                              ? 'order'
                              : hasError
                              ? 'invalid'
                              : null;

                            const levelColors = {
                              tight: {
                                bg: 'from-emerald-500/10 via-green-500/5 to-teal-500/10',
                                border:
                                  'border-emerald-400/30 hover:border-emerald-400/50',
                                text: 'text-emerald-300',
                                accent: 'text-emerald-400',
                                inputBg: 'bg-emerald-500/10',
                                inputBorder: 'border-emerald-400/40',
                              },
                              normal: {
                                bg: 'from-amber-500/10 via-yellow-500/5 to-orange-500/10',
                                border:
                                  'border-amber-400/30 hover:border-amber-400/50',
                                text: 'text-amber-300',
                                accent: 'text-amber-400',
                                inputBg: 'bg-amber-500/10',
                                inputBorder: 'border-amber-400/40',
                              },
                              loose: {
                                bg: 'from-orange-500/10 via-red-500/5 to-pink-500/10',
                                border:
                                  'border-orange-400/30 hover:border-orange-400/50',
                                text: 'text-orange-300',
                                accent: 'text-orange-400',
                                inputBg: 'bg-orange-500/10',
                                inputBorder: 'border-orange-400/40',
                              },
                              wide: {
                                bg: 'from-red-500/10 via-pink-500/5 to-rose-500/10',
                                border:
                                  'border-red-400/30 hover:border-red-400/50',
                                text: 'text-red-300',
                                accent: 'text-red-400',
                                inputBg: 'bg-red-500/10',
                                inputBorder: 'border-red-400/40',
                              },
                            };

                            const colors =
                              levelColors[
                                level.id as keyof typeof levelColors
                              ] || levelColors['tight'];

                            return (
                              <React.Fragment key={level.id}>
                                {/* Stop Loss Level Card - Matching Risk Matrix Size */}
                                <div className="relative flex-shrink-0">
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
                                    {/* Order Conflict Indicator */}
                                    {hasOrderConflict && (
                                      <div className="absolute -top-2 -right-2 z-10">
                                        <div
                                          className={`p-1.5 rounded-full shadow-lg animate-bounce ${
                                            orderConflict?.type === 'decrease'
                                              ? 'bg-gradient-to-r from-amber-500/80 to-orange-500/80 border border-amber-400/90'
                                              : 'bg-gradient-to-r from-cyan-500/80 to-blue-500/80 border border-cyan-400/90'
                                          }`}
                                        >
                                          {orderConflict?.type ===
                                          'decrease' ? (
                                            <ChevronDown className="w-3 h-3 text-white" />
                                          ) : (
                                            <ChevronUp className="w-3 h-3 text-white" />
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out"></div>

                                    {/* Card Content */}
                                    <div className="flex flex-col items-center justify-center text-center space-y-2 h-full">
                                      {/* Icon */}
                                      <div className="relative">
                                        <div
                                          className={`transform transition-transform duration-300 group-hover:scale-110 ${colors.accent}`}
                                        >
                                          {React.createElement(Shield, {
                                            className: 'w-8 h-8',
                                          })}
                                        </div>
                                        {hasError && (
                                          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full animate-pulse"></div>
                                        )}
                                      </div>

                                      {/* Input */}
                                      <div className="relative group">
                                        <input
                                          type="number"
                                          min="0.1"
                                          max="8"
                                          step="0.1"
                                          value={displayValue}
                                          onChange={(e) => {
                                            handleStopLossChange(
                                              level.id,
                                              e.target.value
                                            );
                                          }}
                                          className={`w-16 h-8 border-2 rounded-xl px-2 pr-5 text-center font-bold text-sm focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                                            hasError
                                              ? errorType === 'duplicate'
                                                ? 'bg-purple-900/40 border-purple-400/80 text-purple-200 focus:border-purple-300/90 focus:ring-2 focus:ring-purple-400/40 shadow-lg shadow-purple-500/20'
                                                : errorType === 'high'
                                                ? 'bg-red-900/40 border-red-400/80 text-red-200 focus:border-red-300/90 focus:ring-2 focus:ring-red-400/40 shadow-lg shadow-red-500/20'
                                                : errorType === 'order'
                                                ? orderConflict?.type ===
                                                  'decrease'
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
                                        />
                                        <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2">
                                          <span className="text-xs font-bold text-slate-400">
                                            %
                                          </span>
                                        </div>
                                      </div>

                                      {/* Simple Label - No Subtitle */}
                                      <div className="space-y-1">
                                        <h4
                                          className={`text-xs font-bold ${colors.text} tracking-wider`}
                                        >
                                          {level.urgencyLevel}
                                        </h4>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* ChevronRight Icon Between Tiles */}
                                {index <
                                  localSettings.stopLossLevels.filter((level) =>
                                    [
                                      'tight',
                                      'normal',
                                      'loose',
                                      'wide',
                                    ].includes(level.id)
                                  ).length -
                                    1 && (
                                  <div className="relative flex items-center justify-center px-1">
                                    {/* Directional Node */}
                                    <div className="relative z-10 group">
                                      <div className="w-4 h-4 bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600/60 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-slate-500/80">
                                        <ChevronRight className="w-2 h-2 text-slate-400 group-hover:text-slate-300" />
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

                    {/* Mark Minervini's Wisdom */}
                    <div className="p-4 bg-gradient-to-r from-slate-800/40 to-slate-900/60 border border-slate-600/30 rounded-xl mt-6">
                      <div className="flex items-start space-x-3">
                        <Target className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-slate-400 italic border-l-2 border-emerald-500/30 pl-3">
                            "Your first loss is your best loss. The stop-loss is
                            the single most important tool for preserving
                            capital."
                            <span className="text-slate-500">
                              — Mark Minervini
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Broker Connections Tab Content */}
            {activeTab === 'brokers' && (
              <>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg">
                        <ExternalLink className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <span className="text-sm font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent tracking-wider">
                          Broker Connections
                        </span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Manage your trading account connections
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Broker Connection Interface */}
                  <div className="space-y-6">
                    {/* Connect New Broker Section */}
                    <div className="relative p-6 bg-gradient-to-r from-slate-800/60 via-slate-900/80 to-slate-800/60 backdrop-blur-xl rounded-xl border border-slate-600/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg">
                            <Wifi className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-200">Connect Trading Account</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Link your broker account to enable live trading and portfolio tracking
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsBrokerModalOpen(true)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          <ExternalLink className="w-4 h-4 mr-2 inline" />
                          Connect Broker
                        </button>
                      </div>
                    </div>

                    {/* Connected Brokers Section - This will show user's connected brokers */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-300">Connected Accounts</h3>
                      {user?.connectedBrokers?.length > 0 ? (
                        <div className="space-y-3">
                          {user.connectedBrokers.map((broker: any) => (
                            <div key={broker._id} className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center">
                                    {broker.broker === 'kite' ? '🛡️' : '📊'}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-emerald-300">
                                      {broker.broker === 'kite' ? 'Zerodha Kite' : broker.broker}
                                    </div>
                                    <div className="text-xs text-emerald-400/80">
                                      Account: {broker.brokerUserName}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-emerald-400">
                                  Connected {new Date(broker.connectedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <ExternalLink className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm">No broker accounts connected</p>
                          <p className="text-slate-500 text-xs mt-1">Connect your first trading account to get started</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Sessions Tab Content */}
            {activeTab === 'sessions' && (
              <>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-lg">
                        <Shield className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <span className="text-sm font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent tracking-wider">
                          Active Sessions
                        </span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Manage your device sessions and security
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Management Interface */}
                  <div className="space-y-6">
                    {/* Current Session Info */}
                    <div className="relative p-6 bg-gradient-to-r from-slate-800/60 via-slate-900/80 to-slate-800/60 backdrop-blur-xl rounded-xl border border-slate-600/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-lg">
                            <Shield className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-200">Session Management</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Monitor and manage active sessions across all your devices
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsSessionManagerOpen(true)}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          <Users className="w-4 h-4 mr-2 inline" />
                          Manage Sessions
                        </button>
                      </div>
                    </div>

                    {/* Security Information */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-300">Security & Access</h3>
                      
                      <div className="grid gap-4">
                        {/* Current Session */}
                        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                            <div>
                              <div className="text-sm font-medium text-emerald-300">Current Session</div>
                              <div className="text-xs text-emerald-400/80">This device - Active now</div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => setIsSessionManagerOpen(true)}
                            className="p-3 bg-slate-800/50 border border-slate-600/40 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-left"
                          >
                            <div className="text-sm font-medium text-slate-300">View All Sessions</div>
                            <div className="text-xs text-slate-500 mt-1">See active devices</div>
                          </button>
                          
                          <button
                            onClick={() => setIsSessionManagerOpen(true)}
                            className="p-3 bg-slate-800/50 border border-slate-600/40 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-left"
                          >
                            <div className="text-sm font-medium text-slate-300">Security Settings</div>
                            <div className="text-xs text-slate-500 mt-1">Logout remote devices</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Smart Action Center */}
        <div className="flex items-center justify-between pt-6 px-6 pb-6 border-t border-slate-700/40">
          <div className="flex items-center space-x-3">
            {/* Clear Status Indicator */}
            <div className="flex items-center space-x-3 px-3 py-2 bg-slate-800/40 border border-slate-600/40 rounded-lg">
              <div className="relative">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    hasValidationErrors
                      ? 'bg-red-400 animate-pulse'
                      : hasChanges
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-500'
                  }`}
                ></div>
                {(hasValidationErrors || hasChanges) && (
                  <div
                    className={`absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-40 ${
                      hasValidationErrors ? 'bg-red-400' : 'bg-amber-400'
                    }`}
                  ></div>
                )}
              </div>
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  hasValidationErrors
                    ? 'text-red-300'
                    : hasChanges
                    ? 'text-amber-300'
                    : 'text-slate-400'
                }`}
              >
                {hasValidationErrors
                  ? `${errorCounts.total} Error${
                      errorCounts.total !== 1 ? 's' : ''
                    } Found`
                  : hasChanges
                  ? 'Unsaved Changes'
                  : 'All Settings Saved'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Reset Button (only show when there are changes) */}
            {hasChanges && (
              <button
                onClick={() => {
                  setEditedLevels({});
                  setEditedAllocationLevels({});
                  setEditedStopLossLevels({});
                  setEditedCapital(undefined);
                  setValidationErrors({});
                  setOrderConflicts({});
                  setShakeAnimations({});
                }}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 bg-slate-800/40 hover:bg-slate-700/40 border border-slate-600/40 hover:border-slate-500/60 rounded-lg transition-all duration-200"
              >
                Reset
              </button>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!canSave}
              data-save-button
              className={`relative px-6 py-2.5 font-semibold text-sm rounded-lg transition-all duration-300 ${
                canSave
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105'
                  : hasValidationErrors
                  ? 'bg-red-600/50 text-red-200 cursor-not-allowed border border-red-500/50'
                  : 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>
                  {hasValidationErrors
                    ? 'Fix Errors to Save'
                    : hasChanges
                    ? 'Save Changes'
                    : 'Saved'}
                </span>
                {canSave && <Activity className="w-4 h-4" />}
                {hasValidationErrors && <AlertTriangle className="w-4 h-4" />}
              </span>
            </button>
          </div>
        </div>

        {/* Custom CSS for premium animations */}
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
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-8px) rotate(120deg); }
            66% { transform: translateY(-4px) rotate(240deg); }
          }
          @keyframes float-medium {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-12px) scale(1.1); }
          }
          @keyframes float-fast {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-6px) translateX(3px); }
            75% { transform: translateY(-3px) translateX(-3px); }
          }
          @keyframes spin-slow {
            from { transform: rotate(45deg); }
            to { transform: rotate(405deg); }
          }
          @keyframes bounce-subtle {
            0%, 100% { transform: rotate(12deg) translateY(0px); }
            50% { transform: rotate(12deg) translateY(-4px); }
          }
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes grid-float {
            0%, 100% { transform: translateX(0) translateY(0); }
            50% { transform: translateX(10px) translateY(-5px); }
          }
          @keyframes ambient-pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }
          @keyframes ambient-pulse-delayed {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
          }
          @keyframes ambient-drift {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            33% { transform: translateX(20px) rotate(120deg); }
            66% { transform: translateX(-10px) rotate(240deg); }
          }
          @keyframes data-float {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
            50% { transform: translateY(-15px) rotate(5deg); opacity: 0.8; }
          }
          @keyframes data-float-reverse {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
            50% { transform: translateY(15px) rotate(-5deg); opacity: 0.8; }
          }
          @keyframes neural-flow {
            0% { stroke-dasharray: 0 1000; }
            50% { stroke-dasharray: 500 1000; }
            100% { stroke-dasharray: 1000 1000; }
          }
          @keyframes neural-flow-delayed {
            0% { stroke-dasharray: 0 800; }
            50% { stroke-dasharray: 400 800; }
            100% { stroke-dasharray: 800 800; }
          }
          @keyframes quantum-drift {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
            25% { transform: translate(30px, -20px) scale(1.2); opacity: 1; }
            50% { transform: translate(-10px, -40px) scale(0.8); opacity: 0.6; }
            75% { transform: translate(-30px, -10px) scale(1.1); opacity: 0.9; }
          }
          @keyframes quantum-drift-reverse {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
            25% { transform: translate(-30px, 20px) scale(1.2); opacity: 1; }
            50% { transform: translate(10px, 40px) scale(0.8); opacity: 0.6; }
            75% { transform: translate(30px, 10px) scale(1.1); opacity: 0.9; }
          }
          @keyframes quantum-spiral {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); }
            100% { transform: translate(50px, -50px) rotate(360deg) scale(1.5); opacity: 0; }
          }
          @keyframes quantum-orbit {
            0% { transform: translate(0, 0) rotate(0deg); }
            100% { transform: translate(0, 0) rotate(360deg); }
          }
          @keyframes light-sweep {
            0%, 100% { transform: translateX(-100%); opacity: 0; }
            50% { transform: translateX(100%); opacity: 1; }
          }
          @keyframes orbital-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes orbital-medium {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(-360deg); }
          }
          @keyframes orbital-fast {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
          }
          @keyframes particle-trail {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(20px, -20px) scale(0); opacity: 0; }
          }
          @keyframes particle-trail-delayed {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(-15px, -25px) scale(0); opacity: 0; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes subtle-glow {
            0%, 100% { 
              box-shadow: 0 0 40px rgba(139, 92, 246, 0.1), 0 0 80px rgba(139, 92, 246, 0.05); 
            }
            50% { 
              box-shadow: 0 0 50px rgba(139, 92, 246, 0.15), 0 0 100px rgba(139, 92, 246, 0.08); 
            }
          }
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
          .animate-float-medium { animation: float-medium 4s ease-in-out infinite; }
          .animate-float-fast { animation: float-fast 2s ease-in-out infinite; }
          .animate-spin-slow { animation: spin-slow 8s linear infinite; }
          .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
          .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
          .animate-ambient-pulse { animation: ambient-pulse 4s ease-in-out infinite; }
          .animate-ambient-pulse-delayed { animation: ambient-pulse-delayed 5s ease-in-out infinite 1s; }
          .animate-ambient-drift { animation: ambient-drift 8s ease-in-out infinite; }
          .animate-data-float { animation: data-float 6s ease-in-out infinite; }
          .animate-data-float-reverse { animation: data-float-reverse 7s ease-in-out infinite 1s; }
          .animate-neural-flow { animation: neural-flow 3s ease-in-out infinite; }
          .animate-neural-flow-delayed { animation: neural-flow-delayed 4s ease-in-out infinite 1.5s; }
          .animate-quantum-drift { animation: quantum-drift 8s ease-in-out infinite; }
          .animate-quantum-drift-reverse { animation: quantum-drift-reverse 10s ease-in-out infinite 2s; }
          .animate-quantum-spiral { animation: quantum-spiral 4s linear infinite; }
          .animate-quantum-orbit { animation: quantum-orbit 6s linear infinite; }
          .animate-light-sweep { animation: light-sweep 3s ease-in-out infinite; }
          .animate-orbital-slow { animation: orbital-slow 15s linear infinite; }
          .animate-orbital-medium { animation: orbital-medium 10s linear infinite; }
          .animate-orbital-fast { animation: orbital-fast 8s linear infinite; }
          .animate-particle-trail { animation: particle-trail 1s ease-out infinite; }
          .animate-particle-trail-delayed { animation: particle-trail-delayed 1.2s ease-out infinite 0.3s; }
          .animate-gradient-shift { 
            background-size: 200% 200%; 
            animation: gradient-shift 3s ease infinite; 
          }
          .bg-gradient-radial {
            background: radial-gradient(circle, var(--tw-gradient-stops));
          }
          .animate-shimmer { animation: shimmer 2s linear infinite; }
          .animate-subtle-glow { animation: subtle-glow 4s ease-in-out infinite; }
        `}</style>
      </div>
    </div>
  );

  // Use portal to render modal at document.body level
  return (
    <>
      {createPortal(modalContent, document.body)}
      <SessionManager 
        isOpen={isSessionManagerOpen} 
        onClose={() => setIsSessionManagerOpen(false)} 
      />
      <BrokerConnectionModal 
        isOpen={isBrokerModalOpen} 
        onClose={() => setIsBrokerModalOpen(false)} 
      />
    </>
  );
};

export default SettingsModal;
