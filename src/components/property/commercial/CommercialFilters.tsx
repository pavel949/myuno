/**
 * Advanced filters drawer for Commercial RE browse page.
 * Persisted in URL search params so links stay shareable.
 */
import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

export interface CommercialFiltersValue {
  minPrice?: string;
  maxPrice?: string;
  minAreaSqm?: string;
  maxAreaSqm?: string;
  minCapRate?: string;
  chanoteOnly?: boolean;
  withTenant?: boolean;
}

interface Props {
  value: CommercialFiltersValue;
  onChange: (next: CommercialFiltersValue) => void;
}

export function CommercialFilters({ value, onChange }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [draft, setDraft] = useState<CommercialFiltersValue>(value);
  const [open, setOpen] = useState(false);

  const activeCount =
    Object.values(value).filter((v) => v !== undefined && v !== '' && v !== false).length;

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
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {isRu ? 'Фильтры' : 'Filters'}
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isRu ? 'Фильтры коммерческой недвижимости' : 'Commercial filters'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {isRu ? 'Цена, ฿' : 'Price, ฿'}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={isRu ? 'От' : 'Min'}
                value={draft.minPrice ?? ''}
                onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
              />
              <Input
                type="number"
                placeholder={isRu ? 'До' : 'Max'}
                value={draft.maxPrice ?? ''}
                onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {isRu ? 'Площадь, м²' : 'Area, m²'}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={isRu ? 'От' : 'Min'}
                value={draft.minAreaSqm ?? ''}
                onChange={(e) => setDraft({ ...draft, minAreaSqm: e.target.value })}
              />
              <Input
                type="number"
                placeholder={isRu ? 'До' : 'Max'}
                value={draft.maxAreaSqm ?? ''}
                onChange={(e) => setDraft({ ...draft, maxAreaSqm: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {isRu ? 'Минимальный Cap rate, %' : 'Min Cap rate, %'}
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="6.0"
              value={draft.minCapRate ?? ''}
              onChange={(e) => setDraft({ ...draft, minCapRate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium">
                {isRu ? 'Только с Chanote' : 'Chanote only'}
              </span>
              <input
                type="checkbox"
                checked={!!draft.chanoteOnly}
                onChange={(e) => setDraft({ ...draft, chanoteOnly: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium">
                {isRu ? 'С действующим арендатором' : 'With current tenant'}
              </span>
              <input
                type="checkbox"
                checked={!!draft.withTenant}
                onChange={(e) => setDraft({ ...draft, withTenant: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 sm:flex-row">
          <Button variant="outline" onClick={reset} className="flex-1 gap-1.5">
            <X className="w-3.5 h-3.5" />
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
