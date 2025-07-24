import React, {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  MarketHealth,
  TabType,
} from '../containers/TradingCalculator/types';
import { brokerApiService } from '../services/brokerApiService';
import { preferencesService } from '../services/preferencesService';

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

  // Broker Session Management
  // Indicates if the user has an active session with the brokerage
  hasActiveBrokerSession: boolean;

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

// Settings version for migration (kept for compatibility)
const SETTINGS_VERSION = 2; // No longer used with backend API

// Default Settings
const DEFAULT_SETTINGS: UserSettings = {
  version: SETTINGS_VERSION,
  hasActiveBrokerSession: false,
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
  error: Error | null;
  hasActiveBrokerSession: boolean;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateRiskLevel: (riskLevel: RiskLevel) => Promise<void>;
  addRiskLevel: (riskLevel: Omit<RiskLevel, 'id'>) => Promise<void>;
  removeRiskLevel: (id: string) => Promise<void>;
  updateAllocationLevel: (allocationLevel: AllocationLevel) => Promise<void>;
  addAllocationLevel: (
    allocationLevel: Omit<AllocationLevel, 'id'>
  ) => Promise<void>;
  removeAllocationLevel: (id: string) => Promise<void>;
  updateStopLossLevel: (stopLossLevel: StopLossLevel) => Promise<void>;
  addStopLossLevel: (stopLossLevel: Omit<StopLossLevel, 'id'>) => Promise<void>;
  removeStopLossLevel: (id: string) => Promise<void>;
  resetSettings: () => Promise<void>;
  getCurrentRiskLevel: () => RiskLevel | undefined;
  getCurrentAllocationLevel: () => AllocationLevel | undefined;
  getCurrentStopLossLevel: () => StopLossLevel | undefined;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => Promise<boolean>;
  refetchSettings: () => Promise<void>;
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
  const queryClient = useQueryClient();

  // Fetch preferences from backend using React Query
  const {
    data: settings,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: () => preferencesService.getPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (
        error instanceof Error &&
        (error.message.includes('Authentication failed') ||
          error.message.includes('ACCESS_TOKEN_EXPIRED') ||
          error.message.includes('Token invalid'))
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Use React Query for session checking with matching key
  const { data: activeSession, isLoading: isLoadingActiveSession } = useQuery({
    queryKey: ['broker', 'active-session'],
    queryFn: async () => {
      try {
        return await brokerApiService.getActiveSession();
      } catch (error) {
        // Handle authentication errors gracefully
        if (
          error instanceof Error &&
          (error.message.includes('Authentication failed') ||
            error.message.includes('ACCESS_TOKEN_EXPIRED') ||
            error.message.includes('Token invalid'))
        ) {
          console.log('Token expired, redirecting to login...');
          // Clear any cached auth data and redirect to login
          window.location.href = '/login';
          return { hasActiveSession: false };
        }
        throw error;
      }
    },
    staleTime: 0, // Always refetch on mount for fresh session data
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (
        error instanceof Error &&
        (error.message.includes('Authentication failed') ||
          error.message.includes('ACCESS_TOKEN_EXPIRED') ||
          error.message.includes('Token invalid'))
      ) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
  // Mutations for updating preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: (updates: Partial<UserSettings>) =>
      preferencesService.updatePartialPreferences(updates),
    onMutate: async (updates) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['user', 'preferences'] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData([
        'user',
        'preferences',
      ]);

      // Optimistically update to the new value
      if (previousSettings) {
        const optimisticSettings = { ...previousSettings, ...updates };
        queryClient.setQueryData(['user', 'preferences'], optimisticSettings);
      }

      // Return a context object with the snapshotted value
      return { previousSettings };
    },
    onSuccess: (updatedSettings) => {
      // Update the cache with actual server response
      queryClient.setQueryData(['user', 'preferences'], updatedSettings);
    },
    onError: (error, _updates, context) => {
      // Rollback to the previous value on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          ['user', 'preferences'],
          context.previousSettings
        );
      }
      console.error('Failed to update preferences:', error);
    },
    onSettled: () => {
      // Only invalidate on error - success already has fresh data from server
      // This prevents unnecessary refetches that cause flickering
    },
  });

  const resetPreferencesMutation = useMutation({
    mutationFn: () => preferencesService.resetPreferences(),
    onSuccess: (resetSettings) => {
      // Update the cache with reset settings
      queryClient.setQueryData(['user', 'preferences'], resetSettings);
    },
    onError: (error) => {
      console.error('Failed to reset preferences:', error);
    },
  });

  // Combined loading state
  const isLoading = isLoadingSettings || isLoadingActiveSession;
  const hasActiveBrokerSession = activeSession?.hasActiveSession ?? false;
  const currentSettings = settings || DEFAULT_SETTINGS;

  // Update settings function - now async and uses API
  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      await updatePreferencesMutation.mutateAsync(updates);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  // Update specific risk level
  const updateRiskLevel = async (updatedRiskLevel: RiskLevel) => {
    const updatedRiskLevels = currentSettings.riskLevels.map((level) =>
      level.id === updatedRiskLevel.id ? updatedRiskLevel : level
    );
    await updateSettings({ riskLevels: updatedRiskLevels });
  };

  // Add new risk level
  const addRiskLevel = async (newRiskLevel: Omit<RiskLevel, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const riskLevel: RiskLevel = { ...newRiskLevel, id };
    const updatedRiskLevels = [...currentSettings.riskLevels, riskLevel];
    await updateSettings({ riskLevels: updatedRiskLevels });
  };

  // Remove risk level
  const removeRiskLevel = async (id: string) => {
    const updatedRiskLevels = currentSettings.riskLevels.filter(
      (level) => level.id !== id
    );
    const updates: Partial<UserSettings> = { riskLevels: updatedRiskLevels };

    // Reset default if we're removing it
    if (currentSettings.defaultRiskLevel === id) {
      updates.defaultRiskLevel = updatedRiskLevels[0]?.id || 'conservative';
    }

    await updateSettings(updates);
  };

  // Update specific allocation level
  const updateAllocationLevel = async (
    updatedAllocationLevel: AllocationLevel
  ) => {
    const updatedAllocationLevels = currentSettings.allocationLevels.map(
      (level) =>
        level.id === updatedAllocationLevel.id ? updatedAllocationLevel : level
    );
    await updateSettings({ allocationLevels: updatedAllocationLevels });
  };

  // Add new allocation level
  const addAllocationLevel = async (
    newAllocationLevel: Omit<AllocationLevel, 'id'>
  ) => {
    const id = `custom-${Date.now()}`;
    const allocationLevel: AllocationLevel = { ...newAllocationLevel, id };
    const updatedAllocationLevels = [
      ...currentSettings.allocationLevels,
      allocationLevel,
    ];
    await updateSettings({ allocationLevels: updatedAllocationLevels });
  };

  // Remove allocation level
  const removeAllocationLevel = async (id: string) => {
    const updatedAllocationLevels = currentSettings.allocationLevels.filter(
      (level) => level.id !== id
    );
    const updates: Partial<UserSettings> = {
      allocationLevels: updatedAllocationLevels,
    };

    // Reset default if we're removing it
    if (currentSettings.defaultAllocationLevel === id) {
      updates.defaultAllocationLevel =
        updatedAllocationLevels[0]?.id || 'conservative';
    }

    await updateSettings(updates);
  };

  // Update specific stop loss level
  const updateStopLossLevel = async (updatedStopLossLevel: StopLossLevel) => {
    const updatedStopLossLevels = currentSettings.stopLossLevels.map((level) =>
      level.id === updatedStopLossLevel.id ? updatedStopLossLevel : level
    );
    await updateSettings({ stopLossLevels: updatedStopLossLevels });
  };

  // Add new stop loss level
  const addStopLossLevel = async (
    newStopLossLevel: Omit<StopLossLevel, 'id'>
  ) => {
    const id = `custom-${Date.now()}`;
    const stopLossLevel: StopLossLevel = { ...newStopLossLevel, id };
    const updatedStopLossLevels = [
      ...currentSettings.stopLossLevels,
      stopLossLevel,
    ];
    await updateSettings({ stopLossLevels: updatedStopLossLevels });
  };

  // Remove stop loss level
  const removeStopLossLevel = async (id: string) => {
    const updatedStopLossLevels = currentSettings.stopLossLevels.filter(
      (level) => level.id !== id
    );
    const updates: Partial<UserSettings> = {
      stopLossLevels: updatedStopLossLevels,
    };

    // Reset default if we're removing it
    if (currentSettings.defaultStopLossLevel === id) {
      updates.defaultStopLossLevel = updatedStopLossLevels[0]?.id || 'normal';
    }

    await updateSettings(updates);
  };

  // Reset to default settings
  const resetSettings = async () => {
    try {
      await resetPreferencesMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  };

  // Get current risk level object
  const getCurrentRiskLevel = (): RiskLevel | undefined => {
    return currentSettings.riskLevels.find(
      (level) => level.id === currentSettings.defaultRiskLevel
    );
  };

  // Get current allocation level object
  const getCurrentAllocationLevel = (): AllocationLevel | undefined => {
    return currentSettings.allocationLevels.find(
      (level) => level.id === currentSettings.defaultAllocationLevel
    );
  };

  // Get current stop loss level object
  const getCurrentStopLossLevel = (): StopLossLevel | undefined => {
    return currentSettings.stopLossLevels.find(
      (level) => level.id === currentSettings.defaultStopLossLevel
    );
  };

  // Export settings as JSON
  const exportSettings = (): string => {
    return JSON.stringify(currentSettings, null, 2);
  };

  // Import settings from JSON
  const importSettings = async (settingsJson: string): Promise<boolean> => {
    try {
      const imported = JSON.parse(settingsJson);
      // Validate the structure (basic validation)
      if (imported && typeof imported === 'object') {
        // Remove version field as it's handled by backend
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { version, ...importedSettings } = imported;
        await updatePreferencesMutation.mutateAsync({
          ...DEFAULT_SETTINGS,
          ...importedSettings,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  };

  const value: SettingsContextType = {
    settings: currentSettings,
    isLoading,
    error: settingsError,
    hasActiveBrokerSession,
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
    refetchSettings: async () => {
      await refetchSettings();
    },
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
