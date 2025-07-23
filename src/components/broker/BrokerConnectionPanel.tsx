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
  const {
    data: activeSession,
    isLoading: isLoadingActiveSession,
    isError: isActiveSessionError,
  } = useQuery({
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

  // Show loading indicator while checking active session (to prevent UI flickering)
  if (isLoadingActiveSession) {
    return (
      <div className="mb-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 rounded-2xl p-4 mb-3 border border-violet-400/30 backdrop-blur-md animate-pulse">
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-violet-400/40 border-t-violet-300 rounded-full animate-spin"></div>
              <span className="text-violet-200 text-sm font-medium">
                Checking broker session...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If session check failed, continue to show the panel
  if (isActiveSessionError) {
    // Continue to render the panel normally
  }

  return (
    <div className={`mb-6 ${className}`}>
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 rounded-2xl p-4 mb-3 border border-violet-400/30 backdrop-blur-md hover:border-violet-300/60 transition-all duration-700 hover:shadow-2xl hover:shadow-violet-500/20 group transform hover:scale-[1.01]">
        {/* Enhanced Particle Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating particles */}
          <div className="absolute top-3 left-8 w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
          <div
            className="absolute top-6 right-12 w-1 h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-pulse shadow-lg shadow-violet-400/50"
            style={{ animationDelay: '0.7s' }}
          ></div>
          <div
            className="absolute bottom-4 left-16 w-0.5 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-pulse shadow-lg shadow-pink-400/50"
            style={{ animationDelay: '1.2s' }}
          ></div>
          <div
            className="absolute bottom-3 right-6 w-1.5 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"
            style={{ animationDelay: '1.8s' }}
          ></div>

          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent animate-pulse opacity-60"></div>

          {/* Subtle moving background pattern */}
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.1),transparent_50%)] animate-pulse"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ring-2 ring-violet-400/20 group-hover:ring-violet-300/40">
              <svg
                className="w-4 h-4 text-white drop-shadow-sm"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm bg-gradient-to-r from-violet-200 via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-1.5 group-hover:from-violet-100 group-hover:via-cyan-100 group-hover:to-blue-100 transition-all duration-500">
              From Calculation to Execution — Instantly
            </h4>
            <p className="text-slate-300/90 text-xs font-medium leading-relaxed group-hover:text-slate-200/95 transition-colors duration-300">
              {Object.values(connectionStage).find((stage) => stage) ? (
                <span className="text-violet-300 animate-pulse font-semibold">
                  {Object.values(connectionStage).find((stage) => stage)}
                </span>
              ) : (
                <>
                  No switching apps, no manual errors,{' '}
                  <span className="text-cyan-300 font-semibold">
                    Every second counts.
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Status Indicator */}
          {/* Enhanced Broker Selection with Names */}
          {!isLoading && brokers.length > 0 && (
            <div className="pt-3 border-t border-violet-400/20 bg-gradient-to-r from-transparent via-violet-900/10 to-transparent">
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
                      } text-left relative overflow-hidden backdrop-blur-md rounded-xl border transition-all duration-500 hover:scale-[1.02] hover:-translate-y-0.5 p-3 group/broker ${
                        hasError
                          ? 'bg-gradient-to-br from-rose-950/80 via-red-900/60 to-pink-950/80 border-red-400/50 hover:border-red-300/70 hover:shadow-xl hover:shadow-red-500/20'
                          : hasSuccess
                          ? 'bg-gradient-to-br from-emerald-950/80 via-green-900/60 to-teal-950/80 border-emerald-400/50 hover:border-emerald-300/70 hover:shadow-xl hover:shadow-emerald-500/20'
                          : isLoadingBroker
                          ? 'bg-gradient-to-br from-amber-950/80 via-yellow-900/60 to-orange-950/80 border-yellow-400/50 animate-pulse'
                          : 'bg-gradient-to-br from-slate-950/80 via-slate-800/60 to-slate-950/80 border-violet-400/40 hover:border-violet-300/60 hover:shadow-xl hover:shadow-violet-500/15'
                      }`}
                    >
                      {/* Enhanced particle effects */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {!hasError && !isLoadingBroker && (
                          <>
                            <div className="absolute top-2 right-3 w-1 h-1 bg-gradient-to-r from-violet-400 to-cyan-400 rounded-full animate-pulse shadow-lg shadow-violet-400/50"></div>
                            <div
                              className="absolute bottom-2 left-4 w-0.5 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse shadow-lg shadow-pink-400/50"
                              style={{ animationDelay: '1.5s' }}
                            ></div>
                          </>
                        )}

                        {/* Enhanced shimmer effect */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent transition-all duration-700 ${
                            isLoadingBroker || hasSuccess
                              ? 'opacity-100 animate-pulse'
                              : 'opacity-0 group-hover/broker:opacity-30'
                          }`}
                        ></div>

                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover/broker:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                      </div>

                      <div className="relative flex items-center space-x-3">
                        {/* Enhanced Logo Container */}
                        <div className="relative flex-shrink-0">
                          <div>
                            {/* Enhanced Loading Overlays */}
                            {isLoadingBroker && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                                <div className="relative">
                                  <div className="w-4 h-4 border-2 border-amber-400/40 border-t-amber-300 rounded-full animate-spin shadow-lg shadow-amber-400/30"></div>
                                  <div
                                    className="absolute inset-0 w-4 h-4 border-2 border-transparent border-r-orange-400 rounded-full animate-spin"
                                    style={{
                                      animationDirection: 'reverse',
                                      animationDuration: '1.2s',
                                    }}
                                  ></div>
                                  <div
                                    className="absolute inset-0 w-4 h-4 border border-transparent border-l-yellow-300 rounded-full animate-spin"
                                    style={{
                                      animationDuration: '2s',
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {hasSuccess && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                                <div className="relative">
                                  <svg
                                    className="w-5 h-5 text-emerald-300 drop-shadow-lg animate-bounce"
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
                                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
                                </div>
                              </div>
                            )}

                            {hasError && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                                <div className="relative">
                                  <svg
                                    className="w-4 h-4 text-red-300 drop-shadow-lg animate-pulse"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M12 8v4m0 4h.01"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 bg-red-400/20 rounded-full animate-pulse"></div>
                                </div>
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
                                  className="w-5 h-5 object-contain filter drop-shadow-md group-hover/broker:drop-shadow-lg transition-all duration-300 group-hover/broker:scale-105"
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

                        {/* Enhanced Arrow indicator */}
                        {!isLoadingBroker && !hasError && !hasSuccess && (
                          <div className="flex-shrink-0">
                            <div className="relative">
                              <svg
                                className="w-4 h-4 text-violet-400/70 transition-all duration-300 group-hover/broker:text-violet-300 group-hover/broker:translate-x-1 drop-shadow-sm"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              <div className="absolute inset-0 bg-violet-400/10 rounded-full group-hover/broker:bg-violet-400/20 transition-colors duration-300"></div>
                            </div>
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
                  className="p-3 bg-gradient-to-br from-rose-950/80 via-red-900/60 to-pink-950/80 border border-red-400/50 rounded-xl backdrop-blur-md shadow-lg shadow-red-500/10"
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

      {/* Enhanced Empty state */}
      {!isLoading && brokers.length === 0 && (
        <div className="mt-3 text-center py-6 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-slate-950/80 backdrop-blur-md rounded-xl border border-violet-400/30 shadow-xl">
          <div className="relative mx-auto mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-violet-400/20 flex items-center justify-center shadow-lg">
              <span className="text-violet-300 text-lg animate-pulse">📊</span>
            </div>
            <div className="absolute inset-0 bg-violet-400/10 rounded-xl animate-pulse"></div>
          </div>
          <span className="text-slate-200 text-sm font-medium">
            No brokers available
          </span>
          <p className="text-slate-400 text-xs mt-1">
            Check your connection and try again
          </p>
        </div>
      )}

      {/* Enhanced Force Connect Modal */}
      {showForceConnect && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-amber-400/40 max-w-md mx-4 shadow-2xl shadow-amber-500/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                <svg
                  className="w-4 h-4 text-white"
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
              <h4 className="text-white text-lg font-semibold">
                Broker Already Connected
              </h4>
            </div>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              You already have an active broker connection. Would you like to
              disconnect and connect to this broker instead?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowForceConnect(false)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-600 text-slate-200 rounded-xl hover:from-slate-600 hover:to-slate-500 transition-all duration-300 font-medium border border-slate-500/30 hover:border-slate-400/50"
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-400 hover:to-orange-500 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-amber-400/30"
              >
                {forceConnectMutation.isPending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  'Yes, Switch'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerConnectionPanel;
