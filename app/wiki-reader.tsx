'use client';
/* eslint-disable next/no-img-element -- Provenance-tracked local game assets on GitHub Pages. */
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  History,
  Leaf,
  Link2,
  Search,
  Swords,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  AnalysisComment,
  JobAnalysisHighlight,
  hasAnalysis,
  hasJobAnalysis,
} from './analysis-comment';
import {
  archive,
  archiveSkills,
  byArchiveId,
  eventsFor,
  eventLines,
  sourceById,
  tiers,
  type ArchiveSkill,
} from '@/lib/skill-archive';
import {
  wikiSections,
  sectionById,
  wikiEntries,
  recordsFor,
  currentEntries,
  jobHref,
  skillHref,
  patchHref,
  tierAnchor,
  skillIcon,
  jobIcon,
  directions,
  directionLabels,
  knownVersions,
} from '@/lib/wiki';
import { matches, searchEntries } from '@/lib/wiki-search.mjs';
import { useLocationSearch } from '@/lib/use-location-search';
import { sitePath } from '@/lib/site-path';
import patch from './data/patch.json';

type TocItem = { id: string; label: string };
export type WikiView = 'wiki' | 'wiki-job' | 'wiki-skill' | 'wiki-patch';
const correctionUrl = (title: string) =>
  `https://github.com/N-ightmar-e/maple-patch-notes/issues/new?title=${encodeURIComponent(`[문서 수정] ${title}`)}&body=${encodeURIComponent('수정할 내용:\n\n확인 가능한 공식 출처 URL:\n\n')}`;

