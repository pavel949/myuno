/**
 * NbFilterPanel — Advanced filter drawer for newbuilds catalog
 * Mobile: slide-up sheet; Desktop: inline sidebar
 */
import React, { useState } from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { NewbuildFilters } from '@/hooks/useNewbuildProjects';

interface Props {
  filters: NewbuildFilters;
  onChange: (filters: NewbuildFilters) => void;
  locations: string[];
  onClose?: () => void;
  resultCount?: number;
}

const STATUS_OPTIONS = [
  { value: 'under_construction', label: 'Строится' },
  { value: 'completed', label: 'Сдан' },
  { value: 'upcoming', label: 'Скоро' },
  { value: 'offplan', label: 'Off-plan' },
];

const BEDROOM_OPTIONS = [
  { value: 'studio', label: 'Студия' },
  { value: '1br', label: '1' },
  { value: '2br', label: '2' },
  { value: '3br', label: '3+' },
];

const PRICE_PRESETS = [
  { label: 'до ฿3M', min: 0, max: 3_000_000 },
  { label: '฿3M–5M', min: 3_000_000, max: 5_000_000 },
  { label: '฿5M–10M', min: 5_000_000, max: 10_000_000 },
  { label: '฿10M–20M', min: 10_000_000, max: 20_000_000 },
  { label: '฿20M+', min: 20_000_000, max: undefined },
];

const inputStyle = {
  background: 'hsl(var(--nb-bg))',
  color: 'hsl(var(--nb-text))',
  border: '1px solid hsl(var(--nb-gold) / 0.2)',
};

export function NbFilterPanel({ filters, onChange, locations, onClose, resultCount }: Props) {
  const [local, setLocal] = useState<NewbuildFilters>(filters);

  const update = (partial: Partial<NewbuildFilters>) => {
    const next = { ...local, ...partial };
    setLocal(next);
    onChange(next);
  };

  const clearAll = () => {
    const empty: NewbuildFilters = {};
    setLocal(empty);
    onChange(empty);
  };

  const hasFilters = Object.values(local).some(v => v !== undefined && v !== '');

  const pillStyle = (active: boolean) => ({
    background: active ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-gold) / 0.1)',
    color: active ? 'hsl(var(--nb-bg))' : 'hsl(var(--nb-gold))',
    border: `1px solid hsl(var(--nb-gold) / ${active ? '1' : '0.2'})`,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
          <h3 className="nb-display text-lg" style={{ color: 'hsl(var(--nb-text))' }}>Фильтры</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ color: 'hsl(var(--nb-muted))' }}>
              <RotateCcw className="w-3 h-3" /> Сбросить
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'hsl(var(--nb-muted))' }}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Text search */}
      <div>
        <label className="nb-label text-[10px] mb-2 block">ПОИСК</label>
        <input
          type="text"
          placeholder="Название, район, девелопер..."
          value={(local as any).search_text || ''}
          onChange={e => update({ search_text: e.target.value || undefined } as any)}
          className="w-full px-3 py-2.5 rounded-lg text-sm"
          style={inputStyle}
        />
      </div>

      {/* Location */}
      <div>
        <label className="nb-label text-[10px] mb-2 block">РАЙОН</label>
        <select
          value={local.location_area || ''}
          onChange={e => update({ location_area: e.target.value || undefined })}
          className="w-full px-3 py-2.5 rounded-lg text-sm"
          style={inputStyle}
        >
          <option value="">Все районы</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Price range presets */}
      <div>
        <label className="nb-label text-[10px] mb-2 block">БЮДЖЕТ</label>
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map(preset => {
            const active = local.price_min === preset.min && local.price_max === preset.max;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  if (active) update({ price_min: undefined, price_max: undefined });
                  else update({ price_min: preset.min, price_max: preset.max });
                }}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={pillStyle(active)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        {/* Custom price inputs */}
        <div className="flex gap-2 mt-3">
          <input
            type="number"
            placeholder="от ฿"
            value={local.price_min || ''}
            onChange={e => update({ price_min: parseInt(e.target.value) || undefined })}
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="до ฿"
            value={local.price_max || ''}
            onChange={e => update({ price_max: parseInt(e.target.value) || undefined })}
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="nb-label text-[10px] mb-2 block">СТАТУС</label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(opt => {
            const active = local.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => update({ status: active ? undefined : opt.value })}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={pillStyle(active)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="nb-label text-[10px] mb-2 block">СПАЛЬНИ</label>
        <div className="flex gap-2">
          {BEDROOM_OPTIONS.map(opt => {
            const active = local.unit_type === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => update({ unit_type: active ? undefined : opt.value })}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={pillStyle(active)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="nb-label text-[10px] mb-2 block">СОРТИРОВКА</label>
        <select
          value={local.sort || 'featured'}
          onChange={e => update({ sort: e.target.value as any })}
          className="w-full px-3 py-2.5 rounded-lg text-sm"
          style={inputStyle}
        >
          <option value="featured">По рейтингу</option>
          <option value="newest">Новые</option>
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
          <option value="progress">Прогресс стройки</option>
        </select>
      </div>

      {/* Result count */}
      {resultCount !== undefined && (
        <div className="nb-separator" />
      )}
      {resultCount !== undefined && (
        <p className="text-center text-sm" style={{ color: 'hsl(var(--nb-muted))' }}>
          Найдено <span className="nb-mono font-bold" style={{ color: 'hsl(var(--nb-gold))' }}>{resultCount}</span> проектов
        </p>
      )}
    </div>
  );
}
