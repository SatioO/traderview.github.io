import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Shield, Zap, TrendingUp } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { signupSchema, type SignupFormData } from '../../lib/validationSchemas';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const { signup, signupError, isSignupLoading, clearErrors } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword: _, ...signupData } = data;
      await signup(signupData);
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

  const handleSwitchToLogin = () => {
    reset();
    clearErrors();
    onSwitchToLogin();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} maxWidth="lg" showCloseButton={false}>
      <div className="space-y-5">
        {/* Compact Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative group mx-auto w-fit">
            <div className="relative z-10 p-2.5 bg-gradient-to-br from-slate-800/60 via-slate-900/80 to-black/60 backdrop-blur-xl rounded-xl border border-slate-700/40 group-hover:border-emerald-400/40 transition-all duration-300">
              <UserPlus className="w-6 h-6 text-slate-300 group-hover:text-emerald-300 transition-all duration-300" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-black bg-gradient-to-r from-slate-100 via-emerald-200 to-slate-100 bg-clip-text text-transparent tracking-tight">
              Join TradeView
            </h1>
            <div className="mx-auto px-2 py-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 rounded-full w-fit">
              <span className="text-xs font-bold text-emerald-300 tracking-wider">
                PROFESSIONAL ACCOUNT
              </span>
            </div>
          </div>
        </div>

        {/* Compact Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                {...register('firstName')}
                type="text"
                placeholder="First name"
                error={errors.firstName?.message}
                autoComplete="given-name"
              />
              <Input
                {...register('lastName')}
                type="text"
                placeholder="Last name"
                error={errors.lastName?.message}
                autoComplete="family-name"
              />
            </div>

            <Input
              {...register('email')}
              type="email"
              placeholder="Professional email"
              error={errors.email?.message}
              autoComplete="email"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                {...register('password')}
                type="password"
                placeholder="Password"
                error={errors.password?.message}
                isPassword={true}
                showPasswordToggle={true}
                autoComplete="new-password"
              />

              <Input
                {...register('confirmPassword')}
                type="password"
                placeholder="Confirm"
                error={errors.confirmPassword?.message}
                isPassword={true}
                showPasswordToggle={true}
                autoComplete="new-password"
              />
            </div>
          </div>

          {signupError && (
            <div className="relative p-3 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse flex-shrink-0"></div>
                <p className="text-xs text-red-400 font-medium">{signupError}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSignupLoading}
            className="w-full"
          >
            <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="font-semibold">Create Professional Account</span>
          </Button>
        </form>

        {/* Compact Features Grid */}
        <div className="grid grid-cols-3 gap-3 py-2">
          <div className="text-center space-y-1">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="w-3 h-3 text-cyan-400" />
            </div>
            <p className="text-xs text-slate-400">Risk Mgmt</p>
          </div>
          <div className="text-center space-y-1">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-lg flex items-center justify-center mx-auto">
              <Zap className="w-3 h-3 text-purple-400" />
            </div>
            <p className="text-xs text-slate-400">Analytics</p>
          </div>
          <div className="text-center space-y-1">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-lg flex items-center justify-center mx-auto">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400">Portfolio</p>
          </div>
        </div>

        {/* Compact Sign In Link */}
        <div className="flex items-center justify-center space-x-2 text-xs pt-2">
          <span className="text-slate-400">Already have an account?</span>
          <button
            type="button"
            onClick={handleSwitchToLogin}
            className="inline-flex items-center space-x-1 text-cyan-300 hover:text-cyan-200 transition-colors duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1"
          >
            <Shield className="w-3 h-3 flex-shrink-0" />
            <span>Sign In</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SignupModal;