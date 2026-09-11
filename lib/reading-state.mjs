export const emptyReadingState = { favorites: [], recent: [], comparison: [] };
const unique = (values, pattern, limit) =>
  Array.isArray(values)
    ? [
        ...new Set(
          values.filter(
            (value) => typeof value === 'string' && pattern.test(value),
          ),
        ),
      ].slice(0, limit)
    : [];
export function parseReadingState(raw) {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!value || typeof value !== 'object') return emptyReadingState;
    return {
      favorites: unique(
        value.favorites,
        /^(job:section-\d+|skill:archive-[a-f0-9]+)$/,
        300,
      ),
      recent: unique(
        value.recent,
        /^(job:section-\d+|skill:archive-[a-f0-9]+)$/,
        12,
      ),
      comparison: unique(value.comparison, /^archive-[a-f0-9]+$/, 2),
    };
  } catch {
    return emptyReadingState;
  }
}
export function safeReturnPath(path) {
  if (
    !path ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\')
  )
    return null;
  try {
    const url = new URL(path, 'https://wiki.invalid');
    return url.origin === 'https://wiki.invalid' &&
      ['/wiki/', '/wiki/job/', '/wiki/compare/'].includes(url.pathname)
      ? `${url.pathname}${url.search}${url.hash}`
      : null;
  } catch {
    return null;
  }
}
export const eventAnchor = (sourceId, index = 0) =>
  `timeline-${sourceId}-${index}`;
export const anchorForEvent = (events, index) =>
  eventAnchor(
    events[index].sourceId,
    events
      .slice(0, index)
      .filter((event) => event.sourceId === events[index].sourceId).length,
  );
export const comparisonHref = (ids) =>
  `/wiki/compare/?skills=${[...new Set(ids)].slice(0, 2).map(encodeURIComponent).join(',')}`;
export function changeSignals(entries) {
  const signals = new Set(
    entries.flatMap((entry) => [
      ...entry.tags,
      ...entry.changes.map((change) => change.direction),
    ]),
  );
  if (!entries.length) signals.add('past');
  return [...signals];
}
