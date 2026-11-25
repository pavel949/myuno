/**
 * TransportFilterSidebar — Enterprise-level collapsible filter panel
 * Price range, transmission, fuel, seats, brand, delivery, driver
 */

import { useId, useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { pickLang } from '@/lib/i18n/pickLang';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/hooks/useVehicles';

export interface TransportFilters {
  minPrice: string;
  maxPrice: string;
  transmissions: string[];
  fuelTypes: string[];
  brands: string[];
  minSeats: number | null;
  deliveryOnly: boolean;
  withDriverOnly: boolean;
}

export const DEFAULT_FILTERS: TransportFilters = {
  minPrice: '',
  maxPrice: '',
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

  const update = (partial: Partial<TransportFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const toggleInArray = (arr: string[], value: string) => {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
  };

  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { valid } = parseTransportPriceRange(filters);
  const priceError = useId();

  return (
    <div className="space-y-6">
      <FilterSection title={t('Цена за день, ฿', 'Daily price, THB', 'ราคาต่อวัน (บาท)')}>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['minPrice', t('От', 'Minimum', 'ต่ำสุด')],
            ['maxPrice', t('До', 'Maximum', 'สูงสุด')],
          ] as const).map(([key, label]) => <label key={key} className="space-y-1">
            <span className="block text-sm">{label}</span>
            <Input type="text" inputMode="decimal" value={filters[key]} onChange={event => update({ [key]: event.target.value })} aria-invalid={!valid || undefined} aria-describedby={!valid ? priceError : undefined} placeholder={key === 'maxPrice' ? t('Без ограничений', 'No maximum', 'ไม่จำกัด') : '0'} />
          </label>)}
        </div>
        {!valid && <p id={priceError} role="alert" className="mt-2 text-sm text-destructive">{t('Проверьте диапазон цены: укажите неотрицательные суммы, от меньшей к большей.', 'Enter non-negative amounts, with the minimum no greater than the maximum.', 'กรอกจำนวนเงินที่ไม่ติดลบ โดยค่าต่ำสุดต้องไม่เกินค่าสูงสุด')}</p>}
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
                  type="button"
                  aria-pressed={filters.minSeats === s.id}
                  onClick={() => update({ minSeats: filters.minSeats === s.id ? null : s.id })}
                  className={cn(
                    "min-h-11 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
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
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const contentId = useId();
  return (
    <div>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(!open)} className="mb-2 flex min-h-11 w-full items-center justify-between text-sm font-semibold">
          {title}<ChevronDown aria-hidden="true" className={cn("size-4 text-muted-foreground transition-transform", !open && "-rotate-90")} />
        </button>
      </h3>
      <div id={contentId} hidden={!open}>{children}</div>
    </div>
  );
}

/** Utility: apply filters to vehicle array */
export function applyTransportFilters(vehicles: Vehicle[], filters: TransportFilters): Vehicle[] {
  const { min, max, valid } = parseTransportPriceRange(filters);
  if (!valid) return [];
  return vehicles.filter(v => {
    if (min !== null || max !== null) {
      const price = comparableDailyPrice(v);
      if (price === null || (min !== null && price < min) || (max !== null && price > max)) return false;
    }

    if (filters.transmissions.length > 0 && !filters.transmissions.includes(v.transmission || '')) return false;
    if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(v.fuel_type || '')) return false;
    if (filters.brands.length > 0 && !filters.brands.includes(v.brand || '')) return false;
    if (filters.minSeats && (v.capacity || 0) < filters.minSeats) return false;
    if (filters.deliveryOnly && !v.delivery_available) return false;
    if (filters.withDriverOnly && !v.with_driver_available) return false;

    return true;
  });
}

export function parseTransportPriceRange(filters: Pick<TransportFilters, 'minPrice' | 'maxPrice'>) {
  const read = (value: string) => {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return null;
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return NaN;
    return Number(normalized);
  };
  const min = read(filters.minPrice);
  const max = read(filters.maxPrice);
  return { min, max, valid: (min === null || Number.isFinite(min)) && (max === null || Number.isFinite(max)) && (min === null || max === null || min <= max) };
}

export function dailyPrice(vehicle: Pick<Vehicle, 'price_per_day'>) {
  const price = vehicle.price_per_day;
  return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : null;
}

function comparableDailyPrice(vehicle: Pick<Vehicle, 'price_per_day' | 'currency'>) {
  return (vehicle.currency || 'THB').trim().toUpperCase() === 'THB' ? dailyPrice(vehicle) : null;
}

export function compareTransportDailyPrice(a: Vehicle, b: Vehicle, descending: boolean) {
  const left = comparableDailyPrice(a);
  const right = comparableDailyPrice(b);
  if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
  return descending ? right - left : left - right;
}
