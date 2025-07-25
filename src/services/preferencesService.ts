import httpClient from './httpClient';
import type {
  UserSettings,
  RiskLevel,
  AllocationLevel,
  StopLossLevel,
} from '../contexts/SettingsContext';

// API Response Types
export interface PreferencesResponse {
  message: string;
  preferences: BackendPreferences;
}

export interface FieldResponse<T = any> {
  message: string;
  field: string;
  value: T;
}

// Backend preference structure matches our UserSettings but with some key differences
export interface BackendPreferences {
  _id: string;
  userId: string;
  accountBalance: number;
  currencySymbol: string;
  decimalPlaces: number;
  defaultAllocationLevel: string;
  defaultRiskLevel: string;
  marketHealth: string;
  defaultModeTab: string; // Maps to activeTab in frontend
  defaultStopLossMode: 'price' | 'percentage';
  defaultStopLossLevel: string;
  defaultStopLossPercentage: number;
  hasActiveBrokerSession: boolean;
  darkMode: boolean;
  defaultBrokerageCost: number;
  autoCalculateTargets: boolean;
  showAdvancedMetrics: boolean;
  showPercentages: boolean;
  riskLevels: RiskLevel[];
  allocationLevels: AllocationLevel[];
  stopLossLevels: StopLossLevel[];
  createdAt: string;
  updatedAt: string;
}

// Transform functions to convert between frontend and backend formats
export const transformBackendToFrontend = (
  backendPrefs: BackendPreferences
): UserSettings => ({
  // Remove backend-specific fields and add frontend-specific ones
  version: 2, // Frontend version field
  hasActiveBrokerSession: backendPrefs.hasActiveBrokerSession,
  accountBalance: backendPrefs.accountBalance,
  riskLevels: backendPrefs.riskLevels,
  defaultRiskLevel: backendPrefs.defaultRiskLevel,
  marketHealth: backendPrefs.marketHealth as any, // Type assertion for MarketHealth
  allocationLevels: backendPrefs.allocationLevels,
  defaultAllocationLevel: backendPrefs.defaultAllocationLevel,
  stopLossLevels: backendPrefs.stopLossLevels,
  defaultStopLossLevel: backendPrefs.defaultStopLossLevel,
  stopLossMode: backendPrefs.defaultStopLossMode || 'price',
  activeTab: backendPrefs.defaultModeTab as any, // Maps defaultModeTab to activeTab
  darkMode: backendPrefs.darkMode,
  defaultBrokerageCost: backendPrefs.defaultBrokerageCost,
  autoCalculateTargets: backendPrefs.autoCalculateTargets,
  showAdvancedMetrics: backendPrefs.showAdvancedMetrics,
  defaultStopLossPercentage: backendPrefs.defaultStopLossPercentage,
  currencySymbol: backendPrefs.currencySymbol,
  decimalPlaces: backendPrefs.decimalPlaces,
  showPercentages: backendPrefs.showPercentages,
});

export const transformFrontendToBackend = (
  frontendSettings: Partial<UserSettings>
): Partial<Omit<BackendPreferences, '_id' | 'userId' | 'createdAt' | 'updatedAt'>> => {
  const backendUpdate: any = { ...frontendSettings };
  
  // Transform frontend-specific fields to backend format
  if ('activeTab' in frontendSettings) {
    backendUpdate.defaultModeTab = frontendSettings.activeTab;
    delete backendUpdate.activeTab;
  }

  if ('stopLossMode' in frontendSettings) {
    backendUpdate.defaultStopLossMode = frontendSettings.stopLossMode;
    delete backendUpdate.stopLossMode;
  }
  
  // Remove frontend-specific fields that don't exist in backend
  delete backendUpdate.version;
  
  return backendUpdate;
};

