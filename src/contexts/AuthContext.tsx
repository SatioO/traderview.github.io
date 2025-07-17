import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService, { type LoginRequest, type SignupRequest, type ForgotPasswordRequest, type AuthResponse } from '../services/authService';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  signup: (userData: SignupRequest) => Promise<AuthResponse>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  loginError: string | null;
  signupError: string | null;
  forgotPasswordError: string | null;
  isLoginLoading: boolean;
  isSignupLoading: boolean;
  isForgotPasswordLoading: boolean;
  forgotPasswordSuccess: boolean;
  clearErrors: () => void;
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
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { isLoading: isVerifyLoading } = useQuery({
    queryKey: ['verifyToken'],
    queryFn: async () => {
      const token = authService.getStoredToken();
      const storedUser = authService.getStoredUser();
      
      if (token && storedUser) {
        try {
          const verifiedUser = await authService.verifyToken();
          setUser(verifiedUser);
          setIsAuthenticated(true);
          return verifiedUser;
        } catch (error) {
          setUser(null);
          setIsAuthenticated(false);
          throw error;
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        throw new Error('No stored credentials');
      }
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

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      setForgotPasswordError(null);
      setForgotPasswordSuccess(false);
      const response = await authService.forgotPassword(data);
      return response;
    },
    onSuccess: () => {
      setForgotPasswordSuccess(true);
    },
    onError: (error: Error) => {
      setForgotPasswordError(error.message);
    },
  });

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
  };

  const clearErrors = () => {
    setLoginError(null);
    setSignupError(null);
    setForgotPasswordError(null);
    setForgotPasswordSuccess(false);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: isVerifyLoading,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    logout,
    loginError,
    signupError,
    forgotPasswordError,
    isLoginLoading: loginMutation.isPending,
    isSignupLoading: signupMutation.isPending,
    isForgotPasswordLoading: forgotPasswordMutation.isPending,
    forgotPasswordSuccess,
    clearErrors,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
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