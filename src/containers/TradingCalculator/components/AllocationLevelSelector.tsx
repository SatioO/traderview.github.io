import React from 'react';
import { Info, Shield } from 'lucide-react';
import type { FormData } from '../types';

interface AllocationLevel {
  id: string;
  name: string;
  percentage: number;
  description?: string;
}

interface AllocationThresholds {
  conservative: number;
  balanced: number;
  high: number;
  extreme: number;
}

interface AllocationLevelSelectorProps {
  formData: FormData;
  handleInputChange: (field: keyof FormData, value: string) => void;
  getAllocationLevels: () => AllocationLevel[];
  updateAllocationLevel: (id: string) => Promise<void>;
}

const AllocationLevelSelector: React.FC<AllocationLevelSelectorProps> = ({
  formData,
  handleInputChange,
  getAllocationLevels,
  updateAllocationLevel,
}) => {
  // Helper function to get allocation level icons
  const getAllocationIcon = (): React.ComponentType<{ className?: string }> => {
    return Shield;
  };

  // Get allocation level thresholds for risk assessment
  const getAllocationThresholds = (): AllocationThresholds => {
    const levels = getAllocationLevels();
    return {
      conservative: levels.find((l) => l.id === 'conservative')?.percentage || 10,
      balanced: levels.find((l) => l.id === 'balanced')?.percentage || 20,
      high: levels.find((l) => l.id === 'high')?.percentage || 30,
      extreme: levels.find((l) => l.id === 'extreme')?.percentage || 40,
    };
  };

  // Get allocation level display based on allocation percentage
  const getAllocationLevel = (allocationPercentage: number) => {
    const thresholds = getAllocationThresholds();
    if (allocationPercentage > thresholds.high) return { label: 'HIGH', color: 'text-red-400' };
    if (allocationPercentage > thresholds.balanced) return { label: 'MED', color: 'text-yellow-400' };
    return { label: 'LOW', color: 'text-green-400' };
  };

  const currentAllocationPercentage = Number(formData.allocationPercentage) || 0;
  const allocationLevel = getAllocationLevel(currentAllocationPercentage);

  return (
    <div className="relative overflow-hidden">
      {/* Allocation Header with Portfolio Visualization */}
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-purple-300 flex items-center">
          <span className="mr-2">🎯</span>
          Portfolio Allocation Level
          <Info
            className="inline w-4 h-4 ml-2 text-purple-400 cursor-help"
            xlinkTitle="Strategic allocation of your portfolio to this trade"
          />
        </label>

        {/* Real-time Allocation Meter */}
        <div className="flex items-center space-x-2">
          <div className="text-xs text-blue-300">ALLOCATION</div>
          <div className="relative w-16 h-2 bg-black/40 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(currentAllocationPercentage, 100)}%`,
              }}
            ></div>
          </div>
          <div className={`text-xs font-bold ${allocationLevel.color}`}>
            {allocationLevel.label}
          </div>
        </div>
      </div>

      {/* Quick Allocation Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-2">
        {getAllocationLevels().map((allocationLevel, index) => {
          const allocationColors = [
            'emerald',
            'blue',
            'orange',
            'red',
          ];
          const isSelected =
            Number(formData.allocationPercentage) === allocationLevel.percentage;

          return (
            <button
              key={allocationLevel.id}
              onClick={async () => {
                handleInputChange(
                  'allocationPercentage',
                  allocationLevel.percentage.toString()
                );
                try {
                  await updateAllocationLevel(allocationLevel.id);
                } catch (error) {
                  console.error('Failed to update allocation level:', error);
                }
              }}
              className={`group relative py-3 px-2 text-xs font-bold rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                isSelected
                  ? `border-${allocationColors[index]}-400 bg-${allocationColors[index]}-500/10 shadow-lg shadow-${allocationColors[index]}-500/30 text-${allocationColors[index]}-300 transform scale-105`
                  : `border-purple-500/30 bg-black/30 text-purple-300 hover:border-${allocationColors[index]}-400/50 hover:bg-${allocationColors[index]}-500/5 hover:text-${allocationColors[index]}-300`
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`text-${allocationColors[index]}-400 transition-colors duration-300`}
                >
                  {React.createElement(getAllocationIcon(), {
                    className: 'w-4 h-4',
                  })}
                </div>
                <div className="text-sm font-bold">
                  {allocationLevel.percentage}%
                </div>
                <div className="text-xs opacity-75">
                  {allocationLevel.name.replace(' allocation', '')}
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Enhanced Input Field */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl blur-sm"></div>
        <input
          type="number"
          value={
            formData.allocationPercentage === ''
              ? ''
              : formData.allocationPercentage
          }
          onChange={(e) =>
            handleInputChange('allocationPercentage', e.target.value)
          }
          className="relative w-full px-4 py-3 bg-black/40 border-2 border-blue-500/50 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-white placeholder-blue-300/50 font-mono text-lg transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/20"
          min="1"
          max="100"
          step="1"
          placeholder="Enter allocation %..."
        />
      </div>
    </div>
  );
};

export default AllocationLevelSelector;