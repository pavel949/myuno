/**
 * Client-side deduplication guard for IPP lead events.
 *
 * Why: React StrictMode double-invokes effects, components re-render, and
 * back/forward navigation can replay effects from bfcache. Without a guard
 * we'd inflate `roi_calculator_run`, `ipp_cross_cta_click`, and similar
 * events, polluting M10a audits and lead scoring.
 *
 * Strategy:
 *  - Two layers: in-memory Set (fast, survives re-renders within a tab life)
 *    and sessionStorage (survives bfcache restores + SPA route remounts).
 *  - Keys are deterministic per (eventType + identifying context) so the
 *    SAME logical interaction dedups, but distinct ones (e.g. user changes
 *    project then re-runs ROI) still fire.
 *  - TTL keeps the guard from being permanent: after `ttlMs` the same key
 *    can fire again (default 30 min — covers a single working session).
 */

const MEMORY: Map<string, number> = new Map();
const STORAGE_PREFIX = 'myuno_ipp_dedup:';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

function now(): number {
  return Date.now();
}

function readStorageTimestamp(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

function writeStorageTimestamp(key: string, ts: number): void {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, String(ts));
  } catch {
    /* storage unavailable — memory layer still guards */
  }
}

/**
 * Returns true if this is the FIRST time `key` is seen within `ttlMs`.
 * Returns false on duplicates — caller should skip the event.
 */
export function shouldFireOnce(key: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
  const t = now();
  const memTs = MEMORY.get(key);
  if (memTs && t - memTs < ttlMs) return false;

  const storedTs = readStorageTimestamp(key);
  if (storedTs && t - storedTs < ttlMs) {
    // Sync memory layer so subsequent checks short-circuit fast.
    MEMORY.set(key, storedTs);
    return false;
  }

  MEMORY.set(key, t);
  writeStorageTimestamp(key, t);
  return true;
}

/** Build a stable dedup key from arbitrary parts (null/undefined skipped). */
export function buildDedupKey(...parts: Array<string | number | null | undefined>): string {
  return parts.filter(p => p !== null && p !== undefined && p !== '').join('|');
}

/** Test helper: clear all dedup state. Not exported in production code paths. */
export function __resetEventDedup(): void {
  MEMORY.clear();
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach(k => sessionStorage.removeItem(k));
  } catch { /* noop */ }
}
