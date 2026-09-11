import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  root: `${root}pages`,
  base: '/maple-patch-notes/',
  publicDir: `${root}public`,
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': root, 'next/link': `${root}pages/link.tsx` } },
  define: {
    'process.env.NEXT_PUBLIC_BASE_PATH': JSON.stringify('/maple-patch-notes'),
    'process.env.NEXT_PUBLIC_SITE_ORIGIN': JSON.stringify(
      'https://n-ightmar-e.github.io',
    ),
  },
  build: {
    outDir: `${root}dist/github-pages`,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: `${root}pages/index.html`,
        notes: `${root}pages/notes/index.html`,
        wiki: `${root}pages/wiki/index.html`,
        wikiJob: `${root}pages/wiki/job/index.html`,
        wikiSkill: `${root}pages/wiki/skill/index.html`,
        wikiCompare: `${root}pages/wiki/compare/index.html`,
        wikiPatch: `${root}pages/wiki/patch/index.html`,
        compare: `${root}pages/compare/index.html`,
        sources: `${root}pages/sources/index.html`,
        history: `${root}pages/history/index.html`,
      },
    },
  },
});
