import { createRoot } from 'react-dom/client';
import PatchReader from '../app/patch-reader';
import '../app/globals.css';
const mode = document.body.dataset.view as 'notes' | 'compare' | 'sources' | 'history';
createRoot(document.getElementById('root')!).render(<PatchReader mode={mode}/>);
