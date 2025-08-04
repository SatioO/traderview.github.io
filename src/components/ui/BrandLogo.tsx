import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`relative group cursor-pointer mx-auto w-fit ${className}`}>
      {/* Dynamic Background Orbs - Exact from header */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"></div>
      <div
        className="absolute -left-2 -top-1 w-4 h-4 bg-purple-400/40 rounded-full blur-sm animate-bounce opacity-0 group-hover:opacity-100 transition-all duration-1000"
        style={{ animationDelay: '0.5s' }}
      ></div>
      <div
        className="absolute -right-1 -bottom-1 w-3 h-3 bg-cyan-400/40 rounded-full blur-sm animate-bounce opacity-0 group-hover:opacity-100 transition-all duration-1000"
        style={{ animationDelay: '1s' }}
      ></div>

      {/* Enhanced Logo - Exact from header */}
      <div
        className={`relative ${textSizeClasses[size]} font-bold bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-400 bg-clip-text text-transparent hover:from-purple-300 hover:via-pink-200 hover:to-cyan-300 transition-all duration-500 transform group-hover:scale-105`}
      >
        TraderView
      </div>

      {/* Subtle Glow Effect - Exact from header */}
      <div className="absolute -inset-3 bg-gradient-to-r from-purple-500/8 to-cyan-500/8 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md"></div>

      {/* Floating Particles - Exact from header */}
      <div
        className="absolute top-0 right-0 w-1 h-1 bg-white/60 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-all duration-700"
        style={{ animationDelay: '0.3s' }}
      ></div>
    </div>
  );
};

export default BrandLogo;
