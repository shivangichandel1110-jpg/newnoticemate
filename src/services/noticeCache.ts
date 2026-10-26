import { NoticeAnalysis } from '../types/notice';

// In-memory session cache
const sessionCache = new Map<string, NoticeAnalysis>();

/**
 * Computes a fast string hash / key for notice content
 */
export function computeNoticeKey(params: {
  text?: string;
  fileName?: string;
  fileSize?: number;
  fileBase64Snippet?: string;
}): string {
  if (params.text) {
    const clean = params.text.trim();
    // Use length + sample from head, middle, tail
    const len = clean.length;
    const sample = clean.slice(0, 100) + clean.slice(Math.floor(len / 2), Math.floor(len / 2) + 50) + clean.slice(-50);
    return `text:${len}:${sample}`;
  }

  if (params.fileName || params.fileSize) {
    return `file:${params.fileName || 'unnamed'}:${params.fileSize || 0}:${params.fileBase64Snippet?.slice(0, 60) || ''}`;
  }

  return `random:${Date.now()}`;
}

export function getCachedNotice(key: string): NoticeAnalysis | null {
  return sessionCache.get(key) || null;
}

export function setCachedNotice(key: string, notice: NoticeAnalysis): void {
  // Keep cache size bounded to last 30 items
  if (sessionCache.size > 30) {
    const firstKey = sessionCache.keys().next().value;
    if (firstKey) sessionCache.delete(firstKey);
  }
  sessionCache.set(key, notice);
}

export function clearNoticeCache(): void {
  sessionCache.clear();
}
