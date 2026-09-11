'use client';
/* eslint-disable next/no-img-element -- These are local, fixed-size game icons served by static GitHub Pages. */
import {
  AnalysisComment,
  JobAnalysisHighlight,
  AnalysisSources,
} from './analysis-comment';
import { useLocationSearch } from '@/lib/use-location-search';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  HistoryBrowser,
  ArchiveSources,
  TierBadge,
  TierFilters,
  SkillHistoryLink,
} from './skill-history';
import {
  archiveSkills,
  tierOf,
  tiers,
  tierDescription,
  byPatchId,
} from '@/lib/skill-archive';
import { skillHref, jobHref } from '@/lib/wiki';
import { sitePath } from '@/lib/site-path';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Leaf,
  ListFilter,
  Search,
  Swords,
  X,
  Info,
  SlidersHorizontal,
  History,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import rawPatch from './data/patch.json';
import rawIcons from './data/icons.json';
import rawResearch from './data/research.json';

type Change = {
  text: string;
  before: number;
  after: number;
  unit: string;
  beforeUnit?: string;
  afterUnit?: string;
  beforeContext?: string;
  afterContext?: string;
  metric: string;
  relativeChange: number;
  direction: string;
  reason?: string;
};
type Skill = {
  id: string;
  name: string;
  lines: string[];
  changes: Change[];
  tags: string[];
};
type Section = {
  id: string;
  name: string;
  kind: string;
  skills: Skill[];
  paragraphs?: string[];
};
const patch = rawPatch as {
  title: string;
  version: string;
  date: string;
  sourceUrl: string;
  sections: Section[];
};
const icons = rawIcons as {
  jobs: Record<string, string>;
  skills: Record<string, string>;
};
const research = rawResearch as {
  sources: {
    title: string;
    url: string;
    date?: string;
    description?: string;
  }[];
  findings: { title: string; detail: string }[];
};
const labels: Record<string, string> = {
  all: '전체 변경',
  nerf: '수치 하향',
  buff: '수치 상향',
  mixed: '구조 개편',
  review: '확인 필요',
  new: '신규',
  removed: '삭제',
  changed: '변경',
};
const allSkills = patch.sections.flatMap((section) =>
  section.skills.map((skill) => ({ ...skill, section })),
);
const num = (n: number) =>
  n.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
