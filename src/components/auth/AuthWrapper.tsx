import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../LoadingScreen';
import AuthErrorBoundary from './AuthErrorBoundary';
import { Shield, WifiOff, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isLoading, loginError } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle retry attempts with exponential backoff
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    // Force a page reload to retry authentication
    window.location.reload();
  };

  // Show loading screen during authentication
  if (isLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  // Show offline notice if user is offline
  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-br from-slate-900/95 via-amber-900/90 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-amber-500/30 shadow-2xl shadow-amber-500/20 p-8 text-center space-y-6">
            <div className="relative mx-auto w-fit mb-4">
              <div className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-400/30 rounded-xl">
                <WifiOff className="w-8 h-8 text-amber-400" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-xl blur animate-pulse" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-amber-200 mb-2">
                You're Offline
              </h1>
              <p className="text-sm text-amber-300/80">
                Please check your internet connection and try again.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
            >
              <Shield className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication error if there's a persistent login error
  if (loginError && retryCount > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-br from-slate-900/95 via-red-900/90 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-2xl shadow-red-500/20 p-8 text-center space-y-6">
            <div className="relative mx-auto w-fit mb-4">
              <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-400/30 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-xl blur animate-pulse" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-red-200 mb-2">
                Authentication Failed
              </h1>
              <p className="text-sm text-red-300/80 mb-4">
                {loginError || 'Unable to authenticate your session.'}
              </p>
              <p className="text-xs text-slate-400">
                Attempts: {retryCount} / 3
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleRetry}
                disabled={retryCount >= 3}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="w-4 h-4 mr-2" />
                {retryCount >= 3 ? 'Max Retries Reached' : 'Retry Authentication'}
              </Button>

              {retryCount >= 3 && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => window.location.href = '/login'}
                  className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10"
                >
                  Go to Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wrap children in error boundary
  return (
    <AuthErrorBoundary>
      {children}
    </AuthErrorBoundary>
  );
};

export default AuthWrapper;