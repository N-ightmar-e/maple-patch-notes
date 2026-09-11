import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {numericNotes,productChange,perCooldownChange} from '../lib/analysis-math.mjs';
const read = file => JSON.parse(readFileSync(new URL(`../app/data/${file}.json`,import.meta.url),'utf8'));
const patch=read('patch'),analysis=read('analysis');
const skills=new Map(patch.sections.flatMap(sec=>sec.skills.map(skill=>[skill.id,{...skill,job:sec.name,sectionId:sec.id}])));
assert.equal(analysis.version,patch.version);
assert.equal(analysis.sourceRevision,patch.sourceRevision);
for(const [id,comment] of Object.entries(analysis.comments)){
 const skill=skills.get(id);assert(skill,`Missing analysis target ${id}`);
 assert.equal(comment.job,skill.job);assert.equal(comment.skill,skill.name);assert.equal(comment.sectionId,skill.sectionId);
 assert.equal(createHash('sha256').update(skill.lines.join('\n')).digest('hex'),comment.sourceHash,`Stale AI commentary: ${id}. Re-review it after changing the source.`);
 assert(comment.title&&comment.takeaway&&comment.reasoning&&comment.verify,'Incomplete commentary');
}
for(const sec of patch.sections.filter(s=>s.kind==='job'))assert(Object.values(analysis.comments).some(c=>c.sectionId===sec.id),`No editorial for ${sec.name}`);
const find=(job,name)=>[...skills.values()].find(s=>s.job===job&&s.name===name);
const notesFor=(job,name)=>numericNotes(find(job,name)).map(n=>`${n.title} ${n.text}`).join(' ');
const chasing=notesFor('카인','체이싱 샷');assert(!chasing.includes('933'));assert(chasing.includes('단위'));
const divine=notesFor('비숍','디바인 퍼니시먼트');assert(!divine.includes('7900'));assert(!divine.includes('재사용 빈도'));assert(divine.includes('소비 기준'));
const rage=notesFor('히어로','인레이지');assert(rage.includes('+2%p'));assert(rage.includes('전체 피해의 증가율이 아닙니다'));
const distortion=productChange([350,2],[525,5]);assert.equal(distortion.before,700);assert.equal(distortion.after,2625);assert.equal(distortion.percent,275);
const tornado=productChange([880,6],[1320,4]);assert.equal(tornado.percent,0);
const ord=find('카데나','A.D 오드넌스');
const field=name=>{const c=ord.changes.find(c=>c.metric===name);assert(c,`Missing ordnance metric ${name}`);return c;};
const d=field('응집의 데미지'),h=field('응집의 공격 횟수'),n=field('응집의 발생 횟수'),o=field('구체의 데미지'),oh=field('구체의 공격 횟수'),cd=field('재사용 대기시간');
const before=d.before*h.before*n.before+o.before*oh.before,after=d.after*h.after*n.after+o.after*oh.after;
assert.equal(before,107250);assert.equal(after,150810);assert.equal(((after/before-1)*100).toFixed(2),'40.62');assert.equal(perCooldownChange(before,after,cd.before,cd.after).toFixed(2),'-41.41');
assert.equal(perCooldownChange(1,1,120,60),100);
assert.equal(perCooldownChange(0,1,120,60),null);
assert.equal(productChange([0],[1]).percent,null);
assert.equal(productChange([-1],[1]),null);
const corrected=find('미하일','레디언스 오브 발러');assert(corrected.changes.every(c=>c.direction==='buff'),'Official increase wording was corrected');
assert(find('키네시스','싸이킥 러쉬').lines.some(l=>l.includes('6% 감소')));
assert(find('나이트워커','래피드 이베이젼').lines.some(l=>l.includes('27% 감소')));
assert(!find('다크나이트','돌진').lines.some(l=>l.includes('비홀더스 버프')));
assert(find('다크나이트','비홀더스 버프'));
assert(find('엔젤릭버스터','그랜드 피날레'));
let automatic=0;
for(const s of skills.values()){
 const notes=numericNotes(s);if(notes.length)automatic++;
 for(const n of notes){assert(typeof n.title==='string'&&typeof n.text==='string');assert(!/NaN|Infinity|undefined/.test(n.text),s.id);}
}
console.log(`Analysis checked: ${Object.keys(analysis.comments).length} AI editorials across 48 jobs; ${automatic} entries have deterministic notes. Source freshness, corrected statements and conditional arithmetic verified.`);
