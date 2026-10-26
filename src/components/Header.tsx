import React from 'react';
import {
  FileCheck2,
  Calendar,
  CheckSquare,
  History,
  Settings as SettingsIcon,
  Sparkles,
  Type,
  LogOut,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { TextScale } from '../types/notice';

interface HeaderProps {
  currentTab: 'home' | 'history' | 'actions' | 'calendar' | 'settings';
  setCurrentTab: (tab: 'home' | 'history' | 'actions' | 'calendar' | 'settings') => void;
  googleUser: User | null;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  textScale: TextScale;
  onChangeTextScale: (scale: TextScale) => void;
  savedNoticesCount: number;
  pendingActionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  googleUser,
  onConnectGoogle,
  onDisconnectGoogle,
  textScale,
  onChangeTextScale,
  savedNoticesCount,
  pendingActionsCount,
}) => {
  const cycleTextScale = () => {
    if (textScale === 'normal') onChangeTextScale('large');
    else if (textScale === 'large') onChangeTextScale('xlarge');
    else onChangeTextScale('normal');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#EAE4E8] px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 text-left group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#8273B8] rounded-xl p-1"
            aria-label="Notice Mate Home"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#E8DFF5] text-[#8273B8] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-[#373444] tracking-tight">Notice Mate</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-[#DDEBDD] text-[#345334] rounded-md tracking-wider">
                  Assistant
                </span>
              </div>
              <p className="text-xs text-[#6F6B78]">From Notice to Action.</p>
            </div>
          </button>

          {/* Quick controls on mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={cycleTextScale}
              aria-label={`Adjust text scale. Current: ${textScale}`}
              className="p-1.5 rounded-xl border border-[#EAE4E8] bg-[#FFF9F2] text-[#373444] text-xs font-bold"
              title="Change text size"
            >
              <Type className="w-4 h-4 inline" />
              <span className="ml-1 uppercase text-[10px]">{textScale === 'normal' ? 'A' : textScale === 'large' ? 'A+' : 'A++'}</span>
            </button>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav
          role="navigation"
          aria-label="Main Navigation"
          className="flex items-center gap-1 overflow-x-auto max-w-full py-1 text-sm font-medium"
        >
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 'home'
                ? 'bg-[#E8DFF5] text-[#373444] font-semibold shadow-xs'
                : 'text-[#6F6B78] hover:bg-[#FFF9F2] hover:text-[#373444]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer relative ${
              currentTab === 'history'
                ? 'bg-[#E8DFF5] text-[#373444] font-semibold shadow-xs'
                : 'text-[#6F6B78] hover:bg-[#FFF9F2] hover:text-[#373444]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>My Notices</span>
            {savedNoticesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#DDEBDD] text-[#2c472c] text-[11px] font-bold rounded-full">
                {savedNoticesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('actions')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer relative ${
              currentTab === 'actions'
                ? 'bg-[#E8DFF5] text-[#373444] font-semibold shadow-xs'
                : 'text-[#6F6B78] hover:bg-[#FFF9F2] hover:text-[#373444]'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Action Items</span>
            {pendingActionsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#F8E2D5] text-[#693922] text-[11px] font-bold rounded-full">
                {pendingActionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('calendar')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 'calendar'
                ? 'bg-[#E8DFF5] text-[#373444] font-semibold shadow-xs'
                : 'text-[#6F6B78] hover:bg-[#FFF9F2] hover:text-[#373444]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-[#E8DFF5] text-[#373444] font-semibold shadow-xs'
                : 'text-[#6F6B78] hover:bg-[#FFF9F2] hover:text-[#373444]'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right side controls: Text Scaling & Google Workspace status */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={cycleTextScale}
            aria-label={`Adjust text scale. Current: ${textScale}`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#EAE4E8] bg-[#FFF9F2] text-[#373444] text-xs font-semibold hover:bg-[#eae0d5] cursor-pointer"
            title="Cycle text scaling: Normal / Large / Extra Large"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text: {textScale === 'normal' ? 'Default' : textScale === 'large' ? 'Large' : 'XL'}</span>
          </button>

          {googleUser ? (
            <div className="flex items-center gap-2 bg-[#DDEBDD]/80 border border-[#cce1cc] rounded-full pl-2 pr-3 py-1">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google Account'}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#8273B8] text-white text-[10px] flex items-center justify-center font-bold">
                  {(googleUser.email || 'G')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium text-[#2f4d2f] max-w-[110px] truncate">
                {googleUser.displayName || googleUser.email}
              </span>
              <button
                onClick={onDisconnectGoogle}
                title="Disconnect Google account"
                className="text-[#6F6B78] hover:text-red-600 ml-1 p-0.5 rounded cursor-pointer"
                aria-label="Disconnect Google account"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectGoogle}
              className="gsi-material-button text-xs h-8 px-3"
              aria-label="Connect Google Calendar"
            >
              <div className="gsi-material-button-icon">
                <svg viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <span className="gsi-material-button-contents text-xs">Connect Calendar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
