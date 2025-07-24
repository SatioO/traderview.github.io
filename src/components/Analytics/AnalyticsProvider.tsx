import React, { createContext, useContext, useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';

interface AnalyticsContextType {
  isEnabled: boolean;
  hasConsent: boolean;
  enableAnalytics: () => void;
  disableAnalytics: () => void;
  requestConsent: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined
);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  requireConsent?: boolean;
  debugMode?: boolean;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  requireConsent = true,
  debugMode = false,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(false);

  useEffect(() => {
    // Check for existing consent
    const storedConsent = localStorage.getItem('analytics_consent');
    const consentGranted = storedConsent === 'true';

    if (requireConsent) {
      setHasConsent(consentGranted);
      setIsEnabled(consentGranted);
      setShowConsentBanner(!consentGranted && storedConsent === null);
    } else {
      setHasConsent(true);
      setIsEnabled(true);
    }

    // Debug mode logging
    if (debugMode) {
      console.log('🔥 Analytics Provider initialized:', {
        requireConsent,
        hasConsent: consentGranted,
        isEnabled: requireConsent ? consentGranted : true,
      });
    }
  }, [requireConsent, debugMode]);

  const enableAnalytics = () => {
    setIsEnabled(true);
    setHasConsent(true);
    setShowConsentBanner(false);
    localStorage.setItem('analytics_consent', 'true');

    // Track consent granted
    analyticsService.trackEvent('analytics_consent_granted', {
      timestamp: Date.now(),
      consent_method: 'user_action',
    });
  };

  const disableAnalytics = () => {
    setIsEnabled(false);
    setHasConsent(false);
    setShowConsentBanner(false);
    localStorage.setItem('analytics_consent', 'false');

    // Track consent revoked
    analyticsService.trackEvent('analytics_consent_revoked', {
      timestamp: Date.now(),
    });
  };

  const requestConsent = () => {
    setShowConsentBanner(true);
  };

  const contextValue: AnalyticsContextType = {
    isEnabled,
    hasConsent,
    enableAnalytics,
    disableAnalytics,
    requestConsent,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}

      {/* Consent Banner */}
      {showConsentBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 p-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-1">
                🍪 Help us improve TraderView
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                We use analytics to understand how you use our platform, improve
                performance, and provide better trading tools. We collect device
                info, location (country/region), and usage patterns. No personal
                trading data is shared.
              </p>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={disableAnalytics}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={enableAnalytics}
                className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Accept & Continue
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <p className="text-gray-400 text-xs text-center">
              💡 You can change your analytics preferences anytime in Settings.
              <span className="text-purple-400 cursor-pointer hover:underline ml-1">
                Learn more about our privacy practices
              </span>
            </p>
          </div>
        </div>
      )}
    </AnalyticsContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error(
      'useAnalyticsContext must be used within an AnalyticsProvider'
    );
  }
  return context;
};
