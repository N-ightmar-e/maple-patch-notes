import rawArchive from '@/app/data/skill-archive.json';
import patch from '@/app/data/patch.json';

export type TierInfo = {
  tier: string;
  basis: string;
  sourceUrl: string;
  sourceHeading: string;
  note?: string;
};
export type HistoryEvent = {
  sourceId: string;
  heading: string;
  patchId?: string;
  lines?: string[];
  scope?: string;
};
export type ArchiveSkill = {
  id: string;
  name: string;
  job: string;
  sectionId: string;
  kind: string;
  patchId?: string;
  classification: TierInfo;
  relatedId?: string;
  events: HistoryEvent[];
  commonEvents?: HistoryEvent[];
};
export const archive = rawArchive as typeof rawArchive & {
  records: ArchiveSkill[];
};
export const archiveSkills: ArchiveSkill[] = rawArchive.records;
export const byPatchId = new Map(
  archiveSkills.flatMap((s) =>
    s.events.filter((e) => e.patchId).map((e) => [e.patchId!, s] as const),
  ),
);
export const byArchiveId = new Map(archiveSkills.map((s) => [s.id, s]));
export const sourceById = new Map(archive.sources.map((s) => [s.id, s]));
const currentById = new Map(
  patch.sections.flatMap((s) => s.skills).map((s) => [s.id, s]),
);
export const tiers = [
  '기본',
  '1차',
  '1.5차',
  '2차',
  '2.5차',
  '3차',
  '4차',
  '하이퍼',
  '5차',
  '6차',
  '알파',
  '베타',
  '초월자',
  '공통',
  '기타',
  '확인 필요',
];
export const tierOf = (id: string) =>
  byPatchId.get(id)?.classification.tier ?? '기타';
export const eventLines = (event: HistoryEvent): string[] =>
  event.patchId
    ? (currentById.get(event.patchId)?.lines ?? [])
    : (event.lines ?? []);
export const historyHref = (skill: ArchiveSkill) =>
  `/history/?job=${skill.sectionId}&tier=${encodeURIComponent(skill.classification.tier)}&skill=${skill.id}`;
export const eventsFor = (skill: ArchiveSkill) =>
  [...skill.events, ...(skill.commonEvents ?? [])].sort(
    (a, b) =>
      (sourceById.get(b.sourceId)?.date ?? '').localeCompare(
        sourceById.get(a.sourceId)?.date ?? '',
      ) || Number(!!a.scope) - Number(!!b.scope),
  );
export const tierDescription = (tier: string) =>
  tier === '6차'
    ? 'HEXA 스킬 · 마스터리 · 공용 코어'
    : tier === '5차'
      ? 'V 매트릭스 스킬'
      : tier === '확인 필요'
        ? '차수 근거를 추가로 확인 중인 항목'
        : ['알파', '베타', '초월자'].includes(tier)
          ? '제로 고유 스킬 체계'
          : tier === '기본'
            ? '초보자 · 기본 스킬'
            : tier === '공통'
              ? '공용 스킬 · 시스템 변경'
              : tier === '기타'
                ? '차수와 무관한 변경'
                : '공식 가이드·공지의 분류 기준';
