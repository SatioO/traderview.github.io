import React, { forwardRef, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  isPassword?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, showPasswordToggle = false, isPassword = false, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : props.type || 'text';

    return (
      <div className="w-full group">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-3 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {/* Input container with glass-morphism */}
          <div className={`
            relative overflow-hidden rounded-xl border transition-all duration-300
            ${error 
              ? 'border-red-500/50 bg-red-500/5' 
              : isFocused 
                ? 'border-purple-400/50 bg-purple-400/5' 
                : 'border-slate-600/40 bg-slate-800/20'
            }
            backdrop-blur-sm
          `}>
            {/* Subtle glow effect */}
            <div className={`
              absolute inset-0 transition-opacity duration-300
              ${error
                ? 'bg-gradient-to-r from-red-500/5 to-red-500/5'
                : isFocused
                  ? 'bg-gradient-to-r from-purple-400/8 to-purple-500/5'
                  : 'bg-gradient-to-r from-slate-800/10 to-slate-800/5'
              }
            `} />
            
            {/* Dynamic top border */}
            <div className={`
              absolute top-0 left-0 right-0 h-[1px] transition-all duration-300
              ${error
                ? 'bg-gradient-to-r from-transparent via-red-400/60 to-transparent'
                : isFocused
                  ? 'bg-gradient-to-r from-transparent via-purple-400/60 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-slate-600/30 to-transparent'
              }
            `} />
            
            <input
              ref={ref}
              type={inputType}
              className={`
                relative w-full px-4 py-4 bg-transparent
                text-slate-100 placeholder-slate-400 text-sm
                focus:outline-none transition-all duration-300
                font-medium tracking-wide
                ${showPasswordToggle ? 'pr-12' : ''}
                ${className}
              `}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              {...props}
            />
            
            {showPasswordToggle && isPassword && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
          
          {error && (
            <div className="mt-3 flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse flex-shrink-0" />
              <p className="text-sm text-red-400 font-medium leading-relaxed">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;