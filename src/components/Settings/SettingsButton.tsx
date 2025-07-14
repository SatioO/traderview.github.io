import React from 'react';
import { Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

interface SettingsButtonProps {
  isSettingsOpen: boolean;
  onSettingsToggle: (open: boolean) => void;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({
  isSettingsOpen,
  onSettingsToggle,
}) => {
  return (
    <>
      <div className="group relative">
        {/* Premium Settings Button */}
        <button
          onClick={() => onSettingsToggle(true)}
          className="relative flex items-center space-x-4 backdrop-blur-2xl border rounded-2xl px-3 py-2 cursor-pointer transition-all duration-500 hover:scale-[1.02] overflow-hidden bg-gradient-to-r from-cyan-500/10 via-blue-500/8 to-purple-500/10 border-cyan-400/30 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/20"
          title="Settings"
        >
          {/* Sophisticated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-cyan-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

          {/* Premium Status Icon */}
          <div className="relative flex items-center space-x-3">
            {/* Elegant Settings Icon and Text */}
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-gradient-to-r from-slate-700/40 to-slate-600/40 border border-slate-600/40 rounded-lg">
                <Settings className="w-6 h-4 text-slate-300 group-hover:rotate-90 transition-transform duration-500" />
              </div>
              <div>
                <div className="text-sm font-bold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent tracking-wide">
                  SETTINGS
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => onSettingsToggle(false)}
      />
    </>
  );
};

export default SettingsButton;
