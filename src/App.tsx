import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  Sparkles,
  FileText,
  CalendarCheck,
  CheckSquare,
  History,
  Languages,
  Volume2,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Zap,
} from 'lucide-react';

import {
  NoticeAnalysis,
  ActionItem,
  CalendarEventItem,
  AppSettings,
  AppLanguage,
  TextScale,
} from './types/notice';

import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  setAccessToken,
} from './services/googleAuth';

import {
  loadSavedNotices,
  saveNotice,
  deleteSavedNotice,
  clearAllSavedData,
  loadSettings,
  saveSettings,
} from './services/noticeStorage';

import {
  computeNoticeKey,
  getCachedNotice,
  setCachedNotice,
} from './services/noticeCache';

import { batchCreateGoogleTasks } from './services/googleTasks';

import { Header } from './components/Header';
import { NoticeUploader } from './components/NoticeUploader';
import { NoticeSummary } from './components/NoticeSummary';
import { FactList } from './components/FactList';
import { ActionChecklist } from './components/ActionChecklist';
import { CalendarEventReview } from './components/CalendarEventReview';
import { CalendarView } from './components/CalendarView';
import { ActionItemsView } from './components/ActionItemsView';
import { NoticeHistoryView } from './components/NoticeHistoryView';
import { SettingsView } from './components/SettingsView';

interface AnalyzePayload {
  text?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
  inputMethod: 'file' | 'text' | 'sample';
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'actions' | 'calendar' | 'settings'>('home');
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [activeLanguage, setActiveLanguage] = useState<AppLanguage>(settings.preferredLanguage);

