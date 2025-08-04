import React from 'react';

interface StopLossLevel {
  id: string;
  name: string;
  percentage: number;
  description?: string;
}

interface StopLossPresetButtonProps {
  level: StopLossLevel;
  onClick: () => void;
  disabled?: boolean;
  isSelected?: boolean;
  isLoading?: boolean;
}

const getRiskStyles = (levelId: string, isSelected: boolean = false) => {
  const baseStyles = {
    tight: {
      bg: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300',
      selected: 'ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/20'
    },
    normal: {
      bg: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300',
      selected: 'ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20'
    },
    loose: {
      bg: 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/40 text-orange-300',
      selected: 'ring-2 ring-orange-400/50 shadow-lg shadow-orange-500/20'
    },
    wide: {
      bg: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-300',
      selected: 'ring-2 ring-red-400/50 shadow-lg shadow-red-500/20'
    }
  };
  
  const style = baseStyles[levelId as keyof typeof baseStyles] || baseStyles.normal;
  return isSelected ? `${style.bg} ${style.selected}` : style.bg;
};

export const StopLossPresetButton: React.FC<StopLossPresetButtonProps> = React.memo(({
  level,
  onClick,
  disabled = false,
  isSelected = false,
  isLoading = false
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative px-3 py-1.5 text-xs border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${getRiskStyles(level.id, isSelected)} ${
        !disabled && !isLoading ? "hover:scale-105" : "opacity-50 cursor-not-allowed hover:scale-100"
      }`}
      aria-label={`Set stop loss to ${level.percentage}% (${level.name} risk)`}
      title={level.description || `${level.name}: ${level.percentage}%`}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Compact button content - just percentage */}
      {level.percentage}%
    </button>
  );
});

StopLossPresetButton.displayName = 'StopLossPresetButton';