// User Preferences API Service
class PreferencesService {
  private baseUrl: string = '/user/preferences';

  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', data?: any): Promise<T> {
    switch (method) {
      case 'GET':
        const getResponse = await httpClient.get<T>(endpoint);
        return getResponse.data;
      case 'POST':
        const postResponse = await httpClient.post<T>(endpoint, data);
        return postResponse.data;
      case 'PUT':
        const putResponse = await httpClient.put<T>(endpoint, data);
        return putResponse.data;
      case 'PATCH':
        const patchResponse = await httpClient.patch<T>(endpoint, data);
        return patchResponse.data;
      case 'DELETE':
        const deleteResponse = await httpClient.delete<T>(endpoint);
        return deleteResponse.data;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  // Get user preferences with default values
  async getPreferences(): Promise<UserSettings> {
    const response = await this.makeRequest<PreferencesResponse>(this.baseUrl, 'GET');
    return transformBackendToFrontend(response.preferences);
  }

  // Full update of preferences (PUT)
  async updatePreferences(settings: Partial<UserSettings>): Promise<UserSettings> {
    const backendData = transformFrontendToBackend(settings);
    const response = await this.makeRequest<PreferencesResponse>(this.baseUrl, 'PUT', backendData);
    return transformBackendToFrontend(response.preferences);
  }

  // Partial update of preferences (PATCH)
  async updatePartialPreferences(settings: Partial<UserSettings>): Promise<UserSettings> {
    const backendData = transformFrontendToBackend(settings);
    const response = await this.makeRequest<PreferencesResponse>(this.baseUrl, 'PATCH', backendData);
    return transformBackendToFrontend(response.preferences);
  }

  // Reset preferences to default
  async resetPreferences(): Promise<UserSettings> {
    const response = await this.makeRequest<PreferencesResponse>(this.baseUrl, 'DELETE');
    return transformBackendToFrontend(response.preferences);
  }

  // Get specific preference field
  async getPreferenceField<T = any>(fieldName: string): Promise<T> {
    const response = await this.makeRequest<FieldResponse<T>>(`${this.baseUrl}/field/${fieldName}`, 'GET');
    return response.value;
  }

  // Update specific preference field
  async updatePreferenceField<T = any>(fieldName: string, value: T): Promise<T> {
    const response = await this.makeRequest<FieldResponse<T>>(`${this.baseUrl}/field/${fieldName}`, 'PUT', { value });
    return response.value;
  }

  // Convenience methods for common operations
  async updateAccountBalance(balance: number): Promise<UserSettings> {
    return this.updatePartialPreferences({ accountBalance: balance });
  }

  async updateDarkMode(darkMode: boolean): Promise<UserSettings> {
    return this.updatePartialPreferences({ darkMode });
  }

  async updateMarketHealth(health: UserSettings['marketHealth']): Promise<UserSettings> {
    return this.updatePartialPreferences({ marketHealth: health });
  }

  async updateDefaultRiskLevel(riskLevel: string): Promise<UserSettings> {
    return this.updatePartialPreferences({ defaultRiskLevel: riskLevel });
  }

  async updateDefaultAllocationLevel(allocationLevel: string): Promise<UserSettings> {
    return this.updatePartialPreferences({ defaultAllocationLevel: allocationLevel });
  }

  async updateDefaultStopLossLevel(stopLossLevel: string): Promise<UserSettings> {
    return this.updatePartialPreferences({ defaultStopLossLevel: stopLossLevel });
  }

  async updateActiveTab(activeTab: UserSettings['activeTab']): Promise<UserSettings> {
    return this.updatePartialPreferences({ activeTab });
  }

  // Risk Level Management
  async updateRiskLevels(riskLevels: RiskLevel[]): Promise<UserSettings> {
    return this.updatePartialPreferences({ riskLevels });
  }

  // Allocation Level Management
  async updateAllocationLevels(allocationLevels: AllocationLevel[]): Promise<UserSettings> {
    return this.updatePartialPreferences({ allocationLevels });
  }

  // Stop Loss Level Management
  async updateStopLossLevels(stopLossLevels: StopLossLevel[]): Promise<UserSettings> {
    return this.updatePartialPreferences({ stopLossLevels });
  }

  // Batch update for multiple fields efficiently
  async batchUpdate(updates: Partial<UserSettings>): Promise<UserSettings> {
    return this.updatePartialPreferences(updates);
  }
}

// Create singleton instance
export const preferencesService = new PreferencesService();
export default preferencesService;