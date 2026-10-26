import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Bell,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldAlert,
  Edit3,
  X,
  Check,
  CalendarCheck,
} from 'lucide-react';
import { CalendarEventItem } from '../types/notice';
import { batchAddCalendarEvents, GoogleCalendarEventResponse } from '../services/googleCalendar';

interface CalendarEventReviewProps {
  events: CalendarEventItem[];
  noticeTitle: string;
  accessToken: string | null;
  onConnectGoogle: () => void;
  onUpdateEvent: (id: string, updated: Partial<CalendarEventItem>) => void;
  onEventsCreated?: (results: Array<{ id: string; googleEvent?: GoogleCalendarEventResponse }>) => void;
}

export const CalendarEventReview: React.FC<CalendarEventReviewProps> = ({
  events,
  noticeTitle,
  accessToken,
  onConnectGoogle,
  onUpdateEvent,
  onEventsCreated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [creationSummary, setCreationSummary] = useState<{
    success: number;
    skipped: number;
    failed: number;
    completed: boolean;
    message?: string;
  } | null>(null);

  const selectedEvents = events.filter((e) => e.selected);

  const reminderOptions = [
    { label: 'On the day (Morning 9 AM)', value: 0 },
    { label: '1 hour before', value: 60 },
    { label: '1 day before (Recommended)', value: 1440 },
    { label: '3 days before', value: 4320 },
    { label: '1 week before', value: 10080 },
  ];

  const handleToggleSelectAll = (select: boolean) => {
    events.forEach((e) => onUpdateEvent(e.id, { selected: select }));
  };

  const handleStartEdit = (id: string) => {
    setEditingEventId(id);
  };

  const handleCloseEdit = () => {
    setEditingEventId(null);
  };

  const handleProceedToConfirm = () => {
    if (!accessToken) {
      onConnectGoogle();
      return;
    }
    if (selectedEvents.length === 0) return;
    setShowConfirmModal(true);
  };

  const handleExecuteCalendarCreation = async () => {
    setShowConfirmModal(false);
    if (!accessToken) return;

    setIsSubmitting(true);
    setCreationSummary(null);

    try {
      const { results, totalSuccess, totalSkipped, totalFailed } = await batchAddCalendarEvents(
        accessToken,
        selectedEvents,
        noticeTitle
      );

      // Update individual event statuses
      results.forEach((res) => {
        if (res.status === 'created' && res.googleEvent) {
          onUpdateEvent(res.id, {
            status: 'created',
            googleEventId: res.googleEvent.id,
            googleEventHtmlLink: res.googleEvent.htmlLink,
          });
        } else if (res.status === 'already_exists') {
          onUpdateEvent(res.id, {
            status: 'already_exists',
          });
        } else if (res.status === 'failed') {
          onUpdateEvent(res.id, {
            status: 'failed',
            errorMessage: res.error,
          });
        }
      });

      let message = '';
      if (totalSuccess > 0 && totalFailed === 0) {
        message = 'Your selected events were added successfully to Google Calendar.';
      } else if (totalSuccess > 0 && totalFailed > 0) {
        message = 'Some events were added, but a few need your attention.';
      } else if (totalSuccess === 0 && totalSkipped > 0) {
        message = 'These events are already on your Google Calendar (duplicates avoided).';
      } else {
        message = 'We couldn\'t save these events. Your reviewed dates are still available to try again.';
      }

      setCreationSummary({
        success: totalSuccess,
        skipped: totalSkipped,
        failed: totalFailed,
        completed: true,
        message,
      });

      if (onEventsCreated) {
        onEventsCreated(
          results
            .filter((r) => r.status === 'created' && r.googleEvent)
            .map((r) => ({ id: r.id, googleEvent: r.googleEvent }))
        );
      }
    } catch (err: any) {
      console.error('Calendar batch creation error:', err);
      setCreationSummary({
        success: 0,
        skipped: 0,
        failed: selectedEvents.length,
        completed: true,
        message: 'We couldn\'t save these events. Your reviewed dates are still available to try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#EAE4E8]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#373444] tracking-tight">
              Keep Every Important Date in One Place
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-[#E8DFF5] text-[#55437a] rounded-full">
              {events.length} Dates Found
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6F6B78]">
            Review, edit, and add confirmed notice deadlines directly to Google Calendar.
          </p>
        </div>

        {/* Batch actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleSelectAll(true)}
            className="px-2.5 py-1 text-xs font-medium text-[#6F6B78] hover:text-[#373444] bg-[#FFF9F2] border border-[#EAE4E8] rounded-xl cursor-pointer"
          >
            Select All
          </button>
          <button
            onClick={() => handleToggleSelectAll(false)}
            className="px-2.5 py-1 text-xs font-medium text-[#6F6B78] hover:text-[#373444] bg-[#FFF9F2] border border-[#EAE4E8] rounded-xl cursor-pointer"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Creation Result Banner */}
      {creationSummary && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            creationSummary.failed === 0
              ? 'bg-[#DDEBDD] border border-[#b8deb8] text-[#244b24]'
              : creationSummary.success > 0
              ? 'bg-[#F9E4B7] border border-[#ecd299] text-[#784f10]'
              : 'bg-[#FCE4E4] border border-[#f5b8b8] text-[#8C2424]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {creationSummary.failed === 0 ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <div>
              <p className="text-sm font-bold">{creationSummary.message}</p>
              <p className="text-xs opacity-90">
                {creationSummary.success} created • {creationSummary.skipped} duplicate skipped •{' '}
                {creationSummary.failed} failed
              </p>
            </div>
          </div>

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#373444] text-xs font-bold rounded-xl shadow-xs hover:bg-[#FFF9F2] cursor-pointer"
          >
            <span>Open Google Calendar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-10 bg-[#FFF9F2] rounded-2xl border border-dashed border-[#EAE4E8]">
          <CalendarIcon className="w-10 h-10 text-[#8273B8] mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-[#373444]">No specific dates found in this notice.</p>
          <p className="text-xs text-[#6F6B78]">Check the action checklist to manually add dates if needed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isEditing = editingEventId === event.id;

            return (
              <div
                key={event.id}
                className={`p-5 rounded-2xl border transition-all ${
                  !event.selected
                    ? 'bg-[#FFF9F2]/30 border-[#EAE4E8] opacity-60'
                    : event.status === 'created'
                    ? 'bg-[#DDEBDD]/30 border-[#b8deb8]'
                    : event.isAmbiguous
                    ? 'bg-[#F9E4B7]/20 border-[#ecd299]'
                    : 'bg-[#FFFFFF] border-[#EAE4E8] hover:border-[#8273B8] shadow-xs'
                }`}
              >
                {/* Event header row */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={event.selected}
                    onChange={(e) => onUpdateEvent(event.id, { selected: e.target.checked })}
                    className="mt-1 w-4 h-4 text-[#8273B8] rounded-md cursor-pointer accent-[#8273B8]"
                    aria-label={`Include ${event.title} in calendar`}
                  />

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-[#373444]">{event.title}</h3>

                        {/* Status badges */}
                        {event.status === 'created' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#234b23] bg-[#DDEBDD] px-2 py-0.5 rounded-lg">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Added to Google Calendar</span>
                          </span>
                        )}

                        {event.status === 'already_exists' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6F6B78] bg-[#FFF9F2] px-2 py-0.5 rounded-lg border border-[#EAE4E8]">
                            <span>Already on Calendar</span>
                          </span>
                        )}

                        {event.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C2424] bg-[#FCE4E4] px-2 py-0.5 rounded-lg">
                            <span>Creation Failed</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleStartEdit(event.id)}
                        className="p-1 text-[#6F6B78] hover:text-[#373444] rounded-lg hover:bg-[#FFF9F2] cursor-pointer"
                        title="Edit event details"
                        aria-label="Edit event"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Date and Time Row */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#373444] mb-2 font-medium">
                      <span className="flex items-center gap-1 bg-[#E8DFF5] px-2.5 py-1 rounded-lg text-[#55437a] font-bold">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{event.date || 'Year or Date Ambiguous'}</span>
                      </span>

                      {event.isAllDay ? (
                        <span className="bg-[#FFF9F2] px-2 py-1 rounded-lg border border-[#EAE4E8] text-[#6F6B78]">
                          All-day event
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-[#FFF9F2] px-2 py-1 rounded-lg border border-[#EAE4E8] text-[#6F6B78]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {event.startTime} {event.endTime ? `– ${event.endTime}` : ''}
                          </span>
                        </span>
                      )}

                      <span className="flex items-center gap-1 bg-[#FFF9F2] px-2 py-1 rounded-lg border border-[#EAE4E8] text-[#6F6B78]">
                        <Bell className="w-3.5 h-3.5 text-[#8273B8]" />
                        <span>
                          {reminderOptions.find((r) => r.value === event.suggestedReminderMinutes)?.label ||
                            '1 day before'}
                        </span>
                      </span>
                    </div>

                    {/* Ambiguity or Expiration Warnings */}
                    {event.isAmbiguous && (
                      <div className="p-2.5 rounded-xl bg-[#F9E4B7] text-[#7a4e10] text-xs flex items-start gap-2 mb-2 font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Date Ambiguity Detected:</p>
                          <p>{event.ambiguityReason || "We couldn't confirm the exact year or date. Please verify with the notice before creating."}</p>
                        </div>
                      </div>
                    )}

                    {event.isPassed && (
                      <div className="p-2.5 rounded-xl bg-[#FCE4E4] text-[#8C2424] text-xs flex items-start gap-2 mb-2 font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>This deadline has already passed relative to the current calendar date.</span>
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-[#6F6B78] mb-2">{event.description}</p>

                    {/* Source citation */}
                    {event.sourceQuote && (
                      <p className="text-xs text-[#524f60] italic bg-[#FFF9F2] p-2 rounded-xl border border-[#EAE4E8]">
                        💬 Source: &quot;{event.sourceQuote}&quot;
                      </p>
                    )}

                    {/* Google Calendar Link if created */}
                    {event.googleEventHtmlLink && (
                      <div className="mt-2">
                        <a
                          href={event.googleEventHtmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#8273B8] hover:underline font-bold"
                        >
                          <span>View on Google Calendar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Edit Panel */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-[#EAE4E8] bg-[#FFF9F2] p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#373444]">Edit Event Details</span>
                      <button
                        onClick={handleCloseEdit}
                        className="text-[#6F6B78] hover:text-[#373444] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#373444] mb-1">
                          Event Title
                        </label>
                        <input
                          type="text"
                          value={event.title}
                          onChange={(e) => onUpdateEvent(event.id, { title: e.target.value })}
                          className="w-full p-2 bg-white border border-[#EAE4E8] rounded-xl text-xs text-[#373444] focus-visible:ring-2 focus-visible:ring-[#8273B8]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#373444] mb-1">
                          Date (YYYY-MM-DD)
                        </label>
                        <input
                          type="date"
                          value={event.date}
                          onChange={(e) =>
                            onUpdateEvent(event.id, { date: e.target.value, isAmbiguous: false })
                          }
                          className="w-full p-2 bg-white border border-[#EAE4E8] rounded-xl text-xs text-[#373444] focus-visible:ring-2 focus-visible:ring-[#8273B8]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          id={`allday-${event.id}`}
                          checked={event.isAllDay}
                          onChange={(e) => onUpdateEvent(event.id, { isAllDay: e.target.checked })}
                          className="w-4 h-4 text-[#8273B8] rounded-md accent-[#8273B8]"
                        />
                        <label
                          htmlFor={`allday-${event.id}`}
                          className="text-xs font-medium text-[#373444] cursor-pointer"
                        >
                          All-day event
                        </label>
                      </div>

                      {!event.isAllDay && (
                        <>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#373444] mb-1">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={event.startTime || ''}
                              onChange={(e) => onUpdateEvent(event.id, { startTime: e.target.value })}
                              className="w-full p-2 bg-white border border-[#EAE4E8] rounded-xl text-xs text-[#373444]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#373444] mb-1">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={event.endTime || ''}
                              onChange={(e) => onUpdateEvent(event.id, { endTime: e.target.value })}
                              className="w-full p-2 bg-white border border-[#EAE4E8] rounded-xl text-xs text-[#373444]"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#373444] mb-1">
                        Reminder Notification
                      </label>
                      <select
                        value={event.suggestedReminderMinutes}
                        onChange={(e) =>
                          onUpdateEvent(event.id, {
                            suggestedReminderMinutes: Number(e.target.value),
                          })
                        }
                        className="p-2 bg-white border border-[#EAE4E8] rounded-xl text-xs text-[#373444] w-full sm:w-auto"
                      >
                        {reminderOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleCloseEdit}
                      className="px-4 py-1.5 bg-[#8273B8] text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Done Editing
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Action Bar */}
      <div className="mt-8 pt-6 border-t border-[#EAE4E8] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#6F6B78] text-center sm:text-left">
          <span>{selectedEvents.length} of {events.length} dates selected</span>
          {!accessToken && (
            <p className="text-[11px] text-[#8273B8] font-medium mt-0.5">
              Requires connecting your Google Calendar once.
            </p>
          )}
        </div>

        {accessToken ? (
          <button
            onClick={handleProceedToConfirm}
            disabled={selectedEvents.length === 0 || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#8273B8] hover:bg-[#7061A6] text-white font-bold text-sm rounded-2xl shadow-md cursor-pointer disabled:opacity-50 transition-all"
            aria-label="Add Selected Dates to Google Calendar"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Creating events...'
                : `Add ${selectedEvents.length} Selected Date${selectedEvents.length === 1 ? '' : 's'} to Google Calendar`}
            </span>
          </button>
        ) : (
          <button
            onClick={onConnectGoogle}
            className="gsi-material-button text-sm h-11 px-5 shadow-xs"
            aria-label="Connect Google Calendar to save events"
          >
            <div className="gsi-material-button-icon">
              <svg viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            </div>
            <span className="gsi-material-button-contents font-bold">Connect Google Calendar</span>
          </button>
        )}
      </div>

      {/* Confirmation Modal (MANDATORY per Workspace Destructive/Mutating Operations Policy) */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-calendar-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#EAE4E8] shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E8DFF5] text-[#8273B8] flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 id="confirm-calendar-title" className="text-lg font-bold text-[#373444]">
                  Confirm Google Calendar Events
                </h3>
                <p className="text-xs text-[#6F6B78]">
                  You are about to add {selectedEvents.length} event{selectedEvents.length === 1 ? '' : 's'} to your Google Calendar.
                </p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-[#FFF9F2] rounded-2xl border border-[#EAE4E8]">
              {selectedEvents.map((evt, idx) => (
                <div key={evt.id} className="text-xs text-[#373444] flex items-start gap-2">
                  <span className="font-bold text-[#8273B8]">{idx + 1}.</span>
                  <div>
                    <span className="font-bold">{evt.title}</span>
                    <span className="text-[#6F6B78] ml-1.5">({evt.date || 'Ambiguous date'})</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#6F6B78] leading-normal">
              Notice Mate checks for existing events to prevent duplicates. Reminders will be configured automatically.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE4E8] text-xs font-semibold text-[#6F6B78] hover:bg-[#FFF9F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteCalendarCreation}
                className="px-5 py-2 rounded-xl bg-[#8273B8] hover:bg-[#7061A6] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Confirm &amp; Add Events
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
