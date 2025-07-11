import { useEffect } from 'react';
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
  const { settings, updateSettings, getCurrentRiskLevel } = useSettings();

  // Sync settings to local state on settings change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      accountBalance: settings.accountBalance,
      marketHealth: settings.marketHealth,
      brokerageCost: settings.defaultBrokerageCost,
      riskPercentage: getCurrentRiskLevel()?.percentage || 0.25
    }));

    setActiveTab(settings.activeTab);
    setIsDarkMode(settings.darkMode);
  }, [settings, setFormData, setActiveTab, setIsDarkMode, getCurrentRiskLevel]);

  // Update settings when local state changes
  const handleAccountBalanceChange = (accountBalance: number) => {
    updateSettings({ accountBalance });
  };

  const handleMarketHealthChange = (marketHealth: MarketHealth) => {
    updateSettings({ marketHealth });
  };

  const handleActiveTabChange = (activeTab: TabType) => {
    updateSettings({ activeTab });
  };

  const handleDarkModeChange = (darkMode: boolean) => {
    updateSettings({ darkMode });
  };

  const handleRiskLevelChange = (riskLevelId: string) => {
    updateSettings({ defaultRiskLevel: riskLevelId });
  };

  // Get available risk levels for UI
  const getRiskLevels = () => settings.riskLevels;

  // Get current risk level info
  const getCurrentRiskInfo = () => getCurrentRiskLevel();

  return {
    settings,
    getRiskLevels,
    getCurrentRiskInfo,
    handleAccountBalanceChange,
    handleMarketHealthChange,
    handleActiveTabChange,
    handleDarkModeChange,
    handleRiskLevelChange
  };
};