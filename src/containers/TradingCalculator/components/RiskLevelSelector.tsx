import React from 'react';
import { Zap, Info, Shield } from 'lucide-react';
import type { FormData } from '../types';

interface RiskLevel {
  id: string;
  name: string;
  percentage: number;
  description: string;
}

interface RiskLevelSelectorProps {
  formData: FormData;
  handleInputChange: (field: keyof FormData, value: string) => void;
  getRiskLevels: () => RiskLevel[];
  updateRiskLevel: (id: string) => void;
}

const RiskLevelSelector: React.FC<RiskLevelSelectorProps> = ({
  formData,
  handleInputChange,
  getRiskLevels,
  updateRiskLevel,
}) => {
  // Helper function to get risk level icons
  const getRiskLevelIcon = (): React.ComponentType<{ className?: string }> => {
    return Shield;
  };

  // Get threat level display based on risk percentage
  const getThreatLevel = (riskPercentage: number) => {
    if (riskPercentage >= 3) return { label: 'EXTREME', color: 'text-red-400 animate-pulse' };
    if (riskPercentage > 2) return { label: 'HIGH', color: 'text-orange-400' };
    if (riskPercentage > 1) return { label: 'MED', color: 'text-yellow-400' };
    return { label: 'LOW', color: 'text-green-400' };
  };

  const currentRiskPercentage = Number(formData.riskPercentage) || 0;
  const threatLevel = getThreatLevel(currentRiskPercentage);

  return (
    <div className="relative overflow-hidden">
      {/* Risk Level Header with Dynamic Meter */}
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-purple-300 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          Risk Level
          <Info
            className="inline w-4 h-4 ml-2 text-purple-400 cursor-help"
            xlinkTitle="Strategic allocation of your portfolio to this trade"
          />
        </label>

        {/* Real-time Risk Meter */}
        <div className="flex items-center space-x-4">
          <div className="text-xs text-purple-300">
            THREAT LEVEL
          </div>
          <div className="relative w-16 h-2 bg-black/40 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((currentRiskPercentage * 100) / 3, 100)}%`,
              }}
            ></div>
          </div>
          <div className={`text-xs font-bold ${threatLevel.color}`}>
            {threatLevel.label}
          </div>
        </div>
      </div>

      {/* Risk Level Buttons - Matching Allocation Style */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-2">
        {getRiskLevels().map((riskLevel, index) => {
          const riskColors = [
            'emerald',
            'yellow',
            'orange',
            'red',
          ];
          const isSelected =
            Number(formData.riskPercentage) === riskLevel.percentage;

          return (
            <button
              key={riskLevel.id}
              onClick={() => {
                handleInputChange(
                  'riskPercentage',
                  riskLevel.percentage.toString()
                );
                updateRiskLevel(riskLevel.id);
              }}
              className={`group relative py-3 px-2 text-xs font-bold rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                isSelected
                  ? `border-${riskColors[index]}-400 bg-${riskColors[index]}-500/10 shadow-lg shadow-${riskColors[index]}-500/30 text-${riskColors[index]}-300 transform scale-105`
                  : `border-purple-500/30 bg-black/30 text-purple-300 hover:border-${riskColors[index]}-400/50 hover:bg-${riskColors[index]}-500/5 hover:text-${riskColors[index]}-300`
              }`}
              title={riskLevel.description}
            >
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`text-${riskColors[index]}-400 transition-colors duration-300`}
                >
                  {React.createElement(getRiskLevelIcon(), {
                    className: 'w-4 h-4',
                  })}
                </div>
                <div className="text-sm font-bold">
                  {riskLevel.percentage}%
                </div>
                <div className="text-xs opacity-75">
                  {riskLevel.name
                    .replace(' play', '')
                    .replace(' approach', '')
                    .replace(' strategy', '')
                    .replace(' risk', '')}
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Enhanced Input Field - Always Visible */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur-sm"></div>
        <input
          type="number"
          value={
            formData.riskPercentage === ''
              ? ''
              : formData.riskPercentage
          }
          onChange={(e) => {
            handleInputChange('riskPercentage', e.target.value);
          }}
          className="relative w-full px-4 py-3 bg-black/40 border-2 border-purple-500/50 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-purple-300/50 font-mono text-lg transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/20"
          min="0.25"
          max="10"
          step="0.25"
          placeholder="Enter risk %..."
        />
      </div>
    </div>
  );
};

export default RiskLevelSelector;