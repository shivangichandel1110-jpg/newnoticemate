import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Type,
  Volume2,
  Calendar,
  Shield,
  Trash2,
  Check,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppSettings, AppLanguage, TextScale } from '../types/notice';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  googleUser: User | null;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  googleUser,
  onConnectGoogle,
  onDisconnectGoogle,
  onClearAllData,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testedSpeech, setTestedSpeech] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleTestVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const testPhrase =
      settings.preferredLanguage === 'hi'
        ? 'नमस्ते, नोटिस मेट में आपका स्वागत है। हम आपके नोटिस को समझना आसान बनाते हैं।'
        : 'Hello, welcome to Notice Mate. We make complicated notices easy to understand.';
    const utterance = new SpeechSynthesisUtterance(testPhrase);
    utterance.rate = settings.voiceRate;
    utterance.pitch = settings.voicePitch;

    if (settings.selectedVoiceURI) {
      const voice = voices.find((v) => v.voiceURI === settings.selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => {
      setTestedSpeech(true);
      setTimeout(() => setTestedSpeech(false), 2000);
    };

    window.speechSynthesis.speak(utterance);
  };

  const reminderOptions = [
    { label: 'On the day (Morning 9:00 AM)', value: 0 },
    { label: '1 hour before', value: 60 },
    { label: '1 day before (Recommended)', value: 1440 },
    { label: '3 days before', value: 4320 },
    { label: '1 week before', value: 10080 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#E8DFF5] text-[#8273B8] flex items-center justify-center shrink-0">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#373444] tracking-tight">
            Settings &amp; Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#6F6B78]">
            Customize language, accessibility, speech synthesis, and calendar connections.
          </p>
        </div>
      </div>

      {/* Language & Accessibility Preferences */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#373444] border-b border-[#EAE4E8] pb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#8273B8]" />
          <span>Language &amp; Reading Display</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Preferred language */}
          <div>
            <label className="block text-xs font-semibold text-[#373444] uppercase tracking-wide mb-2">
              Default Summary Language
            </label>
            <div className="flex items-center gap-2 bg-[#FFF9F2] p-1.5 rounded-2xl border border-[#EAE4E8]">
              <button
                onClick={() => onUpdateSettings({ preferredLanguage: 'en' })}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  settings.preferredLanguage === 'en'
                    ? 'bg-white text-[#373444] shadow-xs'
                    : 'text-[#6F6B78]'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onUpdateSettings({ preferredLanguage: 'hi' })}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  settings.preferredLanguage === 'hi'
                    ? 'bg-white text-[#373444] shadow-xs'
                    : 'text-[#6F6B78]'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          </div>

          {/* Text Scaling */}
          <div>
            <label className="block text-xs font-semibold text-[#373444] uppercase tracking-wide mb-2">
              Reading Text Size
            </label>
            <div className="flex items-center gap-2 bg-[#FFF9F2] p-1.5 rounded-2xl border border-[#EAE4E8]">
              {(['normal', 'large', 'xlarge'] as TextScale[]).map((scale) => (
                <button
                  key={scale}
                  onClick={() => onUpdateSettings({ textScale: scale })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    settings.textScale === scale
                      ? 'bg-white text-[#373444] shadow-xs'
                      : 'text-[#6F6B78]'
                  }`}
                >
                  {scale === 'normal' ? 'Default' : scale === 'large' ? 'Large (+15%)' : 'Extra Large'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Text-to-Speech Settings */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#EAE4E8] pb-3">
          <h2 className="text-base font-bold text-[#373444] flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#8273B8]" />
            <span>Voice &amp; Text-to-Speech Settings</span>
          </h2>
          <button
            onClick={handleTestVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF9F2] hover:bg-[#eae0d5] border border-[#EAE4E8] text-[#373444] rounded-xl text-xs font-semibold cursor-pointer"
          >
            {testedSpeech ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{testedSpeech ? 'Voice Tested' : 'Test Speech'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Speech Rate */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#373444] uppercase tracking-wide">
                Speech Speed ({settings.voiceRate}x)
              </label>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={settings.voiceRate}
              onChange={(e) => onUpdateSettings({ voiceRate: parseFloat(e.target.value) })}
              className="w-full accent-[#8273B8] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#6F6B78] mt-1">
              <span>Slower (0.75x)</span>
              <span>Normal (1.0x)</span>
              <span>Faster (1.5x)</span>
            </div>
          </div>

          {/* Speech Pitch */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#373444] uppercase tracking-wide">
                Voice Pitch ({settings.voicePitch})
              </label>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={settings.voicePitch}
              onChange={(e) => onUpdateSettings({ voicePitch: parseFloat(e.target.value) })}
              className="w-full accent-[#8273B8] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#6F6B78] mt-1">
              <span>Deeper</span>
              <span>Natural</span>
              <span>Higher</span>
            </div>
          </div>
        </div>

        {/* Voice selector */}
        {voices.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-[#373444] uppercase tracking-wide mb-1.5">
              Available Browser Voice
            </label>
            <select
              value={settings.selectedVoiceURI}
              onChange={(e) => onUpdateSettings({ selectedVoiceURI: e.target.value })}
              className="w-full p-2.5 bg-[#FFF9F2] border border-[#EAE4E8] rounded-xl text-xs text-[#373444]"
            >
              <option value="">Default system voice</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Google Calendar & Tasks Integration */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#373444] border-b border-[#EAE4E8] pb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#8273B8]" />
          <span>Google Workspace Integration (Calendar &amp; Tasks)</span>
        </h2>

        <div className="p-4 rounded-2xl bg-[#FFF9F2] border border-[#EAE4E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#EAE4E8] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#8273B8]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#373444]">
                {googleUser ? `Connected as ${googleUser.displayName || googleUser.email}` : 'Google Calendar Not Connected'}
              </p>
              <p className="text-xs text-[#6F6B78]">
                {googleUser
                  ? 'Access token cached in memory to sync deadlines and tasks securely.'
                  : 'Connect your Google account to create calendar events and task items with 1-click.'}
              </p>
            </div>
          </div>

          {googleUser ? (
            <button
              onClick={onDisconnectGoogle}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#EAE4E8] bg-white hover:bg-red-50 text-red-600 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={onConnectGoogle}
              className="gsi-material-button text-xs h-9 px-4 shrink-0"
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
              <span className="gsi-material-button-contents font-bold">Connect Account</span>
            </button>
          )}
        </div>

        {/* Default Reminder Setting */}
        <div>
          <label className="block text-xs font-semibold text-[#373444] uppercase tracking-wide mb-2">
            Default Calendar Event Reminder
          </label>
          <select
            value={settings.defaultReminderMinutes}
            onChange={(e) => onUpdateSettings({ defaultReminderMinutes: Number(e.target.value) })}
            className="p-2.5 bg-[#FFF9F2] border border-[#EAE4E8] rounded-xl text-xs text-[#373444] w-full sm:w-80"
          >
            {reminderOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Privacy and Data Management */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#373444] border-b border-[#EAE4E8] pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#8273B8]" />
          <span>Privacy &amp; Data Storage</span>
        </h2>

        <p className="text-xs text-[#6F6B78] leading-relaxed">
          Notice Mate is designed with strict accessibility and user privacy principles. We never store your Google password or private Google Calendar entries. OAuth tokens are maintained in browser memory and discarded on logout.
        </p>

        <div className="pt-2">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#f5c2c2] text-[#8C2424] hover:bg-[#FCE4E4] rounded-xl text-xs font-bold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All Stored Notice Data</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#EAE4E8] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#373444]">
              Delete All Local App Data?
            </h3>
            <p className="text-xs text-[#6F6B78]">
              This will remove all saved notices, checklist states, and custom settings stored in this browser.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE4E8] text-xs font-semibold text-[#6F6B78] hover:bg-[#FFF9F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
