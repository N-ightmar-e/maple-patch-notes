'use client';
import { useSyncExternalStore } from 'react';
const subscribe = (changed: () => void) => {
  window.addEventListener('popstate', changed);
  return () => window.removeEventListener('popstate', changed);
};
const snapshot = () => window.location.search;
const serverSnapshot = () => '';
// Keep server hydration stable while reading shared job/skill URLs on the client.
export function useLocationSearch() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
