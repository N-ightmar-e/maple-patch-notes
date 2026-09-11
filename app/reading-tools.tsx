'use client';
/* eslint-disable next/no-img-element -- Local official game assets. */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Check,
  ChevronRight,
  Columns2,
  Plus,
  Search,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import {
  archiveSkills,
  byArchiveId,
  eventsFor,
  eventLines,
  sourceById,
  type ArchiveSkill,
} from '@/lib/skill-archive';
import {
  currentEntries,
  skillHref,
  jobHref,
  jobIcon,
  skillIcon,
  wikiEntries,
  wikiSections,
  sectionById,
} from '@/lib/wiki';
import { useReadingState, updateReadingState } from '@/lib/use-reading-state';
import { comparisonHref, anchorForEvent } from '@/lib/reading-state.mjs';
import { matches, searchEntries } from '@/lib/wiki-search.mjs';
import { sitePath } from '@/lib/site-path';
import { useLocationSearch } from '@/lib/use-location-search';
import { AnalysisComment, hasAnalysis } from './analysis-comment';

export function BookmarkButton({
  documentId,
  label,
}: {
  documentId: string;
  label: string;
}) {
  const { favorites } = useReadingState();
  const [notice, setNotice] = useState('');
  const saved = favorites.includes(documentId);
  const toggle = () => {
    const persisted = updateReadingState((state) => ({
      ...state,
      favorites: saved
        ? state.favorites.filter((id) => id !== documentId)
        : [documentId, ...state.favorites],
    }));
    setNotice(
      persisted
        ? saved
          ? '스킬북에서 해제했습니다.'
          : '이 브라우저의 스킬북에 저장했습니다.'
        : '브라우저 저장이 제한되어 현재 페이지에서만 유지됩니다.',
    );
  };
  return (
    <span className="reading-action">
      <button
        type="button"
        aria-label={`${label} ${saved ? '저장 해제' : '저장'}`}
        aria-pressed={saved}
        onClick={toggle}
      >
        <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
        {saved ? '저장됨' : '저장'}
      </button>
      <output className="sr-only">{notice}</output>
    </span>
  );
}

export function CompareButton({ skill }: { skill: ArchiveSkill }) {
  const { comparison } = useReadingState();
  const chosen = comparison.includes(skill.id);
  const full = comparison.length >= 2 && !chosen;
  const [notice, setNotice] = useState('');
  return (
    <span className="reading-action">
      <button
        type="button"
        disabled={full}
        title={
          full
            ? '비교함에서 항목 하나를 빼면 추가할 수 있습니다.'
            : '스킬 두 개의 변경 내용을 나란히 보기'
        }
        aria-label={`${skill.name} 비교 ${chosen ? '해제' : '추가'}`}
        aria-pressed={chosen}
        onClick={() => {
          const persisted = updateReadingState((state) => ({
            ...state,
            comparison: chosen
              ? state.comparison.filter((id) => id !== skill.id)
              : [...state.comparison, skill.id],
          }));
          setNotice(
            persisted
              ? chosen
                ? '비교함에서 뺐습니다.'
                : '비교함에 담았습니다.'
              : '브라우저 저장이 제한되어 현재 페이지에서만 유지됩니다.',
          );
        }}
      >
        {chosen ? <Check size={15} /> : <Columns2 size={15} />}비교
        {chosen ? ' 중' : ''}
      </button>
      <output className="sr-only">{notice}</output>
    </span>
  );
}

