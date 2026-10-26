import { CalendarEventItem } from '../types/notice';

export interface GoogleCalendarEventResponse {
  id: string;
  summary: string;
  htmlLink: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  description?: string;
  extendedProperties?: {
    private?: Record<string, string>;
  };
}

/**
 * Checks for existing events around the target date to avoid creating duplicate calendar items
 */
export async function checkEventDuplicate(
  accessToken: string,
  event: CalendarEventItem,
  calendarId: string = 'primary'
): Promise<boolean> {
  try {
    if (!event.date) return false;
    const startDate = new Date(event.date);
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(event.date);
    endDate.setDate(endDate.getDate() + 2);

    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    const query = encodeURIComponent(event.title.trim().slice(0, 30));
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&q=${query}&maxResults=10`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return false;
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return false;

    // Check if any event summary strongly matches or has noticeMate tag
    const normalizedTarget = event.title.toLowerCase().trim();
    return data.items.some((item: any) => {
      const summary = (item.summary || '').toLowerCase().trim();
      const hasNoticeTag = item.description?.includes('Notice Mate') || item.extendedProperties?.private?.createdBy === 'NoticeMate';
      return (summary.includes(normalizedTarget) || normalizedTarget.includes(summary)) && (hasNoticeTag || Math.abs(summary.length - normalizedTarget.length) < 5);
    });
  } catch (err) {
    console.warn('Duplicate check warning:', err);
    return false;
  }
}

/**
 * Creates a single Google Calendar event
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: CalendarEventItem,
  noticeTitle: string = 'Official Notice',
  calendarId: string = 'primary'
): Promise<GoogleCalendarEventResponse> {
  const reminderMinutes = event.suggestedReminderMinutes || 1440; // 1 day before by default

  const description = [
    event.description || '',
    '',
    `📄 Source Notice: ${noticeTitle}`,
    event.sourceQuote ? `💬 Official Text: "${event.sourceQuote}"` : '',
    '',
    '✨ Added with Notice Mate — From Notice to Action',
  ].filter(Boolean).join('\n');

  let startObj: any = {};
  let endObj: any = {};

  if (event.isAllDay || !event.startTime) {
    // All-day event: Google Calendar requires end date to be the next day for exclusive end boundary
    const startDateStr = event.date;
    const nextDay = new Date(event.date);
    nextDay.setDate(nextDay.getDate() + 1);
    const endDateStr = nextDay.toISOString().split('T')[0];

    startObj = { date: startDateStr };
    endObj = { date: endDateStr };
  } else {
    // Specific time specified in the notice
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const startIso = `${event.date}T${event.startTime}:00`;
    let endIso = `${event.date}T${event.endTime || event.startTime}:00`;
    if (event.endTime === event.startTime || !event.endTime) {
      // Default to 1 hour duration
      const [h, m] = event.startTime.split(':').map(Number);
      const endH = String(Math.min(h + 1, 23)).padStart(2, '0');
      endIso = `${event.date}T${endH}:${String(m).padStart(2, '0')}:00`;
    }

    startObj = { dateTime: new Date(startIso).toISOString(), timeZone };
    endObj = { dateTime: new Date(endIso).toISOString(), timeZone };
  }

  const payload = {
    summary: event.title,
    description,
    start: startObj,
    end: endObj,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: reminderMinutes },
        ...(reminderMinutes > 1440 ? [{ method: 'popup', minutes: 1440 }] : []),
      ],
    },
    extendedProperties: {
      private: {
        createdBy: 'NoticeMate',
        sourceNotice: noticeTitle,
        noticeMateId: event.id,
      },
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(
      errorJson?.error?.message || `Google Calendar API returned HTTP ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Batch adds reviewed calendar events with duplicate verification
 */
export async function batchAddCalendarEvents(
  accessToken: string,
  events: CalendarEventItem[],
  noticeTitle: string = 'Notice'
): Promise<{
  results: Array<{
    id: string;
    status: 'created' | 'already_exists' | 'failed';
    googleEvent?: GoogleCalendarEventResponse;
    error?: string;
  }>;
  totalSuccess: number;
  totalSkipped: number;
  totalFailed: number;
}> {
  const results: Array<{
    id: string;
    status: 'created' | 'already_exists' | 'failed';
    googleEvent?: GoogleCalendarEventResponse;
    error?: string;
  }> = [];

  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const event of events) {
    if (!event.selected) continue;

    try {
      // Check for duplicate
      const isDuplicate = await checkEventDuplicate(accessToken, event);
      if (isDuplicate) {
        results.push({
          id: event.id,
          status: 'already_exists',
        });
        totalSkipped++;
        continue;
      }

      const created = await createGoogleCalendarEvent(accessToken, event, noticeTitle);
      results.push({
        id: event.id,
        status: 'created',
        googleEvent: created,
      });
      totalSuccess++;
    } catch (err: any) {
      console.error(`Failed to create event "${event.title}":`, err);
      results.push({
        id: event.id,
        status: 'failed',
        error: err?.message || 'Failed to save event to Google Calendar',
      });
      totalFailed++;
    }
  }

  return { results, totalSuccess, totalSkipped, totalFailed };
}

/**
 * Fetches events created by Notice Mate from primary calendar
 */
export async function listNoticeMateEvents(
  accessToken: string,
  maxResults = 25
): Promise<GoogleCalendarEventResponse[]> {
  const now = new Date();
  now.setDate(now.getDate() - 30); // Show recent past + upcoming
  const timeMin = now.toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list calendar events: HTTP ${res.status}`);
  }

  const data = await res.json();
  const items: GoogleCalendarEventResponse[] = data.items || [];

  // Filter for items created by Notice Mate or matching notice criteria
  return items.filter(
    (item) =>
      item.extendedProperties?.private?.createdBy === 'NoticeMate' ||
      item.description?.includes('Notice Mate')
  );
}

/**
 * Deletes an event from Google Calendar (requires explicit user confirmation in UI)
 */
export async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete event: HTTP ${res.status}`);
  }
}
