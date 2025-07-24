import { useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { FormData, MarketHealth, TabType } from '../containers/TradingCalculator/types';

interface UseTradingSettingsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useTradingSettings = ({
  setFormData,
  setActiveTab,
  setIsDarkMode
}: Omit<UseTradingSettingsProps, 'formData' | 'activeTab' | 'isDarkMode'>) => {
  const { settings, updateSettings, getCurrentRiskLevel, getCurrentAllocationLevel } = useSettings();
  
  // Track if we're in the middle of updating to prevent race conditions
  const isUpdatingRisk = useRef(false);
  const isUpdatingAllocation = useRef(false);

  // Sync settings to local state on settings change
  useEffect(() => {
    if (!settings) return; // Don't update if settings haven't loaded yet
    
    setFormData(prev => ({
      ...prev,
      accountBalance: settings.accountBalance || prev.accountBalance,
      marketHealth: settings.marketHealth || prev.marketHealth,
      brokerageCost: settings.defaultBrokerageCost || prev.brokerageCost,
      // Only update percentage if we're not in the middle of an update
      riskPercentage: isUpdatingRisk.current ? prev.riskPercentage : (getCurrentRiskLevel()?.percentage || prev.riskPercentage || 0.25),
      allocationPercentage: isUpdatingAllocation.current ? prev.allocationPercentage : (getCurrentAllocationLevel()?.percentage || prev.allocationPercentage || 10.0)
    }));

    setActiveTab(settings.activeTab || 'risk');
    setIsDarkMode(settings.darkMode ?? true);
  }, [settings, setFormData, setActiveTab, setIsDarkMode, getCurrentRiskLevel, getCurrentAllocationLevel]);

  // Update settings when local state changes - now async with error handling
  const handleAccountBalanceChange = async (accountBalance: number) => {
    try {
      await updateSettings({ accountBalance });
    } catch (error) {
      console.error('Failed to update account balance:', error);
    }
  };

  const handleMarketHealthChange = async (marketHealth: MarketHealth) => {
    try {
      await updateSettings({ marketHealth });
    } catch (error) {
      console.error('Failed to update market health:', error);
    }
  };

  const handleActiveTabChange = async (activeTab: TabType) => {
    try {
      await updateSettings({ activeTab });
    } catch (error) {
      console.error('Failed to update active tab:', error);
    }
  };

  const handleDarkModeChange = async (darkMode: boolean) => {
    try {
      await updateSettings({ darkMode });
    } catch (error) {
      console.error('Failed to update dark mode:', error);
    }
  };

  const handleRiskLevelChange = async (riskLevelId: string) => {
    try {
      isUpdatingRisk.current = true;
      await updateSettings({ defaultRiskLevel: riskLevelId });
    } catch (error) {
      console.error('Failed to update risk level:', error);
    } finally {
      // Reset flag after a short delay to allow optimistic update to settle
      setTimeout(() => {
        isUpdatingRisk.current = false;
      }, 100);
    }
  };

  const handleAllocationLevelChange = async (allocationLevelId: string) => {
    try {
      isUpdatingAllocation.current = true;
      await updateSettings({ defaultAllocationLevel: allocationLevelId });
    } catch (error) {
      console.error('Failed to update allocation level:', error);
    } finally {
      // Reset flag after a short delay to allow optimistic update to settle
      setTimeout(() => {
        isUpdatingAllocation.current = false;
      }, 100);
    }
  };

  // Get available risk levels for UI
  const getRiskLevels = () => settings?.riskLevels || [];

  // Get available allocation levels for UI
  const getAllocationLevels = () => settings?.allocationLevels || [];

  // Get current risk level info
  const getCurrentRiskInfo = () => getCurrentRiskLevel();

  // Get current allocation level info
  const getCurrentAllocationInfo = () => getCurrentAllocationLevel();

  return {
    settings,
    getRiskLevels,
    getAllocationLevels,
    getCurrentRiskInfo,
    getCurrentAllocationInfo,
    handleAccountBalanceChange,
    handleMarketHealthChange,
    handleActiveTabChange,
    handleDarkModeChange,
    handleRiskLevelChange,
    handleAllocationLevelChange
  };
};