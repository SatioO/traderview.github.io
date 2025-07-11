import React, { useState } from 'react';
import { X, Settings, AlertTriangle, TrendingUp, Shield, Zap, Target, Activity } from 'lucide-react';
import { useSettings, type RiskLevel } from '../../contexts/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, updateRiskLevel } = useSettings();
  const [editedLevels, setEditedLevels] = useState<Record<string, number>>({});
  const [editedCapital, setEditedCapital] = useState<number | undefined>(undefined);
  const [highRiskWarnings, setHighRiskWarnings] = useState<Record<string, boolean>>({});
  const [zeroValueWarnings, setZeroValueWarnings] = useState<Record<string, boolean>>({});
  const [shakeAnimations, setShakeAnimations] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handlePercentageChange = (levelId: string, value: string) => {
    const percentage = Number(value);
    
    // Allow empty string for clearing input
    if (value === '') {
      setEditedLevels(prev => ({ ...prev, [levelId]: 0 }));
      setZeroValueWarnings(prev => ({ ...prev, [levelId]: true }));
      setHighRiskWarnings(prev => ({ ...prev, [levelId]: false }));
      return;
    }
    
    // Set the actual value (including 0)
    setEditedLevels(prev => ({ ...prev, [levelId]: percentage }));
    
    // Check for zero value warning
    const isZeroValue = percentage <= 0;
    setZeroValueWarnings(prev => ({ ...prev, [levelId]: isZeroValue }));
    
    // Check for high risk warning
    const isHighRisk = percentage > 3;
    setHighRiskWarnings(prev => ({ ...prev, [levelId]: isHighRisk }));
    
    // Trigger shake animation for warnings
    if (isHighRisk || isZeroValue) {
      setShakeAnimations(prev => ({ ...prev, [levelId]: true }));
      setTimeout(() => {
        setShakeAnimations(prev => ({ ...prev, [levelId]: false }));
      }, 600);
    }
  };

  const handleCapitalChange = (capital: number) => {
    setEditedCapital(capital);
  };

  const handleSave = () => {
    // Update risk levels with new percentages
    settings.riskLevels.forEach(level => {
      if (editedLevels[level.id] !== undefined) {
        const updatedLevel: RiskLevel = {
          ...level,
          percentage: editedLevels[level.id]
        };
        updateRiskLevel(updatedLevel);
      }
    });

    // Update trading capital if changed
    if (editedCapital !== undefined) {
      updateSettings({ accountBalance: editedCapital });
    }

    onClose();
  };

  const getDisplayValue = (level: RiskLevel) => {
    if (editedLevels[level.id] !== undefined) {
      return editedLevels[level.id] === 0 ? '' : editedLevels[level.id].toString();
    }
    return level.percentage.toString();
  };

  const getDisplayCapital = () => {
    return editedCapital !== undefined ? editedCapital : settings.accountBalance;
  };

  const hasCapitalChanged = editedCapital !== undefined;
  const hasChanges = Object.keys(editedLevels).length > 0 || hasCapitalChanged;
  const hasZeroValues = Object.values(zeroValueWarnings).some(warning => warning);
  const canSave = hasChanges && !hasZeroValues;

  // Get the default risk levels (not custom ones)
  const defaultRiskLevels = settings.riskLevels.filter(level => 
    ['conservative', 'balanced', 'bold', 'maximum'].includes(level.id)
  );

  const getCapitalLevel = (amount: number) => {
    if (amount >= 10000000) return { 
      level: 'ELITE', 
      color: 'from-violet-500 via-purple-500 to-fuchsia-500', 
      bgGradient: 'from-violet-500/10 via-purple-500/5 to-fuchsia-500/10',
      borderColor: 'border-violet-400/30 hover:border-violet-400/50',
      textColor: 'text-violet-200', 
      badgeColor: 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-violet-400/40',
      progress: 100 
    };
    if (amount >= 1000000) return { 
      level: 'ADVANCED', 
      color: 'from-cyan-400 via-blue-500 to-indigo-500', 
      bgGradient: 'from-cyan-400/10 via-blue-500/5 to-indigo-500/10',
      borderColor: 'border-cyan-400/30 hover:border-cyan-400/50',
      textColor: 'text-cyan-200', 
      badgeColor: 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border-cyan-400/40',
      progress: 75 
    };
    if (amount >= 100000) return { 
      level: 'INTERMEDIATE', 
      color: 'from-emerald-400 via-green-500 to-teal-500', 
      bgGradient: 'from-emerald-400/10 via-green-500/5 to-teal-500/10',
      borderColor: 'border-emerald-400/30 hover:border-emerald-400/50',
      textColor: 'text-emerald-200', 
      badgeColor: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/40',
      progress: 50 
    };
    return { 
      level: 'BEGINNER', 
      color: 'from-amber-400 via-orange-500 to-red-500', 
      bgGradient: 'from-amber-400/10 via-orange-500/5 to-red-500/10',
      borderColor: 'border-amber-400/30 hover:border-amber-400/50',
      textColor: 'text-amber-200', 
      badgeColor: 'bg-gradient-to-r from-amber-500/20 to-red-500/20 border-amber-400/40',
      progress: 25 
    };
  };

  const capitalInfo = getCapitalLevel(getDisplayCapital());

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-teal-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>

      {/* Premium Settings Modal */}
      <div className="relative bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-800/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-700/50 hover:border-slate-600/60 transition-all duration-700 overflow-hidden">
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
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent tracking-wide">SETTINGS</h2>
                  <p className="text-sm text-slate-400 font-medium tracking-wider">CONFIG CENTER</p>
                </div>
              </div>
            </div>

            {/* Refined header actions */}
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-emerald-300 tracking-wider">ACTIVE</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="group relative p-2.5 bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-red-500/20 hover:to-red-600/20 border border-slate-600/50 hover:border-red-500/50 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Premium Content */}
        <div className="p-6 space-y-6">
          
          {/* Premium Trading Capital */}
          <div className="relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent tracking-wider">Trading Capital</span>
              <div className={`px-2 py-1 rounded-md text-xs font-bold border transition-all duration-300 ${
                hasCapitalChanged ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-300' : 'bg-slate-700/50 border-slate-600/50 text-slate-400'
              }`}>
                {hasCapitalChanged ? '● MODIFIED' : '○ UNCHANGED'}
              </div>
            </div>
            
            <div className={`group relative bg-gradient-to-br ${capitalInfo.bgGradient} rounded-2xl p-5 border transition-all duration-500 overflow-hidden ${
              hasCapitalChanged 
                ? `${capitalInfo.borderColor} shadow-lg shadow-emerald-500/10` 
                : `${capitalInfo.borderColor}`
            }`}>
              
              {/* Elegant floating elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-3 left-6 w-1 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-ping opacity-40"></div>
                <div className="absolute top-2 right-8 w-1 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-ping opacity-30 delay-1000"></div>
                <div className="absolute bottom-4 left-8 w-1 h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-ping opacity-35 delay-2000"></div>
              </div>

              {/* Sophisticated Capital Header */}
              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-slate-300" />
                    <span className="text-sm font-medium text-slate-300">Current Balance</span>
                  </div>
                  <span className="text-xs text-slate-500">₹{formatCurrency(settings.accountBalance)}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${capitalInfo.badgeColor}`}>
                  {capitalInfo.level}
                </div>
              </div>

              {/* Elegant Power Level Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400 tracking-wide">POWER LEVEL</span>
                  </div>
                  <span className={`text-xs font-bold ${capitalInfo.textColor}`}>{capitalInfo.progress}%</span>
                </div>
                <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className={`h-full bg-gradient-to-r ${capitalInfo.color} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: `${capitalInfo.progress}%` }}
                  />
                </div>
              </div>

              {/* Premium Capital Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-lg">₹</div>
                <input
                  type="number"
                  min="1000"
                  max="100000000"
                  step="1000"
                  value={getDisplayCapital()}
                  onChange={(e) => handleCapitalChange(Number(e.target.value))}
                  className={`w-full bg-gradient-to-r from-slate-800/60 to-slate-700/60 border rounded-xl pl-8 pr-16 py-3 text-white font-bold text-lg focus:outline-none transition-all duration-300 ${
                    hasCapitalChanged 
                      ? 'border-emerald-500/50 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/20' 
                      : 'border-slate-600/50 focus:border-slate-500/70 focus:ring-2 focus:ring-slate-500/20'
                  }`}
                  placeholder="Enter amount"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${capitalInfo.textColor}`}>
                    {formatCurrency(getDisplayCapital())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Risk Matrix */}
          <div className="relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg">
                <Target className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent tracking-wider">Risk Levels</span>
            </div>
            
            {/* Single Row Card Layout with Input Boxes */}
            <div className="grid grid-cols-4 gap-3">
              {defaultRiskLevels.map((level) => {
                const displayValue = getDisplayValue(level);
                const isHighRisk = highRiskWarnings[level.id];
                const isZeroValue = zeroValueWarnings[level.id];
                const isShaking = shakeAnimations[level.id];
                const hasWarning = isHighRisk || isZeroValue;
                
                const levelColors = {
                  'conservative': { 
                    bg: 'from-emerald-500/10 via-green-500/5 to-teal-500/10',
                    border: 'border-emerald-400/30 hover:border-emerald-400/50', 
                    text: 'text-emerald-300',
                    accent: 'text-emerald-400',
                    inputBg: 'bg-emerald-500/10',
                    inputBorder: 'border-emerald-400/40',
                    icon: '🌱'
                  },
                  'balanced': { 
                    bg: 'from-amber-500/10 via-yellow-500/5 to-orange-500/10',
                    border: 'border-amber-400/30 hover:border-amber-400/50', 
                    text: 'text-amber-300',
                    accent: 'text-amber-400',
                    inputBg: 'bg-amber-500/10',
                    inputBorder: 'border-amber-400/40',
                    icon: '🔥'
                  },
                  'bold': { 
                    bg: 'from-orange-500/10 via-red-500/5 to-pink-500/10',
                    border: 'border-orange-400/30 hover:border-orange-400/50', 
                    text: 'text-orange-300',
                    accent: 'text-orange-400',
                    inputBg: 'bg-orange-500/10',
                    inputBorder: 'border-orange-400/40',
                    icon: '⚡'
                  },
                  'maximum': { 
                    bg: 'from-red-500/10 via-pink-500/5 to-rose-500/10',
                    border: 'border-red-400/30 hover:border-red-400/50', 
                    text: 'text-red-300',
                    accent: 'text-red-400',
                    inputBg: 'bg-red-500/10',
                    inputBorder: 'border-red-400/40',
                    icon: '💀'
                  }
                };
                
                const colors = levelColors[level.id as keyof typeof levelColors] || levelColors['conservative'];
                
                return (
                  <div key={level.id} className="relative">
                    {/* Warning Alert */}
                    {hasWarning && (
                      <div className="absolute -top-1 -right-1 z-10">
                        <div className={`p-1 border rounded-full animate-bounce ${
                          isZeroValue 
                            ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-yellow-400/60'
                            : 'bg-gradient-to-r from-red-500/30 to-pink-500/30 border-red-400/60'
                        }`}>
                          <AlertTriangle className={`w-2 h-2 ${
                            isZeroValue ? 'text-yellow-300' : 'text-red-300'
                          }`} />
                        </div>
                      </div>
                    )}
                    
                    {/* Card with Input Box Instead of Percentage */}
                    <div
                      className={`group relative bg-gradient-to-br ${colors.bg} rounded-xl p-3 border transition-all duration-300 hover:scale-105 overflow-hidden ${
                        colors.border
                      } ${isHighRisk ? 'ring-1 ring-red-500/50 border-red-500/40' : ''} ${
                        isZeroValue ? 'ring-1 ring-yellow-500/50 border-yellow-500/40' : ''
                      }`}
                      style={{
                        animation: isShaking ? 'shake 0.6s ease-in-out' : undefined
                      }}
                    >
                      {/* Card Content - Icon, Input, Label */}
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="text-2xl">{colors.icon}</div>
                        
                        {/* Stylish Input Box */}
                        <div className="relative">
                          <input
                            type="number"
                            min="0.01"
                            max="10"
                            step="0.01"
                            value={displayValue}
                            onChange={(e) => handlePercentageChange(level.id, e.target.value)}
                            className={`w-16 h-8 border rounded-lg px-2 pr-4 text-center font-bold text-sm focus:outline-none transition-all duration-300 ${
                              isHighRisk 
                                ? 'bg-gradient-to-r from-red-900/50 to-red-800/50 border-red-400/60 text-red-200 focus:border-red-300/80 focus:ring-2 focus:ring-red-400/30' 
                                : isZeroValue
                                ? 'bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-400/60 text-yellow-200 focus:border-yellow-300/80 focus:ring-2 focus:ring-yellow-400/30'
                                : `${colors.inputBg} ${colors.inputBorder} ${colors.accent} focus:border-current/80 focus:ring-2 focus:ring-current/20 hover:${colors.inputBorder}/60`
                            }`}
                            placeholder="0.01"
                          />
                          <div className={`absolute right-1 top-1/2 transform -translate-y-1/2 text-xs font-bold ${colors.accent} opacity-80 pointer-events-none`}>%</div>
                        </div>
                        
                        <div className={`text-xs font-medium ${colors.text} leading-tight px-1`}>
                          {level.name}
                        </div>
                      </div>
                    </div>
                    
                    {/* Warning Messages Below */}
                    {isZeroValue && (
                      <div className="mt-2 p-2 bg-gradient-to-r from-yellow-500/15 to-orange-600/15 border border-yellow-400/30 rounded-lg">
                        <div className="flex items-center space-x-1">
                          <Shield className="w-2.5 h-2.5 text-yellow-300 flex-shrink-0" />
                          <p className="text-xs font-bold text-yellow-300">Value required!</p>
                        </div>
                      </div>
                    )}
                    {isHighRisk && !isZeroValue && (
                      <div className="mt-2 p-2 bg-gradient-to-r from-red-500/15 to-red-600/15 border border-red-400/30 rounded-lg">
                        <div className="flex items-center space-x-1">
                          <Shield className="w-2.5 h-2.5 text-red-300 flex-shrink-0" />
                          <p className="text-xs font-bold text-red-300">High risk!</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Premium Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  hasChanges ? 'bg-emerald-400' : 'bg-slate-500'
                }`}></div>
                <span className={`text-xs font-medium tracking-wider ${
                  hasChanges ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {hasChanges ? 'CHANGES DETECTED' : 'NO CHANGES'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-slate-600/50 hover:to-slate-500/50 border border-slate-600/50 hover:border-slate-500/50 text-slate-300 hover:text-white font-medium text-sm rounded-xl transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`group relative px-6 py-2.5 font-bold text-sm rounded-xl transition-all duration-300 overflow-hidden ${
                  canSave
                    ? 'bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:via-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105'
                    : hasZeroValues
                    ? 'bg-gradient-to-r from-yellow-700 to-orange-600 text-yellow-200 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>{hasZeroValues ? 'Fix Zero Values' : 'Save Changes'}</span>
                  {canSave && <Activity className="w-4 h-4" />}
                  {hasZeroValues && <AlertTriangle className="w-4 h-4" />}
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
      `}</style>
    </div>
  );
};

export default SettingsModal;