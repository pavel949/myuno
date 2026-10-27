import type { ProjectLifecycleStatus } from './canonicalModel';

/** Missing database facts stay unknown; these helpers never establish provenance. */
export function knownProjectLifecycle(value: unknown): ProjectLifecycleStatus | null {
  return value === 'offplan' || value === 'under_construction' || value === 'completed' ? value : null;
}
export function knownProjectProgress(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}
export function knownProjectCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
