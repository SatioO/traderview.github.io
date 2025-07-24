import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
} from 'firebase/analytics';
import { app } from '../firebaseConfig';

interface UserProfile {
  userId?: string;
  username?: string;
  email?: string;
  displayName?: string;
  brokerConnected?: boolean;
  accountBalance?: number;
  tradingExperience?: string;
  preferredRiskLevel?: number;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  device?: {
    type?: string;
    os?: string;
    browser?: string;
    screenResolution?: string;
    language?: string;
    userAgent?: string;
  };
  session?: {
    sessionId?: string;
    sessionStartTime?: number;
    referrer?: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
  };
}

interface TradeData {
  instrumentSymbol?: string;
  entryPrice?: number;
  stopLoss?: number;
  targetPrice?: number;
  positionSize?: number;
  investmentAmount?: number;
  riskPercentage?: number;
  calculationMode?: 'risk' | 'allocation';
  marketHealth?: string;
  brokerUsed?: string;
  orderType?: 'market' | 'limit';
  timeFrame?: string;
}

interface CalculationData {
  calculationType: 'position_size' | 'risk_assessment' | 'profit_target';
  inputValues: Record<string, any>;
  outputValues: Record<string, any>;
  processingTime?: number;
  accuracy?: 'high' | 'medium' | 'low';
}

class AnalyticsService {
  private analytics: any;
  private isInitialized = false;
  private userProfile: UserProfile = {};
  private sessionData: any = {};

  constructor() {
    this.initializeAnalytics();
  }

