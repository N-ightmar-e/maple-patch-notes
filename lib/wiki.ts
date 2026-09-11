import patch from '@/app/data/patch.json';
import icons from '@/app/data/icons.json';
import {
  archiveSkills,
  eventsFor,
  eventLines,
  tiers,
  type ArchiveSkill,
} from './skill-archive';

export const wikiSections = patch.sections.filter(
  (section) => section.kind !== 'content',
);
export const sectionById = new Map(
  wikiSections.map((section) => [section.id, section]),
);
export const currentById = new Map(
  patch.sections
    .flatMap((section) => section.skills)
    .map((skill) => [skill.id, skill]),
);
export { jobHref, skillHref, patchHref } from './wiki-navigation.mjs';
export const tierAnchor = (tier: string) => `tier-${tiers.indexOf(tier)}`;
export const skillIcon = (skill: ArchiveSkill) =>
  (icons.skills as Record<string, string>)[skill.patchId || ''];
export const jobIcon = (job: string) =>
  (icons.jobs as Record<string, string>)[job];
export const wikiEntries = archiveSkills.map((skill) => ({
  ...skill,
  text: `${skill.job} ${skill.name} ${skill.classification.tier} ${eventsFor(skill).flatMap(eventLines).join(' ')}`,
}));
export const recordsFor = (id: string) =>
  archiveSkills.filter((skill) => skill.sectionId === id);
export const currentEntries = (skill: ArchiveSkill) =>
  skill.events
    .filter((event) => event.patchId)
    .map((event) => currentById.get(event.patchId!)!)
    .filter(Boolean);
export const knownVersions = (skill: ArchiveSkill) =>
  new Set(eventsFor(skill).map((event) => event.sourceId)).size;
export const directions = (skill: ArchiveSkill) => {
  const tags = new Set(currentEntries(skill).flatMap((entry) => entry.tags));
  if (tags.has('review')) return 'review';
  if (tags.has('mixed') || (tags.has('buff') && tags.has('nerf')))
    return 'mixed';
  if (tags.has('nerf')) return 'nerf';
  if (tags.has('buff')) return 'buff';
  if (tags.has('new')) return 'new';
  if (tags.has('removed')) return 'removed';
  return 'neutral';
};
export const directionLabels: Record<string, string> = {
  nerf: '하향 항목',
  buff: '상향 항목',
  mixed: '복합 변경',
  review: '검토 필요',
  new: '신규',
  removed: '삭제',
  neutral: '내용 변경',
};
