'use client';
import { useSyncExternalStore } from 'react';
import PatchReader from './patch-reader';
import WikiReader from './wiki-reader';
import { sitePath } from '@/lib/site-path';
import { isLegacyPatchUrl } from '@/lib/wiki-navigation.mjs';

const subscribe = (notify: () => void) => {
  window.addEventListener('popstate', notify);
  window.addEventListener('hashchange', notify);
  return () => {
    window.removeEventListener('popstate', notify);
    window.removeEventListener('hashchange', notify);
  };
};
const legacy = () => {
  return isLegacyPatchUrl(new URL(window.location.href), sitePath('/'));
};
export default function HomeEntry() {
  const previousLink = useSyncExternalStore(subscribe, legacy, () => false);
  return previousLink ? <PatchReader mode="notes" /> : <WikiReader />;
}
