import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { matches, searchEntries } from '../lib/wiki-search.mjs';
import {
  parseReadingState,
  safeReturnPath,
  anchorForEvent,
  comparisonHref,
  changeSignals,
} from '../lib/reading-state.mjs';
import {
  jobHref,
  skillHref,
  patchHref,
  isLegacyPatchUrl,
} from '../lib/wiki-navigation.mjs';
const read = (name) =>
  JSON.parse(
    readFileSync(new URL(`../app/data/${name}.json`, import.meta.url), 'utf8'),
  );
const archive = read('skill-archive');
const patch = read('patch');
const icons = read('icons');
const sections = new Map(
  patch.sections.filter((s) => s.kind !== 'content').map((s) => [s.id, s]),
);
const current = new Map(
  patch.sections.flatMap((s) => s.skills).map((s) => [s.id, s]),
);
const names = new Set();
for (const skill of archive.records) {
  const url = new URL(skillHref(skill.id), 'https://example.com');
  assert.equal(url.searchParams.get('id'), skill.id);
  assert(
    !names.has(url.href),
    'Each archive record must have a unique permalink',
  );
  names.add(url.href);
  assert(sections.has(skill.sectionId), `Missing parent document: ${skill.id}`);
  const icon = icons.skills[skill.patchId];
  if (icon)
    assert(
      existsSync(new URL(`../public${icon}`, import.meta.url)),
      `Missing icon: ${icon}`,
    );
}
assert.equal(
  new URL(jobHref('section-03'), 'https://example.com').pathname,
  '/wiki/job/',
);
for (const source of archive.sources)
  assert.equal(
    new URL(patchHref(source.id), 'https://example.com').searchParams.get('id'),
    source.id,
  );
for (const base of ['', '/maple-patch-notes']) {
  const url = (suffix) => new URL(`https://example.com${base}/${suffix}`);
  assert.equal(
    isLegacyPatchUrl(url('?job=section-03#section-03-skill-001'), base),
    true,
  );
  assert.equal(isLegacyPatchUrl(url('?q=레이징'), base), true);
  assert.equal(isLegacyPatchUrl(url('#section-03-skill-001'), base), true);
  assert.equal(isLegacyPatchUrl(url(''), base), false);
  assert.equal(
    isLegacyPatchUrl(url('wiki/?q=레이징'), base),
    false,
    'Typing in the new home search must not switch to the old reader',
  );
  assert.equal(isLegacyPatchUrl(url('wiki/job/?id=section-03'), base), false);
}
assert(matches('레이징 블로우 VI', '레이징블로우 vi'));
assert(matches('히어로', 'ㅎㅇㄹ'));
assert(matches('다크나이트', 'ㄷㅋㄴㅇㅌ'));
assert(!matches('팔라딘', 'ㅎㅇㄹ'));
const searchable = archive.records.map((skill) => ({
  ...skill,
  text: `${skill.job} ${skill.name} ${skill.classification.tier} ${[...skill.events, ...(skill.commonEvents || [])].flatMap((event) => (event.patchId ? current.get(event.patchId).lines : event.lines || [])).join(' ')}`,
}));
const heroSix = searchEntries(searchable, '히어로 6차');
assert(
  heroSix.length > 0 &&
    heroSix.every((s) => s.job === '히어로' && s.classification.tier === '6차'),
);
const raging = searchEntries(searchable, '레이징 블로우');
assert(
  raging.length > 1 && raging[0].name === '레이징 블로우',
  'Exact names should precede VI and body matches',
);
assert(searchEntries(searchable, 'ㅎㅇㄹ').some((s) => s.job === '히어로'));
assert(
  searchEntries(searchable, '저항 시간').some(
    (s) => s.name === '행동 불가 저항 시간',
  ),
  'Search must include source text',
);
assert.equal(searchEntries(searchable, '존재하지않는스킬abc').length, 0);
const routeViews = {
  '': 'home',
  notes: 'notes',
  wiki: 'wiki',
  'wiki/job': 'wiki-job',
  'wiki/skill': 'wiki-skill',
  'wiki/patch': 'wiki-patch',
  'wiki/compare': 'wiki-compare',
  history: 'history',
  compare: 'compare',
  sources: 'sources',
};
for (const [route, view] of Object.entries(routeViews)) {
  const html = readFileSync(
    new URL(`../pages/${route ? route + '/' : ''}index.html`, import.meta.url),
    'utf8',
  );
  assert(
    html.includes(`data-view="${view}"`),
    `Incorrect entrypoint: ${route}`,
  );
}
console.log(
  `Wiki checked: ${names.size} unique skill documents, ${sections.size} parent documents, 10 routes, Korean search and legacy URLs.`,
);

// Restored browser data and shared URLs must remain usable after invalid input.
assert.deepEqual(parseReadingState('{broken').comparison, []);
const restored = parseReadingState(
  JSON.stringify({
    favorites: ['job:section-03', 'job:section-03', 'https://external.invalid'],
    comparison: ['archive-abc', 'archive-abc', 'archive-def', 'archive-123'],
    recent: Array.from({ length: 20 }, (_, i) => `job:section-${i}`),
  }),
);
assert.deepEqual(restored.favorites, ['job:section-03']);
assert.deepEqual(restored.comparison, ['archive-abc', 'archive-def']);
assert.equal(restored.recent.length, 12);
for (const bad of [
  'https://external.invalid/wiki/',
  '//external.invalid/wiki/',
  '/wiki/../../outside',
  '/notes/',
  '/wiki/\\external',
])
  assert.equal(safeReturnPath(bad), null);
assert.equal(
  safeReturnPath('/wiki/job/?id=section-03&tier=6차&effect=nerf'),
  '/wiki/job/?id=section-03&tier=6%EC%B0%A8&effect=nerf',
);
const oldEvents = [
  { sourceId: 'p205' },
  { sourceId: 'p205' },
  { sourceId: 'p204' },
];
assert.equal(
  anchorForEvent(oldEvents, 1),
  anchorForEvent([{ sourceId: 'p206' }, ...oldEvents], 2),
);
assert.deepEqual(
  changeSignals([
    {
      tags: ['review'],
      changes: [{ direction: 'nerf' }, { direction: 'buff' }],
    },
  ]).sort(),
  ['buff', 'nerf', 'review'],
);
assert.deepEqual(changeSignals([]), ['past']);
assert.equal(
  comparisonHref(['archive-abc', 'archive-abc', 'archive-def', 'archive-123']),
  '/wiki/compare/?skills=archive-abc,archive-def',
);
assert(
  searchEntries(searchable, 'ㅎㅇㄹ')
    .slice(0, 3)
    .some((entry) => entry.job === '히어로'),
  'Exact job initials should rank ahead of body-only matches',
);
console.log(
  'Reading state, shared comparison URLs, overlapping change signals and version anchors checked.',
);
