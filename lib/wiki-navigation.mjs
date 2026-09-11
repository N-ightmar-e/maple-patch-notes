export const jobHref = (/** @type {string} */ id) =>
  `/wiki/job/?id=${encodeURIComponent(id)}`;
export const skillHref = (/** @type {string} */ id) =>
  `/wiki/skill/?id=${encodeURIComponent(id)}`;
export const patchHref = (/** @type {string} */ id) =>
  `/wiki/patch/?id=${encodeURIComponent(id)}`;
/** Preserve already-shared patch-reader links while allowing a wiki home at /. */
export function isLegacyPatchUrl(
  /** @type {URL} */ url,
  /** @type {string} */ basePath = '',
) {
  const root = url.pathname.replace(/\/$/, '') === basePath.replace(/\/$/, '');
  return (
    root &&
    (['job', 'q', 'tier'].some((key) => url.searchParams.has(key)) ||
      /^#section-/.test(url.hash))
  );
}
