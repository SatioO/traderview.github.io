import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../lib/validationSchemas';
import { CheckCircle, ArrowLeft, Shield, Mail, Key } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const {
    forgotPassword,
    forgotPasswordError,
    isForgotPasswordLoading,
    forgotPasswordSuccess,
    clearErrors,
  } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data);
    } catch {
      // Error is handled by the auth context
    }
  };

  const handleModalClose = () => {
    reset();
    clearErrors();
    onClose();
  };

  const handleSwitchToLogin = () => {
    reset();
    clearErrors();
    onSwitchToLogin();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} maxWidth="md" showCloseButton={false}>
      <div className="space-y-8">
        {!forgotPasswordSuccess ? (
          <>
            {/* Cinematic Brand Header */}
            <div className="text-center space-y-6">
              {/* Quantum Logo */}
              <div className="relative group mx-auto w-fit">
                {/* Orbital rings */}
                <div className="absolute inset-0 w-20 h-20 border border-yellow-400/20 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-1 w-18 h-18 border border-orange-400/15 rounded-full animate-reverse-spin"></div>
                <div className="absolute inset-2 w-16 h-16 border border-red-400/15 rounded-full animate-spin"></div>

                {/* Core icon */}
                <div className="relative z-10 p-5 bg-gradient-to-br from-slate-800/60 via-slate-900/80 to-black/60 backdrop-blur-xl rounded-2xl border border-slate-700/40 group-hover:border-yellow-400/40 transition-all duration-500">
                  <Key className="w-10 h-10 text-slate-300 group-hover:text-yellow-300 transition-all duration-500" />
                  
                  {/* Energy pulse */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/0 via-yellow-400/0 to-yellow-400/0 group-hover:from-yellow-400/10 group-hover:via-yellow-400/5 group-hover:to-yellow-400/10 transition-all duration-500"></div>
                </div>

                {/* Particle effects */}
                <div className="absolute top-8 left-8 w-1 h-1 bg-yellow-400/60 rounded-full animate-pulse"></div>
                <div className="absolute top-10 left-10 w-0.5 h-0.5 bg-orange-400/60 rounded-full animate-pulse delay-300"></div>
              </div>

              {/* Brand Typography */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-black bg-gradient-to-r from-slate-100 via-yellow-200 to-slate-100 bg-clip-text text-transparent tracking-tight">
                    Reset Password
                  </h1>
                  <div className="mx-auto px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-full w-fit">
                    <span className="text-xs font-bold text-yellow-300 tracking-wider">
                      ACCOUNT RECOVERY
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 font-medium tracking-wide">
                  Secure password reset for your trading account
                </p>
              </div>
            </div>

            {/* Reset Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-slate-400">
                    Enter your email address and we'll send you a secure link to reset your password
                  </p>
                </div>
                
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Enter your email address"
                  error={errors.email?.message}
                  autoComplete="email"
                />
              </div>

              {forgotPasswordError && (
                <div className="relative p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                    <p className="text-sm text-red-400 font-medium">{forgotPasswordError}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isForgotPasswordLoading}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="font-semibold">Send Reset Link</span>
              </Button>
            </form>

            {/* Back to Sign In */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="inline-flex items-center space-x-2 text-slate-400 hover:text-cyan-300 transition-colors duration-300 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="relative group mx-auto w-fit">
                {/* Orbital rings */}
                <div className="absolute inset-0 w-20 h-20 border border-green-400/20 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-1 w-18 h-18 border border-emerald-400/15 rounded-full animate-reverse-spin"></div>

                {/* Core icon */}
                <div className="relative z-10 p-5 bg-gradient-to-br from-green-800/60 via-emerald-900/80 to-green-800/60 backdrop-blur-xl rounded-2xl border border-green-700/40">
                  <CheckCircle className="w-10 h-10 text-green-300" />
                  
                  {/* Success glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400/10 via-green-400/5 to-green-400/10"></div>
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-black bg-gradient-to-r from-slate-100 via-green-200 to-slate-100 bg-clip-text text-transparent tracking-tight">
                    Check Your Email
                  </h1>
                  <div className="mx-auto px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-full w-fit">
                    <span className="text-xs font-bold text-green-300 tracking-wider">
                      RESET LINK SENT
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 font-medium tracking-wide">
                  We've sent a secure password reset link to your email address. Click the link to create a new password.
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/20 border border-slate-600/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-lg flex items-center justify-center mt-0.5">
                    <Mail className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-300">Check your inbox</p>
                    <p className="text-xs text-slate-400">The reset link will expire in 1 hour for security</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Sign In */}
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSwitchToLogin}
              className="w-full"
            >
              <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="font-semibold">Back to Sign In</span>
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ForgotPasswordModal;