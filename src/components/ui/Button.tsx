import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none overflow-hidden group';
  
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 
      hover:from-slate-800 hover:via-slate-700 hover:to-slate-800
      text-white border border-slate-600/40 hover:border-slate-500/60
      shadow-xl hover:shadow-2xl hover:shadow-slate-900/50
      rounded-xl backdrop-blur-sm
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-400/0 before:via-purple-400/0 before:to-purple-400/0 
      hover:before:from-purple-400/15 hover:before:via-purple-400/8 hover:before:to-purple-400/15
      before:transition-all before:duration-300
      focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-slate-900
    `,
    secondary: `
      bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50
      hover:from-slate-600/60 hover:via-slate-500/60 hover:to-slate-600/60
      text-slate-200 border border-slate-600/40 hover:border-slate-500/60
      rounded-xl backdrop-blur-sm
      focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 focus:ring-offset-slate-900
    `,
    outline: `
      border border-slate-500/50 bg-slate-800/20 hover:bg-slate-800/40
      text-slate-200 hover:text-white hover:border-slate-400/60
      rounded-xl backdrop-blur-sm
      focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 focus:ring-offset-slate-900
    `,
    ghost: `
      text-slate-300 hover:text-white hover:bg-slate-800/40
      rounded-xl
      focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 focus:ring-offset-slate-900
    `,
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm h-9',
    md: 'px-6 py-2.5 text-sm h-10',
    lg: 'px-8 py-3 text-base h-12',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {/* Dynamic top border light */}
      {variant === 'primary' && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
      
      {/* Content */}
      <span className={`relative z-10 flex items-center justify-center ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        {children}
      </span>
    </button>
  );
};

export default Button;