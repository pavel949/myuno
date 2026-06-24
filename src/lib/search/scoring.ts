/**
 * Shared search scoring — SSOT for ranking client-side search entries.
 *
 * Extracted from navigationIndex.ts so both the navigation index and the
 * unified static index (staticIndex.ts) rank identically. Dependency-free,
 * RU/EN/TH aware, with optional light typo tolerance.
 */

/** Normalize for matching: lowercase + strip diacritics (NFKD). */
export const norm = (s: string): string =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Split a normalized query into ≥2-char tokens. */
export const tokenize = (qNorm: string): string[] =>
  qNorm.split(/[\s,/-]+/).filter((t) => t.length >= 2);

/** Anything matchable by the scorer. Structurally compatible with NavTarget. */
export interface ScorableEntry {
  titleRu: string;
  titleEn: string;
  titleTh?: string;
  /** Matching keywords (lowercase, RU/EN/TH mixed). */
  keywords: string[];
  /** Higher = preferred when multiple match equally. */
  weight?: number;
  /** Persona affinity — boosts ranking when the user matches. */
  personas?: string[];
  /** Surface/cluster id — small boost when it matches the active cluster. */
  cluster?: string;
  /** Role gate — entry scores 0 (hidden) when the user lacks one of these. */
  requiresRole?: string[];
}

export interface ScoreContext {
  isAuthenticated: boolean;
  /** Lowercase roles ('owner', 'mc', 'admin', …). */
  roles: string[];
  /** Active personas. */
  personas: string[];
  /** Active surface/cluster from the current route. */
  activeCluster?: string;
}

export interface ScoreOptions {
  /** Enable single-edit typo tolerance on ≥4-char tokens (default false). */
  fuzzy?: boolean;
}

/** Levenshtein distance with an early exit once it exceeds `max`. */
function withinEditDistance(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  if (a === b) return true;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return false;
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length] <= max;
}

/**
 * Score an entry against a normalized query + context.
 * Returns 0 when the entry should not be shown (role gate or no match).
 */
export function scoreEntry(
  entry: ScorableEntry,
  qNorm: string,
  qTokens: string[],
  ctx: ScoreContext,
  opts: ScoreOptions = {},
): number {
  // Role gate
  if (entry.requiresRole && entry.requiresRole.length > 0) {
    if (entry.requiresRole.includes('authenticated')) {
      if (!ctx.isAuthenticated) return 0;
    } else if (!entry.requiresRole.some((r) => ctx.roles.includes(r))) {
      return 0;
    }
  }

  let score = 0;
  const titles = [norm(entry.titleRu), norm(entry.titleEn)];
  if (entry.titleTh) titles.push(norm(entry.titleTh));

  // Title tiers — best of all titles
  for (const t of titles) {
    if (t === qNorm) { score += 100; break; }
    if (t.startsWith(qNorm)) { score = Math.max(score, 60); }
    else if (t.includes(qNorm)) { score = Math.max(score, 35); }
  }

  // Keyword matches — full-token hit counts more than substring
  for (const kw of entry.keywords) {
    const kwN = norm(kw);
    if (qTokens.includes(kwN)) score += 25;
    else if (kwN.includes(qNorm) && qNorm.length >= 3) score += 12;
    else {
      for (const tok of qTokens) {
        if (tok.length >= 3 && kwN.includes(tok)) { score += 6; break; }
      }
    }
  }

  // Light typo tolerance — only when nothing else matched, low score so it
  // never outranks a real hit.
  if (score === 0 && opts.fuzzy) {
    const haystack = [...titles, ...entry.keywords.map(norm)];
    outer: for (const tok of qTokens) {
      if (tok.length < 4) continue;
      for (const h of haystack) {
        for (const word of h.split(/[\s,/-]+/)) {
          if (word.length >= 4 && withinEditDistance(tok, word, 1)) {
            score += 8;
            break outer;
          }
        }
      }
    }
  }

  if (score === 0) return 0;

  // Boosts
  score += entry.weight ?? 0;
  if (entry.personas && ctx.personas.some((p) => entry.personas!.includes(p))) score += 10;
  if (ctx.activeCluster && entry.cluster === ctx.activeCluster) score += 5;

  return score;
}
