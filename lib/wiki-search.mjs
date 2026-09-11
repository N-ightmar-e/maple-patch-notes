/** Korean spacing and initial-consonant search, shared by the wiki's two indexes. */
export const normalize = (/** @type {string} */ text) =>
  text.normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g, '');
const initials = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const consonants = (/** @type {string} */ text) =>
  Array.from(text)
    .map((char) => {
      const code = char.charCodeAt(0) - 0xac00;
      return code >= 0 && code <= 11171
        ? initials[Math.floor(code / 588)]
        : char;
    })
    .join('');
export function matches(
  /** @type {string} */ text,
  /** @type {string} */ query,
) {
  const compact = normalize(text);
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => {
      // Test consonants before NFKC, which changes compatibility jamo.
      return /^[ㄱ-ㅎ]+$/.test(term)
        ? normalize(consonants(text)).includes(normalize(term))
        : compact.includes(normalize(term));
    });
}
/** @template {{name: string, text: string, job?: string, classification?: {tier: string}}} T
 * @param {T[]} entries @param {string} query @returns {T[]}
 */
export function searchEntries(entries, query) {
  if (!query.trim()) return entries;
  const exact = (text) =>
    normalize(/^[ㄱ-ㅎ]+$/.test(query.trim()) ? consonants(text) : text) ===
    normalize(query);
  const score = (entry) =>
    exact(entry.name)
      ? 0
      : entry.job && exact(entry.job)
        ? 1
        : matches(entry.name, query)
          ? 2
          : matches(
                `${entry.job || ''} ${entry.name} ${entry.classification?.tier || ''}`,
                query,
              )
            ? 3
            : 4;
  return entries
    .filter((entry) => matches(entry.text, query))
    .sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name, 'ko'));
}