  // Notice Data & Persistence
  const [savedNotices, setSavedNotices] = useState<NoticeAnalysis[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<NoticeAnalysis | null>(null);

  // Processing state & Retry handling
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(1);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const lastPayloadRef = useRef<AnalyzePayload | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setToken(token);
      },
      () => {
        setGoogleUser(null);
        setToken(null);
      }
    );

    // Load saved notices
    const loaded = loadSavedNotices();
    setSavedNotices(loaded);
    if (loaded.length > 0) {
      setActiveAnalysis(loaded[0]);
    }

    return () => unsubscribe();
  }, []);

  // Sync text scale class to body
  useEffect(() => {
    document.body.className = `text-scale-${settings.textScale}`;
  }, [settings.textScale]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setToken(res.accessToken);
        showToast(`Connected as ${res.user.displayName || res.user.email}`);
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      showToast('Could not sign in with Google. Please try again.');
    }
  };

  const handleDisconnectGoogle = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setToken(null);
    showToast('Disconnected Google account.');
  };

  const handleUpdateSettings = (newPartial: Partial<AppSettings>) => {
    const updated = saveSettings(newPartial);
    setSettings(updated);
    if (newPartial.preferredLanguage) {
      setActiveLanguage(newPartial.preferredLanguage);
    }
  };

  const handleClearAllData = () => {
    clearAllSavedData();
    setSavedNotices([]);
    setActiveAnalysis(null);
    showToast('All stored notices and preferences have been cleared.');
  };

  const handleAnalyzeNotice = async (payload: AnalyzePayload) => {
    if (isProcessing) return; // Prevent duplicate concurrent requests

    lastPayloadRef.current = payload;
    setLastErrorMessage(null);
    setIsProcessing(true);
    setProcessingStage(1); // Stage 1: Reading document

    const startTime = Date.now();

    // Check fast client-side session cache for identical document
    const cacheKey = computeNoticeKey({
      text: payload.text,
      fileName: payload.fileName,
      fileBase64Snippet: payload.fileBase64?.slice(0, 100),
    });

    const cachedNotice = getCachedNotice(cacheKey);
    if (cachedNotice) {
      setActiveAnalysis(cachedNotice);
      setIsProcessing(false);
      showToast(`Loaded from instant session cache (0.1s)!`);
      return;
    }

    // Advance to Stage 2: Extracting key details
    setProcessingStage(2);

    // Setup 25-second abort controller timeout
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;
    const timeoutId = setTimeout(() => abortController.abort(), 25000);

    try {
      const response = await fetch('/api/analyze-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          text: payload.text,
          fileBase64: payload.fileBase64,
          mimeType: payload.mimeType,
          fileName: payload.fileName,
          preferredLanguage: activeLanguage,
        }),
      });

      clearTimeout(timeoutId);

      // Advance to Stage 3: Preparing summary
      setProcessingStage(3);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Analysis failed with HTTP ${response.status}`);
      }

      const result = await response.json();
      if (!result.data) {
        throw new Error('No structured analysis returned from server.');
      }

      const analysisData = result.data;
      const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

      // Construct pristine NoticeAnalysis object
      const newNotice: NoticeAnalysis = {
        id: `notice-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
        title: analysisData.title || payload.fileName || 'Official Notice',
        issuingOrganization: analysisData.issuingOrganization || 'Issuing Authority',
        announcementDate: analysisData.announcementDate,
        category: analysisData.category || 'General Notice',
        summaryBullets: analysisData.summaryBullets || [],
        summaryEnglish: analysisData.summaryEnglish || (analysisData.summaryBullets ? analysisData.summaryBullets.join(' ') : ''),
        summaryHindi: analysisData.summaryHindi || '',
        whatThisMeansEnglish: analysisData.whatThisMeansEnglish || '',
        whatThisMeansHindi: analysisData.whatThisMeansHindi || '',
        warningsAndMissingInfo: analysisData.warningsAndMissingInfo || [],
        importantInstructions: analysisData.importantInstructions || [],
        conditionsAndEligibility: analysisData.conditionsAndEligibility || [],
        requiredDocuments: analysisData.requiredDocuments || [],
        feesAndPayment: analysisData.feesAndPayment || [],
        extractedFacts: (analysisData.extractedFacts || []).map((f: any, i: number) => ({
          id: f.id || `fact-${i}`,
          category: f.category || 'general',
          fact: f.fact,
          sourceQuote: f.sourceQuote || '',
          pageOrLocation: f.pageOrLocation,
          status: f.status || 'confirmed',
        })),
        actionItems: (analysisData.actionItems || []).map((a: any, i: number) => ({
          id: a.id || `action-${i}`,
          title: a.title,
          description: a.description || '',
          dueDate: a.dueDate || null,
          rawDueDateText: a.rawDueDateText,
          sourceQuote: a.sourceQuote || '',
          isAmbiguousDate: Boolean(a.isAmbiguousDate),
          ambiguityReason: a.ambiguityReason,
          hasPassed: Boolean(a.hasPassed),
          completed: false,
        })),
        calendarEvents: (analysisData.calendarEvents || []).map((e: any, i: number) => ({
          id: e.id || `cal-${i}`,
          title: e.title,
          description: e.description || '',
          date: e.date || '',
          startTime: e.startTime,
          endTime: e.endTime,
          isAllDay: e.isAllDay !== false,
          sourceQuote: e.sourceQuote || '',
          isAmbiguous: Boolean(e.isAmbiguous),
          ambiguityReason: e.ambiguityReason,
          isPassed: Boolean(e.isPassed),
          suggestedReminderMinutes: e.suggestedReminderMinutes || settings.defaultReminderMinutes,
          selected: true,
        })),
        extractedRawTextSnippet: analysisData.extractedRawTextSnippet,
        originalFileName: payload.fileName,
        originalText: payload.text,
        inputMethod: payload.inputMethod,
      };

      // Cache in session
      setCachedNotice(cacheKey, newNotice);

      // Save to local storage
      saveNotice(newNotice);
      setSavedNotices((prev) => [newNotice, ...prev.filter((n) => n.id !== newNotice.id)]);
      setActiveAnalysis(newNotice);

      showToast(`Notice analyzed in ${durationSeconds}s! Ready for review.`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      const msg = isAbort
        ? 'Notice analysis timed out after 25s. Please click Retry.'
        : (err?.message || 'Failed to analyze notice.');
      console.error('Notice analysis error:', msg);
      setLastErrorMessage(msg);
      showToast(msg);
    } finally {
      setIsProcessing(false);
      activeAbortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    if (lastPayloadRef.current) {
      handleAnalyzeNotice(lastPayloadRef.current);
    }
  };

  const handleToggleAction = (noticeId: string, actionId: string) => {
    if (activeAnalysis && activeAnalysis.id === noticeId) {
      const updatedActions = (activeAnalysis.actionItems || []).map((a) =>
        a.id === actionId ? { ...a, completed: !a.completed } : a
      );
      const updatedNotice = { ...activeAnalysis, actionItems: updatedActions };
      setActiveAnalysis(updatedNotice);
      saveNotice(updatedNotice);
    }

    setSavedNotices((prev) =>
      prev.map((n) => {
        if (n.id === noticeId) {
          const updatedActions = (n.actionItems || []).map((a) =>
            a.id === actionId ? { ...a, completed: !a.completed } : a
          );
          const updated = { ...n, actionItems: updatedActions };
          saveNotice(updated);
          return updated;
        }
        return n;
      })
    );
  };

  const handleUpdateAction = (id: string, updated: Partial<ActionItem>) => {
    if (!activeAnalysis) return;
    const updatedActions = (activeAnalysis.actionItems || []).map((a) =>
      a.id === id ? { ...a, ...updated } : a
    );
    const updatedNotice = { ...activeAnalysis, actionItems: updatedActions };
    setActiveAnalysis(updatedNotice);
    saveNotice(updatedNotice);
    setSavedNotices((prev) => prev.map((n) => (n.id === activeAnalysis.id ? updatedNotice : n)));
  };

  const handleUpdateCalendarEvent = (id: string, updated: Partial<CalendarEventItem>) => {
    if (!activeAnalysis) return;
    const updatedEvents = (activeAnalysis.calendarEvents || []).map((e) =>
      e.id === id ? { ...e, ...updated } : e
    );
    const updatedNotice = { ...activeAnalysis, calendarEvents: updatedEvents };
    setActiveAnalysis(updatedNotice);
    saveNotice(updatedNotice);
    setSavedNotices((prev) => prev.map((n) => (n.id === activeAnalysis.id ? updatedNotice : n)));
  };

  const handleSyncGoogleTasks = async (actionsToSync: ActionItem[]) => {
    if (!accessToken) {
      await handleConnectGoogle();
      return;
    }
    if (actionsToSync.length === 0) return;

    setIsSyncingTasks(true);
    try {
      const { created, failed } = await batchCreateGoogleTasks(
        accessToken,
        actionsToSync,
        activeAnalysis?.title || 'Notice'
      );

      if (created.length > 0 && activeAnalysis) {
        const createdIds = new Set(created.map((c) => c.actionId));
        const updatedActions = (activeAnalysis.actionItems || []).map((a) =>
          createdIds.has(a.id) ? { ...a, syncedToGoogleTasks: true } : a
        );
        const updatedNotice = { ...activeAnalysis, actionItems: updatedActions };
        setActiveAnalysis(updatedNotice);
        saveNotice(updatedNotice);
        setSavedNotices((prev) => prev.map((n) => (n.id === activeAnalysis.id ? updatedNotice : n)));
      }

      if (failed.length === 0) {
        showToast(`Successfully added ${created.length} task${created.length === 1 ? '' : 's'} to Google Tasks.`);
      } else {
        showToast(`Added ${created.length} tasks; ${failed.length} tasks had an issue.`);
      }
    } catch (err: any) {
      console.error('Failed to sync to Google Tasks:', err);
      showToast('Could not sync tasks to Google. Please check your connection.');
    } finally {
      setIsSyncingTasks(false);
    }
  };

  const pendingActionsCount = savedNotices.reduce((sum, n) => {
    return sum + (n.actionItems || []).filter((a) => !a.completed).length;
  }, 0);

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#373444] flex flex-col font-sans transition-all">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#373444] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce"
        >
          <Sparkles className="w-4 h-4 text-[#8273B8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        googleUser={googleUser}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
        textScale={settings.textScale}
        onChangeTextScale={(scale: TextScale) => handleUpdateSettings({ textScale: scale })}
        savedNoticesCount={savedNotices.length}
        pendingActionsCount={pendingActionsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Home Tab */}
        {currentTab === 'home' && (
          <div className="space-y-8">
            {/* If there's an active analysis, show top control bar */}
            {activeAnalysis && (
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE4E8] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-xs font-bold text-[#373444] max-w-xs sm:max-w-md truncate">
                    Currently Viewing: {activeAnalysis.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveAnalysis(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF9F2] hover:bg-[#eae0d5] text-[#373444] border border-[#EAE4E8] rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#8273B8]" />
                    <span>Upload Another Notice</span>
                  </button>
                </div>
              </div>
            )}

            {/* When no active notice is selected, show the NoticeUploader */}
            {!activeAnalysis ? (
              <>
                <NoticeUploader
                  onAnalyze={handleAnalyzeNotice}
                  isProcessing={isProcessing}
                  processingStage={processingStage}
                  onRetry={handleRetry}
                  lastErrorMessage={lastErrorMessage}
                />

                {/* Features Highlight Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto pt-4">
                  <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EAE4E8] shadow-xs flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#E8DFF5] text-[#8273B8] flex items-center justify-center shrink-0">
                      <Languages className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#373444] mb-1">Simple English &amp; Hindi</h3>
                      <p className="text-xs text-[#6F6B78] leading-relaxed">
                        Translates convoluted academic and official circulars into 3–5 clear bullet points and action items.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EAE4E8] shadow-xs flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#DDEBDD] text-[#2c532c] flex items-center justify-center shrink-0">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#373444] mb-1">Google Calendar Sync</h3>
                      <p className="text-xs text-[#6F6B78] leading-relaxed">
                        Review all deadlines, resolve ambiguous dates, and add confirmed events to your Google Calendar in 1-click.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EAE4E8] shadow-xs flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#DCEAF7] text-[#2c5378] flex items-center justify-center shrink-0">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#373444] mb-1">Accessible Voice &amp; TTS</h3>
                      <p className="text-xs text-[#6F6B78] leading-relaxed">
                        Listen to summaries aloud, adjust font sizing, and verify facts with exact original document quotes.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* When an active notice analysis exists, display the complete 4-part workflow */
              <div className="space-y-8">
                {/* 1. Simplified Summary & Explanations */}
                <NoticeSummary
                  analysis={activeAnalysis}
                  currentLanguage={activeLanguage}
                  onLanguageChange={setActiveLanguage}
                  settings={settings}
                />

                {/* 2. Verified Facts & Evidence */}
                <FactList facts={activeAnalysis.extractedFacts || []} />

                {/* 3. Next Steps Action Checklist */}
                <ActionChecklist
                  actionItems={activeAnalysis.actionItems || []}
                  onToggleAction={(actionId) => handleToggleAction(activeAnalysis.id, actionId)}
                  onUpdateAction={handleUpdateAction}
                  onSyncGoogleTasks={handleSyncGoogleTasks}
                  isSyncingTasks={isSyncingTasks}
                  googleConnected={Boolean(googleUser)}
                />

                {/* 4. Calendar Event Review & One-Click Creation */}
                <CalendarEventReview
                  events={activeAnalysis.calendarEvents || []}
                  noticeTitle={activeAnalysis.title}
                  accessToken={accessToken}
                  onConnectGoogle={handleConnectGoogle}
                  onUpdateEvent={handleUpdateCalendarEvent}
                />
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {currentTab === 'history' && (
          <NoticeHistoryView
            savedNotices={savedNotices}
            onOpenNotice={(notice) => {
              setActiveAnalysis(notice);
              setCurrentTab('home');
            }}
            onDeleteNotice={(id) => {
              deleteSavedNotice(id);
              setSavedNotices((prev) => prev.filter((n) => n.id !== id));
              if (activeAnalysis?.id === id) {
                setActiveAnalysis(null);
              }
              showToast('Notice removed.');
            }}
            onClearAll={handleClearAllData}
          />
        )}

        {/* Consolidated Action Items Tab */}
        {currentTab === 'actions' && (
          <ActionItemsView
            notices={savedNotices}
            onToggleAction={handleToggleAction}
            onSyncAllTasks={handleSyncGoogleTasks}
            isSyncingTasks={isSyncingTasks}
            googleConnected={Boolean(googleUser)}
          />
        )}

        {/* Calendar Sync Tab */}
        {currentTab === 'calendar' && (
          <CalendarView
            accessToken={accessToken}
            onConnectGoogle={handleConnectGoogle}
            localEvents={activeAnalysis?.calendarEvents || []}
          />
        )}

        {/* Settings Tab */}
        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            googleUser={googleUser}
            onConnectGoogle={handleConnectGoogle}
            onDisconnectGoogle={handleDisconnectGoogle}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#EAE4E8] py-6 px-4 bg-[#FFFFFF]/80 text-center text-xs text-[#6F6B78]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#373444]">Notice Mate</span>
            <span>—</span>
            <span>From Notice to Action.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Fast Flash Engine</span>
            <span>•</span>
            <span>Privacy-first offline storage</span>
            <span>•</span>
            <span>Official Google Calendar &amp; Tasks API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
