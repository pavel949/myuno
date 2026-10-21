import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyStayRestriction, useSaveStayRestriction, type StayRestriction } from '@/hooks/usePropertyStayRestrictions';
import type { RoomCategory } from '@/hooks/useRoomCategories';
import { bangkokTodayISO } from '@/lib/hotelDates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function StayRestrictionsEditor({ propertyId, categories }: { propertyId: string; categories: RoomCategory[] }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string) => language === 'ru' ? ru : en;
  const [scope, setScope] = useState('all');
  const [date, setDate] = useState(bangkokTodayISO);
  const categoryId = scope === 'all' ? null : scope;
  const { data, isLoading, error, refetch } = usePropertyStayRestriction(propertyId, categoryId, date);
  return (
    <section className="space-y-4 border-t border-border pt-6">
      <h2 className="font-display text-xl">{t('Правила по датам', 'Date-specific rules')}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="restriction-scope">{t('Применить к', 'Applies to')}</Label>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger id="restriction-scope"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('Всему объекту', 'Whole property')}</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{(language === 'ru' && c.name_ru) || c.name_en}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="restriction-date">{t('Дата', 'Date')}</Label>
          <Input id="restriction-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      {isLoading ? <Skeleton className="h-40 w-full" /> : error ? (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{t('Не удалось загрузить правила', 'Could not load rules')}</p>
          <Button variant="outline" onClick={() => refetch()}>{t('Повторить', 'Retry')}</Button>
        </div>
      ) : date ? (
        <RestrictionForm key={`${propertyId}:${scope}:${date}`} row={data ?? null} propertyId={propertyId} categoryId={categoryId} date={date} />
      ) : null}
    </section>
  );
}

function RestrictionForm({ row, propertyId, categoryId, date }: {
  row: StayRestriction | null; propertyId: string; categoryId: string | null; date: string;
}) {
  const { language } = useLanguage();
  const t = (ru: string, en: string) => language === 'ru' ? ru : en;
  const save = useSaveStayRestriction();
  const [price, setPrice] = useState(row?.price_override?.toString() ?? '');
  const [minStay, setMinStay] = useState(row?.min_stay_nights?.toString() ?? '');
  const [arrival, setArrival] = useState(row?.closed_to_arrival ?? false);
  const [departure, setDeparture] = useState(row?.closed_to_departure ?? false);
  const [stopSell, setStopSell] = useState(row?.stop_sell ?? false);
  const [savedId, setSavedId] = useState(row?.id);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const priceValue = price.trim() ? Number(price) : null;
    const stayValue = minStay.trim() ? Number(minStay) : null;
    if ((priceValue !== null && (!Number.isFinite(priceValue) || priceValue <= 0)) ||
        (stayValue !== null && (!Number.isInteger(stayValue) || stayValue < 1))) {
      toast.error(t('Укажите положительную цену и целое число ночей', 'Enter a positive price and a whole number of nights'));
      return;
    }
    try {
      const id = await save.mutateAsync({ id: savedId, property_id: propertyId, category_id: categoryId, date,
        price_override: priceValue, min_stay_nights: stayValue,
        closed_to_arrival: arrival, closed_to_departure: departure, stop_sell: stopSell });
      setSavedId(id);
      toast.success(t('Правила сохранены', 'Rules saved'));
    } catch {
      toast.error(t('Не удалось сохранить правила. Введённые значения сохранены в форме.', 'Could not save rules. Your entries remain in the form.'));
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={save.isPending} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="restriction-price">{t('Цена за ночь, ฿', 'Nightly price, ฿')}</Label>
            <Input id="restriction-price" type="number" min="0.01" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder={t('По тарифу', 'Use configured rate')} />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="restriction-min-stay">{t('Минимум ночей', 'Minimum nights')}</Label>
            <Input id="restriction-min-stay" type="number" min="1" step="1" value={minStay} onChange={e => setMinStay(e.target.value)} placeholder={t('По тарифу', 'Use configured rate')} />
          </div>
        </div>
        {[
          { id: 'arrival', label: t('Заезд запрещён', 'No arrivals'), value: arrival, set: setArrival },
          { id: 'departure', label: t('Выезд запрещён', 'No departures'), value: departure, set: setDeparture },
          { id: 'stop-sell', label: t('Продажи закрыты', 'Sales closed'), value: stopSell, set: setStopSell },
        ].map(item => <div key={item.id} className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2">
          <Label htmlFor={`restriction-${item.id}`}>{item.label}</Label>
          <Switch id={`restriction-${item.id}`} checked={item.value} onCheckedChange={item.set} />
        </div>)}
        <Button type="submit" className="gap-2">
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t('Сохранить правила', 'Save rules')}
        </Button>
      </fieldset>
    </form>
  );
}