function updateQuery(values: Record<string, string>) {
  const url = new URL(window.location.href);
  // Search always belongs to the wiki index; legacy root query links keep their original behavior.
  if (url.pathname === sitePath('/') && ('q' in values || 'kind' in values))
    url.pathname = sitePath('/wiki/');
  for (const [key, value] of Object.entries(values)) {
    if (value && value !== 'all') url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function WikiIcon({ skill }: { skill: ArchiveSkill }) {
  const [failed, setFailed] = useState(false);
  const path = skillIcon(skill);
  return (
    <span
      className="wiki-skill-icon"
      title={path ? '이전 공식 가이드 아이콘' : '아이콘 미확인'}
    >
      {path && !failed ? (
        <img
          src={sitePath(path)}
          width={32}
          height={32}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Swords size={21} />
      )}
    </span>
  );
}

function Status({ skill }: { skill: ArchiveSkill }) {
  if (!currentEntries(skill).length)
    return <span className="wiki-status neutral">이전 기록</span>;
  const direction = directions(skill);
  return (
    <span className={`wiki-status ${direction}`}>
      {directionLabels[direction]}
    </span>
  );
}

function SidebarIndex({ sectionId }: { sectionId?: string }) {
  const [query, setQuery] = useState('');
  return (
    <Sidebar className="wiki-sidebar" variant="floating">
      <SidebarHeader className="wiki-side-head">
        <Link href="/" className="wiki-brand">
          <Leaf size={25} />
          <span>
            메이플 패치 위키<small>직업 · 스킬 · 변경 이력</small>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="wiki-side-content">
        <nav className="wiki-main-nav" aria-label="위키 메뉴">
          <Link href="/wiki/">
            <BookOpen size={17} />
            위키 대문
          </Link>
          <Link href={patchHref('p206')}>
            <History size={17} />
            최신 패치 1.2.206
          </Link>
          <Link href="/notes/">
            <FileText size={17} />
            패치노트 읽기
          </Link>
          <Link href="/compare/">
            <Swords size={17} />
            상향 · 하향 비교
          </Link>
          <Link href="/sources/">
            <ExternalLink size={17} />
            출처와 작성 기준
          </Link>
        </nav>
        <div className="wiki-side-search">
          <Search size={16} />
          <Input
            aria-label="직업 문서 찾기"
            placeholder="직업 찾기 · 초성 가능"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {['job', 'common'].map((kind) => (
          <div key={kind} className="wiki-side-group">
            <h2>{kind === 'job' ? '직업 문서' : '공통 · 직업군 문서'}</h2>
            {wikiSections
              .filter((s) => s.kind === kind && matches(s.name, query))
              .map((section) => (
                <Link
                  key={section.id}
                  href={jobHref(section.id)}
                  aria-current={sectionId === section.id ? 'page' : undefined}
                >
                  {jobIcon(section.name) ? (
                    <img
                      src={sitePath(jobIcon(section.name))}
                      alt=""
                      width={30}
                      height={27}
                      loading="lazy"
                    />
                  ) : (
                    <BookOpen size={18} />
                  )}
                  <span>{section.name}</span>
                </Link>
              ))}
          </div>
        ))}
        {query && !wikiSections.some((s) => matches(s.name, query)) && (
          <p className="wiki-small">일치하는 직업이 없습니다.</p>
        )}
      </SidebarContent>
      <SidebarFooter className="wiki-side-footer">
        <span>테스트월드 자료 기반 비공식 위키</span>
        <span>자료 확인 {archive.updatedAt}</span>
      </SidebarFooter>
    </Sidebar>
  );
}

function SearchForm() {
  const search = useLocationSearch();
  const q = new URLSearchParams(search).get('q') || '';
  return (
    <form
      key={q}
      className="wiki-global-search"
      action={sitePath('/wiki/')}
      role="search"
    >
      <Search size={18} />
      <Input
        name="q"
        aria-label="위키 전체 검색"
        placeholder="직업·스킬·패치 내용 검색"
        defaultValue={q}
      />
      <button type="submit">검색</button>
    </form>
  );
}

function Contents({ items }: { items: TocItem[] }) {
  return (
    <nav className="wiki-toc-links" aria-label="문서 목차">
      {items.map((item, i) => (
        <a key={item.id} href={`#${item.id}`}>
          <span>{i + 1}.</span>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

function WikiLayout({
  title,
  label,
  sectionId,
  parents = [],
  toc,
  children,
  illustration,
  kind = 'home',
}: {
  title: string;
  label: string;
  sectionId?: string;
  parents?: { title: string; href: string }[];
  toc: TocItem[];
  children: ReactNode;
  illustration?: ReactNode;
  kind?: 'home' | 'job' | 'skill' | 'patch';
}) {
  const [copyStatus, setCopyStatus] = useState('');
  const isSkillIndex =
    new URLSearchParams(useLocationSearch()).get('kind') === 'skills';
  useEffect(() => {
    document.title = `${title} | 메이플 패치 위키`;
  }, [title]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('주소를 복사했습니다.');
    } catch {
      setCopyStatus('주소창의 URL을 복사해 주세요.');
    }
  };
  return (
    <SidebarProvider
      className="wiki-shell"
      style={{ '--sidebar-width': '260px' } as CSSProperties}
    >
      <a className="skip-link" href="#wiki-main">
        본문으로 이동
      </a>
      <SidebarIndex sectionId={sectionId} />
      <div className="wiki-workspace">
        <header className="wiki-topbar">
          <SidebarTrigger aria-label="위키 메뉴 열기" />
          <Link href="/wiki/" className="maple-top-brand">
            메이플 패치 위키
          </Link>
          <SearchForm />
          <Link className="wiki-top-source" href="/sources/">
            자료 기준
          </Link>
        </header>
        <div className="wiki-body">
          <main
            className="wiki-article maple-window"
            id="wiki-main"
            data-document={kind}
          >
            <div className="maple-window-title">
              <span>
                <BookOpen size={17} />
                {kind === 'job' || kind === 'skill'
                  ? '스킬북'
                  : kind === 'patch'
                    ? '패치 기록'
                    : '메이플 도감'}
              </span>
              <small>TEST WORLD · 1.2.206</small>
            </div>
            <nav className="maple-book-tabs" aria-label="도감 바로가기">
              <Link
                href="/wiki/#jobs"
                aria-current={
                  (kind === 'home' && !isSkillIndex) || kind === 'job'
                    ? 'page'
                    : undefined
                }
              >
                직업 도감
              </Link>
              <Link
                href="/wiki/?kind=skills"
                aria-current={
                  kind === 'skill' || isSkillIndex ? 'page' : undefined
                }
              >
                스킬 찾기
              </Link>
              <Link
                href={patchHref('p206')}
                aria-current={kind === 'patch' ? 'page' : undefined}
              >
                패치 기록
              </Link>
            </nav>
            <nav className="wiki-breadcrumb" aria-label="현재 위치">
              <Link href="/wiki/">대문</Link>
              {parents.map((parent) => (
                <span key={parent.href}>
                  <ChevronRight size={13} />
                  <Link href={parent.href}>{parent.title}</Link>
                </span>
              ))}
              <ChevronRight size={13} />
              <span>{label}</span>
            </nav>
            <header className="wiki-article-header">
              <div>
                <p className="wiki-overline">{label}</p>
                <h1>{title}</h1>
              </div>
              {illustration && (
                <div
                  className={`maple-portrait ${kind === 'skill' ? 'skill' : 'job'}`}
                >
                  {illustration}
                </div>
              )}
            </header>
            <div className="wiki-document-tools">
              <span>자료 확인 {archive.updatedAt}</span>
              <button onClick={copy} type="button">
                <Link2 size={14} />
                문서 주소 복사
              </button>
              <a href={correctionUrl(title)} target="_blank" rel="noreferrer">
                수정 제안 <ExternalLink size={12} />
              </a>
              <span role="status">{copyStatus}</span>
            </div>
            <details className="wiki-mobile-toc">
              <summary>목차</summary>
              <Contents items={toc} />
            </details>
            {children}
            <footer className="wiki-article-footer">
              <p>
                이 위키는 {archive.coverage.from}–{archive.coverage.to}의 공식
                공지 {archive.sources.length}개에서 수집한 기록을 다룹니다. 게임
                전체 스킬 사전이나 현재 라이브 서버의 확정 수치표는 아닙니다.
              </p>
              <p>
                게임 이미지·원문 권리: NEXON 및 원권리자 ·{' '}
                <Link href="/sources/">출처·분류·AI 해설 기준</Link> ·{' '}
                <a
                  href="https://github.com/N-ightmar-e/maple-patch-notes"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </p>
              <p>
                <a
                  href="https://maplestory.nexon.com/Media/Font"
                  target="_blank"
                  rel="noreferrer"
                >
                  메이플스토리 서체
                </a>{' '}
                적용 ·{' '}
                <a
                  href={sitePath('/assets/fonts/LICENSE.txt')}
                  target="_blank"
                  rel="noreferrer"
                >
                  서체 저작권 안내
                </a>
              </p>
            </footer>
          </main>
          <aside className="wiki-toc">
            <h2>
              <BookOpen size={15} />
              문서 목차
            </h2>
            <Contents items={toc} />
            <div className="wiki-toc-note">
              <span>수록 범위</span>
              <strong>1.2.203–1.2.206</strong>
              <small>테스트월드 공지 4개</small>
              <Link href="/sources/">
                자료의 한계 확인 <ChevronRight size={13} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </SidebarProvider>
  );
}

function SectionTitle({
  id,
  children,
  count,
}: {
  id: string;
  children: ReactNode;
  count?: number;
}) {
  return (
    <h2 className="wiki-section-title" id={id}>
      {children}
      {count !== undefined && <span>{count}</span>}
      <a
        href={`#${id}`}
        aria-label={`${typeof children === 'string' ? children : '항목'} 위치 링크`}
      >
        #
      </a>
    </h2>
  );
}

function SkillRows({
  records,
  showJob = false,
}: {
  records: ArchiveSkill[];
  showJob?: boolean;
}) {
  return (
    <ul className="wiki-skill-rows">
      {records.map((skill) => (
        <li key={skill.id}>
          <Link className="wiki-skill-row" href={skillHref(skill.id)}>
            <WikiIcon key={skill.id} skill={skill} />
            <span className="wiki-skill-name">
              <strong>{skill.name}</strong>
              <small>
                {showJob ? `${skill.job} · ` : ''}
                {skill.classification.tier} · {knownVersions(skill)}개 패치 기록
              </small>
            </span>
            <Status skill={skill} />
            <ChevronRight size={16} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PatchList() {
  return (
    <div className="wiki-patch-list">
      {archive.sources.map((source, i) => (
        <Link href={patchHref(source.id)} key={source.id}>
          <span>
            <strong>1.2.{source.version.split('.').pop()}</strong>
            {i === 0 && <em>최신 수록</em>}
            <small>{source.title}</small>
          </span>
          <time>{source.date}</time>
          <ChevronRight size={16} />
        </Link>
      ))}
    </div>
  );
}

function Directory({ kind }: { kind: string }) {
  return (
    <div className={`wiki-job-directory ${kind === 'common' ? 'common' : ''}`}>
      {wikiSections
        .filter((s) => s.kind === kind)
        .map((section) => (
          <Link key={section.id} href={jobHref(section.id)}>
            {jobIcon(section.name) ? (
              <img
                src={sitePath(jobIcon(section.name))}
                width={66}
                height={58}
                alt=""
                loading="lazy"
              />
            ) : (
              <BookOpen size={22} />
            )}
            <span>
              <strong>{section.name}</strong>
              <small>수록 {recordsFor(section.id).length}개 항목</small>
            </span>
            <ChevronRight size={15} />
          </Link>
        ))}
    </div>
  );
}

function SearchResults({ query, kind }: { query: string; kind: string }) {
  const [limit, setLimit] = useState(50);
  const foundSkills = useMemo(() => searchEntries(wikiEntries, query), [query]);
  const foundJobs = wikiSections.filter((section) =>
    matches(section.name, query),
  );
  const showJobs = kind !== 'skills';
  const showSkills = kind !== 'jobs';
  const count =
    (showJobs ? foundJobs.length : 0) + (showSkills ? foundSkills.length : 0);
  return (
    <section aria-label="검색 결과">
      <div className="wiki-results-summary" aria-live="polite">
        <strong>{query ? `“${query}”` : '전체 문서'}</strong>
        <span>{count.toLocaleString()}개 결과</span>
      </div>
      {showJobs && foundJobs.length > 0 && (
        <>
          <h3 className="wiki-subtitle">직업 · 공통 문서</h3>
          <div className="wiki-job-results">
            {foundJobs.map((section) => (
              <Link key={section.id} href={jobHref(section.id)}>
                {section.name}
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </>
      )}
      {showSkills && foundSkills.length > 0 && (
        <>
          <h3 className="wiki-subtitle">
            스킬 · 변경 항목 <small>명칭·직업·차수·패치 본문에서 검색</small>
          </h3>
          <SkillRows records={foundSkills.slice(0, limit)} showJob />
          {foundSkills.length > limit && (
            <button
              className="wiki-load-more"
              onClick={() => setLimit(limit + 50)}
            >
              결과 50개 더 보기 · {limit} / {foundSkills.length}
            </button>
          )}
        </>
      )}
      {count === 0 && (
        <div className="wiki-empty">
          <Search size={24} />
          <h3>일치하는 문서가 없습니다.</h3>
          <p>
            띄어쓰기를 빼거나 직업명으로 검색해 보세요. 수집 범위 밖의 스킬은
            아직 수록되어 있지 않습니다.
          </p>
          <button onClick={() => updateQuery({ q: '', kind: '' })}>
            전체 색인으로 돌아가기
          </button>
        </div>
      )}
    </section>
  );
}

function WikiHome() {
  const params = new URLSearchParams(useLocationSearch());
  const q = params.get('q') || '';
  const kind = ['all', 'jobs', 'skills'].includes(params.get('kind') || '')
    ? params.get('kind')!
    : 'all';
  const searching = !!q.trim() || kind !== 'all';
  return (
    <WikiLayout
      title="메이플 패치 위키"
      label="위키 대문"
      toc={
        searching
          ? [
              { id: 'wiki-search', label: '문서 검색' },
              { id: 'patches', label: '수록 패치' },
            ]
          : [
              { id: 'wiki-search', label: '문서 검색' },
              { id: 'jobs', label: '직업 색인' },
              { id: 'common', label: '공통 · 직업군' },
              { id: 'patches', label: '수록 패치' },
            ]
      }
    >
      <p className="wiki-lead">
        직업에서 스킬로, 스킬에서 변경 이력으로.
        <br />
        48개 직업의 패치 기록과 차수 분류, 근거가 있는 분석을 찾아보세요.
      </p>
      <div className="wiki-update-strip">
        <span>최근 수록</span>
        <Link href={patchHref('p206')}>
          테스트월드 1.2.206 <ArrowRight size={15} />
        </Link>
        <time>{patch.date}</time>
      </div>
      <section className="wiki-search-section" id="wiki-search">
        <label className="wiki-search-label" htmlFor="wiki-search-input">
          문서 검색
        </label>
        <div className="wiki-search-field">
          <Search size={21} />
          <Input
            id="wiki-search-input"
            value={q}
            placeholder="예: 히어로 6차, 레이징 블로우, ㅎㅇㄹ"
            onChange={(e) => updateQuery({ q: e.target.value })}
          />
          {q && (
            <button
              type="button"
              onClick={() => updateQuery({ q: '' })}
              aria-label="검색어 지우기"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="wiki-filter-bar" aria-label="검색 문서 종류">
          {[
            ['all', '전체'],
            ['jobs', '직업·공통'],
            ['skills', '스킬·변경 항목'],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={kind === id}
              onClick={() => updateQuery({ kind: id })}
            >
              {label}
            </button>
          ))}
          <small>띄어쓰기·초성 검색 지원</small>
        </div>
      </section>
      {searching ? (
        <SearchResults key={`${q}|${kind}`} query={q} kind={kind} />
      ) : (
        <>
          <section>
            <SectionTitle id="jobs" count={48}>
              직업 색인
            </SectionTitle>
            <Directory kind="job" />
          </section>
          <section>
            <SectionTitle id="common">공통 · 직업군</SectionTitle>
            <Directory kind="common" />
          </section>
        </>
      )}
      <section>
        <SectionTitle id="patches" count={archive.sources.length}>
          수록 패치
        </SectionTitle>
        <p className="wiki-small">
          버전 문서에서는 해당 공지에 기록된 직업과 스킬을 찾아갈 수 있습니다.
        </p>
        <PatchList />
      </section>
    </WikiLayout>
  );
}

function JobDocument({ id }: { id: string }) {
  const section = sectionById.get(id);
  const params = new URLSearchParams(useLocationSearch());
  const q = params.get('q') || '';
  const requestedTier = params.get('tier') || 'all';
  const selectedTier = tiers.includes(requestedTier) ? requestedTier : 'all';
  if (!section) return <MissingDocument type="직업" />;
  const records = recordsFor(id);
  const availableTiers = tiers.filter((tier) =>
    records.some((skill) => skill.classification.tier === tier),
  );
  const visible = searchEntries(
    wikiEntries.filter(
      (skill) =>
        skill.sectionId === id &&
        (selectedTier === 'all' || skill.classification.tier === selectedTier),
    ),
    q,
  );
  const visibleTiers = availableTiers.filter((tier) =>
    visible.some((skill) => skill.classification.tier === tier),
  );
  const sourceIds = new Set(
    records.flatMap((skill) => eventsFor(skill).map((event) => event.sourceId)),
  );
  const changes = records.filter((skill) => currentEntries(skill).length);
  const toc = [
    { id: 'overview', label: '문서 개요' },
    { id: 'job-skills', label: '차수별 스킬·변경 항목' },
    ...visibleTiers.map((tier) => ({ id: tierAnchor(tier), label: tier })),
    { id: 'job-patches', label: '수록 패치' },
  ];
  return (
    <WikiLayout
      title={section.name}
      label={section.kind === 'job' ? '직업 문서' : '공통 문서'}
      kind="job"
      sectionId={id}
      toc={toc}
      illustration={
        jobIcon(section.name) && (
          <img
            className="wiki-job-art"
            src={sitePath(jobIcon(section.name))}
            width={152}
            height={133}
            alt={`${section.name} 공식 일러스트`}
          />
        )
      }
    >
      <section id="overview">
        <p className="wiki-lead">
          {section.name} · 공식 공지에서 확인한 {records.length}개 항목의 스킬북
        </p>
        <dl className="wiki-facts">
          <div>
            <dt>수록 패치</dt>
            <dd>{sourceIds.size}개 공지</dd>
          </div>
          <div>
            <dt>1.2.206 기록</dt>
            <dd>{changes.length}개 항목</dd>
          </div>
          <div>
            <dt>차수 확인 필요</dt>
            <dd>
              {
                records.filter(
                  (skill) => skill.classification.tier === '확인 필요',
                ).length
              }
              개 항목
            </dd>
          </div>
        </dl>
        <div className="wiki-inline-links">
          <a className="maple-skill-jump" href="#job-skills">
            스킬 목록 <ArrowRight size={14} />
          </a>
          <Link href={`/notes/?job=${id}`}>
            최신 패치노트 <ArrowRight size={14} />
          </Link>
          <Link href={`/history/?job=${id}`}>
            이력 비교 도구 <ArrowRight size={14} />
          </Link>
        </div>
        {hasJobAnalysis(id) && (
          <details className="maple-job-analysis">
            <summary>이번 패치의 AI 코멘트</summary>
            <JobAnalysisHighlight sectionId={id} wiki />
          </details>
        )}
      </section>
      <section className="maple-skillbook">
        <SectionTitle id="job-skills">차수별 스킬 · 변경 항목</SectionTitle>
        <p className="wiki-small">
          패치에서 확인한 항목만 수록했습니다. 차수는 이전 공식 가이드 또는 공지
          기준이며, 각 스킬 문서에 근거를 표시합니다.
        </p>
        <div className="wiki-search-field compact">
          <Search size={18} />
          <Input
            aria-label="이 직업의 스킬 검색"
            value={q}
            onChange={(e) => updateQuery({ q: e.target.value })}
            placeholder={`${section.name} 문서 안에서 검색`}
          />
          {q && (
            <button
              aria-label="검색어 지우기"
              onClick={() => updateQuery({ q: '' })}
            >
              <X size={17} />
            </button>
          )}
        </div>
        <div
          className="wiki-filter-bar maple-tier-tabs"
          aria-label="차수별 필터"
        >
          {['all', ...availableTiers].map((tier) => (
            <button
              key={tier}
              aria-pressed={selectedTier === tier}
              onClick={() => updateQuery({ tier })}
            >
              {tier === 'all' ? '전체 차수' : tier}
            </button>
          ))}
        </div>
        <p className="wiki-small" aria-live="polite">
          {visible.length}개 항목 표시 · 상·하향 표시는 1.2.206 기준
        </p>
        {visibleTiers.map((tier) => (
          <section key={tier} className="wiki-tier-section">
            <h3 id={tierAnchor(tier)}>
              {tier}
              <span>
                {
                  visible.filter((skill) => skill.classification.tier === tier)
                    .length
                }
              </span>
            </h3>
            <SkillRows
              records={visible.filter(
                (skill) => skill.classification.tier === tier,
              )}
            />
          </section>
        ))}
        {!visible.length && (
          <div className="wiki-empty">
            <p>이 조건에 맞는 항목이 없습니다.</p>
            <button onClick={() => updateQuery({ q: '', tier: '' })}>
              검색·차수 필터 초기화
            </button>
          </div>
        )}
      </section>
      <section>
        <SectionTitle id="job-patches">수록 패치</SectionTitle>
        <div className="wiki-patch-list">
          {archive.sources
            .filter((source) => sourceIds.has(source.id))
            .map((source) => (
              <Link key={source.id} href={`${patchHref(source.id)}&job=${id}`}>
                <strong>{source.version}</strong>
                <time>{source.date}</time>
                <span>
                  {
                    records.filter((skill) =>
                      eventsFor(skill).some(
                        (event) => event.sourceId === source.id,
                      ),
                    ).length
                  }
                  개 항목
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}
        </div>
      </section>
    </WikiLayout>
  );
}

function NumericChanges({ skill }: { skill: ArchiveSkill }) {
  const changes = currentEntries(skill).flatMap((entry) => entry.changes);
  if (!changes.length)
    return (
      <p className="wiki-small">
        동일 기준으로 정리할 수 있는 전후 수치가 없습니다. 아래 패치 원문의
        기능·조건 변경을 확인하세요.
      </p>
    );
  return (
    <>
      <p className="wiki-small">
        1.2.206 공지에 명시된 전후 값입니다. 변화율은 해당 수치의 증감이며 직업
        전체의 최종 피해량 변화가 아닙니다.
      </p>
      <div className="wiki-number-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>변경 항목</TableHead>
              <TableHead>변경 전</TableHead>
              <TableHead>변경 후</TableHead>
              <TableHead>판정</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.map((change, i) => {
              const c = change as typeof change & {
                beforeUnit?: string;
                afterUnit?: string;
                beforeContext?: string;
                afterContext?: string;
                reason?: string;
              };
              return (
                <TableRow key={i}>
                  <TableCell>
                    <strong>{c.metric || '수치 변경'}</strong>
                    <small>{c.text}</small>
                    {c.reason && <small>{c.reason}</small>}
                  </TableCell>
                  <TableCell>
                    {c.beforeContext && <small>{c.beforeContext}</small>}
                    {c.before}
                    {c.beforeUnit ?? c.unit}
                  </TableCell>
                  <TableCell>
                    {c.afterContext && <small>{c.afterContext}</small>}
                    {c.after}
                    {c.afterUnit ?? c.unit}
                  </TableCell>
                  <TableCell>
                    <span className={`wiki-status ${c.direction}`}>
                      {directionLabels[c.direction] || '검토 필요'}
                    </span>
                    <small>
                      {c.direction === 'review'
                        ? '단순 비교 보류'
                        : `${c.relativeChange > 0 ? '+' : ''}${c.relativeChange.toFixed(2)}%`}
                    </small>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function SkillDocument({ id }: { id: string }) {
  const skill = byArchiveId.get(id);
  if (!skill) return <MissingDocument type="스킬" />;
  const events = eventsFor(skill);
  const c = skill.classification;
  const related = skill.relatedId
    ? byArchiveId.get(skill.relatedId)
    : undefined;
  const current = currentEntries(skill);
  const analyzed = current.filter((entry) => hasAnalysis(entry.id));
  const siblings = recordsFor(skill.sectionId).filter(
    (s) => s.classification.tier === c.tier,
  );
  const position = siblings.findIndex((s) => s.id === id);
  const toc = [
    { id: 'skill-overview', label: '개요' },
    { id: 'numbers', label: '최근 수치 비교' },
    ...(analyzed.length
      ? [{ id: 'commentary', label: '수치·시스템 해설' }]
      : []),
    { id: 'timeline', label: '패치 이력' },
    { id: 'classification', label: '차수 분류와 출처' },
    { id: 'related', label: '연결 문서' },
  ];
  return (
    <WikiLayout
      title={skill.name}
      label="스킬 · 변경 항목 문서"
      kind="skill"
      sectionId={skill.sectionId}
      parents={[{ title: skill.job, href: jobHref(skill.sectionId) }]}
      toc={toc}
      illustration={<WikiIcon key={id} skill={skill} />}
    >
      <section id="skill-overview">
        <div className="wiki-skill-heading-meta">
          <Link href={jobHref(skill.sectionId)}>{skill.job}</Link>
          <span
            className={`wiki-tier-label ${c.tier === '확인 필요' ? 'uncertain' : ''}`}
          >
            {c.tier}
          </span>
          <Status skill={skill} />
        </div>
        <p className="wiki-lead">
          {knownVersions(skill) === 1
            ? sourceById.get(events[0].sourceId)?.version
            : `${sourceById.get(events[events.length - 1].sourceId)?.version}–${sourceById.get(events[0].sourceId)?.version}`}{' '}
          수록 공지에서 {knownVersions(skill)}개 버전의 기록을 확인한
          항목입니다.
        </p>
        {related && (
          <Link className="wiki-related-callout" href={skillHref(related.id)}>
            <span>
              {related.classification.tier === '6차'
                ? '연결된 VI 스킬'
                : '연결된 원본 스킬'}
              <strong>{related.name}</strong>
            </span>
            <ArrowRight size={18} />
          </Link>
        )}
        {!events.some((event) => event.sourceId !== 'p206') && (
          <p className="wiki-note">
            이전 3개 공지에서는 이 이름으로 분리된 기록을 찾지 못했습니다. 과거
            변경이 없었다는 뜻은 아닙니다.
          </p>
        )}
        {!current.length && (
          <p className="wiki-note">
            이 항목은 이전 공지에서 수집했습니다. 최신 1.2.206 공지에 해당
            이름의 개별 변경 기록이 없습니다.
          </p>
        )}
      </section>
      <section>
        <SectionTitle id="numbers">최근 수치 비교</SectionTitle>
        <NumericChanges skill={skill} />
      </section>
      {analyzed.length > 0 && (
        <section>
          <SectionTitle id="commentary">수치 · 시스템 해설</SectionTitle>
          <p className="wiki-small">
            AI 사전 분석과 규칙 기반 자동 해설은 각각 표시합니다. 실측이 필요한
            조건은 해설의 확인 항목을 참고하세요.
          </p>
          {analyzed.map((entry) => (
            <AnalysisComment key={entry.id} id={entry.id} />
          ))}
        </section>
      )}
      <section>
        <SectionTitle id="timeline" count={knownVersions(skill)}>
          패치 이력
        </SectionTitle>
        <p className="wiki-small">
          최신순 · 스킬별 기록과 직업 전체에 적용된 공통 기록을 구분합니다.
        </p>
        <ol className="wiki-timeline">
          {events.map((event, i) => {
            const source = sourceById.get(event.sourceId)!;
            return (
              <li key={`${event.sourceId}-${i}`}>
                <div className="wiki-timeline-date">
                  <Link href={`${patchHref(source.id)}&job=${skill.sectionId}`}>
                    {source.version}
                  </Link>
                  <time>{source.date}</time>
                </div>
                <div className="wiki-timeline-content">
                  <div className="wiki-event-label">
                    {event.scope
                      ? `${event.scope} · 공통 적용 기록`
                      : event.heading || skill.name}
                    <a href={source.url} target="_blank" rel="noreferrer">
                      공식 원문 <ExternalLink size={13} />
                    </a>
                  </div>
                  <ul>
                    {eventLines(event).map((line, n) => (
                      <li key={n}>{line.replace(/^[·•]\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <section>
        <SectionTitle id="classification">차수 분류와 출처</SectionTitle>
        <dl className="wiki-evidence">
          <div>
            <dt>분류</dt>
            <dd>{c.tier}</dd>
          </div>
          <div>
            <dt>근거</dt>
            <dd>{c.basis}</dd>
          </div>
          <div>
            <dt>참조 문서</dt>
            <dd>
              <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                {c.sourceHeading}
                <ExternalLink size={13} />
              </a>
            </dd>
          </div>
        </dl>
        <p className="wiki-note">
          {c.tier === '확인 필요'
            ? '확인한 공식 자료에서 이 항목의 차수를 확정하지 못했습니다. 이름이나 목록 순서만으로 추정하지 않았습니다.'
            : c.basis === '이전 공식 가이드'
              ? '이전 공식 가이드의 차수입니다. 이후 개편으로 달라졌을 수 있으며 현재 클라이언트와의 대조는 완료하지 않았습니다.'
              : c.note || '공식 공지에서 소개된 차수를 기준으로 분류했습니다.'}
        </p>
        <p className="wiki-small">
          {skillIcon(skill)
            ? '아이콘은 이전 공식 가이드에서 수집했습니다. 현재 인게임 이미지와 다를 수 있습니다.'
            : '이 항목의 공식 스킬 아이콘은 아직 연결되지 않았습니다. 공통 아이콘으로 표시합니다.'}{' '}
          <Link href="/sources/">자산 출처 확인</Link>
        </p>
      </section>
      <section>
        <SectionTitle id="related">연결 문서</SectionTitle>
        <div className="wiki-inline-links">
          <Link href={jobHref(skill.sectionId)}>
            {skill.job} 문서 <ArrowRight size={14} />
          </Link>
          <Link
            href={`${jobHref(skill.sectionId)}&tier=${encodeURIComponent(c.tier)}#${tierAnchor(c.tier)}`}
          >
            {c.tier} 전체 항목 <ArrowRight size={14} />
          </Link>
          {related && (
            <Link href={skillHref(related.id)}>
              {related.name} <ArrowRight size={14} />
            </Link>
          )}
        </div>
        <div className="wiki-neighbor-nav">
          {position > 0 && (
            <Link href={skillHref(siblings[position - 1].id)}>
              <small>같은 차수 · 이전 항목</small>
              <strong>{siblings[position - 1].name}</strong>
            </Link>
          )}
          {position < siblings.length - 1 && (
            <Link href={skillHref(siblings[position + 1].id)}>
              <small>같은 차수 · 다음 항목</small>
              <strong>{siblings[position + 1].name}</strong>
            </Link>
          )}
        </div>
      </section>
    </WikiLayout>
  );
}

function PatchDocument({ id }: { id: string }) {
  const params = new URLSearchParams(useLocationSearch());
  const source = sourceById.get(id);
  const job = params.get('job') || 'all';
  if (!source) return <MissingDocument type="패치" />;
  const records = archiveSkills.filter((skill) =>
    eventsFor(skill).some((event) => event.sourceId === id),
  );
  const sections = wikiSections.filter((section) =>
    records.some((skill) => skill.sectionId === section.id),
  );
  const selectedJob = sections.some((section) => section.id === job)
    ? job
    : 'all';
  const visibleSections = sections.filter(
    (section) => selectedJob === 'all' || section.id === selectedJob,
  );
  return (
    <WikiLayout
      title={`테스트월드 ${source.version}`}
      label="패치 버전 문서"
      kind="patch"
      toc={[
        { id: 'patch-overview', label: '공지 정보' },
        { id: 'patch-jobs', label: '직업별 기록' },
        ...visibleSections.map((section) => ({
          id: `patch-${section.id}`,
          label: section.name,
        })),
      ]}
    >
      <section id="patch-overview">
        <p className="wiki-lead">{source.title}</p>
        <dl className="wiki-facts">
          <div>
            <dt>공지 날짜</dt>
            <dd>{source.date}</dd>
          </div>
          <div>
            <dt>수록 대상</dt>
            <dd>{sections.length}개 직업·공통 분류</dd>
          </div>
          <div>
            <dt>연결 문서</dt>
            <dd>{records.length}개 항목</dd>
          </div>
        </dl>
        <div className="wiki-inline-links">
          <a href={source.url} target="_blank" rel="noreferrer">
            공식 공지 원문 <ExternalLink size={14} />
          </a>
          {id === 'p206' && (
            <Link href="/notes/">
              최신 패치노트 전체 읽기 <ArrowRight size={14} />
            </Link>
          )}
          <Link href="/wiki/#patches">
            다른 버전 보기 <ArrowRight size={14} />
          </Link>
        </div>
        <p className="wiki-note">
          스킬 문서와 연결된 기록만 표시합니다. 이벤트·콘텐츠를 포함한 공지
          전체는 공식 원문에서 확인하세요.
          {id === 'p206'
            ? ` ${patch.sourceRevision} 기준입니다.`
            : ' 이전 공지의 일반 설명은 스킬별 변경 이력과 구분되어 일부 수록되지 않을 수 있습니다.'}
        </p>
      </section>
      <section>
        <SectionTitle id="patch-jobs">직업별 기록</SectionTitle>
        <div className="wiki-filter-bar" aria-label="패치 직업 필터">
          <button
            aria-pressed={selectedJob === 'all'}
            onClick={() => updateQuery({ job: 'all' })}
          >
            전체
          </button>
          {sections.map((section) => (
            <button
              key={section.id}
              aria-pressed={selectedJob === section.id}
              onClick={() => updateQuery({ job: section.id })}
            >
              {section.name}
            </button>
          ))}
        </div>
        {visibleSections.map((section) => (
          <section className="wiki-patch-job" key={section.id}>
            <h3 id={`patch-${section.id}`}>
              <Link href={jobHref(section.id)}>
                {section.name}
                <ArrowRight size={15} />
              </Link>
            </h3>
            <ul className="wiki-patch-entry-list">
              {records
                .filter((skill) => skill.sectionId === section.id)
                .map((skill) => (
                  <li key={skill.id}>
                    <div>
                      <WikiIcon key={skill.id} skill={skill} />
                      <Link href={skillHref(skill.id)}>{skill.name}</Link>
                      <span className="wiki-tier-label">
                        {skill.classification.tier}
                      </span>
                    </div>
                    <ul>
                      {eventsFor(skill)
                        .filter((event) => event.sourceId === id)
                        .map((event, i) => (
                          <li key={i}>
                            {event.scope && (
                              <strong>{event.scope} · 공통 기록: </strong>
                            )}
                            {eventLines(event)[0]}
                            {eventLines(event).length > 1 && (
                              <Link href={`${skillHref(skill.id)}#timeline`}>
                                기록 {eventLines(event).length}줄 전체 보기
                              </Link>
                            )}
                          </li>
                        ))}
                    </ul>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </section>
    </WikiLayout>
  );
}

function MissingDocument({ type }: { type: string }) {
  return (
    <WikiLayout title="문서를 찾을 수 없습니다" label="문서 없음" toc={[]}>
      <div className="wiki-empty">
        <BookOpen size={30} />
        <p>요청한 {type} 문서가 없거나 주소가 올바르지 않습니다.</p>
        <Link href="/wiki/">
          위키에서 다시 찾기 <ArrowRight size={15} />
        </Link>
      </div>
    </WikiLayout>
  );
}

export default function WikiReader({ view = 'wiki' }: { view?: WikiView }) {
  const params = new URLSearchParams(useLocationSearch());
  const id = params.get('id') || '';
  if (view === 'wiki-job') return <JobDocument key={id} id={id} />;
  if (view === 'wiki-skill') return <SkillDocument key={id} id={id} />;
  if (view === 'wiki-patch') return <PatchDocument key={id} id={id} />;
  return <WikiHome />;
}
