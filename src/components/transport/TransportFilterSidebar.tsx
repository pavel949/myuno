/**
 * TransportFilterSidebar — Enterprise-level collapsible filter panel
 * Price range, transmission, fuel, seats, brand, delivery, driver
 */

import { useState, useMemo } from 'react';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/hooks/useVehicles';

export interface TransportFilters {
  priceRange: [number, number];
  transmissions: string[];
  fuelTypes: string[];
  brands: string[];
  minSeats: number | null;
  deliveryOnly: boolean;
  withDriverOnly: boolean;
}

export const DEFAULT_FILTERS: TransportFilters = {
  priceRange: [0, 5000],
  transmissions: [],
  fuelTypes: [],
  brands: [],
  minSeats: null,
  deliveryOnly: false,
  withDriverOnly: false,
};

interface TransportFilterSidebarProps {
  filters: TransportFilters;
  onChange: (filters: TransportFilters) => void;
  vehicles: Vehicle[];
  open: boolean;
  onClose: () => void;
}

const TRANSMISSIONS = [
  { id: 'automatic', en: 'Automatic', ru: 'Автомат' },
  { id: 'manual', en: 'Manual', ru: 'Механика' },
];

const FUEL_TYPES = [
  { id: 'petrol', en: 'Petrol', ru: 'Бензин' },
  { id: 'diesel', en: 'Diesel', ru: 'Дизель' },
  { id: 'electric', en: 'Electric', ru: 'Электро' },
  { id: 'hybrid', en: 'Hybrid', ru: 'Гибрид' },
];

const SEAT_OPTIONS = [
  { id: 2, en: '2+ seats', ru: '2+ мест' },
  { id: 4, en: '4+ seats', ru: '4+ мест' },
  { id: 7, en: '7+ seats', ru: '7+ мест' },
  { id: 9, en: '9+ seats', ru: '9+ мест' },
];

export function TransportFilterSidebar({
  filters,
  onChange,
  vehicles,
  open,
  onClose,
}: TransportFilterSidebarProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Extract unique brands from vehicles
  const brands = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach(v => {
      if (v.brand) set.add(v.brand);
    });
    return Array.from(set).sort();
  }, [vehicles]);

  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) count++;
    if (filters.transmissions.length > 0) count++;
    if (filters.fuelTypes.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.minSeats) count++;
    if (filters.deliveryOnly) count++;
    if (filters.withDriverOnly) count++;
    return count;
  }, [filters]);

  const update = (partial: Partial<TransportFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const toggleInArray = (arr: string[], value: string) => {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
  };

  const reset = () => onChange(DEFAULT_FILTERS);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[320px] max-w-full bg-background border-l border-border shadow-2xl transition-[transform,visibility] duration-300 overflow-y-auto",
          "lg:static lg:z-auto lg:shadow-none lg:border-l-0 lg:border-r lg:border-border/50 lg:rounded-none lg:h-auto lg:w-[280px] lg:shrink-0",
          // Closed on mobile: `invisible` takes the off-canvas controls out of
          // the tab order and the accessibility tree, not just out of sight.
          open ? "translate-x-0 visible" : "translate-x-full invisible lg:translate-x-0 lg:hidden"
        )}
        aria-label={isRu ? 'Фильтры' : 'Filters'}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">{isRu ? 'Фильтры' : 'Filters'}</h2>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button type="button" onClick={reset} className="min-h-11 px-2 text-xs text-primary hover:underline">
                {isRu ? 'Сбросить' : 'Reset'}
              </button>
            )}
            <button type="button" onClick={onClose} aria-label={isRu ? 'Закрыть фильтры' : 'Close filters'} className="lg:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-none hover:bg-muted">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Price Range */}
          <FilterSection title={isRu ? 'Цена за день' : 'Daily price'}>
            <div className="px-1">
              <Slider
                value={filters.priceRange}
                min={0}
                max={5000}
                step={100}
                onValueChange={(v) => update({ priceRange: v as [number, number] })}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>฿{filters.priceRange[0].toLocaleString()}</span>
                <span>฿{filters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </FilterSection>

          {/* Transmission */}
          <FilterSection title={isRu ? 'Трансмиссия' : 'Transmission'}>
            <div>
              {TRANSMISSIONS.map(t => (
                <label key={t.id} className="flex min-h-11 items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={filters.transmissions.includes(t.id)}
                    onCheckedChange={() => update({ transmissions: toggleInArray(filters.transmissions, t.id) })}
                  />
                  <span className="text-sm">{isRu ? t.ru : t.en}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Fuel Type */}
          <FilterSection title={isRu ? 'Тип топлива' : 'Fuel type'}>
            <div>
              {FUEL_TYPES.map(f => (
                <label key={f.id} className="flex min-h-11 items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={filters.fuelTypes.includes(f.id)}
                    onCheckedChange={() => update({ fuelTypes: toggleInArray(filters.fuelTypes, f.id) })}
                  />
                  <span className="text-sm">{isRu ? f.ru : f.en}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Seats */}
          <FilterSection title={isRu ? 'Мест' : 'Seats'}>
            <div className="flex flex-wrap gap-2">
              {SEAT_OPTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => update({ minSeats: filters.minSeats === s.id ? null : s.id })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    filters.minSeats === s.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                  )}
                >
                  {isRu ? s.ru : s.en}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Brand */}
          {brands.length > 0 && (
            <FilterSection title={isRu ? 'Марка' : 'Brand'}>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {brands.map(brand => (
                  <label key={brand} className="flex min-h-11 items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={filters.brands.includes(brand)}
                      onCheckedChange={() => update({ brands: toggleInArray(filters.brands, brand) })}
                    />
                    <span className="text-sm">{brand}</span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Toggles */}
          <FilterSection title={isRu ? 'Опции' : 'Options'}>
            <div>
              <label className="flex min-h-11 items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={filters.deliveryOnly}
                  onCheckedChange={(v) => update({ deliveryOnly: !!v })}
                />
                <span className="text-sm">{isRu ? 'С доставкой' : 'Delivery available'}</span>
              </label>
              <label className="flex min-h-11 items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={filters.withDriverOnly}
                  onCheckedChange={(v) => update({ withDriverOnly: !!v })}
                />
                <span className="text-sm">{isRu ? 'С водителем' : 'With driver'}</span>
              </label>
            </div>
          </FilterSection>
        </div>
      </aside>
    </>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-2.5"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", !open && "-rotate-90")} />
      </button>
      {open && children}
    </div>
  );
}

/** Utility: apply filters to vehicle array */
export function applyTransportFilters(vehicles: Vehicle[], filters: TransportFilters): Vehicle[] {
  return vehicles.filter(v => {
    const price = v.price_per_day || 0;
    if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;

    if (filters.transmissions.length > 0 && !filters.transmissions.includes(v.transmission || '')) return false;
    if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(v.fuel_type || '')) return false;
    if (filters.brands.length > 0 && !filters.brands.includes(v.brand || '')) return false;
    if (filters.minSeats && (v.capacity || 0) < filters.minSeats) return false;
    if (filters.deliveryOnly && !v.delivery_available) return false;
    if (filters.withDriverOnly && !v.with_driver_available) return false;

    return true;
  });
}
