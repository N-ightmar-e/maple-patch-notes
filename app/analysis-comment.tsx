'use client';
import Link from 'next/link';
import {
  ArrowRight,
  BrainCircuit,
  Calculator,
  ExternalLink,
} from 'lucide-react';
import data from './data/analysis.json';
import patch from './data/patch.json';
import { byPatchId } from '@/lib/skill-archive';
import { skillHref } from '@/lib/wiki';
import {
  numericNotes,
  productChange,
  perCooldownChange,
} from '@/lib/analysis-math.mjs';

type Comment = {
  job: string;
  skill: string;
  sectionId: string;
  title: string;
  takeaway: string;
  reasoning: string;
  verify: string;
  sourceHash: string;
};
const comments = data.comments as Record<string, Comment>;
const skills = new Map(
  patch.sections.flatMap((s) => s.skills).map((s) => [s.id, s]),
);
const number = (n: number) =>
  n.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
const percent = (n: number) => `${n > 0 ? '+' : ''}${number(n)}%`;
function OrdnanceModel() {
  const skill = skills.get('section-45-skill-021')!;
  const metric = (name: string) =>
    skill.changes.find((c) => c.metric === name)!;
  const d = metric('응집의 데미지'),
    h = metric('응집의 공격 횟수'),
    n = metric('응집의 발생 횟수'),
    orb = metric('구체의 데미지'),
    oh = metric('구체의 공격 횟수'),
    cd = metric('재사용 대기시간');
  const phase = productChange(
    [d.before, h.before, n.before],
    [d.after, h.after, n.after],
  )!;
  const finisher = productChange(
    [orb.before, oh.before],
    [orb.after, oh.after],
  )!;
  const before = phase.before + finisher.before,
    after = phase.after + finisher.after;
  return (
    <div className="analysis-formula">
      <strong>
        <Calculator size={15} />
        조건부 표기계수 계산
      </strong>
      <p>
        응집 최대 횟수 모두 적중 + 구체 공격 1회, 전후 타격 구조가 공지 수치와
        같다고 가정합니다.
      </p>
      <dl>
        <div>
          <dt>변경 전</dt>
          <dd>
            {d.before} × {h.before} × {n.before} + {orb.before} × {oh.before} ={' '}
            {number(before)}
          </dd>
        </div>
        <div>
          <dt>변경 후</dt>
          <dd>
            {d.after} × {h.after} × {n.after} + {orb.after} × {oh.after} ={' '}
            {number(after)}
          </dd>
        </div>
        <div>
          <dt>1회 표기계수합</dt>
          <dd>{percent((after / before - 1) * 100)}</dd>
        </div>
        <div>
          <dt>쿨타임으로 나눈 비율</dt>
          <dd>
            {percent(perCooldownChange(before, after, cd.before, cd.after)!)}{' '}
            <small>
              ({cd.before}초 → {cd.after}초)
            </small>
          </dd>
        </div>
      </dl>
      <p>
        버프 정렬·시전 지연·적중 실패·기타 공격을 제외한 계산입니다. 실제 DPS나
        캐릭터 전체 피해 변화율이 아닙니다.
      </p>
    </div>
  );
}
export const hasAnalysis = (id: string) => {
  const skill = skills.get(id);
  return !!comments[id] || (!!skill && numericNotes(skill).length > 0);
};
export function AnalysisComment({ id }: { id: string }) {
  const skill = skills.get(id);
  if (!skill) return null;
  const editorial = comments[id];
  const notes = numericNotes(skill);
  if (!editorial && !notes.length) return null;
  return (
    <aside
      className={`analysis-comment ${editorial ? 'editorial' : 'automatic'}`}
      aria-label={editorial ? 'AI 사전 분석 코멘트' : '수치·시스템 자동 해설'}
    >
      {editorial ? (
        <>
          <div className="analysis-label">
            <BrainCircuit size={16} />
            <strong>AI 사전 분석</strong>
            <span>
              {data.version} · {data.reviewedAt}
            </span>
          </div>
          <h4>{editorial.title}</h4>
          <p className="analysis-takeaway">{editorial.takeaway}</p>
          <details className="analysis-more">
            <summary>분석 근거와 확인 조건</summary>
            <div>
              <h5>기존 운용과 달라지는 점</h5>
              <p>{editorial.reasoning}</p>
              {id === 'section-45-skill-021' && <OrdnanceModel />}
              <h5>추가로 확인할 것</h5>
              <p>{editorial.verify}</p>
              {notes.length > 0 && (
                <div className="numeric-notes">
                  <h5>
                    <Calculator size={14} />
                    수치·조건 자동 점검
                  </h5>
                  {notes.map((note, i) => (
                    <div key={i}>
                      <strong>{note.title}</strong>
                      <p>{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="analysis-authorship">
                공식 결론이나 실측 결과가 아닌 AI의 사전 해석입니다. 공식 공지에
                없는 적용식·발동 수는 확정하지 않았습니다.
              </p>
              <a
                className="analysis-source"
                href={data.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                정정 공지 근거 <ExternalLink size={13} />
              </a>
            </div>
          </details>
        </>
      ) : (
        <details className="analysis-more">
          <summary>
            <Calculator size={16} />
            수치·시스템 자동 해설<span>규칙 기반</span>
          </summary>
          <div className="numeric-notes">
            {notes.map((note, i) => (
              <div key={i}>
                <strong>{note.title}</strong>
                <p>{note.text}</p>
              </div>
            ))}
            <p className="analysis-authorship">
              사전 정의한 계산·조건 규칙으로 만든 설명입니다. 이 스킬의 AI 심층
              코멘트는 아직 수록하지 않았습니다.
            </p>
          </div>
        </details>
      )}
    </aside>
  );
}
export function JobAnalysisHighlight({
  sectionId,
  wiki = false,
}: {
  sectionId: string;
  wiki?: boolean;
}) {
  const entry = Object.entries(comments).find(
    ([, c]) => c.sectionId === sectionId,
  );
  if (!entry) return null;
  const [id, c] = entry;
  return (
    <aside className="job-analysis-highlight">
      <div>
        <BrainCircuit size={18} />
        <span>AI가 짚은 주요 변화</span>
        <small>사전 작성</small>
      </div>
      <Link
        href={
          wiki && byPatchId.has(id)
            ? `${skillHref(byPatchId.get(id)!.id)}#commentary`
            : `/?job=${sectionId}#${id}`
        }
      >
        <strong>{c.skill}</strong>
        <span>{c.title}</span>
        <ArrowRight size={16} />
      </Link>
    </aside>
  );
}
export function AnalysisSources() {
  return (
    <section>
      <span className="section-kicker">AI COMMENTARY</span>
      <h2>AI 분석 코멘트를 읽는 기준</h2>
      <p>
        48개 직업의 주요 변경을 포함한 {Object.keys(comments).length}개 코멘트는
        AI(Codex)가 공식 공지의 수치·기능 변경을 읽고 사전 작성했습니다. 실시간
        모델 호출이나 게임 내 실측이 없으며, 사이트 방문에 따른 별도 AI API
        비용이 발생하지 않습니다.
      </p>
      <p>
        AI 코멘트와 ‘수치·시스템 자동 해설’을 구분합니다. 자동 해설은 계산과
        조건 점검 규칙으로 작성되며, 모든 스킬을 AI가 심층 검토했다는 뜻이
        아닙니다. 각 코멘트에는 변경 해석과 추가 확인 조건을 함께 제공합니다.
      </p>
      <p>
        분석 기준은 {data.sourceRevision} 공지이며 작성일은 {data.reviewedAt}
        입니다. 공격 계수·타수·발생 수와 쿨타임의 조건부 계산은 실제 DPS나 직업
        전체 상승·하락률이 아닙니다. 단위가 다른 수치, 새 적중 제한, 계산식
        변경, 파티와 개인 효과를 합산하지 않습니다.
      </p>
      <p>
        이전 시스템은 공지에 명시된 변경 전 수치·기능을 기준으로 분석했습니다.
        공지에 없는 충전 주기·보정식·기존 적중 분포까지 복원한 자료는 아닙니다.
        다음 패치에서 데이터가 바뀌면 코멘트도 다시 검토해야 합니다.
      </p>
      <a
        className="source-link"
        href={data.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        <span>
          <strong>1.2.206 정정 공지</strong>
          <small>{data.sourceRevision}</small>
        </span>
        <ExternalLink size={16} />
      </a>
    </section>
  );
}
