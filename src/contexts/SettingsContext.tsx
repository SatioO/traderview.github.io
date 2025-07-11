import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  MarketHealth,
  TabType,
} from '../containers/TradingCalculator/types';

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

// Enhanced Settings Interface
export interface UserSettings {
  // Account Settings
  accountBalance: number;

  // Risk Management
  riskLevels: RiskLevel[];
  defaultRiskLevel: string;
  marketHealth: MarketHealth;

  // UI Preferences
  activeTab: TabType;
  darkMode: boolean;

  // Trading Preferences
  defaultBrokerageCost: number;
  autoCalculateTargets: boolean;
  showAdvancedMetrics: boolean;

  // Display Settings
  currencySymbol: string;
  decimalPlaces: number;
  showPercentages: boolean;
}

// Default Risk Levels (based on your screenshot)
const DEFAULT_RISK_LEVELS: RiskLevel[] = [
  {
    id: 'conservative',
    name: 'Conservative play',
    percentage: 0.25,
    description: 'Low risk, steady growth approach',
    icon: '🌱',
    threatLevel: 'LOW',
    color: '#10B981',
  },
  {
    id: 'balanced',
    name: 'Balanced approach',
    percentage: 0.5,
    description: 'Moderate risk with balanced returns',
    icon: '🔥',
    threatLevel: 'MEDIUM',
    color: '#F59E0B',
  },
  {
    id: 'bold',
    name: 'Bold strategy',
    percentage: 0.75,
    description: 'Higher risk for greater potential returns',
    icon: '⚡',
    threatLevel: 'HIGH',
    color: '#EF4444',
  },
  {
    id: 'maximum',
    name: 'Maximum risk',
    percentage: 1.0,
    description: 'Highest risk, highest potential reward',
    icon: '💀',
    threatLevel: 'MAXIMUM',
    color: '#8B5CF6',
  },
];

// Default Settings
const DEFAULT_SETTINGS: UserSettings = {
  accountBalance: 100000,
  riskLevels: DEFAULT_RISK_LEVELS,
  defaultRiskLevel: 'conservative',
  marketHealth: 'confirmed-uptrend',
  activeTab: 'risk',
  darkMode: true,
  defaultBrokerageCost: 20,
  autoCalculateTargets: true,
  showAdvancedMetrics: false,
  currencySymbol: '₹',
  decimalPlaces: 2,
  showPercentages: true,
};

// Context Interface
interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  updateRiskLevel: (riskLevel: RiskLevel) => void;
  addRiskLevel: (riskLevel: Omit<RiskLevel, 'id'>) => void;
  removeRiskLevel: (id: string) => void;
  resetSettings: () => void;
  getCurrentRiskLevel: () => RiskLevel | undefined;
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

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults to ensure all properties exist
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
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
    } finally {
      setIsLoaded(true);
    }
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
    updateSettings,
    updateRiskLevel,
    addRiskLevel,
    removeRiskLevel,
    resetSettings,
    getCurrentRiskLevel,
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
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
