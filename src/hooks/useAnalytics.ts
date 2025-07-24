import { useEffect, useCallback, useRef } from 'react';
import { analyticsService, type UserProfile, type TradeData, type CalculationData } from '../services/analyticsService';

interface UseAnalyticsOptions {
  trackPageViews?: boolean;
  trackPerformance?: boolean;
  trackErrors?: boolean;
  screenName?: string;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const {
    trackPageViews = true,
    trackPerformance = true,
    trackErrors = true,
    screenName,
  } = options;

  const startTimeRef = useRef<number>(Date.now());
  const pageLoadTrackedRef = useRef<boolean>(false);

  // Track page view on mount
  useEffect(() => {
    if (trackPageViews && screenName && !pageLoadTrackedRef.current) {
      analyticsService.trackScreenView(screenName);
      pageLoadTrackedRef.current = true;
    }
  }, [trackPageViews, screenName]);

  // Track page load performance
  useEffect(() => {
    if (trackPerformance) {
      const trackLoadPerformance = () => {
        const loadTime = Date.now() - startTimeRef.current;
        analyticsService.trackPerformance('page_load_time', loadTime);
        
        // Track Web Vitals if available
        if ('performance' in window && 'getEntriesByType' in performance) {
          const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          if (navigationEntries.length > 0) {
            const nav = navigationEntries[0];
            analyticsService.trackPerformance('dom_content_loaded', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart);
            analyticsService.trackPerformance('first_contentful_paint', nav.loadEventEnd - nav.fetchStart);
          }
        }
      };

      // Track after component mount
      const timer = setTimeout(trackLoadPerformance, 100);
      return () => clearTimeout(timer);
    }
  }, [trackPerformance]);

  // Track errors
  useEffect(() => {
    if (trackErrors) {
      const handleError = (event: ErrorEvent) => {
        analyticsService.trackError(event.error || event.message, screenName);
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        analyticsService.trackError(event.reason, `${screenName}_promise_rejection`);
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, [trackErrors, screenName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (screenName) {
        const timeSpent = Date.now() - startTimeRef.current;
        analyticsService.trackEngagement('screen_time', {
          screen_name: screenName,
          time_spent_ms: timeSpent,
          time_spent_seconds: Math.round(timeSpent / 1000),
        });
      }
    };
  }, [screenName]);

  // Return analytics methods
  return {
    // User management
    setUser: useCallback((profile: Partial<UserProfile>) => {
      analyticsService.setUser(profile);
    }, []),

    // Event tracking
    trackEvent: useCallback((eventName: string, parameters?: Record<string, any>) => {
      analyticsService.trackEvent(eventName, parameters);
    }, []),

    // Trading specific tracking
    trackTrade: useCallback((eventType: string, tradeData: Partial<TradeData>) => {
      analyticsService.trackTradingEvent(eventType, tradeData);
    }, []),

    // Calculation tracking
    trackCalculation: useCallback((calculationData: CalculationData) => {
      analyticsService.trackCalculation(calculationData);
    }, []),

    // Engagement tracking
    trackEngagement: useCallback((action: string, details?: Record<string, any>) => {
      analyticsService.trackEngagement(action, details);
    }, []),

    // Error tracking
    trackError: useCallback((error: Error | string, context?: string) => {
      analyticsService.trackError(error, context);
    }, []),

    // Performance tracking
    trackPerformance: useCallback((metricName: string, value: number, unit?: string) => {
      analyticsService.trackPerformance(metricName, value, unit);
    }, []),

    // Screen tracking
    trackScreen: useCallback((screenName: string, screenClass?: string) => {
      analyticsService.trackScreenView(screenName, screenClass);
    }, []),

    // Get user profile
    getUserProfile: useCallback(() => {
      return analyticsService.getUserProfile();
    }, []),
  };
};