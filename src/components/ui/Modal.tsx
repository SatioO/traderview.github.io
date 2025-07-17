import React, { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm w-full',
    md: 'max-w-md w-full',
    lg: 'max-w-lg w-full',
    xl: 'max-w-xl w-full',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Trading-themed Background Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xl"
        onClick={onClose}
      >
        {/* Premium Trading Dashboard Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Animated Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.3)_1px,transparent_1px)] bg-[size:50px_50px] animate-grid-fade"></div>
          </div>
          
          {/* Floating Chart Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Market Data Points */}
            <div className="absolute top-20 left-20 w-32 h-20 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20 backdrop-blur-sm animate-float-slow">
              <div className="p-3 text-green-400 text-xs font-mono">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>+2.4%</span>
                </div>
                <div className="text-green-300/70 mt-1">Portfolio</div>
              </div>
            </div>
            
            <div className="absolute top-32 right-32 w-36 h-24 bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 rounded-lg border border-cyan-500/20 backdrop-blur-sm animate-float-medium">
              <div className="p-3 text-cyan-400 text-xs font-mono">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span>78.3K</span>
                </div>
                <div className="text-cyan-300/70 mt-1">Total Value</div>
              </div>
            </div>
            
            <div className="absolute bottom-40 left-32 w-28 h-18 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20 backdrop-blur-sm animate-float-fast">
              <div className="p-2 text-purple-400 text-xs font-mono">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Risk: Low</span>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-20 right-20 w-40 h-20 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 rounded-lg border border-yellow-500/20 backdrop-blur-sm animate-float-slow">
              <div className="p-3 text-yellow-400 text-xs font-mono">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span>Analytics</span>
                </div>
                <div className="text-yellow-300/70 mt-1">Active</div>
              </div>
            </div>
          </div>
          
          {/* Chart Lines */}
          <div className="absolute inset-0">
            <svg className="w-full h-full opacity-20" viewBox="0 0 1000 800">
              <path
                d="M50,400 Q200,300 350,350 T650,320 T950,280"
                stroke="url(#gradient1)"
                strokeWidth="2"
                fill="none"
                className="animate-draw-line"
              />
              <path
                d="M50,500 Q200,450 350,480 T650,460 T950,420"
                stroke="url(#gradient2)"
                strokeWidth="2"
                fill="none"
                className="animate-draw-line-delayed"
              />
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(168,85,247)" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="rgb(236,72,153)" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Particle System */}
          <div className="absolute inset-0">
            <div className="absolute top-40 left-40 w-1 h-1 bg-cyan-400/60 rounded-full animate-particle-float"></div>
            <div className="absolute top-60 right-60 w-0.5 h-0.5 bg-green-400/60 rounded-full animate-particle-float-delayed"></div>
            <div className="absolute bottom-60 left-60 w-1 h-1 bg-purple-400/60 rounded-full animate-particle-float-slow"></div>
            <div className="absolute bottom-80 right-80 w-0.5 h-0.5 bg-yellow-400/60 rounded-full animate-particle-float-fast"></div>
            <div className="absolute top-80 left-80 w-0.5 h-0.5 bg-pink-400/60 rounded-full animate-particle-float"></div>
            <div className="absolute bottom-40 right-40 w-1 h-1 bg-blue-400/60 rounded-full animate-particle-float-delayed"></div>
          </div>

          {/* Market Indicators */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-xs text-slate-500/60 font-mono">
              <div className="flex items-center space-x-4">
                <span className="text-green-400/60">NIFTY +1.2%</span>
                <span className="text-red-400/60">SENSEX -0.8%</span>
                <span className="text-cyan-400/60">PORTFOLIO +2.4%</span>
              </div>
            </div>
            
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-xs text-slate-500/60 font-mono">
              <div className="flex items-center space-x-4">
                <span className="text-yellow-400/60">VOLUME: 2.3M</span>
                <span className="text-purple-400/60">RISK: MANAGED</span>
                <span className="text-emerald-400/60">ACTIVE TRADES: 12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ambient glow effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-emerald-500/5 pointer-events-none" />
      
      {/* Modal container with glass-morphism */}
      <div className={`
        relative bg-gradient-to-br from-slate-800/70 via-indigo-900/80 to-slate-800/70 
        backdrop-blur-3xl rounded-[2rem] shadow-2xl border border-slate-600/40
        ${maxWidthClasses[maxWidth]}
        max-h-[90vh] overflow-hidden
        transform transition-all duration-500 ease-out
        animate-fade-in-up
        mx-auto
      `}>
        {/* Dynamic light bar */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-black/10 pointer-events-none" />
        
        {(title || showCloseButton) && (
          <div className="relative flex items-center justify-between p-6 border-b border-slate-600/30">
            {title && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-100 via-cyan-200 to-slate-100 bg-clip-text text-transparent">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="relative group p-2 hover:bg-slate-800/60 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-600/40"
              >
                <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-all duration-300 group-hover:rotate-90" />
              </button>
            )}
          </div>
        )}
        
        <div className="relative p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;