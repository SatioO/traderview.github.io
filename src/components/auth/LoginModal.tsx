import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrendingUp, Shield, Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema, type LoginFormData } from '../../lib/validationSchemas';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignup,
  onSwitchToForgotPassword,
}) => {
  const { login, loginError, isLoginLoading, clearErrors } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      reset();
      onClose();
    } catch {
      // Error is handled by the auth context
    }
  };

  const handleModalClose = () => {
    reset();
    clearErrors();
    onClose();
  };

  const handleSwitchToSignup = () => {
    reset();
    clearErrors();
    onSwitchToSignup();
  };

  const handleSwitchToForgotPassword = () => {
    reset();
    clearErrors();
    onSwitchToForgotPassword();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      maxWidth="md"
      showCloseButton={false}
    >
      <div className="space-y-6">
        {/* Compact Brand Header */}
        <div className="text-center space-y-3">
          {/* Simplified Logo */}
          <div className="relative group mx-auto w-fit">
            <div className="relative z-10 p-3 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-800/80 backdrop-blur-xl rounded-xl border border-purple-400/30 group-hover:border-purple-400/50 transition-all duration-300">
              <TrendingUp className="w-7 h-7 text-slate-300 group-hover:text-purple-300 transition-all duration-300" />
            </div>
          </div>

          {/* Compact Typography */}
          <div className="space-y-2">
            <h1 className="text-2xl font-black bg-gradient-to-r from-slate-100 via-purple-200 to-slate-100 bg-clip-text text-transparent tracking-tight">
              TradeView
            </h1>
            <div className="mx-auto px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-400/30 rounded-full w-fit">
              <span className="text-xs font-bold text-purple-300 tracking-wider">
                Risk Management Platform
              </span>
            </div>
          </div>
        </div>

        {/* Compact Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <Input
              {...register('email')}
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              autoComplete="email"
            />

            <Input
              {...register('password')}
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              isPassword={true}
              showPasswordToggle={true}
              autoComplete="current-password"
            />
          </div>

          {loginError && (
            <div className="relative p-3 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse flex-shrink-0"></div>
                <p className="text-xs text-red-400 font-medium">{loginError}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoginLoading}
            className="w-full"
          >
            <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="font-semibold">Access Platform</span>
          </Button>
        </form>

        {/* Compact Action Links */}
        <div className="space-y-3">
          {/* Forgot Password */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleSwitchToForgotPassword}
              className="text-xs text-slate-400 hover:text-purple-300 transition-colors duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1"
            >
              Forgot your password?
            </button>
          </div>

          {/* Horizontal Layout for Sign Up */}
          <div className="flex items-center justify-center space-x-2 text-xs">
            <span className="text-slate-400">New to TradeView?</span>
            <button
              type="button"
              onClick={handleSwitchToSignup}
              className="inline-flex items-center space-x-1 text-purple-300 hover:text-purple-200 transition-colors duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1"
            >
              <Zap className="w-3 h-3 flex-shrink-0" />
              <span>Create Account</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LoginModal;
