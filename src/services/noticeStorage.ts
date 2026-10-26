import { NoticeAnalysis, AppSettings } from '../types/notice';

const NOTICES_KEY = 'notice_mate_saved_notices_v1';
const SETTINGS_KEY = 'notice_mate_user_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  preferredLanguage: 'en',
  textScale: 'normal',
  defaultReminderMinutes: 1440, // 1 day before
  voiceRate: 1.0,
  voicePitch: 1.0,
  selectedVoiceURI: '',
  autoReadSummary: false,
};

export function loadSavedNotices(): NoticeAnalysis[] {
  try {
    const raw = localStorage.getItem(NOTICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load saved notices:', err);
    return [];
  }
}

export function saveNotice(notice: NoticeAnalysis): void {
  try {
    const current = loadSavedNotices();
    const existingIndex = current.findIndex((n) => n.id === notice.id);
    let updated: NoticeAnalysis[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = notice;
    } else {
      updated = [notice, ...current];
    }
    localStorage.setItem(NOTICES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save notice:', err);
  }
}

export function deleteSavedNotice(id: string): void {
  try {
    const current = loadSavedNotices();
    const filtered = current.filter((n) => n.id !== id);
    localStorage.setItem(NOTICES_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete notice:', err);
  }
}

export function clearAllSavedData(): void {
  try {
    localStorage.removeItem(NOTICES_KEY);
  } catch (err) {
    console.error('Failed to clear saved notices:', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