export function QuickFind({
  onChoose,
  label = '빠른 찾기',
  hotkey = false,
}: {
  onChoose?: (id: string) => void;
  label?: string;
  hotkey?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const reading = useReadingState();
  useEffect(() => {
    if (!hotkey) return;
    const key = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k' &&
        !event.isComposing
      ) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [hotkey]);
  const jobs = onChoose
    ? []
    : wikiSections.filter((job) => matches(job.name, query)).slice(0, 6);
  const found = useMemo(() => searchEntries(wikiEntries, query), [query]);
  const recent = reading.recent
    .filter((id) => id.startsWith('skill:'))
    .map((id) => byArchiveId.get(id.slice(6)))
    .filter((skill): skill is ArchiveSkill => !!skill);
  const skills = query.trim()
    ? found.slice(0, 10)
    : recent.length
      ? recent
      : archiveSkills
          .filter((skill) => skill.classification.tier === '6차')
          .slice(0, 6);
  const choose = (id: string) => {
    setOpen(false);
    setQuery('');
    if (onChoose) onChoose(id);
    else window.location.assign(sitePath(skillHref(id)));
  };
  return (
    <>
      <button
        type="button"
        className="reading-quick-button"
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <Search size={16} />
        {label}
        {hotkey && <kbd>⌘ / Ctrl K</kbd>}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="reading-dialog"
          showCloseButton={false}
          initialFocus={inputRef}
        >
          <DialogHeader>
            <DialogTitle>
              {onChoose ? '비교할 스킬 찾기' : '빠른 문서 찾기'}
            </DialogTitle>
            <DialogDescription>
              직업명·스킬명·초성으로 검색하세요. 방향키와 Enter로 선택할 수
              있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogClose className="reading-dialog-close" aria-label="닫기">
            <X size={18} />
          </DialogClose>
          <Command shouldFilter={false}>
            <CommandInput
              ref={inputRef}
              aria-label="빠른 문서 검색"
              placeholder="예: 데몬슬레이어, 레이징, ㅎㅇㄹ"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                찾은 항목이 없습니다. 다른 이름으로 검색해 보세요.
              </CommandEmpty>
              {jobs.length > 0 && (
                <CommandGroup heading="직업·공통 문서">
                  {jobs.map((job) => (
                    <CommandItem
                      key={job.id}
                      value={`job-${job.id}`}
                      onSelect={() => {
                        setOpen(false);
                        window.location.assign(sitePath(jobHref(job.id)));
                      }}
                    >
                      {jobIcon(job.name) && (
                        <img
                          src={sitePath(jobIcon(job.name))}
                          alt=""
                          width={28}
                          height={26}
                        />
                      )}
                      <span>{job.name}</span>
                      <small>직업 문서</small>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {skills.length > 0 && (
                <CommandGroup
                  heading={
                    query.trim()
                      ? '스킬·변경 항목'
                      : recent.length
                        ? '최근 읽은 스킬'
                        : '6차 스킬'
                  }
                >
                  {skills.map((skill) => (
                    <CommandItem
                      key={skill.id}
                      value={skill.id}
                      onSelect={() => choose(skill.id)}
                    >
                      {skillIcon(skill) && (
                        <img
                          src={sitePath(skillIcon(skill))}
                          alt=""
                          width={28}
                          height={28}
                        />
                      )}
                      <span>
                        {skill.name}
                        <small>
                          {skill.job} · {skill.classification.tier}
                        </small>
                      </span>
                      <ChevronRight size={14} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
          {!onChoose && query && (
            <Link
              className="reading-all-results"
              href={`/wiki/?q=${encodeURIComponent(query)}`}
            >
              전체 검색 결과 보기 <ArrowRight size={15} />
            </Link>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReadingTray() {
  const { comparison } = useReadingState();
  const selected = comparison
    .map((id) => byArchiveId.get(id))
    .filter((skill): skill is ArchiveSkill => !!skill);
  if (!selected.length) return null;
  return (
    <aside className="reading-tray" aria-label="스킬 비교함">
      <div className="reading-tray-title">
        <Columns2 size={18} />
        <strong>비교함</strong>
        <span>{selected.length} / 2</span>
      </div>
      <div className="reading-tray-items">
        {selected.map((skill) => (
          <span key={skill.id}>
            <b>{skill.name}</b>
            <button
              aria-label={`${skill.name} 비교함에서 빼기`}
              onClick={() =>
                updateReadingState((state) => ({
                  ...state,
                  comparison: state.comparison.filter((id) => id !== skill.id),
                }))
              }
            >
              <X size={15} />
            </button>
          </span>
        ))}
      </div>
      {selected.length === 2 ? (
        <Link className="reading-compare-go" href={comparisonHref(comparison)}>
          나란히 비교 <ArrowRight size={15} />
        </Link>
      ) : (
        <span className="reading-tray-hint">스킬을 하나 더 담아주세요.</span>
      )}
    </aside>
  );
}

const resolveDocument = (key: string) => {
  if (key.startsWith('job:')) {
    const job = sectionById.get(key.slice(4));
    return job
      ? {
          key,
          name: job.name,
          detail: '직업 문서',
          href: jobHref(job.id),
          icon: jobIcon(job.name),
        }
      : null;
  }
  const skill = byArchiveId.get(key.slice(6));
  return skill
    ? {
        key,
        name: skill.name,
        detail: `${skill.job} · ${skill.classification.tier}`,
        href: skillHref(skill.id),
        icon: skillIcon(skill),
      }
    : null;
};
export function ReadingLibrary({ compact = false }: { compact?: boolean }) {
  const { favorites, recent } = useReadingState();
  const saved = favorites
    .map(resolveDocument)
    .filter((value) => value !== null);
  const viewed = recent.map(resolveDocument).filter((value) => value !== null);
  if (compact && !saved.length && !viewed.length)
    return (
      <div className="reading-library-intro">
        <Bookmark size={17} />
        <span>자주 보는 직업과 스킬을 저장해 두세요.</span>
        <Link href="/wiki/?view=saved">내 스킬북</Link>
      </div>
    );
  const groups = compact
    ? [
        {
          title: '내 스킬북',
          rows: saved.length ? saved.slice(0, 5) : viewed.slice(0, 5),
        },
      ]
    : [
        { title: '저장한 문서', rows: saved },
        { title: '최근 읽은 문서', rows: viewed },
      ];
  return (
    <section className={`reading-library ${compact ? 'compact' : ''}`}>
      <div className="reading-library-heading">
        <h2>
          <Bookmark size={18} />
          {compact && !saved.length ? '최근 읽은 문서' : '내 스킬북'}
        </h2>
        {compact && (
          <Link href="/wiki/?view=saved">
            전체 보기 <ChevronRight size={14} />
          </Link>
        )}
      </div>
      <p>이 브라우저에 저장됩니다. 다른 기기와 자동으로 동기화되지 않습니다.</p>
      {groups.map((group) => (
        <div key={group.title}>
          {!compact && (
            <h3>
              {group.title}
              <span>{group.rows.length}</span>
            </h3>
          )}
          {group.rows.length ? (
            <ul>
              {group.rows.map((doc) => (
                <li key={doc.key}>
                  <Link href={doc.href}>
                    {doc.icon && (
                      <img
                        src={sitePath(doc.icon)}
                        alt=""
                        width={32}
                        height={30}
                      />
                    )}
                    <span>
                      <strong>{doc.name}</strong>
                      <small>{doc.detail}</small>
                    </span>
                    <ChevronRight size={14} />
                  </Link>
                  {!compact && (
                    <BookmarkButton documentId={doc.key} label={doc.name} />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="reading-library-empty">
              <p>
                {group.title === '저장한 문서'
                  ? '문서의 저장 버튼을 누르면 여기에 모입니다.'
                  : '직업이나 스킬 문서를 열면 최근 기록이 남습니다.'}
              </p>
              <Link href="/wiki/#jobs">직업 도감 둘러보기</Link>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

export function ChangeList({ skill }: { skill: ArchiveSkill }) {
  const changes = currentEntries(skill).flatMap((entry) => entry.changes);
  if (!changes.length)
    return (
      <p className="wiki-small">
        동일 기준으로 정리할 수 있는 전후 수치가 없습니다. 패치 기록의 기능·조건
        변경을 확인하세요.
      </p>
    );
  return (
    <>
      <p className="wiki-small">
        1.2.206 공지 기준 · 수치의 변화율이며 직업 전체 피해량의 변화가
        아닙니다.
      </p>
      <div className="reading-changes">
        {changes.map((value, i) => {
          const c = value as typeof value & {
            beforeContext?: string;
            afterContext?: string;
            beforeUnit?: string;
            afterUnit?: string;
            reason?: string;
          };
          return (
            <div className="reading-change" key={i}>
              <h3>{c.metric || '수치 변경'}</h3>
              <div className="reading-values">
                <div>
                  <small>변경 전 {c.beforeContext}</small>
                  <span>
                    {c.before.toLocaleString('ko-KR')}
                    {c.beforeUnit ?? c.unit}
                  </span>
                </div>
                <ArrowRight size={17} />
                <div>
                  <small>변경 후 {c.afterContext}</small>
                  <strong>
                    {c.after.toLocaleString('ko-KR')}
                    {c.afterUnit ?? c.unit}
                  </strong>
                </div>
                <em className={c.direction}>
                  {c.direction === 'review'
                    ? '비교 보류'
                    : `${c.relativeChange > 0 ? '+' : ''}${c.relativeChange.toFixed(2)}%`}
                </em>
              </div>
              <details>
                <summary>원문·비교 조건</summary>
                <p>{c.text}</p>
                {c.reason && <p>{c.reason}</p>}
              </details>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ComparisonContent() {
  const [notice, setNotice] = useState('');
  const params = new URLSearchParams(useLocationSearch());
  const reading = useReadingState();
  const requested = params.has('skills')
    ? [
        ...new Set((params.get('skills') || '').split(',').filter(Boolean)),
      ].slice(0, 2)
    : reading.comparison;
  const skills = requested
    .map((id) => byArchiveId.get(id))
    .filter((skill): skill is ArchiveSkill => !!skill);
  const requestedKey = params.has('skills')
    ? skills.map((skill) => skill.id).join(',')
    : null;
  const savedKey = reading.comparison.join(',');
  useEffect(() => {
    if (requestedKey !== null) {
      if (requestedKey !== savedKey)
        updateReadingState((state) => ({
          ...state,
          comparison: requestedKey ? requestedKey.split(',') : [],
        }));
    } else if (savedKey) {
      // Include restored selections in the address so copying it shares this comparison.
      const url = new URL(window.location.href);
      url.searchParams.set('skills', savedKey);
      window.history.replaceState(null, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [requestedKey, savedKey]);
  const choose = (id: string, slot: number) => {
    if (skills[1 - slot]?.id === id) {
      setNotice('이미 선택한 스킬입니다. 다른 스킬을 골라 주세요.');
      return;
    }
    setNotice('');
    const next = skills.map((skill) => skill.id);
    next[slot] = id;
    const unique = [...new Set(next.filter(Boolean))];
    const url = new URL(window.location.href);
    url.searchParams.set('skills', unique.join(','));
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
    updateReadingState((state) => ({ ...state, comparison: unique }));
  };
  const versions = [...sourceById.values()];
  return (
    <>
      <p className="wiki-lead">
        두 스킬의 조정 수치와 변경 이력을 나란히 읽습니다. 각 수치의 대상·발동
        조건은 스킬마다 다를 수 있습니다.
      </p>
      {requested.some((id) => !byArchiveId.has(id)) && (
        <output className="wiki-note">
          주소에 포함된 일부 스킬을 찾지 못했습니다. 비교할 스킬을 다시 선택해
          주세요.
        </output>
      )}
      <output className="reading-selection-notice">{notice}</output>
      <div className="reading-comparison" id="compare-values">
        {[0, 1].map((slot) => {
          const skill = skills[slot];
          return (
            <section key={slot} className="reading-compare-column">
              {skill ? (
                <>
                  <header>
                    {skillIcon(skill) && (
                      <img
                        src={sitePath(skillIcon(skill))}
                        width={40}
                        height={40}
                        alt=""
                      />
                    )}
                    <div>
                      <small>
                        {skill.job} · {skill.classification.tier}
                      </small>
                      <h2>
                        <Link href={skillHref(skill.id)}>{skill.name}</Link>
                      </h2>
                    </div>
                  </header>
                  <div className="reading-compare-actions">
                    <BookmarkButton
                      documentId={`skill:${skill.id}`}
                      label={skill.name}
                    />
                    <QuickFind
                      label="스킬 바꾸기"
                      onChoose={(id) => choose(id, slot)}
                    />
                  </div>
                  <ChangeList skill={skill} />
                  {!currentEntries(skill).length && (
                    <p className="wiki-note">
                      1.2.206에는 이 이름의 개별 변경 기록이 없습니다.
                    </p>
                  )}
                  {currentEntries(skill)
                    .filter((entry) => hasAnalysis(entry.id))
                    .map((entry) => (
                      <AnalysisComment key={entry.id} id={entry.id} />
                    ))}
                </>
              ) : (
                <div className="reading-compare-empty">
                  <Plus size={30} />
                  <h2>{slot + 1}번째 스킬</h2>
                  <p>
                    {slot === 1 && !skills.length
                      ? '첫 번째 스킬을 선택하면 두 번째 스킬을 담을 수 있습니다.'
                      : '이름으로 찾거나 스킬 문서의 비교 버튼을 눌러 담으세요.'}
                  </p>
                  {(slot === 0 || skills.length > 0) && (
                    <QuickFind
                      label="스킬 선택"
                      onChoose={(id) => choose(id, slot)}
                    />
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {skills.length > 0 && (
        <section id="compare-history">
          <h2 className="wiki-section-title">버전별 기록</h2>
          <p className="wiki-small">
            기록 미발견은 과거 변경이 없었다는 뜻이 아닙니다.
          </p>
          <div className="reading-history-compare">
            {versions.map((version) => (
              <section key={version.id}>
                <h3>
                  {version.version}
                  <time>{version.date}</time>
                </h3>
                <div>
                  {skills.map((skill) => {
                    const events = eventsFor(skill);
                    const matching = events
                      .map((event, index) => ({ event, index }))
                      .filter(({ event }) => event.sourceId === version.id);
                    return (
                      <article key={skill.id}>
                        <strong>{skill.name}</strong>
                        {matching.length ? (
                          matching.map(({ event, index }) => (
                            <div key={index}>
                              {event.scope && (
                                <small>{event.scope} · 공통 기록</small>
                              )}
                              <p>{eventLines(event)[0]}</p>
                              <Link
                                href={`${skillHref(skill.id)}#${anchorForEvent(events, index)}`}
                              >
                                이 버전 기록 읽기 <ArrowRight size={13} />
                              </Link>
                            </div>
                          ))
                        ) : (
                          <p className="wiki-small">
                            해당 공지에서 분리된 기록 미발견
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
