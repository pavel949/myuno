/**
 * Slug generation for Thai business landing pages (`/ts/:slug`).
 *
 * Business names are usually Thai or Russian, so we transliterate to a latin,
 * URL-safe base. Uniqueness is enforced at the DB boundary (unique constraint);
 * `ensureUniqueSlug` appends a short suffix when a base collides.
 */

// Minimal RU→latin map (covers the common cases for business names).
const RU_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => (ch in RU_MAP ? RU_MAP[ch] : ch))
    .join('');
}

/**
 * Produce a URL-safe base slug from a business name. Always returns a
 * non-empty string (falls back to `biz` when nothing transliterates).
 */
export function slugifyThaiBusiness(name: string): string {
  const base = transliterate(name ?? '')
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-') // non-latin (e.g. Thai script) collapses to separators
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return base || 'biz';
}

/** Short random suffix (lowercase base36) used to de-dupe colliding slugs. */
export function randomSlugSuffix(len = 4): string {
  return Math.random().toString(36).slice(2, 2 + len);
}

/**
 * Given a base slug and the set of slugs already taken, return a unique slug.
 * Pure + deterministic given the suffix generator (injectable for tests).
 */
export function ensureUniqueSlug(
  base: string,
  taken: Set<string> | string[],
  suffixFn: () => string = randomSlugSuffix,
): string {
  const takenSet = Array.isArray(taken) ? new Set(taken) : taken;
  if (!takenSet.has(base)) return base;
  let candidate = `${base}-${suffixFn()}`;
  while (takenSet.has(candidate)) {
    candidate = `${base}-${suffixFn()}`;
  }
  return candidate;
}
