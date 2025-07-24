import { analyticsService } from '../services/analyticsService';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService, {
  type LoginRequest,
  type SignupRequest,
  type AuthResponse,
  type UserProfile,
} from '../services/authService';
import { getAvailableBrokers } from '../services/brokers';
import brokerApiService from '../services/brokerApiService';
import {
  type BrokerAuthResponse,
  type BrokerCallbackData,
} from '../types/broker';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  signup: (userData: SignupRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  loginError: string | null;
  signupError: string | null;
  isLoginLoading: boolean;
  isSignupLoading: boolean;
  clearErrors: () => void;
  refreshProfile: () => Promise<void>;
  // Session management
  activeSessions: Array<{
    id: string;
    deviceInfo: {
      userAgent: string;
      ipAddress: string;
      deviceId?: string;
    };
    createdAt: string;
    lastUsedAt: string;
    isCurrent: boolean;
  }>;
  revokeSession: (sessionId: string) => Promise<void>;
  availableBrokers: any[];
  loginWithBroker: (brokerName: string) => void;
  handleBrokerCallback: (
    data: BrokerCallbackData
  ) => Promise<BrokerAuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<
    Array<{
      id: string;
      deviceInfo: {
        userAgent: string;
        ipAddress: string;
        deviceId?: string;
      };
      createdAt: string;
      lastUsedAt: string;
      isCurrent: boolean;
    }>
  >([]);
  const queryClient = useQueryClient();

  // Get available brokers
  const availableBrokers = getAvailableBrokers();

  // Initialize authentication state on mount
  useEffect(() => {
    const initAuth = () => {
      if (authService.isAuthenticated()) {
        const storedUser = authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          analyticsService.setUser({
            userId: storedUser.id,
            email: storedUser.email,
            displayName: `${storedUser.firstName} ${storedUser.lastName}`,
          });
        }
      }
    };

    initAuth();
  }, []);

  // Verify token and get user profile
  const { isLoading: isVerifyLoading } = useQuery({
    queryKey: ['verifyToken'],
    queryFn: async () => {
      if (!authService.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      try {
        // Verify token is still valid
        const verifyResult = await authService.verifyToken();
        if (!verifyResult.valid) {
          authService.clearAuthData();
          setUser(null);
          setIsAuthenticated(false);
          // Redirect to login instead of just throwing error
          window.location.href = '/login';
          throw new Error('Token invalid');
        }

        // Get user profile if authenticated
        const profile = await authService.getUserProfile();
        setUserProfile(profile);

        const storedUser = authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }

        return profile;
      } catch (error) {
        // Handle authentication errors
        authService.clearAuthData();
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);

        // Clear broker tokens on auth failure
        availableBrokers.forEach((broker) => {
          broker.removeToken();
        });

        // Clear query cache
        queryClient.clear();

        // Check if this is a token expiration error and redirect
        if (
          error instanceof Error &&
          (error.message.includes('Authentication failed') ||
            error.message.includes('ACCESS_TOKEN_EXPIRED') ||
            error.message.includes('Token invalid'))
        ) {
          console.log('Authentication failed, redirecting to login...');
          window.location.href = '/login';
        }

        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors - redirect instead
      if (
        error instanceof Error &&
        (error.message.includes('Authentication failed') ||
          error.message.includes('ACCESS_TOKEN_EXPIRED') ||
          error.message.includes('Token invalid') ||
          error.message.includes('Not authenticated'))
      ) {
        return false;
      }
      return failureCount < 1; // Only retry once for other errors
    },
    staleTime: 5 * 60 * 1000,
    enabled: authService.isAuthenticated(),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      setLoginError(null);
      const response = await authService.login(credentials);
      return response;
    },
    onSuccess: (response) => {
      setUser(response.user);
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ['verifyToken'] });
    },
    onError: (error: Error) => {
      setLoginError(error.message);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (userData: SignupRequest) => {
      setSignupError(null);
      const response = await authService.signup(userData);
      return response;
    },
    onSuccess: (response) => {
      setUser(response.user);
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ['verifyToken'] });
    },
    onError: (error: Error) => {
      setSignupError(error.message);
    },
  });

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear broker tokens
      availableBrokers.forEach((broker) => {
        broker.removeToken();
      });

      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setActiveSessions([]);
      queryClient.clear();
    }
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      // Clear broker tokens
      availableBrokers.forEach((broker) => {
        broker.removeToken();
      });

      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setActiveSessions([]);
      queryClient.clear();
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await authService.revokeSession(sessionId);
      // Refresh active sessions
      const sessions = await authService.getActiveSessions();
      setActiveSessions(sessions.activeSessions);
    } catch (error) {
      console.error('Failed to revoke session:', error);
      throw error;
    }
  };

  const clearErrors = () => {
    setLoginError(null);
    setSignupError(null);
  };

  // Load active sessions when authenticated
  useEffect(() => {
    const loadActiveSessions = async () => {
      if (isAuthenticated) {
        try {
          const sessions = await authService.getActiveSessions();
          setActiveSessions(sessions.activeSessions);
        } catch (error) {
          console.error('Failed to load active sessions:', error);
        }
      }
    };

    loadActiveSessions();
  }, [isAuthenticated]);

  const loginWithBroker = useCallback(async (brokerName: string) => {
    try {
      setLoginError(null);
      // Use the new broker API service to get login URL
      const response = await brokerApiService.connectBroker(brokerName);

      // Redirect to broker login URL
      window.location.href = response.loginUrl;
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : `${brokerName} connection failed`
      );
    }
  }, []);

  const handleBrokerCallback = useCallback(
    async (data: BrokerCallbackData): Promise<BrokerAuthResponse> => {
      try {
        setLoginError(null);

        // Use the new broker API service to complete authentication
        const response = await brokerApiService.completeBrokerAuth(
          data.broker,
          data.requestToken || data.authCode || ''
        );

        // Invalidate broker-related queries to refresh UI
        queryClient.invalidateQueries({
          queryKey: ['broker', 'active-session'],
        });
        queryClient.invalidateQueries({ queryKey: ['brokers', 'available'] });
        queryClient.invalidateQueries({ queryKey: ['verifyToken'] });
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });

        // Create a compatible response object
        const brokerResponse: BrokerAuthResponse = {
          accessToken: '', // Not returned by new API
          user: {
            id: response.user.brokerUserId,
            email: response.user.brokerUserName,
            firstName: response.user.brokerUserName,
            lastName: '',
            brokerUserId: response.user.brokerUserId,
            brokerUserName: response.user.brokerUserName,
            broker: response.broker,
          },
        };

        return brokerResponse;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Broker authentication failed';
        setLoginError(errorMessage);
        throw error;
      }
    },
    [queryClient]
  );

  const value: AuthContextType = {
    user,
    userProfile,
    isAuthenticated,
    isLoading: isVerifyLoading,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout,
    logoutAll,
    loginError,
    signupError,
    isLoginLoading: loginMutation.isPending,
    isSignupLoading: signupMutation.isPending,
    clearErrors,
    refreshProfile,
    activeSessions,
    revokeSession,
    availableBrokers,
    loginWithBroker,
    handleBrokerCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
