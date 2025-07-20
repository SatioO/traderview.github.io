import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrendingUp, Shield, Zap } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { loginSchema, type LoginFormData } from '../lib/validationSchemas';
import { ROUTES } from '../routes';
import '../components/ui/CinematicAnimations.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginError, isLoginLoading, clearErrors, isAuthenticated } = useAuth();
  
  // Get the intended destination from location state, or default to home
  const from = location.state?.from?.pathname || ROUTES.HOME;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      reset();
      navigate(from, { replace: true });
    } catch {
      // Error is handled by the auth context
    }
  };

  const handleSwitchToSignup = () => {
    reset();
    clearErrors();
    navigate('/signup');
  };


  return (
    <div className="min-h-screen relative overflow-hidden bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
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
              {/* Animated Trading Chart Lines */}
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
              <path
                d="M0,600 Q100,550 250,580 T500,520 T750,480 T1200,450"
                stroke="url(#accentGradient)"
                strokeWidth="1.5"
                fill="none"
                className="animate-chart-draw-slow"
              />

              {/* Dynamic Connection Nodes */}
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
              <circle
                cx="900"
                cy="150"
                r="5"
                fill="rgba(16,185,129,0.8)"
                className="animate-node-pulse-slow"
              >
                <animate
                  attributeName="r"
                  values="5;10;5"
                  dur="4s"
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
                <linearGradient
                  id="accentGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    stopColor="rgb(251,191,36)"
                    stopOpacity="0.6"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(168,85,247)"
                    stopOpacity="0.3"
                  />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Layer 4: Ambient Particles & Energy Fields */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Energy Orbs */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-radial from-purple-500/30 via-purple-500/10 to-transparent rounded-full blur-xl animate-energy-pulse"></div>
            <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-gradient-radial from-cyan-500/25 via-cyan-500/8 to-transparent rounded-full blur-2xl animate-energy-pulse-delayed"></div>
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-radial from-green-500/35 via-green-500/12 to-transparent rounded-full blur-xl animate-energy-pulse-slow"></div>

            {/* Floating Data Particles */}
            <div className="absolute top-40 left-80 w-1 h-1 bg-purple-400/80 rounded-full animate-data-particle"></div>
            <div className="absolute top-80 right-96 w-0.5 h-0.5 bg-cyan-400/80 rounded-full animate-data-particle-delayed"></div>
            <div className="absolute bottom-60 left-96 w-1 h-1 bg-green-400/80 rounded-full animate-data-particle-slow"></div>
            <div className="absolute bottom-80 right-80 w-0.5 h-0.5 bg-yellow-400/80 rounded-full animate-data-particle-fast"></div>
            <div className="absolute top-60 left-60 w-0.5 h-0.5 bg-pink-400/80 rounded-full animate-data-particle"></div>
            <div className="absolute bottom-40 right-60 w-1 h-1 bg-blue-400/80 rounded-full animate-data-particle-delayed"></div>
          </div>

          {/* Layer 5: Environmental Lighting */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 animate-ambient-shift"></div>
          </div>
        </div>
      </div>

      {/* Enhanced Cinematic Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 via-transparent to-cyan-500/8 pointer-events-none animate-atmospheric-drift" />

      {/* Depth of Field Blur Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20 pointer-events-none" />

      <div className="max-w-md w-full mx-auto relative z-10">
        <div className="relative bg-gradient-to-br from-slate-900/98 via-purple-900/95 to-slate-800/98 backdrop-blur-3xl rounded-[2rem] shadow-2xl border border-purple-400/40 shadow-[0_0_50px_rgba(168,85,247,0.3)] p-8 space-y-6 animate-terminal-float">
          {/* Dynamic light bar */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          
          {/* Glass morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-black/10 pointer-events-none rounded-[2rem]" />
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <div className="relative group mx-auto w-fit">
              <div className="relative z-10 p-3 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-800/80 backdrop-blur-xl rounded-xl border border-purple-400/30 group-hover:border-purple-400/50 transition-all duration-300">
                <TrendingUp className="w-7 h-7 text-slate-300 group-hover:text-purple-300 transition-all duration-300" />
              </div>
            </div>

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

          {/* Login Form */}
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

          {/* Action Links */}
          <div className="space-y-3">
            {/* Sign Up */}
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
      </div>
    </div>
  );
};

export default LoginPage;