import { spawnSync } from 'node:child_process';
import { accessSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const result = spawnSync(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'build', '--config', 'vite.pages.config.ts'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
for (const route of ['index.html', 'compare/index.html', 'sources/index.html']) accessSync(resolve('dist/github-pages', route));
writeFileSync('dist/github-pages/.nojekyll', '');
console.log('GitHub Pages output ready: dist/github-pages');
