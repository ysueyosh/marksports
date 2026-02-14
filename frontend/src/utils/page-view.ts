import { recordPageView } from '@/api/page-views';

const STORAGE_KEY = 'pageViewAccess';
const PAGE_VIEW_WINDOW_MS = 5 * 60 * 1000;

const parseAccessMap = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};

  try {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string>;
    }
  } catch (error) {
    console.warn('Failed to parse pageViewAccess from localStorage:', error);
  }

  return {};
};

const saveAccessMap = (map: Record<string, string>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

export const recordPageViewIfNeeded = async (pageId: string) => {
  if (!pageId || typeof window === 'undefined') return;

  const now = Date.now();
  const accessMap = parseAccessMap();
  const lastAccess = accessMap[pageId];

  let shouldRecord = true;
  if (lastAccess) {
    const lastAccessMs = new Date(lastAccess).getTime();
    if (!Number.isNaN(lastAccessMs)) {
      shouldRecord = now - lastAccessMs >= PAGE_VIEW_WINDOW_MS;
    }
  }

  const nowIso = new Date(now).toISOString();

  if (shouldRecord) {
    accessMap[pageId] = nowIso;
    saveAccessMap(accessMap);
    try {
      await recordPageView(pageId);
    } catch (error) {
      console.error('Failed to record page view:', error);
    }
    return;
  }

  accessMap[pageId] = nowIso;
  saveAccessMap(accessMap);
};
