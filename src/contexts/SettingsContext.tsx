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
import { useAuth } from './AuthContext';

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
  stopLossMode: 'price' | 'percentage';

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

// All default values are now handled by the backend API

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

  // Get reactive authentication status from AuthContext
  const { isAuthenticated } = useAuth();

  // Fetch preferences from backend using React Query - only when authenticated
  const {
    data: settings,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: () => preferencesService.getPreferences(),
    enabled: isAuthenticated, // Only run query when user is authenticated
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

  // Use React Query for session checking with matching key - only when authenticated
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
    enabled: isAuthenticated, // Only run when user is authenticated
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

  // Combined loading state - only loading if authenticated and settings are loading
  const isLoading =
    (isAuthenticated && isLoadingSettings) || isLoadingActiveSession;
  const hasActiveBrokerSession = activeSession?.hasActiveSession ?? false;
  
  // Debug: Log when loading screen should show
  useEffect(() => {
    console.log('🔄 Loading screen status:', {
      isAuthenticated,
      isLoadingSettings,
      isLoadingActiveSession,
      finalIsLoading: isLoading,
      shouldShowForUnauthenticated: !isAuthenticated && isLoading
    });
  }, [isAuthenticated, isLoadingSettings, isLoadingActiveSession, isLoading]);

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
    if (!settings) return;
    const updatedRiskLevels = settings.riskLevels.map((level) =>
      level.id === updatedRiskLevel.id ? updatedRiskLevel : level
    );
    await updateSettings({ riskLevels: updatedRiskLevels });
  };

  // Add new risk level
  const addRiskLevel = async (newRiskLevel: Omit<RiskLevel, 'id'>) => {
    if (!settings) return;
    const id = `custom-${Date.now()}`;
    const riskLevel: RiskLevel = { ...newRiskLevel, id };
    const updatedRiskLevels = [...settings.riskLevels, riskLevel];
    await updateSettings({ riskLevels: updatedRiskLevels });
  };

  // Remove risk level
  const removeRiskLevel = async (id: string) => {
    if (!settings) return;
    const updatedRiskLevels = settings.riskLevels.filter(
      (level) => level.id !== id
    );
    const updates: Partial<UserSettings> = { riskLevels: updatedRiskLevels };

    // Reset default if we're removing it
    if (settings.defaultRiskLevel === id) {
      updates.defaultRiskLevel = updatedRiskLevels[0]?.id || 'conservative';
    }

    await updateSettings(updates);
  };

  // Update specific allocation level
  const updateAllocationLevel = async (
    updatedAllocationLevel: AllocationLevel
  ) => {
    if (!settings) return;
    const updatedAllocationLevels = settings.allocationLevels.map((level) =>
      level.id === updatedAllocationLevel.id ? updatedAllocationLevel : level
    );
    await updateSettings({ allocationLevels: updatedAllocationLevels });
  };

  // Add new allocation level
  const addAllocationLevel = async (
    newAllocationLevel: Omit<AllocationLevel, 'id'>
  ) => {
    if (!settings) return;
    const id = `custom-${Date.now()}`;
    const allocationLevel: AllocationLevel = { ...newAllocationLevel, id };
    const updatedAllocationLevels = [
      ...settings.allocationLevels,
      allocationLevel,
    ];
    await updateSettings({ allocationLevels: updatedAllocationLevels });
  };

  // Remove allocation level
  const removeAllocationLevel = async (id: string) => {
    if (!settings) return;
    const updatedAllocationLevels = settings.allocationLevels.filter(
      (level) => level.id !== id
    );
    const updates: Partial<UserSettings> = {
      allocationLevels: updatedAllocationLevels,
    };

    // Reset default if we're removing it
    if (settings.defaultAllocationLevel === id) {
      updates.defaultAllocationLevel =
        updatedAllocationLevels[0]?.id || 'conservative';
    }

    await updateSettings(updates);
  };

  // Update specific stop loss level
  const updateStopLossLevel = async (updatedStopLossLevel: StopLossLevel) => {
    if (!settings) return;
    const updatedStopLossLevels = settings.stopLossLevels.map((level) =>
      level.id === updatedStopLossLevel.id ? updatedStopLossLevel : level
    );
    await updateSettings({ stopLossLevels: updatedStopLossLevels });
  };

  // Add new stop loss level
  const addStopLossLevel = async (
    newStopLossLevel: Omit<StopLossLevel, 'id'>
  ) => {
    if (!settings) return;
    const id = `custom-${Date.now()}`;
    const stopLossLevel: StopLossLevel = { ...newStopLossLevel, id };
    const updatedStopLossLevels = [...settings.stopLossLevels, stopLossLevel];
    await updateSettings({ stopLossLevels: updatedStopLossLevels });
  };

  // Remove stop loss level
  const removeStopLossLevel = async (id: string) => {
    if (!settings) return;
    const updatedStopLossLevels = settings.stopLossLevels.filter(
      (level) => level.id !== id
    );
    const updates: Partial<UserSettings> = {
      stopLossLevels: updatedStopLossLevels,
    };

    // Reset default if we're removing it
    if (settings.defaultStopLossLevel === id) {
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
    return settings?.riskLevels.find(
      (level) => level.id === settings.defaultRiskLevel
    );
  };

  // Get current allocation level object
  const getCurrentAllocationLevel = (): AllocationLevel | undefined => {
    return settings?.allocationLevels.find(
      (level) => level.id === settings.defaultAllocationLevel
    );
  };

  // Get current stop loss level object
  const getCurrentStopLossLevel = (): StopLossLevel | undefined => {
    return settings?.stopLossLevels.find(
      (level) => level.id === settings.defaultStopLossLevel
    );
  };

  // Export settings as JSON
  const exportSettings = (): string => {
    return JSON.stringify(settings || {}, null, 2);
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
        await updatePreferencesMutation.mutateAsync(importedSettings);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  };

  // Refetch preferences when authentication status changes
  useEffect(() => {
    if (isAuthenticated && !settings) {
      refetchSettings();
    }
  }, [isAuthenticated, settings, refetchSettings]);

  // If user is authenticated but settings haven't loaded yet, show loading
  // If user is not authenticated, provide empty settings object
  const contextSettings = isAuthenticated
    ? settings || ({} as UserSettings)
    : ({} as UserSettings);

  const value: SettingsContextType = {
    settings: contextSettings,
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
