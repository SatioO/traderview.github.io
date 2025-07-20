import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield } from 'lucide-react';
import Button from '../ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message?.toLowerCase().includes('auth') ||
                         this.state.error?.message?.toLowerCase().includes('token') ||
                         this.state.error?.message?.toLowerCase().includes('login');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-red-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-amber-500/10 via-yellow-500/5 to-transparent rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10 max-w-lg w-full">
            <div className="bg-gradient-to-br from-slate-900/95 via-red-900/90 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-2xl shadow-red-500/20 p-8 space-y-6">
              {/* Error Icon */}
              <div className="text-center">
                <div className="relative mx-auto w-fit mb-4">
                  <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-400/30 rounded-xl">
                    {isAuthError ? (
                      <Shield className="w-8 h-8 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-xl blur animate-pulse" />
                </div>

                <h1 className="text-xl font-bold text-red-200 mb-2">
                  {isAuthError ? 'Authentication Error' : 'Something Went Wrong'}
                </h1>
                <p className="text-sm text-red-300/80">
                  {isAuthError 
                    ? 'There was a problem with your authentication. Please try logging in again.'
                    : 'An unexpected error occurred. We apologize for the inconvenience.'
                  }
                </p>
              </div>

              {/* Error Details (for development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-4 bg-slate-800/50 border border-slate-600/30 rounded-lg">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Error Details:</h3>
                  <pre className="text-xs text-slate-400 overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {isAuthError ? (
                  <>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={this.handleGoHome}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Go to Login
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={this.handleReload}
                      className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reload Page
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={this.handleReload}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={this.handleGoHome}
                      className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Go Home
                    </Button>
                  </>
                )}
              </div>

              {/* Help Text */}
              <div className="text-center">
                <p className="text-xs text-slate-400">
                  If this problem persists, please contact support or try refreshing the page.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;