'use client';
/* eslint-disable next/no-img-element -- These are local, fixed-size game icons served by static GitHub Pages. */
import { AnalysisComment } from './analysis-comment';
import { useLocationSearch } from '@/lib/use-location-search';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  History,
  Info,
  Search,
  Swords,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  archive,
  archiveSkills,
  byArchiveId,
  byPatchId,
  eventLines,
  eventsFor,
  historyHref,
  sourceById,
  tiers,
  type ArchiveSkill,
} from '@/lib/skill-archive';
import { sitePath } from '@/lib/site-path';
import icons from './data/icons.json';

const normalized = (s: string) => s.replace(/\s/g, '').toLowerCase();
function remember(values: Record<string, string>) {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value && value !== 'all') url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  history.replaceState(null, '', url);
}
export function TierFilters({
  value,
  onChange,
  counts,
}: {
  value: string;
  onChange: (tier: string) => void;
  counts: Record<string, number>;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="tier-filter" aria-label="스킬 차수 필터">
      <span className="tier-filter-label">스킬 차수</span>
      <div className="tier-options">
        {['all', ...tiers.filter((t) => counts[t] || value === t)].map((t) => (
          <button
            type="button"
            key={t}
            aria-pressed={value === t}
            className={value === t ? 'active' : ''}
            onClick={() => onChange(t)}
          >
            {t === 'all' ? '전체' : t}
            <small>{t === 'all' ? total : counts[t] || 0}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
export function TierBadge({ id }: { id: string }) {
  const c = byPatchId.get(id)?.classification;
  return c ? (
    <span
      className={`tier-badge ${c.tier === '확인 필요' ? 'uncertain' : ''}`}
      title={`${c.basis} · ${c.sourceHeading}`}
    >
      {c.tier === '확인 필요' ? '차수 확인 필요' : c.tier}
    </span>
  ) : null;
}
export function SkillHistoryLink({ id }: { id: string }) {
  const record = byPatchId.get(id);
  return record ? (
    <Link className="skill-history-link" href={historyHref(record)}>
      <History size={14} />
      패치 이력{' '}
      <span>{new Set(eventsFor(record).map((e) => e.sourceId)).size}</span>
      <ChevronRight size={13} />
    </Link>
  ) : null;
}
function HistoryIcon({ skill }: { skill: ArchiveSkill }) {
  const [failed, setFailed] = useState(false);
  const url = skill.patchId
    ? (icons.skills as Record<string, string>)[skill.patchId]
    : null;
  return (
    <span
      className="history-icon"
      title={url ? '공식 가이드의 이전 아이콘' : '아이콘 미확인'}
    >
      {url && !failed ? (
        <img
          src={sitePath(url)}
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
function HistoryDetail({ skill }: { skill: ArchiveSkill }) {
  const c = skill.classification;
  const events = eventsFor(skill);
  const prior = events.some((e) => e.sourceId !== 'p206');
  const related = skill.relatedId ? byArchiveId.get(skill.relatedId) : null;
  return (
    <article className="history-detail" aria-labelledby="history-skill-title">
      <header className="history-detail-heading">
        <div className="history-detail-title">
          <HistoryIcon key={skill.id} skill={skill} />
          <div>
            <div className="history-detail-meta">
              {skill.job}
              <span
                className={`tier-badge ${c.tier === '확인 필요' ? 'uncertain' : ''}`}
              >
                {c.tier}
              </span>
            </div>
            <h3 id="history-skill-title" tabIndex={-1}>
              {skill.name}
            </h3>
          </div>
        </div>
        <span className="history-event-count">
          {new Set(events.map((e) => e.sourceId)).size}개 패치
        </span>
      </header>
      <details className="tier-evidence">
        <summary>
          <Info size={14} />
          차수 분류 근거 <span>{c.basis}</span>
        </summary>
        <div>
          <p>
            {c.tier === '확인 필요'
              ? '확인한 공식 자료에서 이 명칭의 차수를 확정하지 못했습니다. 이름이나 목록 순서만으로 차수를 추정하지 않습니다.'
              : c.basis === '이전 공식 가이드'
                ? '이전 공식 가이드에 기재된 차수입니다. 이후 개편으로 달라졌을 수 있으며, 현재 클라이언트와의 대조는 완료하지 않았습니다.'
                : c.note ||
                  '공식 공지에서 이 스킬을 해당 차수의 항목으로 소개한 내용을 기준으로 분류했습니다.'}
          </p>
          <a href={c.sourceUrl} target="_blank" rel="noreferrer">
            {c.sourceHeading}
            <ExternalLink size={13} />
          </a>
        </div>
      </details>
      {related && (
        <Link className="related-skill" href={historyHref(related)}>
          <span>
            {related.classification.tier === '6차'
              ? '6차 스킬 이력'
              : '원본 스킬 이력'}{' '}
            · {related.name}
          </span>
          <ArrowRight size={14} />
        </Link>
      )}
      {!prior && (
        <p className="history-absence">
          조사한 이전 3개 공지에서는 이 스킬명으로 분리된 기록을 찾지
          못했습니다. 과거 변경이 없었다는 뜻은 아닙니다.
        </p>
      )}
      {skill.patchId && <AnalysisComment id={skill.patchId} />}
      <ol className="history-timeline">
        {events.map((event, i) => {
          const source = sourceById.get(event.sourceId)!;
          return (
            <li
              key={`${event.sourceId}-${event.scope || 'job'}-${i}`}
              className={event.sourceId === 'p206' ? 'current' : ''}
            >
              <div className="timeline-date">
                <time dateTime={source.date}>
                  {source.date.replaceAll('-', '.')}
                </time>
                <span>TEST WORLD · {source.version}</span>
                {event.sourceId === 'p206' && <b>현재 정리본</b>}
                {event.scope && <b>전 직업 공통</b>}
              </div>
              <div className="timeline-entry">
                <div className="timeline-entry-heading">
                  <span>{event.heading}</span>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    공식 원문 <ExternalLink size={12} />
                  </a>
                </div>
                <ul>
                  {eventLines(event).map((line, n) => (
                    <li key={n}>{line}</li>
                  ))}
                </ul>
                {event.patchId && (
                  <Link
                    className="text-button"
                    href={`/?job=${skill.sectionId}#${event.patchId}`}
                  >
                    변경 전후 수치 보기 <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="history-scope-footnote">
        테스트월드 공지의 기록입니다. 본 서버에 그대로 적용되었다는 의미는
        아닙니다. 공지에 표제 없이 함께 언급된 변경과 개명 이력은 일부 누락될 수
        있습니다.
      </p>
    </article>
  );
}
export function HistoryBrowser({ selected }: { selected: string }) {
  const search = useLocationSearch();
  const params = new URLSearchParams(search);
  const [queryOverride, setQuery] = useState<string | null>(null);
  const query = queryOverride ?? params.get('q') ?? '';
  const [tierOverride, setTier] = useState<string | null>(null);
  const tierParam = params.get('tier') || '';
  const tier = tierOverride ?? (tiers.includes(tierParam) ? tierParam : 'all');
  const [versionOverride, setVersion] = useState<string | null>(null);
  const versionParam = params.get('version') || '';
  const version =
    versionOverride ??
    (archive.sources.some((s) => s.id === versionParam) ? versionParam : 'all');
  const [pastOverride, setPastOnly] = useState<boolean | null>(null);
  const pastOnly = pastOverride ?? params.get('past') === '1';
  const [focusOverride, setFocus] = useState<string | null>(null);
  const focus = focusOverride ?? params.get('skill') ?? '';
  const candidates = useMemo(
    () =>
      archiveSkills.filter(
        (s) =>
          (selected === 'all' || s.sectionId === selected) &&
          normalized(`${s.job} ${s.name}`).includes(normalized(query)) &&
          (version === 'all' ||
            eventsFor(s).some((e) => e.sourceId === version)) &&
          (!pastOnly || eventsFor(s).some((e) => e.sourceId !== 'p206')),
      ),
    [selected, query, version, pastOnly],
  );
  const counts = useMemo(
    () =>
      candidates.reduce<Record<string, number>>((sum, s) => {
        const key = s.classification.tier;
        sum[key] = (sum[key] || 0) + 1;
        return sum;
      }, {}),
    [candidates],
  );
  const filtered = useMemo(
    () =>
      candidates
        .filter((s) => tier === 'all' || s.classification.tier === tier)
        .sort(
          (a, b) =>
            tiers.indexOf(a.classification.tier) -
              tiers.indexOf(b.classification.tier) ||
            a.name.localeCompare(b.name, 'ko'),
        ),
    [candidates, tier],
  );
  const current =
    filtered.find((s) => s.id === focus) ||
    filtered.reduce<ArchiveSkill | undefined>(
      (best, s) =>
        !best || eventsFor(s).length > eventsFor(best).length ? s : best,
      undefined,
    );
  const choose = (s: ArchiveSkill) => {
    setFocus(s.id);
    remember({ skill: s.id });
    requestAnimationFrame(() => {
      document
        .getElementById('history-skill-title')
        ?.focus({ preventScroll: true });
      document
        .getElementById('history-detail-panel')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };
  const clear = () => {
    setQuery('');
    setTier('all');
    setVersion('all');
    setPastOnly(false);
    remember({ q: '', tier: '', version: '', past: '', skill: '' });
  };
  return (
    <div className="history-browser">
      <div className="history-intro">
        <div>
          <Clock3 size={18} />
          <strong>최근 4개 패치에서 이어지는 기록</strong>
        </div>
        <p>
          2026.07.09 → 09.10 · 1.2.203–1.2.206 · 전체 패치 연혁이 아닌, 조사한
          공지 범위의 스킬 이력입니다.
        </p>
      </div>
      <div className="history-controls">
        <div className="main-search">
          <Search size={18} />
          <Input
            aria-label="선택한 직업의 스킬 이력 검색"
            placeholder="스킬 이름으로 이력 찾기"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              remember({ q: e.target.value, skill: '' });
            }}
          />
          {query && (
            <button
              aria-label="검색 지우기"
              onClick={() => {
                setQuery('');
                remember({ q: '' });
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className={`past-toggle ${pastOnly ? 'active' : ''}`}
          aria-pressed={pastOnly}
          onClick={() => {
            setPastOnly(!pastOnly);
            remember({ past: pastOnly ? '' : '1' });
          }}
        >
          <Check size={15} />
          이전 이력이 있는 스킬만
        </button>
      </div>
      <TierFilters
        value={tier}
        onChange={(t) => {
          setTier(t);
          setFocus('');
          remember({ tier: t, skill: '' });
        }}
        counts={counts}
      />
      <div
        className="history-version-filter"
        aria-label="이력이 있는 패치 선택"
      >
        <span>기록이 있는 패치</span>
        {['all', ...archive.sources.map((s) => s.id)].map((v) => (
          <button
            key={v}
            aria-pressed={version === v}
            className={version === v ? 'active' : ''}
            onClick={() => {
              setVersion(v);
              remember({ version: v });
            }}
          >
            {v === 'all' ? '전체 기간' : sourceById.get(v)!.version}
          </button>
        ))}
      </div>
      <output className="history-results-label">
        <strong>
          {selected === 'all'
            ? '전체 직업 · 공통'
            : archiveSkills.find((s) => s.sectionId === selected)?.job}
        </strong>
        <span>{filtered.length}개 스킬</span>
        <span className="history-help">
          스킬을 선택하면 오른쪽에 이력이 열립니다.
        </span>
      </output>
      {current ? (
        <div className="history-layout">
          <nav className="history-skill-index" aria-label="차수별 스킬 목록">
            {tiers.map((t) => {
              const group = filtered.filter((s) => s.classification.tier === t);
              return group.length ? (
                <section key={t}>
                  <h3>
                    {t}
                    <span>{group.length}</span>
                  </h3>
                  {group.map((s) => (
                    <button
                      key={s.id}
                      aria-current={current.id === s.id ? 'true' : undefined}
                      className={current.id === s.id ? 'selected' : ''}
                      onClick={() => choose(s)}
                    >
                      <HistoryIcon skill={s} />
                      <span>
                        {selected === 'all' && <small>{s.job}</small>}
                        <strong>{s.name}</strong>
                      </span>
                      <small className="history-list-count">
                        {new Set(eventsFor(s).map((e) => e.sourceId)).size}
                      </small>
                    </button>
                  ))}
                </section>
              ) : null;
            })}
          </nav>
          <div id="history-detail-panel">
            <HistoryDetail key={current.id} skill={current} />
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Search size={27} />
          <h3>조건에 맞는 이력이 없습니다.</h3>
          <p>차수, 패치 또는 검색어를 바꿔 보세요.</p>
          <button className="external-button" onClick={clear}>
            이력 필터 초기화
          </button>
        </div>
      )}
      <div className="history-method-note">
        <BookOpen size={17} />
        <p>
          차수는 공식 공지와 이전 공식 가이드로 분류했습니다. 나무위키는 접근
          제한으로 대조하지 못했으며, 확인되지 않은 차수는 ‘확인 필요’로
          표시합니다. <Link href="/sources/">출처·수록 기준 보기</Link>
        </p>
      </div>
    </div>
  );
}
export function ArchiveSources() {
  return (
    <section>
      <span className="section-kicker">SKILL TIERS & HISTORY</span>
      <h2>스킬 차수와 패치 이력</h2>
      <p>
        최근 테스트월드 공지 4개(2026.07.09–09.10)의 직업·공통 항목에서{' '}
        {archive.coverage.recordCount.toLocaleString('ko-KR')}개 스킬·변경
        항목을 모았습니다. 스킬명을 표제로 명시한 이력을 중심으로 수록했으며,
        콘텐츠 변경은 기존 패치노트 화면에서 볼 수 있습니다.
      </p>
      <p>
        기본·1–4차·하이퍼·5차는 넥슨 공식 가이드와 리마스터 공지의 차수 제목을
        사용했습니다. 듀얼블레이드의 1.5·2.5차와 제로의 알파·베타·초월자를
        유지합니다. 6차 마스터리 코어의 세 번째·네 번째 출시 순서를 3·4차
        전직으로 분류하지 않습니다.
      </p>
      <p>
        공식 차수 제목으로 대조한 항목, VI 표기로 분류한 항목, 차수 확인이
        필요한 {archive.coverage.tierCounts['확인 필요']}개 항목을 구분합니다.
        이전 가이드 기준 정보가 최신 클라이언트와 다를 수 있으므로 스킬별 ‘차수
        분류 근거’에서 확인하세요.
      </p>
      <p>
        {archive.namuWiki.note} 나무위키를 확인한 자료로 표시하거나 내용을
        옮기지 않았습니다.
      </p>
      <p>
        직업과 스킬명이 일치하는 기록만 연결했습니다. 공백·구두점은 정규화하고,
        원본과 VI 스킬의 이력은 따로 유지합니다. 개명으로 이력이 갈라질 수
        있습니다. 이전 기록 미발견은 변경 없음의 증거가 아니며, 이력의 테스트
        결과를 본 서버 수치로 간주하지 않습니다.
      </p>
      {archive.sources.map((s) => (
        <a
          key={s.id}
          className="source-link"
          href={s.url}
          target="_blank"
          rel="noreferrer"
        >
          <span>
            <strong>
              {s.version} · {s.title}
            </strong>
            <small>{s.date} · 테스트월드</small>
          </span>
          <ExternalLink size={16} />
        </a>
      ))}
      <Link className="text-button" href="/history/">
        차수별 스킬 이력 열기 <ArrowRight size={14} />
      </Link>
    </section>
  );
}
