import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { brokerApiService } from '../../services/brokerApiService';

interface BrokerConnectionPanelProps {
  className?: string;
}

const BrokerConnectionPanel: React.FC<BrokerConnectionPanelProps> = ({
  className,
}) => {
  const [showForceConnect, setShowForceConnect] = useState(false);
  const [connectionStage, setConnectionStage] = useState<{
    [key: string]: string;
  }>({});
  const [connectionError, setConnectionError] = useState<{
    [key: string]: string;
  }>({});
  const [showSuccess, setShowSuccess] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Fetch available brokers
  const { data: brokersData, isLoading } = useQuery({
    queryKey: ['brokers', 'available'],
    queryFn: () => brokerApiService.getAvailableBrokers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch active session
  const { data: activeSession } = useQuery({
    queryKey: ['broker', 'active-session'],
    queryFn: () => brokerApiService.getActiveSession(),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  // Connect to broker mutation with progressive feedback
  const connectMutation = useMutation({
    mutationFn: async (brokerId: string) => {
      // Stage 1: Preparing connection
      setConnectionStage((prev) => ({
        ...prev,
        [brokerId]: 'Preparing connection...',
      }));
      setConnectionError((prev) => ({ ...prev, [brokerId]: '' }));

      await new Promise((resolve) => setTimeout(resolve, 800)); // Brief pause for UX

      // Stage 2: Getting login URL
      setConnectionStage((prev) => ({
        ...prev,
        [brokerId]: 'Getting login URL...',
      }));

      const response = await brokerApiService.connectBroker(brokerId);

      // Stage 3: Success
      setConnectionStage((prev) => ({
        ...prev,
        [brokerId]: 'Success! Redirecting...',
      }));
      setShowSuccess((prev) => ({ ...prev, [brokerId]: true }));

      return response;
    },
    onSuccess: (data, brokerId) => {
      // Brief success animation before redirect
      setTimeout(() => {
        setConnectionStage((prev) => ({
          ...prev,
          [brokerId]: `Redirecting to ${brokerId}...`,
        }));
        setTimeout(() => {
          window.location.href = data.loginUrl;
        }, 500);
      }, 1000);
    },
    onError: (error: Error, brokerId: string) => {
      setConnectionStage((prev) => ({ ...prev, [brokerId]: '' }));
      setShowSuccess((prev) => ({ ...prev, [brokerId]: false }));

      if (error.message?.includes('already connected')) {
        setShowForceConnect(true);
      } else {
        setConnectionError((prev) => ({
          ...prev,
          [brokerId]: error.message || 'Connection failed. Please try again.',
        }));
      }
    },
  });

  // Force connect mutation with same progressive feedback
  const forceConnectMutation = useMutation({
    mutationFn: async (brokerId: string) => {
      setConnectionStage((prev) => ({
        ...prev,
        [brokerId]: 'Disconnecting previous broker...',
      }));
      await new Promise((resolve) => setTimeout(resolve, 800));

      setConnectionStage((prev) => ({
        ...prev,
        [brokerId]: 'Getting login URL...',
      }));
      const response = await brokerApiService.forceConnectBroker(brokerId);

      setConnectionStage((prev) => ({
        ...prev,
        [brokerId]: 'Success! Redirecting...',
      }));
      setShowSuccess((prev) => ({ ...prev, [brokerId]: true }));

      return response;
    },
    onSuccess: (data) => {
      setTimeout(() => {
        window.location.href = data.loginUrl;
        setShowForceConnect(false);
      }, 1000);
    },
    onError: (error: Error, brokerId: string) => {
      setConnectionStage((prev) => ({ ...prev, [brokerId]: '' }));
      setConnectionError((prev) => ({
        ...prev,
        [brokerId]:
          error.message || 'Force connection failed. Please try again.',
      }));
    },
  });

  const handleConnect = async (brokerId: string) => {
    setConnectionError((prev) => ({ ...prev, [brokerId]: '' }));
    try {
      await connectMutation.mutateAsync(brokerId);
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleRetryConnect = async (brokerId: string) => {
    handleConnect(brokerId);
  };

  const handleForceConnect = async (brokerId: string) => {
    try {
      await forceConnectMutation.mutateAsync(brokerId);
    } catch (error) {
      console.error('Force connection error:', error);
    }
  };

  const hasActiveSession = activeSession?.hasActiveSession;
  const brokers = brokersData?.brokers || [];

  // Don't show if user has an active session
  if (hasActiveSession) {
    return null;
  }

  return (
    <div className={`mb-6 ${className}`}>
      {/* Gaming-Style Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900  to-cyan-500/15 rounded-2xl p-3 mb-3 border border-teal-500/30 backdrop-blur-sm hover:border-teal-400/50 transition-all duration-500 hover:shadow-teal-500/20 hover:shadow-lg group">
        {/* Particle Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 left-6 w-1 h-1 bg-teal-400/60 rounded-full animate-pulse"></div>
          <div
            className="absolute top-4 right-8 w-1 h-1 bg-emerald-400/40 rounded-full animate-pulse"
            style={{ animationDelay: '0.5s' }}
          ></div>
          <div
            className="absolute bottom-3 left-12 w-0.5 h-0.5 bg-cyan-400/50 rounded-full animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute bottom-2 right-4 w-1 h-1 bg-teal-300/30 rounded-full animate-pulse"
            style={{ animationDelay: '1.5s' }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6  to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs bg-gradient-to-r from-purple-300 to-green-300 bg-clip-text text-transparent mb-1">
              From Calculation to Execution — Instantly
            </h4>
            <p className="text-teal-200/90 text-xs font-medium leading-relaxed">
              {Object.values(connectionStage).find(stage => stage) || (
                <>
                  No switching apps, no manual errors,{' '}
                  <span className="text-emerald-300">Every second counts.</span>
                </>
              )}
            </p>
          </div>

          {/* Status Indicator */}
          {/* Enhanced Broker Selection with Names */}
          {!isLoading && brokers.length > 0 && (
            <div className="pt-2.5 p border-t border-teal-500/20">
              <div
                className={`${
                  brokers.length > 2
                    ? 'grid grid-cols-2 gap-2'
                    : 'flex space-x-2'
                }`}
              >
                {brokers.map((broker) => {
                  const isConnecting =
                    connectMutation.isPending &&
                    connectMutation.variables === broker.id;
                  const isForceConnecting =
                    forceConnectMutation.isPending &&
                    forceConnectMutation.variables === broker.id;
                  const isLoadingBroker = isConnecting || isForceConnecting;
                  const hasError = connectionError[broker.id];
                  const hasSuccess = showSuccess[broker.id];

                  return (
                    <button
                      key={broker.id}
                      onClick={() =>
                        hasError
                          ? handleRetryConnect(broker.id)
                          : handleConnect(broker.id)
                      }
                      disabled={isLoadingBroker || broker.isConnected}
                      className={`${
                        brokers.length > 2 ? 'w-full' : 'flex-1'
                      } text-left relative overflow-hidden backdrop-blur-sm rounded-lg border transition-all duration-300 hover:scale-[1.01] p-2 ${
                        hasError
                          ? 'bg-gradient-to-r from-red-900/30 to-red-800/20 border-red-500/40 hover:border-red-400/60'
                          : hasSuccess
                          ? 'bg-gradient-to-r from-emerald-900/30 to-green-800/20 border-emerald-500/40 hover:border-emerald-400/60'
                          : isLoadingBroker
                          ? 'bg-gradient-to-r from-yellow-900/30 to-amber-800/20 border-yellow-500/40'
                          : 'bg-gradient-to-r from-black/30 via-slate-900/40 to-black/30 border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-cyan-500/20'
                      }`}
                    >
                      {/* Gaming particle effects */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {!hasError && !isLoadingBroker && (
                          <>
                            <div className="absolute top-1 right-2 w-0.5 h-0.5 bg-cyan-400/30 rounded-full animate-pulse"></div>
                            <div
                              className="absolute bottom-1 left-3 w-0.5 h-0.5 bg-purple-400/20 rounded-full animate-pulse"
                              style={{ animationDelay: '1s' }}
                            ></div>
                          </>
                        )}

                        {/* Enhanced shimmer effect for loading/success */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-opacity duration-300 ${
                            isLoadingBroker || hasSuccess
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        ></div>
                      </div>

                      <div className="relative flex items-center space-x-3">
                        {/* Enhanced Logo Container */}
                        <div className="relative flex-shrink-0">
                          <div>
                            {/* Enhanced Loading Overlays */}
                            {isLoadingBroker && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                                <div className="relative">
                                  <div className="w-3 h-3 border border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin"></div>
                                  <div
                                    className="absolute inset-0 w-3 h-3 border border-transparent border-r-amber-400 rounded-full animate-spin"
                                    style={{
                                      animationDirection: 'reverse',
                                      animationDuration: '1.5s',
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {hasSuccess && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                                <svg
                                  className="w-4 h-4 text-emerald-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}

                            {hasError && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                                <svg
                                  className="w-3 h-3 text-red-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01"
                                  />
                                </svg>
                              </div>
                            )}

                            {/* Broker Logo */}
                            <div
                              className={`transition-all duration-300 ${
                                isLoadingBroker || hasSuccess || hasError
                                  ? 'opacity-30'
                                  : 'opacity-100'
                              }`}
                            >
                              {broker.icon ? (
                                <img
                                  src={broker.icon}
                                  alt={`${broker.name} logo`}
                                  className="w-4 h-4 object-contain filter drop-shadow-sm"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const emojiSpan =
                                      document.createElement('span');
                                    emojiSpan.className = 'text-xs';
                                    emojiSpan.textContent =
                                      broker.id === 'kite'
                                        ? '🔥'
                                        : broker.id === 'groww'
                                        ? '📈'
                                        : broker.id === 'angelone'
                                        ? '⚡'
                                        : '🏛️';
                                    target.parentElement!.appendChild(
                                      emojiSpan
                                    );
                                  }}
                                />
                              ) : (
                                <span className="text-xs">
                                  {broker.id === 'kite'
                                    ? '🔥'
                                    : broker.id === 'groww'
                                    ? '📈'
                                    : broker.id === 'angelone'
                                    ? '⚡'
                                    : '🏛️'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        {!isLoadingBroker && !hasError && !hasSuccess && (
                          <div className="flex-shrink-0">
                            <svg
                              className="w-3 h-3 text-cyan-400/60 transition-all duration-200 group-hover:text-cyan-400 group-hover:translate-x-0.5"
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
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Loading State within Header */}
        {isLoading && (
          <div className="flex items-center justify-between pt-3 border-t border-cyan-500/20">
            <span className="text-cyan-200 text-xs font-medium">
              Loading brokers...
            </span>
            <div className="flex items-center space-x-2">
              {[1, 2].map((index) => (
                <div
                  key={index}
                  className="w-9 h-9 bg-slate-800/50 rounded-lg border border-slate-600/40 animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Messages for Brokers */}
      {!isLoading &&
        brokers.length > 0 &&
        brokers.some((broker) => connectionError[broker.id]) && (
          <div className="mt-3 space-y-2">
            {brokers.map((broker) => {
              const hasError = connectionError[broker.id];
              if (!hasError) return null;

              return (
                <div
                  key={`error-${broker.id}`}
                  className="p-2 bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-500/40 rounded-lg backdrop-blur-sm"
                >
                  <p className="text-red-300 text-xs font-medium flex items-center space-x-2">
                    <svg
                      className="w-3 h-3 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01"
                      />
                    </svg>
                    <span>
                      <strong>{broker.name}:</strong> {hasError}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        )}

      {/* Empty state for no brokers */}
      {!isLoading && brokers.length === 0 && (
        <div className="mt-2 text-center py-4 bg-gradient-to-r from-black/40 via-slate-900/30 to-black/40 backdrop-blur-sm rounded-lg border border-purple-500/20">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/40 flex items-center justify-center mx-auto mb-2 shadow-lg">
            <span className="text-slate-400 text-sm">📊</span>
          </div>
          <span className="text-slate-300 text-xs font-medium">
            No brokers available
          </span>
        </div>
      )}

      {/* Force Connect Modal */}
      {showForceConnect && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 border border-orange-500/30 max-w-md mx-4">
            <h4 className="text-white text-lg font-semibold mb-2">
              Broker Already Connected
            </h4>
            <p className="text-gray-300 text-sm mb-4">
              You already have an active broker connection. Would you like to
              disconnect and connect to this broker instead?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowForceConnect(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (connectMutation.variables) {
                    handleForceConnect(connectMutation.variables);
                  }
                }}
                disabled={forceConnectMutation.isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {forceConnectMutation.isPending
                  ? 'Connecting...'
                  : 'Yes, Switch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerConnectionPanel;
