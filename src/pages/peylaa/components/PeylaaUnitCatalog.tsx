/**
 * PEYLAA Unit Catalog — filterable table of all available units
 */
import React, { useState, useMemo } from 'react';
import { Building2, Layers, Eye, SlidersHorizontal, ChevronDown, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePeylaaUnits, usePeylaaViews, formatThb } from '@/hooks/usePeylaa';
import type { UnitFilters } from '@/lib/peylaa/types';

interface Props {
  onInquiry: (unitId: string) => void;
}

const FLOOR_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function PeylaaUnitCatalog({ onInquiry }: Props) {
  const [filters, setFilters] = useState<UnitFilters>({
    status: ['available'],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'floor_asc' | 'area_asc'>('price_asc');

  const { data: units, isLoading } = usePeylaaUnits(filters);
  const { data: views } = usePeylaaViews();

  const sortedUnits = useMemo(() => {
    if (!units) return [];
    return [...units].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc': return (a.asking_price_thb || 0) - (b.asking_price_thb || 0);
        case 'price_desc': return (b.asking_price_thb || 0) - (a.asking_price_thb || 0);
        case 'floor_asc': return a.floor - b.floor;
        case 'area_asc': return a.area_sqm - b.area_sqm;
        default: return 0;
      }
    });
  }, [units, sortBy]);

  const toggleFilter = <K extends keyof UnitFilters>(key: K, value: any) => {
    setFilters(prev => {
      const current = (prev[key] as any[]) || [];
      const next = current.includes(value)
        ? current.filter((v: any) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next.length ? next : undefined };
    });
  };

  const activeFilterCount = [
    filters.bedrooms?.length,
    filters.buildings?.length,
    filters.floors?.length,
    filters.views?.length,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick bedroom filters */}
        <div className="flex gap-1">
          {[1, 2].map(br => (
            <button
              key={br}
              onClick={() => toggleFilter('bedrooms', br)}
              className={`px-4 py-2 rounded-none text-sm font-medium transition-colors ${
                filters.bedrooms?.includes(br)
                  ? 'bg-accent text-black'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {br} BR
            </button>
          ))}
        </div>

        {/* Building filter */}
        <div className="flex gap-1">
          {['A', 'B'].map(b => (
            <button
              key={b}
              onClick={() => toggleFilter('buildings', b)}
              className={`px-3 py-2 rounded-none text-sm font-medium transition-colors ${
                filters.buildings?.includes(b)
                  ? 'bg-accent text-black'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              <Building2 className="w-3 h-3 inline mr-1" />
              {b}
            </button>
          ))}
        </div>

        {/* More filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-2 rounded-none text-sm bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 flex items-center gap-1"
        >
          <SlidersHorizontal className="w-3 h-3" />
          Фильтры
          {activeFilterCount > 0 && (
            <Badge className="bg-accent text-black text-[10px] ml-1 h-4 w-4 p-0 flex items-center justify-center rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </button>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="ml-auto px-3 py-2 rounded-none text-sm bg-white/5 border border-white/10 text-white/60 appearance-none cursor-pointer"
        >
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
          <option value="floor_asc">Этаж ↑</option>
          <option value="area_asc">Площадь ↑</option>
        </select>

        {/* Count */}
        <span className="text-sm text-white/40">
          {sortedUnits.length} юнитов
        </span>
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="p-4 rounded-none bg-white/5 border border-white/10 space-y-4">
          {/* Floor */}
          <div>
            <div className="text-xs text-white/40 mb-2 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Этаж
            </div>
            <div className="flex flex-wrap gap-1">
              {FLOOR_OPTIONS.map(f => (
                <button
                  key={f}
                  onClick={() => toggleFilter('floors', f)}
                  className={`w-9 h-9 rounded-none text-sm font-medium transition-colors ${
                    filters.floors?.includes(f)
                      ? 'bg-accent text-black'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* View */}
          <div>
            <div className="text-xs text-white/40 mb-2 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Вид
            </div>
            <div className="flex flex-wrap gap-1">
              {(views || []).map(v => (
                <button
                  key={v}
                  onClick={() => toggleFilter('views', v)}
                  className={`px-3 py-1.5 rounded-none text-xs font-medium transition-colors ${
                    filters.views?.includes(v)
                      ? 'bg-accent text-black'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Clear */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
            onClick={() => setFilters({ status: ['available'] })}
          >
            Сбросить фильтры
          </Button>
        </div>
      )}

      {/* Units table / cards */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 bg-white/5 rounded-none" />
          ))}
        </div>
      ) : sortedUnits.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          Нет юнитов по выбранным фильтрам
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/40 border-b border-white/10">
                  <th className="pb-3 font-medium">Юнит</th>
                  <th className="pb-3 font-medium">Корпус</th>
                  <th className="pb-3 font-medium">Этаж</th>
                  <th className="pb-3 font-medium">Тип</th>
                  <th className="pb-3 font-medium">Площадь</th>
                  <th className="pb-3 font-medium">Вид</th>
                  <th className="pb-3 font-medium text-right">Цена (THB)</th>
                  <th className="pb-3 font-medium text-right">~USD</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {sortedUnits.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="font-mono py-3 font-medium text-white">
                      {u.unit_no}
                    </td>
                    <td className="py-3 text-white/60">{u.building}</td>
                    <td className="py-3 text-white/60">{u.floor}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="border-white/20 text-white/70 text-xs">
                        {u.room_type}
                      </Badge>
                    </td>
                    <td className="font-mono py-3 text-white/60">
                      {u.area_sqm} м²
                    </td>
                    <td className="py-3 text-white/50 text-xs">{u.view}</td>
                    <td className="font-mono py-3 text-right font-semibold text-accent">
                      {u.asking_price_thb ? `฿${u.asking_price_thb.toLocaleString()}` : '—'}
                    </td>
                    <td className="font-mono py-3 text-right text-white/40 text-xs">
                      {u.asking_price_thb ? `$${Math.round(u.asking_price_thb / 35).toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-accent hover:bg-accent/10 h-7 text-xs"
                        onClick={() => onInquiry(u.id)}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Запрос
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {sortedUnits.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-none bg-white/5 border border-white/10 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-white text-sm">
                      {u.unit_no}
                    </span>
                    <Badge variant="outline" className="border-white/20 text-white/50 text-[10px]">
                      {u.room_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    {u.building} / Этаж {u.floor} / {u.area_sqm}м² / {u.view}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-accent font-semibold text-sm">
                    {formatThb(u.asking_price_thb)}
                  </div>
                  <button
                    className="text-[10px] text-accent/70 mt-1"
                    onClick={() => onInquiry(u.id)}
                  >
                    Запрос →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
