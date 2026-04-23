/**
 * Hotel-specific advanced filters drawer.
 */
import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { HOTEL_LICENSE_TYPES, HOTEL_MANAGEMENT_STATUSES } from '@/lib/real-estate/commercialTaxonomy';

export interface HotelFiltersValue {
  minKeys?: string;
  maxKeys?: string;
  minStars?: string;
  licenseType?: string;
  managementStatus?: string;
  minOccupancy?: string;
}

interface Props {
  value: HotelFiltersValue;
  onChange: (next: HotelFiltersValue) => void;
}

export function HotelFiltersSheet({ value, onChange }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [draft, setDraft] = useState<HotelFiltersValue>(value);
  const [open, setOpen] = useState(false);

  const activeCount = Object.values(value).filter((v) => v !== undefined && v !== '').length;

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const reset = () => {
    setDraft({});
    onChange({});
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
          {isRu ? 'Фильтры' : 'Filters'}
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-none max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isRu ? 'Параметры отеля' : 'Hotel filters'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Keys range */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {isRu ? 'Количество ключей' : 'Number of keys'}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                placeholder={isRu ? 'От' : 'Min'}
                value={draft.minKeys ?? ''}
                onChange={(e) => setDraft({ ...draft, minKeys: e.target.value || undefined })}
              />
              <Input
                type="number"
                min={0}
                placeholder={isRu ? 'До' : 'Max'}
                value={draft.maxKeys ?? ''}
                onChange={(e) => setDraft({ ...draft, maxKeys: e.target.value || undefined })}
              />
            </div>
          </div>

          {/* Min stars */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {isRu ? 'Звёздность от' : 'Min stars'}
            </Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => {
                const sel = draft.minStars === String(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraft({ ...draft, minStars: sel ? undefined : String(s) })}
                    className={`flex-1 px-2 py-2 rounded-none border text-sm font-semibold transition-colors ${
                      sel
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {s}★
                  </button>
                );
              })}
            </div>
          </div>

          {/* License type */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {isRu ? 'Лицензия' : 'License'}
            </Label>
            <select
              value={draft.licenseType ?? ''}
              onChange={(e) => setDraft({ ...draft, licenseType: e.target.value || undefined })}
              className="flex h-10 w-full rounded-none border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">{isRu ? 'Любая' : 'Any'}</option>
              {HOTEL_LICENSE_TYPES.map((l) => (
                <option key={l.id} value={l.id}>
                  {isRu ? l.labelRu : l.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Management status */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {isRu ? 'Статус управления' : 'Management status'}
            </Label>
            <select
              value={draft.managementStatus ?? ''}
              onChange={(e) => setDraft({ ...draft, managementStatus: e.target.value || undefined })}
              className="flex h-10 w-full rounded-none border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">{isRu ? 'Любой' : 'Any'}</option>
              {HOTEL_MANAGEMENT_STATUSES.map((m) => (
                <option key={m.id} value={m.id}>
                  {isRu ? m.labelRu : m.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Min occupancy */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {isRu ? 'Загрузка от, %' : 'Min occupancy, %'}
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="65"
              value={draft.minOccupancy ?? ''}
              onChange={(e) => setDraft({ ...draft, minOccupancy: e.target.value || undefined })}
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" onClick={reset} className="flex-1">
            {isRu ? 'Сбросить' : 'Reset'}
          </Button>
          <Button onClick={apply} className="flex-1">
            {isRu ? 'Применить' : 'Apply'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
