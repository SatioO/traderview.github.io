import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  MarketHealth,
  TabType,
} from '../containers/TradingCalculator/types';
import { brokerApiService } from '../services/brokerApiService';

// Risk Level Configuration
export interface RiskLevel {
  id: string;
  name: string;
  percentage: number;
  description: string;
  icon: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAXIMUM';
  color: string;
}

// Portfolio Allocation Level Configuration
export interface AllocationLevel {
  id: string;
  name: string;
  percentage: number;
  description: string;
  icon: string;
  riskCategory: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'EXTREME';
  color: string;
}

// Stop Loss Level Configuration
export interface StopLossLevel {
  id: string;
  name: string;
  percentage: number;
  description: string;
  icon: string;
  urgencyLevel: 'TIGHT' | 'NORMAL' | 'LOOSE' | 'WIDE';
  color: string;
}

// Enhanced Settings Interface
export interface UserSettings {
  // Version for migration
  version?: number;

  // Account Settings
  accountBalance: number;

  // Risk Management
  riskLevels: RiskLevel[];
  defaultRiskLevel: string;
  marketHealth: MarketHealth;

  // Portfolio Allocation
  allocationLevels: AllocationLevel[];
  defaultAllocationLevel: string;

  // Stop Loss Management
  stopLossLevels: StopLossLevel[];
  defaultStopLossLevel: string;

  // UI Preferences
  activeTab: TabType;
  darkMode: boolean;

  // Trading Preferences
  defaultBrokerageCost: number;
  autoCalculateTargets: boolean;
  showAdvancedMetrics: boolean;
  defaultStopLossPercentage: number;

  // Display Settings
  currencySymbol: string;
  decimalPlaces: number;
  showPercentages: boolean;
}

// Default Risk Levels (using Shield icon for all levels like allocation levels)
const DEFAULT_RISK_LEVELS: RiskLevel[] = [
  {
    id: 'conservative',
    name: 'Conservative play',
    percentage: 0.25,
    description: 'Low risk, steady growth approach',
    icon: 'Shield',
    threatLevel: 'LOW',
    color: '#10B981',
  },
  {
    id: 'balanced',
    name: 'Balanced approach',
    percentage: 0.5,
    description: 'Moderate risk with balanced returns',
    icon: 'Shield',
    threatLevel: 'MEDIUM',
    color: '#F59E0B',
  },
  {
    id: 'bold',
    name: 'Bold strategy',
    percentage: 0.75,
    description: 'Higher risk for greater potential returns',
    icon: 'Shield',
    threatLevel: 'HIGH',
    color: '#EF4444',
  },
  {
    id: 'maximum',
    name: 'Maximum risk',
    percentage: 1.0,
    description: 'Highest risk, highest potential reward',
    icon: 'Shield',
    threatLevel: 'MAXIMUM',
    color: '#8B5CF6',
  },
];

// Default Portfolio Allocation Levels (using Shield icon for all levels like risk levels)
const DEFAULT_ALLOCATION_LEVELS: AllocationLevel[] = [
  {
    id: 'conservative',
    name: 'Conservative allocation',
    percentage: 10,
    description: 'Low portfolio exposure',
    icon: 'Shield',
    riskCategory: 'CONSERVATIVE',
    color: '#10B981',
  },
  {
    id: 'balanced',
    name: 'Balanced allocation',
    percentage: 20,
    description: 'Moderate portfolio exposure',
    icon: 'Shield',
    riskCategory: 'MODERATE',
    color: '#F59E0B',
  },
  {
    id: 'high',
    name: 'High allocation',
    percentage: 30,
    description: 'Aggressive portfolio exposure',
    icon: 'Shield',
    riskCategory: 'AGGRESSIVE',
    color: '#EF4444',
  },
  {
    id: 'extreme',
    name: 'Extreme allocation',
    percentage: 40,
    description: 'Maximum concentration risk',
    icon: 'Shield',
    riskCategory: 'EXTREME',
    color: '#991B1B',
  },
];

