import React, { useCallback } from 'react';
import type { FormData, MarketHealth } from '../types';

interface MarketOutlookSectionProps {
  formData: FormData;
  showMarketOutlookPanel: boolean;
  setShowMarketOutlookPanel: (show: boolean) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onMarketHealthChange: (marketHealth: MarketHealth) => Promise<void>;
}

const MarketOutlookSection: React.FC<MarketOutlookSectionProps> = ({
  formData,
  showMarketOutlookPanel,
  setShowMarketOutlookPanel,
  setFormData,
  onMarketHealthChange,
}) => {
  // Get market health display info
  const getMarketSizingInfo = useCallback((marketHealth: MarketHealth) => {
    switch (marketHealth) {
      case 'confirmed-uptrend':
        return {
          label: 'Confirmed Uptrend',
          icon: '🚀',
          color: 'emerald',
          description: 'Strong bullish momentum - Full position sizing',
          sizingLevel: 100,
          adjustment: '100%',
        };
      case 'uptrend-under-pressure':
        return {
          label: 'Uptrend Under Pressure',
          icon: '🔥',
          color: 'yellow',
          description: 'Weakening momentum - Reduced position sizing',
          sizingLevel: 75,
          adjustment: '75%',
        };
      case 'rally-attempt':
        return {
          label: 'Rally Attempt',
          icon: '⚖️',
          color: 'orange',
          description: 'Uncertain direction - Conservative sizing',
          sizingLevel: 50,
          adjustment: '50%',
        };
      case 'downtrend':
        return {
          label: 'Downtrend',
          icon: '🩸',
          color: 'red',
          description: 'Bearish conditions - Minimal position sizing',
          sizingLevel: 25,
          adjustment: '25%',
        };
      default:
        return {
          label: 'Unknown',
          icon: '❓',
          color: 'gray',
          description: 'Market status unclear',
          sizingLevel: 50,
          adjustment: '50%',
        };
    }
  }, []);

  return (
    <>
      {/* Market Outlook - Fixed Compact Design */}
      <div className={showMarketOutlookPanel ? 'mb-6' : ''}>
        <div
          className="flex items-center justify-between px-3 py-3 rounded-2xl bg-black/30 border border-green-500/20 cursor-pointer hover:border-green-400/40 transition-all duration-500 ease-out hover:bg-black/40 hover:shadow-lg hover:shadow-green-500/10 hover:scale-[1.02] transform"
          onClick={() => setShowMarketOutlookPanel(!showMarketOutlookPanel)}
        >
          {/* Left - Status & Title */}
          <div className="flex items-center space-x-3">
            {/* Creative Market Icon */}
            <div className="relative">
              <svg
                className={`w-5 h-5 transition-colors duration-300 ${
                  formData.marketHealth === 'confirmed-uptrend'
                    ? 'text-green-400'
                    : formData.marketHealth === 'uptrend-under-pressure'
                    ? 'text-yellow-400'
                    : formData.marketHealth === 'rally-attempt'
                    ? 'text-orange-400'
                    : 'text-red-400'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              {/* Subtle glow effect */}
              <div
                className={`absolute inset-0 blur-sm opacity-30 ${
                  formData.marketHealth === 'confirmed-uptrend'
                    ? 'bg-green-400'
                    : formData.marketHealth === 'uptrend-under-pressure'
                    ? 'bg-yellow-400'
                    : formData.marketHealth === 'rally-attempt'
                    ? 'bg-orange-400'
                    : 'bg-red-400'
                }`}
              ></div>
            </div>
            <span className="text-white font-medium text-sm">
              MARKET OUTLOOK
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-600/40"></div>

          {/* Center - Condition */}
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">
              CONDITION
            </div>
            <div
              className={`font-semibold text-sm ${
                formData.marketHealth === 'confirmed-uptrend'
                  ? 'text-green-300'
                  : formData.marketHealth === 'uptrend-under-pressure'
                  ? 'text-yellow-300'
                  : formData.marketHealth === 'rally-attempt'
                  ? 'text-orange-300'
                  : 'text-red-300'
              }`}
            >
              {getMarketSizingInfo(formData.marketHealth).label}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-600/40"></div>

          {/* Right - Sizing & Arrow */}
          <div className="flex items-center space-x-2">
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">
                SIZING
              </div>
              <div className="text-orange-400 font-bold text-sm">
                {getMarketSizingInfo(formData.marketHealth).adjustment}
              </div>
            </div>
            <svg
              className={`w-4 h-4 text-white/60 transition-all duration-500 ease-in-out transform ${
                showMarketOutlookPanel
                  ? 'rotate-90 text-purple-400 scale-110'
                  : 'scale-100 hover:scale-105'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanding Market Command Center - Gaming Style with 2x2 Layout */}
      <div
        className={`mb-6 transition-all duration-700 ease-in-out overflow-hidden transform ${
          showMarketOutlookPanel
            ? 'max-h-[800px] opacity-100 translate-y-0 scale-100'
            : 'max-h-0 opacity-0 -translate-y-4 scale-95'
        }`}
      >
        {showMarketOutlookPanel && (
          <div
            className={`transition-all duration-500 ease-out delay-100 ${
              showMarketOutlookPanel
                ? 'opacity-100 transform translate-y-0'
                : 'opacity-0 transform translate-y-2'
            }`}
          >
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30 backdrop-blur-sm">
              {/* Enhanced Gaming Particle Background */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className={`absolute top-0 left-0 w-2 h-2 bg-cyan-400/40 rounded-full transition-all duration-700 ${
                    showMarketOutlookPanel
                      ? 'animate-pulse opacity-100 scale-100'
                      : 'opacity-0 scale-0'
                  }`}
                ></div>
                <div
                  className={`absolute top-4 right-4 w-1 h-1 bg-indigo-400/50 rounded-full transition-all duration-700 delay-200 ${
                    showMarketOutlookPanel
                      ? 'animate-pulse opacity-100 scale-100'
                      : 'opacity-0 scale-0'
                  }`}
                ></div>
                <div
                  className={`absolute bottom-6 left-8 w-1.5 h-1.5 bg-purple-400/30 rounded-full transition-all duration-700 delay-400 ${
                    showMarketOutlookPanel
                      ? 'animate-pulse opacity-100 scale-100'
                      : 'opacity-0 scale-0'
                  }`}
                ></div>
                <div
                  className={`absolute top-1/2 left-1/4 w-1 h-1 bg-teal-400/25 rounded-full transition-all duration-700 delay-600 ${
                    showMarketOutlookPanel
                      ? 'animate-pulse opacity-100 scale-100'
                      : 'opacity-0 scale-0'
                  }`}
                ></div>
              </div>

              {/* Market Trend Tiles - Matching Risk Tab Style */}
              <div className="grid grid-cols-2 gap-3 relative z-10">
                {[
                  {
                    key: 'confirmed-uptrend',
                    label: 'Confirmed Uptrend',
                    subtitle: 'Full aggression',
                    icon: (
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ),
                    borderColor: 'border-green-400',
                    bgActive: 'bg-green-500/10',
                    bgHover: 'hover:bg-green-500/5',
                    textActive: 'text-green-300',
                    textHover: 'hover:text-green-300',
                    borderHover: 'hover:border-green-400/50',
                    shadowActive: 'shadow-green-500/30',
                    gradientActive:
                      'from-green-600/40 via-emerald-600/40 to-teal-600/40',
                    glowColor: 'text-green-400',
                  },
                  {
                    key: 'uptrend-under-pressure',
                    label: 'Uptrend Under Pressure',
                    subtitle: 'Reduced size',
                    icon: (
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ),
                    borderColor: 'border-yellow-400',
                    bgActive: 'bg-yellow-500/10',
                    bgHover: 'hover:bg-yellow-500/5',
                    textActive: 'text-yellow-300',
                    textHover: 'hover:text-yellow-300',
                    borderHover: 'hover:border-yellow-400/50',
                    shadowActive: 'shadow-yellow-500/30',
                    gradientActive:
                      'from-yellow-600/40 via-amber-600/40 to-orange-600/40',
                    glowColor: 'text-yellow-400',
                  },
                  {
                    key: 'rally-attempt',
                    label: 'Rally Attempt',
                    subtitle: 'Half position',
                    icon: (
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ),
                    borderColor: 'border-orange-400',
                    bgActive: 'bg-orange-500/10',
                    bgHover: 'hover:bg-orange-500/5',
                    textActive: 'text-orange-300',
                    textHover: 'hover:text-orange-300',
                    borderHover: 'hover:border-orange-400/50',
                    shadowActive: 'shadow-orange-500/30',
                    gradientActive:
                      'from-orange-600/40 via-red-600/40 to-pink-600/40',
                    glowColor: 'text-orange-400',
                  },
                  {
                    key: 'downtrend',
                    label: 'Downtrend',
                    subtitle: 'Min position',
                    icon: (
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ),
                    borderColor: 'border-red-400',
                    bgActive: 'bg-red-500/10',
                    bgHover: 'hover:bg-red-500/5',
                    textActive: 'text-red-300',
                    textHover: 'hover:text-red-300',
                    borderHover: 'hover:border-red-400/50',
                    shadowActive: 'shadow-red-500/30',
                    gradientActive:
                      'from-red-600/40 via-pink-600/40 to-rose-600/40',
                    glowColor: 'text-red-400',
                  },
                ].map((trend, index) => (
                  <button
                    key={trend.key}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        marketHealth: trend.key as MarketHealth,
                      }));
                    }}
                    className={`group relative p-3 text-sm font-bold rounded-xl border-2 transition-all duration-500 hover:scale-105 overflow-hidden transform ${
                      showMarketOutlookPanel
                        ? `translate-y-0 opacity-100 ${
                            index === 0
                              ? 'delay-300'
                              : index === 1
                              ? 'delay-400'
                              : index === 2
                              ? 'delay-500'
                              : 'delay-600'
                          }`
                        : 'translate-y-4 opacity-0'
                    } ${
                      formData.marketHealth === trend.key
                        ? `${trend.borderColor} ${trend.bgActive} shadow-lg ${trend.shadowActive} ${trend.textActive} scale-105`
                        : `border-purple-500/30 bg-black/30 text-purple-300 ${trend.borderHover} ${trend.bgHover} ${trend.textHover}`
                    }`}
                  >
                    {/* Animated background - matching risk tabs */}
                    <div className="absolute inset-0 opacity-20">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                          formData.marketHealth === trend.key
                            ? `${trend.gradientActive} animate-pulse`
                            : 'from-transparent to-transparent'
                        }`}
                      ></div>
                    </div>

                    {/* Achievement indicator - top right corner, only when selected */}
                    {formData.marketHealth === trend.key && (
                      <div className="absolute top-3 right-3 z-20">
                        <div
                          className={`w-2 h-2 rounded-full ${trend.glowColor.replace(
                            'text-',
                            'bg-'
                          )} animate-pulse shadow-lg`}
                        ></div>
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col items-center space-y-2">
                      {/* Icon with glow effect - matching risk tabs */}
                      <div className="relative transition-all duration-300 group-hover:scale-110">
                        <div
                          className={`transition-colors duration-300 ${
                            formData.marketHealth === trend.key
                              ? trend.glowColor
                              : 'text-purple-400 group-hover:' +
                                trend.glowColor.split('-')[1]
                          }`}
                        >
                          {trend.icon}
                        </div>

                        {/* Glow effect */}
                        {formData.marketHealth === trend.key && (
                          <div
                            className={`absolute inset-0 ${trend.glowColor} opacity-50 blur-sm animate-pulse`}
                            aria-hidden="true"
                          >
                            {trend.icon}
                          </div>
                        )}
                      </div>

                      {/* Text content */}
                      <div className="text-center space-y-1">
                        <div className="font-bold text-xs tracking-wider leading-tight">
                          {trend.label}
                        </div>
                        <div className="text-xs opacity-80 leading-tight">
                          {trend.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Particle effects - subtle */}
                    <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-current opacity-30 animate-pulse"></div>
                    <div
                      className="absolute bottom-3 left-3 w-0.5 h-0.5 rounded-full bg-current opacity-20 animate-pulse"
                      style={{ animationDelay: '1s' }}
                    ></div>
                  </button>
                ))}
              </div>

              {/* Educational Risk Management Insight */}
              <div className="mt-6 pt-4 border-t border-purple-400/20 relative z-10">
                <div className="bg-gradient-to-r from-indigo-900/30 via-purple-900/40 to-blue-900/30 rounded-xl p-4 border border-indigo-400/30 relative overflow-hidden">
                  {/* Floating wisdom particles */}
                  <div className="absolute top-2 right-4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-60"></div>
                  <div
                    className="absolute bottom-3 left-6 w-0.5 h-0.5 bg-purple-400 rounded-full animate-pulse opacity-40"
                    style={{ animationDelay: '1.5s' }}
                  ></div>

                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">
                        Market Wizard Insight
                      </h3>
                      <p className="text-gray-400 text-xs">
                        Mark Minervini's Risk Philosophy
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Risk Visualization */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Current Market Risk */}
                    <div className="bg-black/30 rounded-lg p-3 border border-slate-600/40">
                      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
                        Market Environment
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            formData.marketHealth === 'confirmed-uptrend'
                              ? 'bg-green-400'
                              : formData.marketHealth ===
                                'uptrend-under-pressure'
                              ? 'bg-yellow-400'
                              : formData.marketHealth === 'rally-attempt'
                              ? 'bg-orange-400'
                              : 'bg-red-400'
                          } animate-pulse`}
                        ></div>
                        <span
                          className={`text-sm font-bold ${
                            formData.marketHealth === 'confirmed-uptrend'
                              ? 'text-green-300'
                              : formData.marketHealth ===
                                'uptrend-under-pressure'
                              ? 'text-yellow-300'
                              : formData.marketHealth === 'rally-attempt'
                              ? 'text-orange-300'
                              : 'text-red-300'
                          }`}
                        >
                          {formData.marketHealth === 'confirmed-uptrend'
                            ? 'LOW RISK'
                            : formData.marketHealth === 'uptrend-under-pressure'
                            ? 'MEDIUM RISK'
                            : formData.marketHealth === 'rally-attempt'
                            ? 'HIGH RISK'
                            : 'VERY HIGH RISK'}
                        </span>
                      </div>
                    </div>

                    {/* Position Adjustment */}
                    <div className="bg-black/30 rounded-lg p-3 border border-slate-600/40">
                      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
                        ADJUSTED SIZE
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-3 h-3 text-cyan-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-cyan-300 text-sm font-bold">
                          {
                            getMarketSizingInfo(formData.marketHealth)
                              .adjustment
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Wisdom Quote */}
                  <div className="bg-gradient-to-r from-slate-800/60 to-purple-800/40 rounded-lg p-3 border-l-2 border-amber-400">
                    <div className="flex items-start space-x-3">
                      <div className="text-amber-400 text-lg leading-none">
                        "
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-200 text-xs leading-relaxed italic">
                          {formData.marketHealth === 'confirmed-uptrend'
                            ? 'In strong markets, be more aggressive. When stocks are working, increase position sizes progressively.'
                            : formData.marketHealth === 'uptrend-under-pressure'
                            ? 'In weak markets, make adjustments - take quicker profits and smaller losses to preserve capital.'
                            : formData.marketHealth === 'rally-attempt'
                            ? "During rally attempts, reduce risk. It's not how often you trade, but how profitable your trades are."
                            : 'In bear markets, protect capital above all. The best traders reduce position size when conditions deteriorate.'}
                        </p>
                        <div className="text-amber-400 text-xs mt-1 font-medium">
                          — Mark Minervini, Stock Market Wizard
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Action */}
                  <div className="mt-4 pt-3 border-t border-indigo-400/20">
                    <button
                      onClick={async () => {
                        await onMarketHealthChange(formData.marketHealth);
                        setShowMarketOutlookPanel(false);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-purple-500/30 flex items-center justify-center space-x-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Apply Market Trend</span>
                    </button>

                    {/* Quick tip */}
                    <div className="mt-2 text-center">
                      <span className="text-xs text-gray-400">
                        💡 Position size automatically adjusted to{' '}
                        {getMarketSizingInfo(formData.marketHealth).adjustment}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MarketOutlookSection;
