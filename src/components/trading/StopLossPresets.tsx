import React, { useMemo, useCallback } from 'react';
import { StopLossPresetButton } from './StopLossPresetButton';
import { calculatePreciseStopLoss } from '../../utils/stopLossCalculations';

interface StopLossLevel {
  id: string;
  name: string;
  percentage: number;
  description?: string;
}

interface StopLossPresetsProps {
  stopLossLevels: StopLossLevel[];
  entryPrice: number;
  selectedPresetId?: string | null;
  onPresetSelect: (percentage: number, calculatedPrice: number, presetId: string) => void;
  isLoading?: boolean;
}

const VISIBLE_PRESET_IDS = ['tight', 'normal', 'loose', 'wide'] as const;


export const StopLossPresets: React.FC<StopLossPresetsProps> = React.memo(({
  stopLossLevels,
  entryPrice,
  selectedPresetId,
  onPresetSelect,
  isLoading = false
}) => {
  const visibleLevels = useMemo(() => 
    stopLossLevels.filter(level => 
      VISIBLE_PRESET_IDS.includes(level.id as any)
    ).sort((a, b) => a.percentage - b.percentage), // Sort by percentage ascending
    [stopLossLevels]
  );

  const handlePresetClick = useCallback((level: StopLossLevel) => {
    if (entryPrice <= 0 || isLoading) return;
    
    // Use professional calculation with market microstructure awareness
    const calculation = calculatePreciseStopLoss(entryPrice, level.percentage);
    onPresetSelect(level.percentage, calculation.stopPrice, level.id);
  }, [entryPrice, onPresetSelect, isLoading]);


  if (visibleLevels.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center flex-wrap gap-2">
      {visibleLevels.map(level => (
        <StopLossPresetButton
          key={level.id}
          level={level}
          onClick={() => handlePresetClick(level)}
          disabled={entryPrice <= 0}
          isLoading={isLoading}
          isSelected={selectedPresetId === level.id}
        />
      ))}
    </div>
  );
});

StopLossPresets.displayName = 'StopLossPresets';