// Default Stop Loss Levels (using Shield icon for all levels like risk and allocation levels)
const DEFAULT_STOP_LOSS_LEVELS: StopLossLevel[] = [
  {
    id: 'tight',
    name: 'Tight stop loss',
    percentage: 1,
    description: 'Very close protection, minimal loss tolerance',
    icon: 'Shield',
    urgencyLevel: 'TIGHT',
    color: '#10B981',
  },
  {
    id: 'normal',
    name: 'Normal stop loss',
    percentage: 2,
    description: 'Standard protection with moderate tolerance',
    icon: 'Shield',
    urgencyLevel: 'NORMAL',
    color: '#F59E0B',
  },
  {
    id: 'loose',
    name: 'Loose stop loss',
    percentage: 3,
    description: 'Relaxed protection for volatile conditions',
    icon: 'Shield',
    urgencyLevel: 'LOOSE',
    color: '#EF4444',
  },
  {
    id: 'wide',
    name: 'Wide stop loss',
    percentage: 5,
    description: 'Maximum tolerance for high volatility',
    icon: 'Shield',
    urgencyLevel: 'WIDE',
    color: '#8B5CF6',
  },
];

// Settings version for migration
const SETTINGS_VERSION = 2; // Increment when structure changes

// Default Settings
const DEFAULT_SETTINGS: UserSettings = {
  version: SETTINGS_VERSION,
  accountBalance: 100000,
  riskLevels: DEFAULT_RISK_LEVELS,
  defaultRiskLevel: 'conservative',
  marketHealth: 'confirmed-uptrend',
  allocationLevels: DEFAULT_ALLOCATION_LEVELS,
  defaultAllocationLevel: 'conservative',
  stopLossLevels: DEFAULT_STOP_LOSS_LEVELS,
  defaultStopLossLevel: 'normal',
  activeTab: 'risk',
  darkMode: true,
  defaultBrokerageCost: 20,
  autoCalculateTargets: true,
  showAdvancedMetrics: false,
  defaultStopLossPercentage: 3,
  currencySymbol: '₹',
  decimalPlaces: 2,
  showPercentages: true,
};

// Context Interface
interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<UserSettings>) => void;
  updateRiskLevel: (riskLevel: RiskLevel) => void;
  addRiskLevel: (riskLevel: Omit<RiskLevel, 'id'>) => void;
  removeRiskLevel: (id: string) => void;
  updateAllocationLevel: (allocationLevel: AllocationLevel) => void;
  addAllocationLevel: (allocationLevel: Omit<AllocationLevel, 'id'>) => void;
  removeAllocationLevel: (id: string) => void;
  updateStopLossLevel: (stopLossLevel: StopLossLevel) => void;
  addStopLossLevel: (stopLossLevel: Omit<StopLossLevel, 'id'>) => void;
  removeStopLossLevel: (id: string) => void;
  resetSettings: () => void;
  getCurrentRiskLevel: () => RiskLevel | undefined;
  getCurrentAllocationLevel: () => AllocationLevel | undefined;
  getCurrentStopLossLevel: () => StopLossLevel | undefined;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

// Create Context
const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

