import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../app/data/${name}.json`, import.meta.url), 'utf8'));
const archive = read('skill-archive');
const patch = read('patch');
const sources = new Map(archive.sources.map(s => [s.id, s]));
const current = new Map(patch.sections.filter(s => s.kind !== 'content').flatMap(s => s.skills.map(k => [k.id, {skill:k, section:s}])));
const records = new Map(archive.records.map(s => [s.id, s]));
const represented = new Set();
assert.equal(records.size, archive.records.length, 'Duplicate archive IDs');
assert.equal(sources.size, 4, 'Declared coverage must match the four researched notices');
for (const skill of archive.records) {
  assert(skill.events.length, `No events for ${skill.id}`);
  assert(skill.classification.tier && skill.classification.basis, `Unlabeled tier for ${skill.id}`);
  assert(new URL(skill.classification.sourceUrl).hostname.endsWith('.nexon.com'));
  for (const event of skill.events) {
    assert(sources.has(event.sourceId), `Unknown source ${event.sourceId}`);
    if (event.patchId) {
      const source = current.get(event.patchId);
      assert(source, `Unknown current entry ${event.patchId}`);
      assert.equal(source.section.name, skill.job, 'Cross-job history link');
      assert.equal(source.skill.name, skill.name, 'Current skill name mismatch');
      assert(!represented.has(event.patchId), `Duplicate current event ${event.patchId}`);
      represented.add(event.patchId);
    } else {
      assert(event.lines?.length, `Empty earlier event ${skill.id}`);
      assert(event.lines.every(line => !/■|GM소리|안녕하세요/.test(line)), 'Unparsed article boundary');
    }
  }
  if (skill.relatedId) {
    const related = records.get(skill.relatedId);
    assert(related && related.job === skill.job, `Invalid related skill ${skill.id}`);
    assert.notEqual(related.classification.tier, skill.classification.tier, 'Original and VI must stay distinct');
  }
}
assert.equal(represented.size, current.size, 'A current patch entry is missing from its history');
const find = (job, name) => archive.records.find(s => s.job === job && s.name === name);
assert.equal(find('듀얼블레이드','토네이도 스핀').classification.tier,'1.5차');
assert.equal(find('듀얼블레이드','플라잉 어썰터').classification.tier,'2.5차');
assert.equal(find('제로','타임 홀딩').classification.tier,'초월자');
assert.equal(find('히어로','퓨리어스 엣지').classification.tier,'6차', 'Mastery release order is not advancement tier');
assert.equal(find('히어로','레이지 익스플로젼').events.length,4);
assert.equal(find('일리움','글로리 윙:스플렌더').events.length,3, 'Inline source section heading must be preserved');
assert(!find('아델','글로리 윙:스플렌더'), 'Do not assign an inline-heading skill to the preceding job');
assert.equal(archive.namuWiki.status,'unverified','NamuWiki was inaccessible and must not be cited as verified');
console.log(`Archive checked: ${records.size} records, ${represented.size} current entries, ${sources.size} source notices.`);