const norm = (s: string) => s.replace(/\s/g, '').toLowerCase();
function SkillIcon({
  id,
  name,
  job,
  small = false,
}: {
  id?: string;
  name: string;
  job?: string;
  small?: boolean;
}) {
  const src =
    (id && icons.skills[id]) ||
    icons.skills[`${job}|${name}`] ||
    icons.skills[name];
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`skill-icon ${small ? 'small' : ''}`}
      title={
        src
          ? '공식 가이드 아이콘 · 패치 이전 이미지일 수 있습니다'
          : '공식 아이콘 미확인'
      }
    >
      {src && !failed ? (
        <img
          src={sitePath(src)}
          alt=""
          width="32"
          height="32"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Swords size={20} />
      )}
    </span>
  );
}
function Badge({ tag }: { tag: string }) {
  return (
    <span className={`badge ${tag}`}>
      {tag === 'nerf' ? (
        <ArrowDownRight size={13} />
      ) : tag === 'buff' ? (
        <ArrowUpRight size={13} />
      ) : null}
      {labels[tag] || tag}
    </span>
  );
}
function Index({
  selected,
  select,
  archiveMode = false,
}: {
  selected: string;
  select: (id: string) => void;
  archiveMode?: boolean;
}) {
  const count = (id?: string) =>
    archiveMode
      ? archiveSkills.filter((s) => !id || s.sectionId === id).length
      : id
        ? patch.sections.find((s) => s.id === id)?.skills.length || 0
        : allSkills.length;
  const { setOpenMobile } = useSidebar();
  const [query, setQuery] = useState('');
  const choose = (id: string) => {
    select(id);
    setOpenMobile(false);
  };
  return (
    <Sidebar className="job-sidebar">
      <SidebarHeader className="index-head">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Leaf size={23} />
          </span>
          <span>
            메이플 패치노트<small>MAPLE PATCH ARCHIVE</small>
          </span>
        </Link>
        <div className="edition">
          <span className="live-dot" />
          TEST WORLD <b>1.2.206</b>
        </div>
      </SidebarHeader>
      <SidebarContent className="index-content">
        <div className="index-label">
          <span>패치 색인</span>
          <span>{patch.sections.length}</span>
        </div>
        <div className="index-search">
          <Search size={15} />
          <Input
            aria-label="색인에서 직업 찾기"
            placeholder="직업 찾기"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          className={`job-link all-link ${selected === 'all' ? 'selected' : ''}`}
          onClick={() => choose('all')}
        >
          <BookOpen size={17} />
          <span>전체 보기</span>
          <small>{count()}</small>
        </button>
        {(archiveMode ? ['common', 'job'] : ['common', 'job', 'content']).map(
          (kind) => (
            <div key={kind} className="index-group">
              <div className="group-title">
                {kind === 'common'
                  ? '공통 · 직업군'
                  : kind === 'job'
                    ? '직업별 변경'
                    : '콘텐츠 · 지원'}
              </div>
              {patch.sections
                .filter(
                  (s) => s.kind === kind && norm(s.name).includes(norm(query)),
                )
                .map((s) => (
                  <button
                    key={s.id}
                    className={`job-link ${selected === s.id ? 'selected' : ''}`}
                    onClick={() => choose(s.id)}
                  >
                    {icons.jobs[s.name] ? (
                      <img
                        src={sitePath(icons.jobs[s.name])}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className="job-monogram">{s.name.slice(0, 1)}</span>
                    )}
                    <span>{s.name}</span>
                    <small>{count(s.id) || '↗'}</small>
                  </button>
                ))}
            </div>
          ),
        )}
      </SidebarContent>
      <SidebarFooter className="index-footer">
        <span>2026. 09. 10. 공개</span>
        <a href={patch.sourceUrl} target="_blank" rel="noreferrer">
          NEXON 공식 원문 <ExternalLink size={12} />
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
function ChangeRow({ c }: { c: Change }) {
  return (
    <div className={`change-row ${c.direction}`}>
      <div className="change-metric">{c.metric || '수치 변경'}</div>
      <div className="change-values">
        <span className="old-value">
          {c.beforeContext && <small>{c.beforeContext} </small>}
          {num(c.before)}
          {c.beforeUnit ?? c.unit}
        </span>
        <ArrowRight size={15} />
        <strong>
          {c.afterContext && <small>{c.afterContext} </small>}
          {num(c.after)}
          {c.afterUnit ?? c.unit}
        </strong>
        <span className={`delta ${c.direction}`}>
          {c.direction === 'review'
            ? '—'
            : `${c.relativeChange > 0 ? '+' : ''}${num(c.relativeChange)}%`}
        </span>
      </div>
      {c.reason && <small className="change-reason">{c.reason}</small>}
    </div>
  );
}
function SkillCard({ skill, job }: { skill: Skill; job: string }) {
  const tag = skill.tags.includes('review')
    ? 'review'
    : skill.tags.includes('mixed')
      ? 'mixed'
      : skill.changes.some((c) => c.direction === 'nerf')
        ? 'nerf'
        : skill.changes.some((c) => c.direction === 'buff')
          ? 'buff'
          : skill.tags.includes('new')
            ? 'new'
            : skill.tags.includes('removed')
              ? 'removed'
              : 'changed';
  return (
    <article className="skill-card" id={skill.id}>
      <header className="skill-card-head">
        <SkillIcon id={skill.id} name={skill.name} job={job} />
        <div>
          <h3>{skill.name}</h3>
          <span className="skill-meta">
            {job}
            <TierBadge id={skill.id} />
            {!icons.skills[skill.id] && (
              <span className="icon-unavailable"> · 아이콘 미확인</span>
            )}
          </span>
        </div>
        <Badge tag={tag} />
      </header>
      {skill.changes.length > 0 && (
        <div className="change-box">
          {skill.changes.map((c, i) => (
            <ChangeRow key={i} c={c} />
          ))}
        </div>
      )}
      {tag === 'mixed' && (
        <p className="mixed-note">
          <Info size={14} />
          기능·발동 방식이 함께 변경됩니다. 개별 수치가 전체 성능의 변화를
          뜻하지 않습니다.
        </p>
      )}
      <ul className="patch-lines">
        {skill.lines.map((line, i) => (
          <li key={i}>{line.replace(/^[·•]\s*/, '')}</li>
        ))}
      </ul>
      <AnalysisComment id={skill.id} />
      <div className="skill-card-footer">
        <SkillHistoryLink id={skill.id} />
        {byPatchId.has(skill.id) && (
          <Link
            className="skill-history-link"
            href={skillHref(byPatchId.get(skill.id)!.id)}
          >
            위키 문서 <BookOpen size={14} />
          </Link>
        )}
        <a
          className="card-source"
          href={patch.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          공식 패치노트 근거 <ExternalLink size={12} />
        </a>
      </div>
    </article>
  );
}
function Empty({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <Search size={27} />
      <h3>조건에 맞는 변경이 없습니다.</h3>
      <p>다른 직업이나 검색어를 선택해 보세요.</p>
      <button className="external-button" onClick={reset}>
        모든 변경 보기
      </button>
    </div>
  );
}
export default function PatchReader({
  mode,
}: {
  mode: 'notes' | 'compare' | 'sources' | 'history';
}) {
  const search = useLocationSearch();
  const params = new URLSearchParams(search);
  const jobParam = params.get('job');
  const defaultJob =
    mode === 'compare'
      ? 'all'
      : patch.sections.find((s) => s.name === '히어로')?.id || 'all';
  const [selectedOverride, setSelected] = useState<string | null>(null);
  const selected =
    selectedOverride ??
    (jobParam &&
    (jobParam === 'all' || patch.sections.some((s) => s.id === jobParam))
      ? jobParam
      : defaultJob);
  const [queryOverride, setQuery] = useState<string | null>(null);
  const query = queryOverride ?? params.get('q') ?? '';
  const [tierOverride, setTier] = useState<string | null>(null);
  const tierParam = params.get('tier') || '';
  const tier = tierOverride ?? (tiers.includes(tierParam) ? tierParam : 'all');
  const [filter, setFilter] = useState(mode === 'compare' ? 'nerf' : 'all');
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() =>
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ block: 'start' }),
      );
    }
  }, [selected]);
  const select = (id: string) => {
    if (mode === 'sources') {
      location.href = sitePath(id === 'all' ? '/?job=all' : `/?job=${id}`);
      return;
    }
    setSelected(id);
    setQuery('');
    setTier('all');
    const u = new URL(location.href);
    u.searchParams.set('job', id);
    ['q', 'tier', 'skill', 'version', 'past'].forEach((k) =>
      u.searchParams.delete(k),
    );
    u.hash = '';
    history.replaceState(null, '', u);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const beforeTier = useMemo(
    () =>
      allSkills.filter(
        (s) =>
          norm(`${s.section.name} ${s.name} ${s.lines.join(' ')}`).includes(
            norm(query),
          ) &&
          (query || selected === 'all' || s.section.id === selected) &&
          (filter === 'all' ||
            (['mixed', 'review'].includes(filter)
              ? s.tags.includes(filter)
              : s.changes.some((c) => c.direction === filter))),
      ),
    [query, selected, filter],
  );
  const filtered = useMemo(
    () => beforeTier.filter((s) => tier === 'all' || tierOf(s.id) === tier),
    [beforeTier, tier],
  );
  const tierCounts = useMemo(
    () =>
      beforeTier.reduce<Record<string, number>>((counts, s) => {
        const t = tierOf(s.id);
        counts[t] = (counts[t] || 0) + 1;
        return counts;
      }, {}),
    [beforeTier],
  );
  const chooseTier = (t: string) => {
    setTier(t);
    const u = new URL(location.href);
    if (t === 'all') u.searchParams.delete('tier');
    else u.searchParams.set('tier', t);
    history.replaceState(null, '', u);
  };
  const rows = filtered.flatMap((s) =>
    s.changes
      .filter(
        (c) => filter === 'all' || filter === 'mixed' || c.direction === filter,
      )
      .map((c) => ({ skill: s, c })),
  );
  const section = patch.sections.find((s) => s.id === selected);
  const nerfs = allSkills.filter((s) =>
    s.changes.some((c) => c.direction === 'nerf'),
  ).length;
  const matchingParagraphs = patch.sections.filter(
    (s) =>
      (query || selected === 'all' || s.id === selected) &&
      (s.paragraphs || []).some((p) => norm(p).includes(norm(query))),
  );
  const reset = () => {
    setFilter('all');
    select('all');
  };
  return (
    <SidebarProvider
      style={{ '--sidebar-width': '264px' } as React.CSSProperties}
    >
      <a className="skip-link" href="#main">
        본문으로 이동
      </a>
      <Index
        selected={selected}
        select={select}
        archiveMode={mode === 'history'}
      />
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <SidebarTrigger aria-label="직업 색인 열기" />
            <span className="breadcrumb">
              테스트월드 <ChevronRight size={13} />
              <b>9월 스킬 조정</b>
            </span>
          </div>
          <a
            href={patch.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="external-button"
          >
            원문 보기 <ExternalLink size={14} />
          </a>
        </header>
        <main id="main" className="main-content">
          <div className="page-heading">
            <div className="eyebrow">
              PATCH NOTE <span>2026.09.10</span>
            </div>
            <div className="title-row">
              <h1>
                {mode === 'history'
                  ? '스킬의 변화를 따라가다.'
                  : mode === 'compare'
                    ? '무엇이 달라졌을까?'
                    : mode === 'sources'
                      ? '비교의 근거를 확인하세요.'
                      : '내 직업의 변화, 한눈에.'}
              </h1>
              <span className="version">v{patch.version}</span>
            </div>
            <p>
              {mode === 'history'
                ? '직업과 차수를 고르면, 같은 스킬의 패치 기록을 시간순으로 확인할 수 있습니다.'
                : mode === 'compare'
                  ? '9/10 공식 공지에 명시된 변경 전후 수치를 비교합니다.'
                  : mode === 'sources'
                    ? '패치 출처와 비교 기준, 아이콘 정보를 모았습니다.'
                    : '직업을 고르고, 스킬별 변경 내용과 이전 수치를 확인하세요.'}
            </p>
          </div>
          <nav className="view-nav" aria-label="패치노트 화면">
            <Link
              href={
                selected !== 'all' &&
                patch.sections.some(
                  (section) =>
                    section.id === selected && section.kind !== 'content',
                )
                  ? jobHref(selected)
                  : '/wiki/'
              }
            >
              <BookOpen size={16} />
              위키
            </Link>
            <Link className={mode === 'notes' ? 'active' : ''} href="/notes/">
              <BookOpen size={17} />
              직업별 패치노트
            </Link>
            <Link
              className={mode === 'compare' ? 'active' : ''}
              href="/compare"
            >
              <SlidersHorizontal size={17} />
              상향 · 하향 비교<span className="nav-count">{nerfs}</span>
            </Link>
            <Link
              className={mode === 'history' ? 'active' : ''}
              href="/history/"
            >
              <History size={17} />
              차수별 스킬 이력
            </Link>
            <Link
              className={mode === 'sources' ? 'active' : ''}
              href="/sources"
            >
              출처 · 비교 기준
            </Link>
          </nav>
          {mode === 'sources' ? (
            <Sources />
          ) : mode === 'history' ? (
            <HistoryBrowser key={selected} selected={selected} />
          ) : (
            <>
              <div className="reading-tools">
                <div className="main-search">
                  <Search size={19} />
                  <Input
                    placeholder="직업, 스킬 또는 변경 내용 검색"
                    aria-label="패치 전체 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      aria-label="검색 지우기"
                      onClick={() => setQuery('')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="filter-bar" aria-label="변경 유형 필터">
                  <ListFilter size={16} />
                  {['all', 'nerf', 'buff', 'mixed', 'review'].map((f) => (
                    <button
                      key={f}
                      aria-pressed={filter === f}
                      className={filter === f ? 'active' : ''}
                      onClick={() => setFilter(f)}
                    >
                      {labels[f]}
                    </button>
                  ))}
                </div>
              </div>
              <TierFilters
                value={tier}
                onChange={chooseTier}
                counts={tierCounts}
              />
              <div className="result-heading">
                <div>
                  <span className="section-kicker">
                    {query
                      ? '검색 결과'
                      : mode === 'compare'
                        ? 'BEFORE & AFTER'
                        : 'JOB PATCH INDEX'}
                  </span>
                  <h2>
                    {query
                      ? `“${query}”`
                      : selected === 'all'
                        ? '전체 직업 · 공통'
                        : section?.name}
                    <span>
                      {mode === 'compare' ? rows.length : filtered.length}
                    </span>
                  </h2>
                </div>
                {section && icons.jobs[section.name] && (
                  <img
                    className="selected-job-art"
                    src={sitePath(icons.jobs[section.name])}
                    alt={section.name}
                    width="80"
                    height="70"
                  />
                )}
                {selected !== 'all' && (
                  <button className="text-button" onClick={() => select('all')}>
                    전체 보기 <ArrowRight size={14} />
                  </button>
                )}
              </div>
              {mode === 'notes' &&
                selected !== 'all' &&
                !query &&
                filter === 'all' &&
                tier === 'all' && <JobAnalysisHighlight sectionId={selected} />}
              {mode === 'compare' ? (
                <>
                  <div className="notice">
                    <Info size={18} />
                    <div>
                      <strong>스킬 개별 수치의 변화입니다.</strong>
                      <p>
                        변화율은 (이후 − 이전) ÷ 이전입니다. 구조 개편과 파티
                        효과 변경을 포함한 직업 전체 딜 상승·하락률을 뜻하지
                        않습니다.
                      </p>
                    </div>
                  </div>
                  <div className="comparison-table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>직업 / 스킬</TableHead>
                          <TableHead>변경 항목</TableHead>
                          <TableHead>이전</TableHead>
                          <TableHead>이후</TableHead>
                          <TableHead>변화율</TableHead>
                          <TableHead>판정</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map(({ skill, c }, i) => (
                          <TableRow key={`${skill.id}-${i}`}>
                            <TableCell>
                              <Link
                                className="table-skill"
                                href={`/?job=${skill.section.id}#${skill.id}`}
                              >
                                <SkillIcon
                                  id={skill.id}
                                  name={skill.name}
                                  job={skill.section.name}
                                  small
                                />
                                <span>
                                  <small>
                                    {skill.section.name} · {tierOf(skill.id)}
                                  </small>
                                  <strong>{skill.name}</strong>
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell className="metric-cell">
                              <span>{c.metric}</span>
                              {c.direction === 'review' && (
                                <small>{c.text}</small>
                              )}
                              {skill.tags.includes('mixed') && (
                                <small>구조 개편 포함</small>
                              )}
                              {c.reason && <small>{c.reason}</small>}
                            </TableCell>
                            <TableCell className="numeric old-value">
                              {c.beforeContext && (
                                <small>{c.beforeContext} </small>
                              )}
                              {num(c.before)}
                              {c.beforeUnit ?? c.unit}
                            </TableCell>
                            <TableCell className="numeric">
                              <b>
                                {c.afterContext && (
                                  <small>{c.afterContext} </small>
                                )}
                                {num(c.after)}
                                {c.afterUnit ?? c.unit}
                              </b>
                            </TableCell>
                            <TableCell
                              className={`numeric ${c.direction}-text`}
                            >
                              {c.direction === 'review'
                                ? '—'
                                : `${c.relativeChange > 0 ? '+' : ''}${num(c.relativeChange)}%`}
                            </TableCell>
                            <TableCell>
                              <Badge tag={c.direction} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {!rows.length && <Empty reset={reset} />}
                  <Qualitative selected={selected} />
                </>
              ) : (
                <>
                  {patch.sections
                    .filter(
                      (s) => query || selected === 'all' || selected === s.id,
                    )
                    .map((s) => {
                      const skills = filtered.filter(
                        (k) => k.section.id === s.id,
                      );
                      if (
                        !skills.length &&
                        !(
                          (query || selected === s.id || selected === 'all') &&
                          filter === 'all' &&
                          tier === 'all' &&
                          (s.paragraphs || []).some((p) =>
                            norm(p).includes(norm(query)),
                          )
                        )
                      )
                        return null;
                      return (
                        <section className="job-section" key={s.id}>
                          {(selected === 'all' || query) && (
                            <div className="job-section-title">
                              <h3>{s.name}</h3>
                              <span>{skills.length}개 항목</span>
                            </div>
                          )}
                          <div className="skill-list">
                            {tiers.map((t) => {
                              const group = skills.filter(
                                (skill) => tierOf(skill.id) === t,
                              );
                              return group.length ? (
                                <div className="tier-group" key={t}>
                                  <div className="tier-group-heading">
                                    <h4>{t}</h4>
                                    <span>{tierDescription(t)}</span>
                                    <small>{group.length}개 항목</small>
                                  </div>
                                  {group.map((skill) => (
                                    <SkillCard
                                      key={skill.id}
                                      skill={skill}
                                      job={s.name}
                                    />
                                  ))}
                                </div>
                              ) : null;
                            })}
                          </div>
                          {s.paragraphs &&
                            filter === 'all' &&
                            tier === 'all' && (
                              <div className="content-paragraphs">
                                {s.paragraphs
                                  .filter((p) => norm(p).includes(norm(query)))
                                  .map((p, i) => (
                                    <p key={i}>{p}</p>
                                  ))}
                              </div>
                            )}
                        </section>
                      );
                    })}
                  {!filtered.length &&
                    (filter !== 'all' ||
                      tier !== 'all' ||
                      !matchingParagraphs.length) && <Empty reset={reset} />}
                </>
              )}
            </>
          )}
          <footer className="page-footer">
            <Leaf size={16} />
            <span>메이플스토리 테스트월드 1.2.206 · 비공식 패치노트 뷰어</span>
            <a href={sitePath('/sources/')}>출처 및 기준</a>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}
function Qualitative({ selected }: { selected: string }) {
  const effects = allSkills.filter(
    (s) =>
      (selected === 'all' || s.section.id === selected) &&
      s.lines.some((l) => /파티원/.test(l) && /삭제/.test(l)),
  );
  return (
    <section className="qualitative">
      <div className="section-kicker">PARTY EFFECTS</div>
      <h2>수치만으로 보이지 않는 변화</h2>
      <p className="muted">
        파티 효과 삭제가 명시된 {effects.length}개 스킬입니다. 개인 효과로
        전환되는 보정은 각 스킬의 전체 내용을 함께 확인하세요.
      </p>
      <div className="effects-list">
        {effects.map((s) => (
          <Link key={s.id} href={`/?job=${s.section.id}#${s.id}`}>
            <SkillIcon id={s.id} name={s.name} job={s.section.name} small />
            <div>
              <small>{s.section.name}</small>
              <strong>{s.name}</strong>
              <p>{s.lines.find((l) => /파티원/.test(l) && /삭제/.test(l))}</p>
            </div>
            <ChevronRight size={16} />
          </Link>
        ))}
      </div>
    </section>
  );
}
function Sources() {
  return (
    <div className="sources-content">
      <AnalysisSources />
      <ArchiveSources />
      <section>
        <span className="section-kicker">PRIMARY SOURCE</span>
        <h2>공식 패치노트</h2>
        <a
          className="source-link"
          href={patch.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span>
            <strong>{patch.title}</strong>
            <small>넥슨 메이플스토리 · 2026.09.10 · 테스트월드</small>
          </span>
          <ExternalLink size={18} />
        </a>
        <p>
          이번 공지에 기재된 ‘이전 수치 → 이후 수치’를 우선 사용합니다. 현재
          라이브 서버 설명을 과거 버전의 수치로 대신하지 않습니다.
        </p>
      </section>
      <section>
        <span className="section-kicker">HOW TO READ</span>
        <h2>상향·하향을 읽는 기준</h2>
        <div className="method-list">
          <div>
            <Badge tag="nerf" />
            <p>
              데미지·공격 횟수 등 유리한 수치가 줄거나, 재사용 대기시간·자원
              소비처럼 부담이 커지는 항목입니다.
            </p>
          </div>
          <div>
            <Badge tag="buff" />
            <p>
              유리한 수치의 증가 또는 재사용 대기시간·딜레이·자원 소비 감소를
              구분합니다.
            </p>
          </div>
          <div>
            <Badge tag="mixed" />
            <p>
              공격 횟수, 발동 방식, 효과의 삭제·추가 등이 함께 바뀌는
              스킬입니다. 한 타의 데미지가 줄어도 전체 피해량은 늘 수 있습니다.
            </p>
          </div>
          <div>
            <Badge tag="review" />
            <p>
              수치와 증감 표현이 서로 다르거나, 문맥상 판정을 확정하기 어려운
              경우입니다. 원문 확인이 필요합니다.
            </p>
          </div>
        </div>
        <p>
          표의 변화율은 (이후 − 이전) ÷ 이전 × 100으로 계산합니다. 예를 들어 20%
          → 22%는 +2%p이며, 수치의 상대 변화는 +10%입니다. 캐릭터 전체 딜 +10%를
          뜻하지 않습니다.
        </p>
      </section>
      <section>
        <span className="section-kicker">PREVIOUS PATCHES</span>
        <h2>이전 패치 조사</h2>
        {research.sources.map((s, i) => (
          <a
            key={i}
            className="source-link"
            href={s.url}
            target="_blank"
            rel="noreferrer"
          >
            <span>
              <strong>{s.title}</strong>
              <small>
                {s.date} {s.description}
              </small>
            </span>
            <ExternalLink size={17} />
          </a>
        ))}
        {research.findings.map((f, i) => (
          <div className="research-finding" key={i}>
            <h3>{f.title}</h3>
            <p>{f.detail}</p>
          </div>
        ))}
      </section>
      <section>
        <span className="section-kicker">ASSET CREDITS</span>
        <h2>직업·스킬 아이콘</h2>
        <p>
          직업 이미지 48종과 스킬 항목 638개에 공식 가이드의 실제 이미지를
          연결했습니다. 스킬 이미지는 1~5차 가이드 기준으로 패치 이전 모습일 수
          있습니다. 개편 당일의 신규·교체 아이콘을 확보하지 못한 스킬은 확인
          가능한 이전 아이콘 또는 중립 표시로 보여줍니다. 중립 표시는 게임의
          실제 스킬 아이콘이 아닙니다.
        </p>
        <p>
          메이플스토리 및 관련 이미지의 권리는 NEXON에 있습니다. 이 페이지는
          공식 서비스가 아닌 비공식 패치노트 뷰어입니다.
        </p>
        <a
          className="text-button"
          href={sitePath('/asset-sources.json')}
          target="_blank"
        >
          아이콘 출처 목록 <ExternalLink size={14} />
        </a>
      </section>
    </div>
  );
}
