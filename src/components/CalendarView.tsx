import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  ExternalLink,
  Trash2,
  CalendarCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { listNoticeMateEvents, deleteCalendarEvent, GoogleCalendarEventResponse } from '../services/googleCalendar';
import { CalendarEventItem } from '../types/notice';

interface CalendarViewProps {
  accessToken: string | null;
  onConnectGoogle: () => void;
  localEvents: CalendarEventItem[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  accessToken,
  onConnectGoogle,
  localEvents,
}) => {
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const fetchGoogleEvents = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const items = await listNoticeMateEvents(accessToken);
      setGoogleEvents(items);
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      setError('Could not fetch events from Google Calendar. You may need to reconnect.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchGoogleEvents();
    }
  }, [accessToken]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!accessToken) return;
    try {
      await deleteCalendarEvent(accessToken, eventId);
      setGoogleEvents((prev) => prev.filter((e) => e.id !== eventId));
      setEventToDelete(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to remove event from Google Calendar.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-[#E8DFF5] text-[#8273B8] flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#373444] tracking-tight">
                Synced Calendar Deadlines
              </h1>
              <p className="text-xs sm:text-sm text-[#6F6B78]">
                Deadlines and important dates added to your Google Calendar through Notice Mate.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {accessToken ? (
            <>
              <button
                onClick={fetchGoogleEvents}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFF9F2] hover:bg-[#eae0d5] text-[#373444] border border-[#EAE4E8] rounded-xl text-xs font-semibold cursor-pointer"
                title="Refresh calendar events"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#8273B8] hover:bg-[#7061A6] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                <span>Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          ) : (
            <button
              onClick={onConnectGoogle}
              className="gsi-material-button text-xs h-9 px-4"
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
              <span className="gsi-material-button-contents font-bold">Connect Google Calendar</span>
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-[#FCE4E4] border border-[#f5b8b8] text-[#8C2424] rounded-2xl flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Events List */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EAE4E8]">
          <h2 className="text-base font-bold text-[#373444]">
            {accessToken ? `Events on Google Calendar (${googleEvents.length})` : 'Notice Deadlines Overview'}
          </h2>

          <div className="inline-flex bg-[#FFF9F2] p-1 rounded-2xl border border-[#EAE4E8]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                filter === 'all' ? 'bg-white text-[#373444] shadow-xs' : 'text-[#6F6B78]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                filter === 'upcoming' ? 'bg-white text-[#373444] shadow-xs' : 'text-[#6F6B78]'
              }`}
            >
              Upcoming
            </button>
          </div>
        </div>

        {accessToken ? (
          googleEvents.length === 0 ? (
            <div className="text-center py-12 bg-[#FFF9F2] rounded-2xl border border-dashed border-[#EAE4E8]">
              <CalendarIcon className="w-10 h-10 text-[#8273B8] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#373444]">No Notice Mate events on your calendar yet.</p>
              <p className="text-xs text-[#6F6B78] mt-1 max-w-sm mx-auto">
                Process an official notice on the Home page, review the extracted dates, and click &quot;Add Selected Dates to Google Calendar&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {googleEvents.map((evt) => {
                const dateDisplay = evt.start?.date || evt.start?.dateTime?.split('T')[0] || '';
                const timeDisplay = evt.start?.dateTime
                  ? new Date(evt.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'All-day event';

                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl border border-[#EAE4E8] bg-[#FFF9F2]/40 hover:bg-[#FFF9F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm sm:text-base text-[#373444]">{evt.summary}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-[#DDEBDD] text-[#2c532c] rounded-md">
                          Live on Calendar
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#6F6B78]">
                        <span className="flex items-center gap-1 font-medium text-[#8273B8]">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>{dateDisplay}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{timeDisplay}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {evt.htmlLink && (
                        <a
                          href={evt.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#8273B8] hover:bg-white rounded-xl border border-[#EAE4E8] cursor-pointer"
                          title="Open event in Google Calendar"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setEventToDelete(evt.id)}
                        className="p-2 text-[#6F6B78] hover:text-red-600 hover:bg-white rounded-xl border border-[#EAE4E8] cursor-pointer"
                        title="Delete event from Google Calendar"
                        aria-label="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* When Google is not connected yet, show local event candidates */
          <div>
            <div className="p-4 mb-4 bg-[#DCEAF7]/30 border border-[#b8d6f2] rounded-2xl text-xs text-[#2b5177] flex items-center justify-between">
              <span>Connect Google Calendar to sync and view your real events here.</span>
              <button
                onClick={onConnectGoogle}
                className="font-bold text-[#8273B8] hover:underline cursor-pointer"
              >
                Connect Now →
              </button>
            </div>

            {localEvents.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#6F6B78]">No events extracted yet.</p>
            ) : (
              <div className="space-y-3">
                {localEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl border border-[#EAE4E8] bg-[#FFF9F2]/50 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-[#373444]">{evt.title}</h3>
                      <p className="text-xs text-[#6F6B78]">
                        Date: {evt.date || 'Ambiguous'} • {evt.isAllDay ? 'All-day' : evt.startTime || 'Time not specified'}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#8273B8] bg-[#E8DFF5] px-2.5 py-1 rounded-xl">
                      Ready to sync
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Destructive Delete (MANDATORY per workspace skill) */}
      {eventToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#EAE4E8] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#373444]">
              Delete Event from Google Calendar?
            </h3>
            <p className="text-xs text-[#6F6B78]">
              This will remove the event directly from your Google Calendar. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4E8] text-xs font-semibold text-[#6F6B78] hover:bg-[#FFF9F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(eventToDelete)}
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
