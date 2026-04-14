/**
 * Client-side filters for off-plan projects (DB columns + offplan_catalog JSON).
 * Behaviour aligned with github.com/pavel949/OFFPLAN/lib/filters.ts
 */
import type { OffplanProject } from '@/hooks/useOffplanProjects';
import type { OffplanCatalogFacet, OffplanSortKey, OffplanUiFilterState, RecLabel } from './types';

const beachOrd: Record<string, number> = { bf: 0, '500': 1, '1k': 2, inl: 3 };

function catalog(p: OffplanProject): OffplanCatalogFacet | null {
  return p.offplanCatalog ?? null;
}

function recOf(p: OffplanProject): RecLabel | undefined {
  const c = catalog(p);
  if (c?.rec) return c.rec;
  const rl = p.riskLevel?.toUpperCase();
  if (rl === 'BUY' || rl === 'WATCH' || rl === 'AVOID') return rl;
  return undefined;
}

export function filterOffplanProjects(
  projects: OffplanProject[],
  f: OffplanUiFilterState,
): OffplanProject[] {
  const q = f.q.toLowerCase().trim();
  return projects.filter((p) => {
    const c = catalog(p);
    if (f.fRec && recOf(p) !== f.fRec) return false;
    if (f.fSeg && c?.seg !== f.fSeg) return false;
    const zoneVal = c?.zone || p.district || '';
    if (f.fZone && zoneVal.indexOf(f.fZone) < 0) return false;
    if (f.fBeach && c?.beach !== f.fBeach) return false;
    if (f.fOwn && c?.own && c.own !== f.fOwn && c.own !== 'both') return false;
    if (f.fMgmt && c?.mgmt && c.mgmt !== f.fMgmt) return false;
    if (f.fFocus && c?.focus && c.focus !== f.fFocus && c.focus !== 'mixed') return false;
    if (f.fRisk) {
      const riskNum = parseInt(f.fRisk, 10);
      const pRisk = parseRiskStars(p);
      if (pRisk === null || pRisk !== riskNum) return false;
    }
    if (f.fYear) {
      const y = completionYear(p);
      if (f.fYear === 'done24' && y !== 2024) return false;
      if (f.fYear === 'done25' && y !== 2025) return false;
      if (f.fYear === '2026' && y !== 2026) return false;
      if (f.fYear === '2027' && y !== 2027) return false;
      if (f.fYear === '2028' && (y || 0) < 2028) return false;
    }
    if (f.fDev) {
      const name = (p.developerName || '').toLowerCase();
      if (name.indexOf(f.fDev.toLowerCase()) < 0) return false;
    }
    if (q) {
      const hay = `${p.nameEn} ${p.nameRu} ${p.district || ''} ${p.developerName || ''} ${(c?.tags || p.amenities || []).join(' ')}`.toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });
}

function parseRiskStars(p: OffplanProject): number | null {
  const raw = p.riskLevel?.trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 5) return n;
  return null;
}

function completionYear(p: OffplanProject): number | null {
  const c = catalog(p);
  if (c?.comp_y) return c.comp_y;
  if (!p.completionDate) return null;
  const y = new Date(p.completionDate).getFullYear();
  return Number.isNaN(y) ? null : y;
}

export function sortOffplanProjects(
  list: OffplanProject[],
  fSort: OffplanSortKey,
): OffplanProject[] {
  const arr = [...list];
  arr.sort((a, b) => {
    if (fSort === 'price_asc') return (a.priceFrom || 0) - (b.priceFrom || 0);
    if (fSort === 'price_desc') return (b.priceFrom || 0) - (a.priceFrom || 0);
    if (fSort === 'yield') return (b.roiProjected || 0) - (a.roiProjected || 0);
    if (fSort === 'risk') {
      const ra = parseRiskStars(a) ?? 3;
      const rb = parseRiskStars(b) ?? 3;
      return ra - rb;
    }
    if (fSort === 'beach') {
      const ba = beachOrd[catalog(a)?.beach ?? ''] ?? 3;
      const bb = beachOrd[catalog(b)?.beach ?? ''] ?? 3;
      return ba - bb;
    }
    if (fSort === 'rating') {
      const ratA = catalog(a)?.rating ?? a.muunoScore ?? 0;
      const ratB = catalog(b)?.rating ?? b.muunoScore ?? 0;
      return ratB - ratA;
    }
    if (fSort === 'completion') {
      const ta = a.completionDate ? new Date(a.completionDate).getTime() : Infinity;
      const tb = b.completionDate ? new Date(b.completionDate).getTime() : Infinity;
      return ta - tb;
    }
    return (b.muunoScore || 0) - (a.muunoScore || 0);
  });
  return arr;
}

export function applyOffplanUiFilters(
  projects: OffplanProject[],
  f: OffplanUiFilterState,
): OffplanProject[] {
  return sortOffplanProjects(filterOffplanProjects(projects, f), f.fSort);
}

export function countByRec(projects: OffplanProject[]): Record<RecLabel, number> {
  const init: Record<RecLabel, number> = { BUY: 0, WATCH: 0, AVOID: 0 };
  for (const p of projects) {
    const r = recOf(p);
    if (r) init[r] += 1;
  }
  return init;
}

export function activeOffplanFilterCount(f: OffplanUiFilterState): number {
  let n = 0;
  if (f.fRec) n += 1;
  if (f.q) n += 1;
  if (f.fRisk) n += 1;
  if (f.fSeg) n += 1;
  if (f.fZone) n += 1;
  if (f.fYear) n += 1;
  if (f.fBeach) n += 1;
  if (f.fOwn) n += 1;
  if (f.fMgmt) n += 1;
  if (f.fFocus) n += 1;
  if (f.fDev) n += 1;
  return n;
}

export function collectFacetOptions(projects: OffplanProject[]) {
  const zones = new Set<string>();
  const segs = new Set<string>();
  const beaches = new Set<string>();
  for (const p of projects) {
    const c = p.offplanCatalog;
    if (c?.zone) zones.add(c.zone);
    else if (p.district) zones.add(p.district);
    if (c?.seg) segs.add(c.seg);
    if (c?.beach) beaches.add(c.beach);
  }
  return {
    zones: Array.from(zones).sort(),
    segs: Array.from(segs).sort(),
    beaches: Array.from(beaches).sort(),
  };
}
