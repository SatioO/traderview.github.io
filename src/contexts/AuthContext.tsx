import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService, {
  type LoginRequest,
  type SignupRequest,
  type AuthResponse,
} from '../services/authService';
import { getAvailableBrokers, getBrokerService } from '../services/brokers';
import {
  type BrokerAuthResponse,
  type BrokerCallbackData,
} from '../types/broker';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  signup: (userData: SignupRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  loginError: string | null;
  signupError: string | null;
  isLoginLoading: boolean;
  isSignupLoading: boolean;
  clearErrors: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get available brokers
  const availableBrokers = getAvailableBrokers();

  const { isLoading: isVerifyLoading } = useQuery({
    queryKey: ['verifyToken'],
    queryFn: async () => {
      const token = authService.getStoredToken();
      const storedUser = authService.getStoredUser();

      // Check if we have a valid application token and user
      if (token && storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        return storedUser;
      }

      // Check if any broker has a valid token
      const validBroker = availableBrokers.find((broker) =>
        broker.isTokenValid()
      );
      if (validBroker && storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        return storedUser;
      }

      setUser(null);
      setIsAuthenticated(false);
      throw new Error('No stored credentials');
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      setLoginError(null);
      const response = await authService.login(credentials);
      return response;
    },
    onSuccess: (response) => {
      authService.storeAuthData(response.token, response.user);
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
      authService.storeAuthData(response.token, response.user);
      setUser(response.user);
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ['verifyToken'] });
    },
    onError: (error: Error) => {
      setSignupError(error.message);
    },
  });

  const logout = async () => {
    await authService.logout();

    // Clear broker tokens
    availableBrokers.forEach((broker) => {
      broker.removeToken();
    });

    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
  };

  const clearErrors = () => {
    setLoginError(null);
    setSignupError(null);
  };

  const loginWithBroker = useCallback((brokerName: string) => {
    try {
      const broker = getBrokerService(brokerName);
      broker.initiateLogin();
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : `${brokerName} login failed`
      );
    }
  }, []);

  const handleBrokerCallback = useCallback(
    async (data: BrokerCallbackData): Promise<BrokerAuthResponse> => {
      try {
        setLoginError(null);
        const broker = getBrokerService(data.broker);
        const response = await broker.handleCallback(data);
        console.log(response);

        // Store tokens - use broker service as primary storage for broker tokens
        // and authService for user data and general app authentication
        broker.storeToken(response.accessToken);
        authService.storeAuthData(response.accessToken, response.user);

        setUser(response.user);
        setIsAuthenticated(true);
        queryClient.invalidateQueries({ queryKey: ['verifyToken'] });

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Broker authentication failed';
        setLoginError(errorMessage);
        throw error;
      }
    },
    [queryClient]
  );

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: isVerifyLoading,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout,
    loginError,
    signupError,
    isLoginLoading: loginMutation.isPending,
    isSignupLoading: signupMutation.isPending,
    clearErrors,
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
