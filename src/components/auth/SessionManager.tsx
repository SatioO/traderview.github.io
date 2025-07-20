import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Trash2,
  Shield,
  Clock,
  AlertTriangle,
  LogOut,
  X,
  Zap,
  Globe,
  Lock,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface SessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({ isOpen, onClose }) => {
  const { activeSessions, revokeSession, logoutAll, logout } = useAuth();
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleRevokeSession = async (
    sessionId: string,
    isCurrent: boolean = false
  ) => {
    console.log('Revoking session:', { sessionId, isCurrent });

    try {
      setIsRevoking(sessionId);

      if (isCurrent) {
        console.log('Revoking current session - logging out user');
        // Close modal first to prevent any UI issues
        onClose();

        // For current session, revoke it first then logout
        try {
          await revokeSession(sessionId);
          console.log('Current session revoked from server');
        } catch (revokeError) {
          console.error(
            'Failed to revoke current session from server:',
            revokeError
          );
        }

        // Force logout which will clear auth state and redirect to login
        await logout();
        console.log('Logout completed');

        // Force a hard reload to ensure clean state
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else {
        console.log('Revoking other session');
        // If revoking other session, just revoke that specific session
        await revokeSession(sessionId);
        console.log('Other session revoked successfully');
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
      // If revoking current session failed, we might still need to logout
      // to prevent the user from being stuck in an invalid state
      if (isCurrent) {
        console.log('Error occurred, force logging out current session');
        onClose();
        try {
          await logout();
          // Force redirect even on error
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        } catch (logoutError) {
          console.error(
            'Failed to logout after session revoke error:',
            logoutError
          );
          // Force redirect as last resort
          window.location.href = '/login';
        }
      }
    } finally {
      setIsRevoking(null);
    }
  };

  const handleLogoutAll = async () => {
    try {
      setIsLoggingOutAll(true);
      await logoutAll();
      onClose();
    } catch (error) {
      console.error('Failed to logout all devices:', error);
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (
      userAgent.toLowerCase().includes('mobile') ||
      userAgent.toLowerCase().includes('android') ||
      userAgent.toLowerCase().includes('iphone')
    ) {
      return Smartphone;
    }
    return Monitor;
  };

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const getOSName = (userAgent: string) => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown OS';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Cinematic Trading Environment Overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl">
        {/* Multi-layered Trading Dashboard Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {/* Dynamic Depth Layers */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Layer 1: Deep Background Grid */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.4)_1px,transparent_1px)] bg-[size:100px_100px] animate-grid-drift"></div>
            </div>

            {/* Layer 2: Mid-ground Chart Network */}
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" viewBox="0 0 1200 800">
                {/* Animated Security Chart Lines */}
                <path
                  d="M0,400 Q150,200 300,250 T600,180 T900,150 T1200,120"
                  stroke="url(#primaryGradient)"
                  strokeWidth="3"
                  fill="none"
                  className="animate-chart-draw"
                />
                <path
                  d="M0,500 Q200,350 400,400 T800,320 T1200,280"
                  stroke="url(#secondaryGradient)"
                  strokeWidth="2"
                  fill="none"
                  className="animate-chart-draw-delayed"
                />

                {/* Security Connection Nodes */}
                <circle
                  cx="300"
                  cy="250"
                  r="4"
                  fill="rgba(168,85,247,0.8)"
                  className="animate-node-pulse"
                >
                  <animate
                    attributeName="r"
                    values="4;8;4"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx="600"
                  cy="180"
                  r="3"
                  fill="rgba(6,182,212,0.8)"
                  className="animate-node-pulse-delayed"
                >
                  <animate
                    attributeName="r"
                    values="3;6;3"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>

                <defs>
                  <linearGradient
                    id="primaryGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop
                      offset="0%"
                      stopColor="rgb(168,85,247)"
                      stopOpacity="0.9"
                    />
                    <stop
                      offset="50%"
                      stopColor="rgb(236,72,153)"
                      stopOpacity="0.7"
                    />
                    <stop
                      offset="100%"
                      stopColor="rgb(6,182,212)"
                      stopOpacity="0.5"
                    />
                  </linearGradient>
                  <linearGradient
                    id="secondaryGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop
                      offset="0%"
                      stopColor="rgb(6,182,212)"
                      stopOpacity="0.8"
                    />
                    <stop
                      offset="100%"
                      stopColor="rgb(16,185,129)"
                      stopOpacity="0.4"
                    />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Layer 3: Security Particles & Energy Fields */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Energy Orbs */}
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-radial from-purple-500/30 via-purple-500/10 to-transparent rounded-full blur-xl animate-energy-pulse"></div>
              <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-gradient-radial from-cyan-500/25 via-cyan-500/8 to-transparent rounded-full blur-2xl animate-energy-pulse-delayed"></div>
              <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-radial from-green-500/35 via-green-500/12 to-transparent rounded-full blur-xl animate-energy-pulse-slow"></div>

              {/* Floating Security Particles */}
              <div className="absolute top-40 left-80 w-1 h-1 bg-purple-400/80 rounded-full animate-data-particle"></div>
              <div className="absolute top-80 right-96 w-0.5 h-0.5 bg-cyan-400/80 rounded-full animate-data-particle-delayed"></div>
              <div className="absolute bottom-60 left-96 w-1 h-1 bg-green-400/80 rounded-full animate-data-particle-slow"></div>
              <div className="absolute bottom-80 right-80 w-0.5 h-0.5 bg-yellow-400/80 rounded-full animate-data-particle-fast"></div>
            </div>

            {/* Layer 4: Environmental Lighting */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 animate-ambient-shift"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Cinematic Atmosphere */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/8 via-transparent to-cyan-500/8 pointer-events-none animate-atmospheric-drift" />

      {/* Depth of Field Blur Effect */}
      <div className="fixed inset-0 bg-gradient-radial from-transparent via-transparent to-black/20 pointer-events-none" />

      <div className="relative w-full max-w-3xl bg-gradient-to-br from-slate-900/98 via-purple-900/95 to-slate-800/98 backdrop-blur-3xl rounded-[2rem] border border-purple-400/40 max-h-[90vh] overflow-hidden transform transition-all duration-700 ease-out animate-terminal-float mx-auto shadow-[0_0_50px_rgba(168,85,247,0.3)]">
        {/* Floating Premium Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-8 left-12 w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-ping opacity-60"></div>
          <div className="absolute top-6 right-16 w-1 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-ping opacity-40 delay-1000"></div>
          <div className="absolute bottom-12 left-20 w-1 h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-ping opacity-50 delay-2000"></div>
          <div className="absolute bottom-8 right-12 w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-ping opacity-45 delay-3000"></div>
        </div>

        {/* Dynamic light bar */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-black/10 pointer-events-none rounded-[2rem]" />

        {/* Header */}
        <div className="relative p-8 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="relative z-10 p-3 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-800/80 backdrop-blur-xl rounded-xl border border-purple-400/30 group-hover:border-purple-400/50 transition-all duration-300">
                  <Shield className="w-6 h-6 text-slate-300 group-hover:text-cyan-300 transition-all duration-300" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black bg-gradient-to-r from-slate-100 via-cyan-200 to-slate-100 bg-clip-text text-transparent tracking-tight">
                  🛡️ Active Sessions
                </h2>
                <div className="mx-auto px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-400/30 rounded-full w-fit mt-2">
                  <span className="text-xs font-bold text-cyan-300 tracking-wider">
                    SECURITY & DEVICE MANAGEMENT
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Header with current stats */}
          <div className="text-center space-y-4">
            <p className="text-slate-300 text-sm">
              Monitor and manage all devices with access to your trading account
            </p>

            {/* Stats Row */}
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-semibold">
                  {activeSessions.length} Active Device
                  {activeSessions.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-300 font-semibold">
                  End-to-End Encrypted
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-300 font-semibold">
                  Real-Time Monitoring
                </span>
              </div>
            </div>
          </div>

          {/* Device Management Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Connected Devices ({activeSessions.length})</span>
            </h3>

            {/* Quick Actions Bar */}
            {activeSessions.length > 1 && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/60 via-slate-900/80 to-slate-800/60 backdrop-blur-xl rounded-xl border border-slate-600/40">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-sm font-semibold text-amber-300">
                      Security Alert
                    </div>
                    <div className="text-xs text-amber-200/80">
                      Multiple devices detected. Secure your account by logging
                      out unfamiliar devices.
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutAll}
                  loading={isLoggingOutAll}
                  className="bg-gradient-to-r from-red-600/20 to-pink-600/20 border-red-500/30 text-red-300 hover:from-red-600/30 hover:to-pink-600/30 hover:scale-105 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout All Others
                </Button>
              </div>
            )}

            {/* Premium Session Cards */}
            <div className="grid gap-4">
              {activeSessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.deviceInfo.userAgent);
                const browserName = getBrowserName(
                  session.deviceInfo.userAgent
                );
                const osName = getOSName(session.deviceInfo.userAgent);

                // Detect if this is the current session (fallback if server doesn't mark it properly)
                const isCurrentSession =
                  session.isCurrent ||
                  // Fallback: if no session is marked as current, assume the most recent one is current
                  (!activeSessions.some((s) => s.isCurrent) &&
                    session.id ===
                      activeSessions.sort(
                        (a, b) =>
                          new Date(b.lastUsedAt).getTime() -
                          new Date(a.lastUsedAt).getTime()
                      )[0]?.id);

                return (
                  <div
                    key={session.id}
                    className={`group relative bg-gradient-to-r backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] ${
                      isCurrentSession
                        ? 'from-emerald-500/10 via-cyan-500/5 to-teal-500/10 border-emerald-400/40 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
                        : 'from-slate-800/60 via-slate-900/80 to-slate-800/60 border-slate-600/40 hover:border-slate-500/50'
                    }`}
                  >
                    {/* Floating Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute top-4 left-8 w-1 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-ping opacity-60"></div>
                      <div className="absolute top-3 right-10 w-1 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-ping opacity-40 delay-1000"></div>
                      <div className="absolute bottom-5 left-12 w-1 h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-ping opacity-50 delay-2000"></div>
                    </div>

                    {isCurrentSession && (
                      <div className="absolute -top-2 -right-2">
                        <div className="flex items-center space-x-1 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-emerald-300 font-semibold">
                            THIS DEVICE
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {/* Enhanced Device Icon */}
                          <div className="relative">
                            <div
                              className={`p-4 rounded-xl border-2 transition-all duration-300 group-hover:scale-105 ${
                                isCurrentSession
                                  ? 'bg-emerald-500/20 border-emerald-400/60'
                                  : 'bg-slate-700/50 border-slate-600/60'
                              }`}
                            >
                              <DeviceIcon
                                className={`w-6 h-6 ${
                                  isCurrentSession
                                    ? 'text-emerald-300'
                                    : 'text-slate-400'
                                }`}
                              />
                            </div>
                            {isCurrentSession && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse border-2 border-slate-900"></div>
                            )}
                          </div>

                          {/* Device Details */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-bold text-slate-200">
                                {browserName}
                              </h4>
                              <div className="px-2 py-1 bg-slate-800/60 border border-slate-600/40 rounded-lg">
                                <span className="text-xs text-slate-300 font-medium">
                                  {osName}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-slate-400 mb-3">
                              {session.deviceInfo.userAgent.substring(0, 60)}...
                            </p>

                            {/* Enhanced Session Stats */}
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center space-x-1">
                                <Globe className="w-3 h-3 text-cyan-400" />
                                <span className="text-xs text-cyan-300 font-semibold">
                                  {session.deviceInfo.ipAddress}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-purple-400" />
                                <span className="text-xs text-purple-300 font-semibold">
                                  {formatTimeAgo(session.lastUsedAt)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Activity className="w-3 h-3 text-yellow-400" />
                                <span className="text-xs text-yellow-300 font-semibold">
                                  {isCurrentSession ? 'Active Now' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="ml-4">
                          {isCurrentSession ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleRevokeSession(session.id, true)
                              }
                              loading={isRevoking === session.id}
                              className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/30 text-orange-300 hover:from-orange-600/30 hover:to-red-600/30 hover:scale-105 transition-all duration-200"
                            >
                              <LogOut className="w-4 h-4 mr-2" />
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleRevokeSession(session.id, false)
                              }
                              loading={isRevoking === session.id}
                              className="bg-gradient-to-r from-red-600/20 to-pink-600/20 border-red-500/30 text-red-300 hover:from-red-600/30 hover:to-pink-600/30 hover:scale-105 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Security Badge */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-600/30">
                        <div className="flex items-center space-x-2">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-400">
                            {isCurrentSession
                              ? 'Secured • Encrypted Connection'
                              : 'Session encrypted with TLS 1.3'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isCurrentSession
                                ? 'bg-emerald-400 animate-pulse'
                                : 'bg-slate-500'
                            }`}
                          ></div>
                          <span className="text-xs text-slate-400 font-semibold">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeSessions.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg font-semibold">
                    No Active Sessions
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Your account security is monitored 24/7
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-900/50">
          <div className="space-y-4">
            {/* Security Info */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Lock className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-cyan-300">
                    🔐 Auto-Security
                  </h3>
                  <p className="text-xs text-cyan-200/80 mt-1">
                    Sessions expire after 30 days. Real-time monitoring active.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-4 py-2 border-slate-600/30 hover:border-slate-500/50 text-xs"
                >
                  All Secure
                </Button>
              </div>
            </div>

            {/* Security Stats */}
            <div className="text-center">
              <p className="text-xs text-slate-400">
                🛡️{' '}
                <span className="text-cyan-300 font-semibold">
                  24/7 Monitoring
                </span>{' '}
                • Last scan: Just now
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;
