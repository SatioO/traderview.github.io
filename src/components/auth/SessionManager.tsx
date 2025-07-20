import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Trash2, 
  Shield, 
  MapPin, 
  Clock, 
  AlertTriangle,
  LogOut,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface SessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({ isOpen, onClose }) => {
  const { activeSessions, revokeSession, logoutAll, user } = useAuth();
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

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setIsRevoking(sessionId);
      await revokeSession(sessionId);
    } catch (error) {
      console.error('Failed to revoke session:', error);
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
    if (userAgent.toLowerCase().includes('mobile') || userAgent.toLowerCase().includes('android') || userAgent.toLowerCase().includes('iphone')) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900/98 via-purple-900/95 to-slate-800/98 backdrop-blur-3xl rounded-2xl border border-purple-400/40 shadow-2xl shadow-purple-500/20 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg border border-purple-400/30">
                <Users className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Active Sessions</h2>
                <p className="text-sm text-slate-400">
                  Manage devices signed in to {user?.firstName}'s account
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
            >
              <Shield className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Security Notice */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-300">Security Notice</h3>
                <p className="text-xs text-amber-200/80 mt-1">
                  If you see unfamiliar devices, revoke them immediately and change your password.
                </p>
              </div>
            </div>
          </div>

          {/* Active Sessions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">
                {activeSessions.length} Active Session{activeSessions.length !== 1 ? 's' : ''}
              </h3>
              {activeSessions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutAll}
                  loading={isLoggingOutAll}
                  className="text-red-300 border-red-500/30 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout All Devices
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {activeSessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.deviceInfo.userAgent);
                const browserName = getBrowserName(session.deviceInfo.userAgent);
                const osName = getOSName(session.deviceInfo.userAgent);

                return (
                  <div
                    key={session.id}
                    className={`relative p-4 rounded-lg border transition-all duration-200 ${
                      session.isCurrent
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-600/30 hover:border-slate-500/50'
                    }`}
                  >
                    {session.isCurrent && (
                      <div className="absolute top-2 right-2">
                        <div className="px-2 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded text-xs text-emerald-300 font-medium">
                          Current
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg ${
                          session.isCurrent 
                            ? 'bg-emerald-500/20 border border-emerald-400/30' 
                            : 'bg-slate-700/50 border border-slate-600/30'
                        }`}>
                          <DeviceIcon className={`w-5 h-5 ${
                            session.isCurrent ? 'text-emerald-300' : 'text-slate-400'
                          }`} />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-semibold text-slate-200">
                                {browserName} on {osName}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {session.deviceInfo.userAgent.substring(0, 80)}...
                            </p>
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-slate-400">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{session.deviceInfo.ipAddress}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Last active {formatTimeAgo(session.lastUsedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {!session.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeSession(session.id)}
                          loading={isRevoking === session.id}
                          className="text-red-300 border-red-500/30 hover:bg-red-500/10 ml-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {activeSessions.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No active sessions found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Sessions are automatically removed after 30 days of inactivity
            </p>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;