// Provider Component
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  // Use React Query for session checking with matching key
  const { isLoading: isLoadingActiveSession } = useQuery({
    queryKey: ['broker', 'active-session'],
    queryFn: () => brokerApiService.getActiveSession(),
    staleTime: 0, // Always refetch on mount for fresh session data
  });
  
  // Combined loading state
  const isLoading = !isLoaded || isLoadingActiveSession;

  // Load settings from localStorage on mount with enhanced UX delay
  useEffect(() => {
    const loadSettings = async () => {
      // Add a minimum delay for better UX
      const startTime = Date.now();
      
      try {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          
          // Check if migration is needed
          const needsMigration = !parsed.version || parsed.version < SETTINGS_VERSION;
          
          const migratedSettings = { ...DEFAULT_SETTINGS, ...parsed };
          
          if (needsMigration) {
            console.log('Migrating settings from version', parsed.version || 'unknown', 'to', SETTINGS_VERSION);
            
            // Force update allocation levels to include all 4 defaults
            migratedSettings.allocationLevels = DEFAULT_ALLOCATION_LEVELS;
            // Force update stop loss levels to include all 4 defaults
            migratedSettings.stopLossLevels = DEFAULT_STOP_LOSS_LEVELS;
            migratedSettings.version = SETTINGS_VERSION;
            
            // Force save the migrated settings
            localStorage.setItem('userSettings', JSON.stringify(migratedSettings));
          } else {
            // Even if not migrating, ensure all 4 allocation levels exist
            const requiredAllocationIds = ['conservative', 'balanced', 'high', 'extreme'];
            const existingAllocationIds = (migratedSettings.allocationLevels || []).map((l: AllocationLevel) => l.id);
            const missingAllocationLevels = requiredAllocationIds.filter(id => !existingAllocationIds.includes(id));
            
            // Ensure all 4 stop loss levels exist
            const requiredStopLossIds = ['tight', 'normal', 'loose', 'wide'];
            const existingStopLossIds = (migratedSettings.stopLossLevels || []).map((l: StopLossLevel) => l.id);
            const missingStopLossLevels = requiredStopLossIds.filter(id => !existingStopLossIds.includes(id));
            
            let needsUpdate = false;
            
            if (!migratedSettings.allocationLevels || migratedSettings.allocationLevels.length < 4 || missingAllocationLevels.length > 0) {
              console.log('Fixing missing allocation levels:', missingAllocationLevels);
              migratedSettings.allocationLevels = DEFAULT_ALLOCATION_LEVELS;
              needsUpdate = true;
            }
            
            if (!migratedSettings.stopLossLevels || migratedSettings.stopLossLevels.length < 4 || missingStopLossLevels.length > 0) {
              console.log('Fixing missing stop loss levels:', missingStopLossLevels);
              migratedSettings.stopLossLevels = DEFAULT_STOP_LOSS_LEVELS;
              needsUpdate = true;
            }
            
            if (needsUpdate) {
              localStorage.setItem('userSettings', JSON.stringify(migratedSettings));
            }
          }
          
          // Merge with defaults to ensure all properties exist
          setSettings(migratedSettings);
        } else {
          // Load legacy preferences if they exist
          const legacyAccountInfo = localStorage.getItem('accountInfo');
          const legacyDarkMode = localStorage.getItem('darkMode');

          let legacySettings = { ...DEFAULT_SETTINGS };

          if (legacyAccountInfo) {
            const legacy = JSON.parse(legacyAccountInfo);
            legacySettings = {
              ...legacySettings,
              accountBalance:
                legacy.accountBalance || legacySettings.accountBalance,
              marketHealth: legacy.marketHealth || legacySettings.marketHealth,
              activeTab: legacy.activeTab || legacySettings.activeTab,
            };
          }

          if (legacyDarkMode) {
            legacySettings.darkMode = JSON.parse(legacyDarkMode);
          }

          setSettings(legacySettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(DEFAULT_SETTINGS);
      }
      
      // Ensure minimum delay for smooth UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime); // 1 second minimum
      
      setTimeout(() => {
        setIsLoaded(true);
      }, remainingTime);
    };

    loadSettings();
  }, []);


  // Save settings to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (!isLoaded) return; // Don't save during initial load

    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));

      // Also save to legacy keys for backward compatibility
      localStorage.setItem(
        'accountInfo',
        JSON.stringify({
          accountBalance: settings.accountBalance,
          marketHealth: settings.marketHealth,
          activeTab: settings.activeTab,
        })
      );
      localStorage.setItem('darkMode', JSON.stringify(settings.darkMode));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings, isLoaded]);

  // Update settings function
  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Update specific risk level
  const updateRiskLevel = (updatedRiskLevel: RiskLevel) => {
    setSettings((prev) => ({
      ...prev,
      riskLevels: prev.riskLevels.map((level) =>
        level.id === updatedRiskLevel.id ? updatedRiskLevel : level
      ),
    }));
  };

  // Add new risk level
  const addRiskLevel = (newRiskLevel: Omit<RiskLevel, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const riskLevel: RiskLevel = { ...newRiskLevel, id };

    setSettings((prev) => ({
      ...prev,
      riskLevels: [...prev.riskLevels, riskLevel],
    }));
  };

  // Remove risk level
  const removeRiskLevel = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      riskLevels: prev.riskLevels.filter((level) => level.id !== id),
      // Reset default if we're removing it
      defaultRiskLevel:
        prev.defaultRiskLevel === id
          ? prev.riskLevels[0]?.id || 'conservative'
          : prev.defaultRiskLevel,
    }));
  };

  // Update specific allocation level
  const updateAllocationLevel = (updatedAllocationLevel: AllocationLevel) => {
    setSettings((prev) => ({
      ...prev,
      allocationLevels: prev.allocationLevels.map((level) =>
        level.id === updatedAllocationLevel.id ? updatedAllocationLevel : level
      ),
    }));
  };

  // Add new allocation level
  const addAllocationLevel = (newAllocationLevel: Omit<AllocationLevel, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const allocationLevel: AllocationLevel = { ...newAllocationLevel, id };

    setSettings((prev) => ({
      ...prev,
      allocationLevels: [...prev.allocationLevels, allocationLevel],
    }));
  };

  // Remove allocation level
  const removeAllocationLevel = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      allocationLevels: prev.allocationLevels.filter((level) => level.id !== id),
      // Reset default if we're removing it
      defaultAllocationLevel:
        prev.defaultAllocationLevel === id
          ? prev.allocationLevels[0]?.id || 'conservative'
          : prev.defaultAllocationLevel,
    }));
  };

  // Update specific stop loss level
  const updateStopLossLevel = (updatedStopLossLevel: StopLossLevel) => {
    setSettings((prev) => ({
      ...prev,
      stopLossLevels: prev.stopLossLevels.map((level) =>
        level.id === updatedStopLossLevel.id ? updatedStopLossLevel : level
      ),
    }));
  };

  // Add new stop loss level
  const addStopLossLevel = (newStopLossLevel: Omit<StopLossLevel, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const stopLossLevel: StopLossLevel = { ...newStopLossLevel, id };

    setSettings((prev) => ({
      ...prev,
      stopLossLevels: [...prev.stopLossLevels, stopLossLevel],
    }));
  };

  // Remove stop loss level
  const removeStopLossLevel = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      stopLossLevels: prev.stopLossLevels.filter((level) => level.id !== id),
      // Reset default if we're removing it
      defaultStopLossLevel:
        prev.defaultStopLossLevel === id
          ? prev.stopLossLevels[0]?.id || 'normal'
          : prev.defaultStopLossLevel,
    }));
  };

  // Reset to default settings
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('userSettings');
    localStorage.removeItem('accountInfo');
    localStorage.removeItem('darkMode');
  };

  // Get current risk level object
  const getCurrentRiskLevel = (): RiskLevel | undefined => {
    return settings.riskLevels.find(
      (level) => level.id === settings.defaultRiskLevel
    );
  };

  // Get current allocation level object
  const getCurrentAllocationLevel = (): AllocationLevel | undefined => {
    return settings.allocationLevels.find(
      (level) => level.id === settings.defaultAllocationLevel
    );
  };

  // Get current stop loss level object
  const getCurrentStopLossLevel = (): StopLossLevel | undefined => {
    return settings.stopLossLevels.find(
      (level) => level.id === settings.defaultStopLossLevel
    );
  };

  // Export settings as JSON
  const exportSettings = (): string => {
    return JSON.stringify(settings, null, 2);
  };

  // Import settings from JSON
  const importSettings = (settingsJson: string): boolean => {
    try {
      const imported = JSON.parse(settingsJson);
      // Validate the structure (basic validation)
      if (imported && typeof imported === 'object') {
        setSettings({ ...DEFAULT_SETTINGS, ...imported });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  };

  const value: SettingsContextType = {
    settings,
    isLoading,
    updateSettings,
    updateRiskLevel,
    addRiskLevel,
    removeRiskLevel,
    updateAllocationLevel,
    addAllocationLevel,
    removeAllocationLevel,
    updateStopLossLevel,
    addStopLossLevel,
    removeStopLossLevel,
    resetSettings,
    getCurrentRiskLevel,
    getCurrentAllocationLevel,
    getCurrentStopLossLevel,
    exportSettings,
    importSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings context
// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
