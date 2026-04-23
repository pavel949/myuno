/**
 * CatalogSidebar — 11-filter sidebar for offplan catalog (reference-style)
 */
import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { OffplanUiFilterState, OffplanSortKey } from '@/lib/offplan/types';

interface FacetOptions {
  zones: string[];
  segs: string[];
  beaches: string[];
}

interface Props {
  filters: OffplanUiFilterState;
  onChange: (patch: Partial<OffplanUiFilterState>) => void;
  facets: FacetOptions;
  developers: string[];
  activeCount: number;
  onReset: () => void;
}

const SORT_OPTIONS: { value: OffplanSortKey; label: string }[] = [
  { value: 'rating', label: 'Rating ↓' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'completion', label: 'Completion' },
  { value: 'yield', label: 'Yield ↓' },
  { value: 'risk', label: 'Risk ↑' },
  { value: 'beach', label: 'Beach ↑' },
];

const REC_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'BUY', label: '✅ BUY' },
  { value: 'WATCH', label: '⏳ WATCH' },
  { value: 'AVOID', label: '🚫 AVOID' },
];

const RISK_OPTIONS = [
  { value: '', label: 'All' },
  { value: '1', label: 'Tier 1 — Low' },
  { value: '2', label: 'Tier 2 — Medium' },
  { value: '3', label: 'Tier 3 — High' },
  { value: '4', label: 'Tier 4 — Very High' },
  { value: '5', label: 'Tier 5 — Extreme' },
];

const YEAR_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'done24', label: 'Completed 2024' },
  { value: 'done25', label: 'Completed 2025' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
  { value: '2028', label: '2028+' },
];

const BEACH_LABELS: Record<string, string> = { bf: 'Beachfront', '500': '< 500m', '1k': '< 1km', inl: 'Inland' };
const OWN_OPTIONS = ['', 'fh', 'lh', 'both'];
const OWN_LABELS: Record<string, string> = { '': 'All', fh: 'Freehold', lh: 'Leasehold', both: 'FH + LH' };
const MGMT_OPTIONS = ['', 'hotel', 'self', 'optional'];
const MGMT_LABELS: Record<string, string> = { '': 'All', hotel: 'Hotel-managed', self: 'Self-managed', optional: 'Optional' };
const FOCUS_OPTIONS = ['', 'inv', 'life', 'mixed'];
const FOCUS_LABELS: Record<string, string> = { '': 'All', inv: 'Investment', life: 'Lifestyle', mixed: 'Mixed' };

export function CatalogSidebar({ filters, onChange, facets, developers, activeCount, onReset }: Props) {
  return (
    <aside className="space-y-4 text-xs" style={{ color: 'hsl(var(--nb-text))' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: 'hsl(var(--nb-gold))' }} />
          <span className="font-semibold text-sm">Filters</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'hsl(var(--nb-gold))', color: 'hsl(var(--nb-bg))' }}>
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={onReset} className="flex items-center gap-1 text-[11px]" style={{ color: 'hsl(var(--nb-gold))' }}>
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'hsl(var(--nb-muted))' }} />
        <input
          type="text"
          placeholder="Search projects..."
          value={filters.q}
          onChange={e => onChange({ q: e.target.value })}
          className="w-full pl-8 pr-3 py-2 rounded-none text-xs"
          style={{
            background: 'hsl(var(--nb-bg))',
            border: '1px solid hsl(var(--nb-gold) / 0.15)',
            color: 'hsl(var(--nb-text))',
          }}
        />
      </div>

      {/* Sort */}
      <FilterSelect
        label="Sort by"
        value={filters.fSort}
        options={SORT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
        onChange={v => onChange({ fSort: v as OffplanSortKey })}
      />

      {/* Recommendation */}
      <FilterSelect
        label="Recommendation"
        value={filters.fRec}
        options={REC_OPTIONS}
        onChange={v => onChange({ fRec: v as any })}
      />

      {/* Risk Tier */}
      <FilterSelect
        label="Risk Tier"
        value={filters.fRisk}
        options={RISK_OPTIONS}
        onChange={v => onChange({ fRisk: v })}
      />

      {/* Segment */}
      {facets.segs.length > 0 && (
        <FilterSelect
          label="Segment"
          value={filters.fSeg}
          options={[{ value: '', label: 'All' }, ...facets.segs.map(s => ({ value: s, label: s }))]}
          onChange={v => onChange({ fSeg: v })}
        />
      )}

      {/* Zone */}
      {facets.zones.length > 0 && (
        <FilterSelect
          label="Zone"
          value={filters.fZone}
          options={[{ value: '', label: 'All' }, ...facets.zones.map(z => ({ value: z, label: z }))]}
          onChange={v => onChange({ fZone: v })}
        />
      )}

      {/* Completion Year */}
      <FilterSelect
        label="Completion"
        value={filters.fYear}
        options={YEAR_OPTIONS}
        onChange={v => onChange({ fYear: v })}
      />

      {/* Beach */}
      {facets.beaches.length > 0 && (
        <FilterSelect
          label="Beach Distance"
          value={filters.fBeach}
          options={[{ value: '', label: 'All' }, ...facets.beaches.map(b => ({ value: b, label: BEACH_LABELS[b] || b }))]}
          onChange={v => onChange({ fBeach: v })}
        />
      )}

      {/* Ownership */}
      <FilterSelect
        label="Ownership"
        value={filters.fOwn}
        options={OWN_OPTIONS.map(v => ({ value: v, label: OWN_LABELS[v] }))}
        onChange={v => onChange({ fOwn: v })}
      />

      {/* Management */}
      <FilterSelect
        label="Management"
        value={filters.fMgmt}
        options={MGMT_OPTIONS.map(v => ({ value: v, label: MGMT_LABELS[v] }))}
        onChange={v => onChange({ fMgmt: v })}
      />

      {/* Focus */}
      <FilterSelect
        label="Focus"
        value={filters.fFocus}
        options={FOCUS_OPTIONS.map(v => ({ value: v, label: FOCUS_LABELS[v] }))}
        onChange={v => onChange({ fFocus: v })}
      />

      {/* Developer */}
      {developers.length > 0 && (
        <FilterSelect
          label="Developer"
          value={filters.fDev}
          options={[{ value: '', label: 'All' }, ...developers.map(d => ({ value: d, label: d }))]}
          onChange={v => onChange({ fDev: v })}
        />
      )}
    </aside>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider mb-1 font-medium" style={{ color: 'hsl(var(--nb-muted))' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded-none text-xs appearance-none cursor-pointer"
        style={{
          background: 'hsl(var(--nb-bg))',
          border: '1px solid hsl(var(--nb-gold) / 0.15)',
          color: 'hsl(var(--nb-text))',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
