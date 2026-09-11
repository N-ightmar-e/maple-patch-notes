'use client';
import { useMemo, useSyncExternalStore } from 'react';
import { parseReadingState, emptyReadingState } from './reading-state.mjs';
import { byArchiveId } from './skill-archive';

const validState = (raw: unknown): ReadingState => {
  const state = parseReadingState(raw) as ReadingState;
  return {
    ...state,
    comparison: state.comparison.filter((id) => byArchiveId.has(id)),
  };
};

export type ReadingState = {
  favorites: string[];
  recent: string[];
  comparison: string[];
};
const key = 'maple-wiki-reading-v1';
const blank = JSON.stringify(emptyReadingState);
let fallback: string | null = null;
const snapshot = () => {
  if (fallback !== null) return fallback;
  try {
    return window.localStorage.getItem(key) || blank;
  } catch {
    return blank;
  }
};
const subscribe = (notify: () => void) => {
  const storage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) {
      fallback = null;
      notify();
    }
  };
  window.addEventListener('maple-reading', notify);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener('maple-reading', notify);
    window.removeEventListener('storage', storage);
  };
};
export function updateReadingState(
  update: (state: ReadingState) => ReadingState,
): boolean {
  const next = JSON.stringify(validState(update(validState(snapshot()))));
  let persisted = true;
  try {
    window.localStorage.setItem(key, next);
    fallback = null;
  } catch {
    fallback = next;
    persisted = false;
  }
  window.dispatchEvent(new Event('maple-reading'));
  return persisted;
}
export function useReadingState(): ReadingState {
  const raw = useSyncExternalStore(subscribe, snapshot, () => blank);
  return useMemo(() => validState(raw), [raw]);
}
export const rememberDocument = (id: string) =>
  updateReadingState((state) => ({
    ...state,
    recent: [id, ...state.recent.filter((value) => value !== id)].slice(0, 12),
  }));