  private async initializeAnalytics() {
    try {
      this.analytics = getAnalytics(app);
      this.isInitialized = true;

      // Initialize session data
      await this.initializeSession();

      // Set up device and location tracking
      await this.setupDeviceTracking();
      await this.setupLocationTracking();

      console.log('🔥 Firebase Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error);
    }
  }

  private async initializeSession() {
    const sessionId = this.generateSessionId();
    const sessionStartTime = Date.now();

    this.sessionData = {
      sessionId,
      sessionStartTime,
      referrer: document.referrer || 'direct',
      utm: this.extractUTMParameters(),
    };

    this.userProfile.session = this.sessionData;

    // Track session start
    this.trackEvent('session_start', {
      session_id: sessionId,
      referrer: this.sessionData.referrer,
      timestamp: sessionStartTime,
      ...this.sessionData.utm,
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractUTMParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      source: urlParams.get('utm_source') || undefined,
      medium: urlParams.get('utm_medium') || undefined,
      campaign: urlParams.get('utm_campaign') || undefined,
      term: urlParams.get('utm_term') || undefined,
      content: urlParams.get('utm_content') || undefined,
    };
  }

  private async setupDeviceTracking() {
    const deviceInfo = {
      type: this.getDeviceType(),
      os: this.getOperatingSystem(),
      browser: this.getBrowserInfo(),
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language || 'unknown',
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      platform: navigator.platform,
      connectionType: this.getConnectionType(),
    };

    this.userProfile.device = deviceInfo;

    // Set user properties for device info
    if (this.isInitialized) {
      setUserProperties(this.analytics, {
        device_type: deviceInfo.type,
        operating_system: deviceInfo.os,
        browser: deviceInfo.browser,
        screen_resolution: deviceInfo.screenResolution,
        user_language: deviceInfo.language,
        timezone: deviceInfo.timezone,
      });
    }
  }

  private async setupLocationTracking() {
    try {
      // Use IP-based geolocation service (you can replace with your preferred service)
      const response = await fetch('https://ipapi.co/json/');
      const locationData = await response.json();

      const locationInfo = {
        country: locationData.country_name || 'Unknown',
        region: locationData.region || 'Unknown',
        city: locationData.city || 'Unknown',
        timezone: locationData.timezone || 'Unknown',
        ip: locationData.ip || 'Unknown',
        isp: locationData.org || 'Unknown',
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        countryCode: locationData.country_code || 'XX',
      };

      this.userProfile.location = locationInfo;

      // Set user properties for location
      if (this.isInitialized) {
        setUserProperties(this.analytics, {
          user_country: locationInfo.country,
          user_region: locationInfo.region,
          user_city: locationInfo.city,
          user_timezone: locationInfo.timezone,
          user_isp: locationInfo.isp,
        });
      }

      // Track location data
      this.trackEvent('user_location_detected', {
        country: locationInfo.country,
        region: locationInfo.region,
        city: locationInfo.city,
        timezone: locationInfo.timezone,
      });
    } catch (error) {
      console.warn('Could not fetch location data:', error);

      // Fallback to basic timezone info
      const fallbackLocation = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
      };

      this.userProfile.location = fallbackLocation;
    }
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (
      /mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(
        userAgent
      )
    )
      return 'mobile';
    return 'desktop';
  }

  private getOperatingSystem(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  private getConnectionType(): string {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  // Public Methods

  /**
   * Set user identification and profile data
   */
  public setUser(profile: Partial<UserProfile>) {
    if (!this.isInitialized) return;

    // Merge with existing profile
    this.userProfile = { ...this.userProfile, ...profile };

    // Set Firebase user ID
    if (profile.userId) {
      setUserId(this.analytics, profile.userId);
    }

    // Set user properties
    const userProperties: Record<string, any> = {};
    console.log('Setting user properties:', profile);
    if (profile.email) userProperties.user_email = profile.email;
    if (profile.displayName) {
      userProperties.user_name = profile.displayName;
      userProperties.name = profile.displayName;
    }
    if (profile.brokerConnected !== undefined)
      userProperties.broker_connected = profile.brokerConnected;
    if (profile.accountBalance)
      userProperties.account_balance_range = this.categorizeAccountBalance(
        profile.accountBalance
      );
    if (profile.tradingExperience)
      userProperties.trading_experience = profile.tradingExperience;
    if (profile.preferredRiskLevel)
      userProperties.preferred_risk_level = profile.preferredRiskLevel;

    setUserProperties(this.analytics, userProperties);

    // Track user profile update
    this.trackEvent('user_profile_updated', {
      user_id: profile.userId || 'unknown',
      username: profile.displayName || 'unknown',
      has_email: !!profile.email,
      has_display_name: !!profile.displayName,
      broker_connected: profile.brokerConnected || false,
      trading_experience: profile.tradingExperience || 'unknown',
    });
  }

  /**
   * Track custom events with enhanced data
   */
  public trackEvent(eventName: string, parameters: Record<string, any> = {}) {
    if (!this.isInitialized) return;

    const enhancedParameters = {
      ...parameters,
      session_id: this.sessionData.sessionId,
      timestamp: Date.now(),
      page_url: window.location.href,
      page_title: document.title,
      user_country: this.userProfile.location?.country,
      device_type: this.userProfile.device?.type,
      browser: this.userProfile.device?.browser,
      operating_system: this.userProfile.device?.os,
    };

    logEvent(this.analytics, eventName, enhancedParameters);

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔥 Analytics Event: ${eventName}`, enhancedParameters);
    }
  }

  /**
   * Track screen/page views
   */
  public trackScreenView(screenName: string, screenClass?: string) {
    if (!this.isInitialized) return;

    this.trackEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  }

  /**
   * Track trading-specific events
   */
  public trackTradingEvent(eventType: string, tradeData: Partial<TradeData>) {
    const tradingParameters = {
      event_type: eventType,
      instrument_symbol: tradeData.instrumentSymbol,
      entry_price: tradeData.entryPrice,
      stop_loss: tradeData.stopLoss,
      position_size: tradeData.positionSize,
      investment_amount: tradeData.investmentAmount,
      risk_percentage: tradeData.riskPercentage,
      calculation_mode: tradeData.calculationMode,
      market_health: tradeData.marketHealth,
      broker_used: tradeData.brokerUsed,
      order_type: tradeData.orderType,
      // Categorize sensitive data
      investment_range: tradeData.investmentAmount
        ? this.categorizeInvestmentAmount(tradeData.investmentAmount)
        : undefined,
      risk_category: tradeData.riskPercentage
        ? this.categorizeRiskLevel(tradeData.riskPercentage)
        : undefined,
    };

    this.trackEvent(`trading_${eventType}`, tradingParameters);
  }

  /**
   * Track calculation events
   */
  public trackCalculation(calculationData: CalculationData) {
    this.trackEvent('calculation_performed', {
      calculation_type: calculationData.calculationType,
      processing_time: calculationData.processingTime,
      accuracy: calculationData.accuracy,
      input_count: Object.keys(calculationData.inputValues).length,
      output_count: Object.keys(calculationData.outputValues).length,
    });
  }

  /**
   * Track user engagement events
   */
  public trackEngagement(action: string, details: Record<string, any> = {}) {
    this.trackEvent('user_engagement', {
      engagement_action: action,
      engagement_time: Date.now() - this.sessionData.sessionStartTime,
      ...details,
    });
  }

  /**
   * Track errors and exceptions
   */
  public trackError(error: Error | string, context?: string) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'object' ? error.stack : undefined;

    this.trackEvent('app_exception', {
      error_message: errorMessage,
      error_context: context || 'unknown',
      error_stack: errorStack?.substring(0, 500), // Limit stack trace length
      fatal: false,
    });
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(
    metricName: string,
    value: number,
    unit: string = 'ms'
  ) {
    this.trackEvent('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit,
    });
  }

  // Helper methods for data categorization

  private categorizeAccountBalance(balance: number): string {
    if (balance >= 50000000) return 'elite_5cr_plus';
    if (balance >= 20000000) return 'professional_2cr_to_5cr';
    if (balance >= 10000000) return 'advanced_1cr_to_2cr';
    if (balance >= 5000000) return 'intermediate_plus_50l_to_1cr';
    if (balance >= 2500000) return 'intermediate_25l_to_50l';
    if (balance >= 1000000) return 'developing_10l_to_25l';
    if (balance >= 500000) return 'beginner_plus_5l_to_10l';
    return 'beginner_under_5l';
  }

  private categorizeInvestmentAmount(amount: number): string {
    if (amount >= 1000000) return 'high_10l_plus';
    if (amount >= 500000) return 'medium_high_5l_to_10l';
    if (amount >= 100000) return 'medium_1l_to_5l';
    if (amount >= 50000) return 'low_medium_50k_to_1l';
    return 'low_under_50k';
  }

  private categorizeRiskLevel(riskPercentage: number): string {
    if (riskPercentage >= 5) return 'extreme_5_plus';
    if (riskPercentage >= 3) return 'high_3_to_5';
    if (riskPercentage >= 2) return 'medium_high_2_to_3';
    if (riskPercentage >= 1) return 'medium_1_to_2';
    if (riskPercentage >= 0.5) return 'low_medium_0_5_to_1';
    return 'conservative_under_0_5';
  }

  /**
   * Get current user profile
   */
  public getUserProfile(): UserProfile {
    return { ...this.userProfile };
  }

  /**
   * End current session
   */
  public endSession() {
    const sessionDuration = Date.now() - this.sessionData.sessionStartTime;

    this.trackEvent('session_end', {
      session_id: this.sessionData.sessionId,
      session_duration: sessionDuration,
      session_duration_minutes: Math.round(sessionDuration / 60000),
    });
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

// Export types for use in components
export type { UserProfile, TradeData, CalculationData };
