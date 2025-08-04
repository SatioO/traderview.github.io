import { useCallback, useState } from 'react';

interface UseStopLossPresetsProps {
  entryPrice: number;
  onStopLossChange: (field: 'stopLoss', value: string) => void;
  onPercentageChange: (percentage: number) => void;
}

export const useStopLossPresets = ({
  entryPrice: _entryPrice, // Marked as unused but kept for future use
  onStopLossChange,
  onPercentageChange
}: UseStopLossPresetsProps) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const handlePresetSelect = useCallback((
    percentage: number, 
    calculatedPrice: number,
    presetId: string
  ) => {
    // Update percentage state
    onPercentageChange(percentage);
    
    // Update stop loss price
    onStopLossChange('stopLoss', calculatedPrice.toFixed(2));
    
    // Track selected preset
    setSelectedPresetId(presetId);
  }, [onStopLossChange, onPercentageChange]);

  // Clear selection when values change manually
  const clearSelection = useCallback(() => {
    setSelectedPresetId(null);
  }, []);

  return {
    selectedPresetId,
    handlePresetSelect,
    clearSelection
  };
};