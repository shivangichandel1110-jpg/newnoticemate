import { ActionItem } from '../types/notice';

export interface GoogleTaskResponse {
  id: string;
  title: string;
  notes?: string;
  due?: string; // RFC 3339 timestamp
  status: 'needsAction' | 'completed';
}

/**
 * Creates a task in the user's default Google Tasks list
 */
export async function createGoogleTask(
  accessToken: string,
  action: ActionItem,
  noticeTitle: string = 'Notice'
): Promise<GoogleTaskResponse> {
  const notes = [
    action.description || '',
    '',
    `📄 Notice: ${noticeTitle}`,
    action.sourceQuote ? `💬 Quotation: "${action.sourceQuote}"` : '',
    '',
    '✨ Synced via Notice Mate',
  ].filter(Boolean).join('\n');

  let dueString: string | undefined;
  if (action.dueDate) {
    // Google Tasks RFC 3339 timestamp with zero time
    dueString = `${action.dueDate}T00:00:00.000Z`;
  }

  const payload: any = {
    title: action.title,
    notes,
    status: action.completed ? 'completed' : 'needsAction',
  };

  if (dueString) {
    payload.due = dueString;
  }

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Google Tasks API returned HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * Sync multiple action items to Google Tasks
 */
export async function batchCreateGoogleTasks(
  accessToken: string,
  actions: ActionItem[],
  noticeTitle: string = 'Notice'
): Promise<{
  created: Array<{ actionId: string; taskId: string }>;
  failed: Array<{ actionId: string; error: string }>;
}> {
  const created: Array<{ actionId: string; taskId: string }> = [];
  const failed: Array<{ actionId: string; error: string }> = [];

  for (const action of actions) {
    try {
      const task = await createGoogleTask(accessToken, action, noticeTitle);
      created.push({ actionId: action.id, taskId: task.id });
    } catch (err: any) {
      failed.push({ actionId: action.id, error: err?.message || 'Failed to sync task' });
    }
  }

  return { created, failed };
}
