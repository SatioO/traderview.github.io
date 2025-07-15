import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Target, Shield } from 'lucide-react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  isLoading: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    {
      icon: Shield,
      label: 'Initializing Security',
      color: 'from-emerald-400 to-teal-400',
    },
    {
      icon: BarChart3,
      label: 'Loading Portfolio Data',
      color: 'from-blue-400 to-cyan-400',
    },
    {
      icon: Target,
      label: 'Configuring Risk Matrix',
      color: 'from-orange-400 to-red-400',
    },
    {
      icon: TrendingUp,
      label: 'Ready to Rock',
      color: 'from-violet-400 to-purple-400',
    },
  ];

  useEffect(() => {
    if (!isLoading) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 2;

        // Update current step based on progress
        const stepIndex = Math.floor((newProgress / 100) * loadingSteps.length);
        setCurrentStep(Math.min(stepIndex, loadingSteps.length - 1));

        if (newProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return newProgress;
      });
    }, 20); // Update every 20ms for smooth animation

    return () => clearInterval(timer);
  }, [isLoading, loadingSteps.length]);

  if (!isLoading) return null;

  const CurrentIcon = loadingSteps[currentStep]?.icon || TrendingUp;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Sophisticated Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Dynamic Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20 animate-grid-pulse"
          style={{
            backgroundImage: `
              linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Ambient Lighting Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-blue-500/20 via-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-violet-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />

        {/* Floating Data Points */}
        <div className="absolute top-1/3 left-1/5 w-2 h-2 bg-cyan-400/60 rounded-full animate-ping" />
        <div
          className="absolute bottom-1/3 right-1/5 w-2 h-2 bg-emerald-400/60 rounded-full animate-ping"
          style={{ animationDelay: '0.5s' }}
        />
        <div
          className="absolute top-2/3 left-2/3 w-2 h-2 bg-violet-400/60 rounded-full animate-ping"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      {/* Main Loading Container */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Brand Logo Area */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 rounded-2xl backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-2xl blur animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              TraderView
            </h1>
          </div>
        </div>

        {/* Dynamic Loading Icon */}
        <div className="relative mb-6">
          <div className="relative p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-3xl backdrop-blur-xl">
            <CurrentIcon
              className={`w-12 h-12 bg-gradient-to-r ${
                loadingSteps[currentStep]?.color || 'from-blue-400 to-cyan-400'
              } bg-clip-text text-transparent animate-pulse`}
            />

            {/* Rotating Ring */}
            <div className="absolute inset-0 rounded-3xl">
              <div
                className="absolute inset-2 border-2 border-transparent bg-gradient-to-r from-emerald-400/30 via-cyan-400/30 to-violet-400/30 rounded-3xl animate-spin"
                style={{
                  mask: 'linear-gradient(45deg, transparent 40%, black 50%, transparent 60%)',
                  WebkitMask:
                    'linear-gradient(45deg, transparent 40%, black 50%, transparent 60%)',
                }}
              />
            </div>
          </div>

          {/* Pulsing Glow */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${
              loadingSteps[currentStep]?.color || 'from-blue-400 to-cyan-400'
            } opacity-20 rounded-3xl blur-xl animate-pulse`}
          />
        </div>

        {/* Progress Bar */}
        <div className="w-80 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-300">
              {loadingSteps[currentStep]?.label || 'Loading...'}
            </span>
            <span className="text-sm font-mono text-slate-400">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Progress Track */}
          <div className="relative h-2 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/50">
            {/* Background Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600/20 to-transparent animate-shimmer" />

            {/* Progress Fill */}
            <div
              className={`h-full bg-gradient-to-r ${
                loadingSteps[currentStep]?.color || 'from-blue-400 to-cyan-400'
              } transition-all duration-300 ease-out relative overflow-hidden`}
              style={{ width: `${progress}%` }}
            >
              {/* Moving Highlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide" />
            </div>
          </div>
        </div>

        {/* Loading Steps Indicators */}
        <div className="flex space-x-4">
          {loadingSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={index}
                className={`relative p-3 rounded-xl border transition-all duration-500 ${
                  isActive
                    ? `bg-gradient-to-r ${step.color} bg-opacity-20 border-current shadow-lg`
                    : isCompleted
                    ? 'bg-emerald-500/20 border-emerald-400/40'
                    : 'bg-slate-800/40 border-slate-700/40'
                }`}
              >
                <StepIcon
                  className={`w-5 h-5 transition-colors duration-300 ${
                    isActive
                      ? 'text-white'
                      : isCompleted
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }`}
                />

                {/* Active Pulse */}
                {isActive && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-30 rounded-xl animate-pulse`}
                  />
                )}

                {/* Completion Check */}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Message */}
        <div className="text-center max-w-md">
          <p className="text-slate-400 text-sm leading-relaxed">
            Preparing your personalized trading environment with advanced risk
            management and portfolio optimization tools.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
