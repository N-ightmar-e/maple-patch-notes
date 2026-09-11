import { createRoot } from 'react-dom/client';
import PatchReader from '../app/patch-reader';
import HomeEntry from '../app/home-entry';
import WikiReader, { type WikiView } from '../app/wiki-reader';
import '../app/globals.css';
const view = document.body.dataset.view || 'home';
const screen =
  view === 'home' ? (
    <HomeEntry />
  ) : view.startsWith('wiki') ? (
    <WikiReader view={view as WikiView} />
  ) : (
    <PatchReader mode={view as 'notes' | 'compare' | 'sources' | 'history'} />
  );
createRoot(document.getElementById('root')!).render(screen);
