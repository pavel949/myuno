/**
 * Resort / hotel structure: room categories, rate plans and room assignment.
 * Rooms are ordinary `properties` rows linked by parent_property_id + room_category_id.
 */
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import {
  useRoomCategories, useSaveCategory, useSavePlan, useAssignRoomCategory,
  type RoomCategory,
} from '@/hooks/useRoomCategories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const MEALS = ['room_only', 'breakfast', 'half_board', 'full_board', 'all_inclusive'] as const;
const MEAL_LABEL: Record<string, { ru: string; en: string }> = {
  room_only: { ru: 'Без питания', en: 'Room only' },
  breakfast: { ru: 'Завтрак', en: 'Breakfast' },
  half_board: { ru: 'Полупансион', en: 'Half board' },
  full_board: { ru: 'Полный пансион', en: 'Full board' },
  all_inclusive: { ru: 'Всё включено', en: 'All inclusive' },
};

export default function PropertyStructurePage() {
  const { language } = useLanguage();
  const ru = language === 'ru';
  const t = (r: string, e: string) => (ru ? r : e);
  const { allProperties, isLoading } = useMyProperties() as ReturnType<typeof useMyProperties> & { isLoading?: boolean };
  const [parentId, setParentId] = useState<string>('');
  const { data, isLoading: loadingCats, error } = useRoomCategories(parentId || undefined);
  const saveCategory = useSaveCategory();
  const assign = useAssignRoomCategory();

  const [newCat, setNewCat] = useState({ name_ru: '', name_en: '', base: '', guests: '2', minStay: '1' });

  const addCategory = async () => {
    const base = Number(newCat.base);
    if (!newCat.name_en.trim() || !(base > 0)) {
      toast.error(t('Укажите название на английском и цену за ночь больше нуля', 'Enter an English name and a nightly price above zero'));
      return;
    }
    try {
      await saveCategory.mutateAsync({
        property_id: parentId, name_en: newCat.name_en.trim(), name_ru: newCat.name_ru.trim() || null,
        base_price_per_night: base, max_guests: Math.max(1, Number(newCat.guests) || 1),
        min_stay_nights: Math.max(1, Number(newCat.minStay) || 1),
        sort_order: data?.categories.length ?? 0,
      });
      setNewCat({ name_ru: '', name_en: '', base: '', guests: '2', minStay: '1' });
      toast.success(t('Категория добавлена', 'Category added'));
    } catch (e) {
      toast.error(t('Не удалось сохранить категорию', 'Could not save the category'), { description: (e as Error).message });
    }
  };

  const otherProps = allProperties.filter((p) => p.property_id !== parentId);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <header className="space-y-1">
        <h1 className="font-serif text-2xl text-foreground">{t('Структура объекта', 'Property structure')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('Для резортов и гостиниц: категории номеров, тарифы и номера в каждой категории. Цены, сезоны и ограничения задаются на категорию.',
            'For resorts and hotels: room categories, rate plans and the rooms in each category. Prices, seasons and restrictions are set per category.')}
        </p>
      </header>

      <div className="space-y-2">
        <Label>{t('Объект', 'Property')}</Label>
        {isLoading ? <Skeleton className="h-10 w-full" /> : (
          <Select value={parentId} onValueChange={setParentId}>
            <SelectTrigger><SelectValue placeholder={t('Выберите резорт или гостиницу', 'Choose a resort or hotel')} /></SelectTrigger>
            <SelectContent>
              {allProperties.map((p) => (
                <SelectItem key={p.property_id} value={p.property_id}>{(ru && p.title_ru) || p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {parentId && (
        <>
          {error && <p className="text-sm text-destructive">{t('Не удалось загрузить категории', 'Could not load categories')}</p>}
          {loadingCats ? <Skeleton className="h-40 w-full" /> : (
            <div className="space-y-4">
              {data?.categories.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('Категорий пока нет. Без категорий объект бронируется целиком, как сейчас.', 'No categories yet. Without categories the property is booked as a whole, as now.')}</p>
              )}
              {data?.categories.map((c) => (
                <CategoryCard key={c.id} category={c} t={t} ru={ru}
                  plans={data.plans.filter((p) => p.category_id === c.id)}
                  rooms={data.rooms.filter((r) => r.room_category_id === c.id)} />
              ))}

              <Card><CardContent className="space-y-3 p-4">
                <h2 className="font-medium text-foreground">{t('Новая категория', 'New category')}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder={t('Название (рус.)', 'Name (RU)')} value={newCat.name_ru} onChange={(e) => setNewCat({ ...newCat, name_ru: e.target.value })} />
                  <Input placeholder={t('Название (англ.)', 'Name (EN)')} value={newCat.name_en} onChange={(e) => setNewCat({ ...newCat, name_en: e.target.value })} />
                  <Input type="number" min={1} placeholder={t('Цена за ночь, ฿', 'Price per night, ฿')} value={newCat.base} onChange={(e) => setNewCat({ ...newCat, base: e.target.value })} />
                  <Input type="number" min={1} placeholder={t('Гостей не более', 'Max guests')} value={newCat.guests} onChange={(e) => setNewCat({ ...newCat, guests: e.target.value })} />
                  <Input type="number" min={1} placeholder={t('Минимум ночей', 'Minimum nights')} value={newCat.minStay} onChange={(e) => setNewCat({ ...newCat, minStay: e.target.value })} />
                </div>
                <Button onClick={addCategory} disabled={saveCategory.isPending}>{t('Добавить категорию', 'Add category')}</Button>
              </CardContent></Card>

              {(data?.categories.length ?? 0) > 0 && (
                <Card><CardContent className="space-y-3 p-4">
                  <h2 className="font-medium text-foreground">{t('Номера', 'Rooms')}</h2>
                  <p className="text-sm text-muted-foreground">{t('Каждый номер — отдельный объект со своим календарём и уборками. Укажите, к какой категории он относится.', 'Each room is a separate listing with its own calendar and cleaning. Choose its category.')}</p>
                  {otherProps.map((p) => {
                    const current = data?.rooms.find((r) => r.id === p.property_id)?.room_category_id ?? 'none';
                    return (
                      <div key={p.property_id} className="flex items-center justify-between gap-3 border-b border-border py-2">
                        <span className="text-sm text-foreground">{(ru && p.title_ru) || p.title}</span>
                        <Select value={current} onValueChange={async (v) => {
                          try {
                            await assign.mutateAsync({ roomId: p.property_id, parentId, categoryId: v === 'none' ? null : v });
                          } catch (e) { toast.error(t('Не удалось сохранить', 'Could not save'), { description: (e as Error).message }); }
                        }}>
                          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('Не входит в объект', 'Not part of this property')}</SelectItem>
                            {data?.categories.map((c) => <SelectItem key={c.id} value={c.id}>{(ru && c.name_ru) || c.name_en}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </CardContent></Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryCard({ category, plans, rooms, t, ru }: {
  category: RoomCategory;
  plans: { id: string; name_en: string; name_ru: string | null; adjustment_type: string; adjustment_value: number; meal_plan: string; is_refundable: boolean; is_active: boolean }[];
  rooms: { id: string }[];
  t: (r: string, e: string) => string; ru: boolean;
}) {
  const savePlan = useSavePlan();
  const saveCategory = useSaveCategory();
  const [plan, setPlan] = useState({ name_ru: '', name_en: '', type: 'percent', value: '0', meal: 'room_only', refundable: true, cancelDays: '3', minStay: '' });

  const addPlan = async () => {
    const value = Number(plan.value);
    if (!plan.name_en.trim() || !Number.isFinite(value) || (plan.type === 'percent' && (value <= -100 || value > 500))) {
      toast.error(t('Укажите название тарифа и допустимую поправку', 'Enter a rate name and a valid adjustment'));
      return;
    }
    try {
      await savePlan.mutateAsync({
        category_id: category.id, name_en: plan.name_en.trim(), name_ru: plan.name_ru.trim() || null,
        adjustment_type: plan.type, adjustment_value: value, meal_plan: plan.meal,
        is_refundable: plan.refundable, free_cancellation_days: plan.refundable ? Number(plan.cancelDays) || 0 : null,
        min_stay_nights: plan.minStay ? Math.max(1, Number(plan.minStay)) : null,
        is_default: plans.length === 0,
      });
      setPlan({ ...plan, name_ru: '', name_en: '', value: '0' });
      toast.success(t('Тариф добавлен', 'Rate plan added'));
    } catch (e) {
      toast.error(t('Не удалось сохранить тариф', 'Could not save the rate plan'), { description: (e as Error).message });
    }
  };

  return (
    <Card><CardContent className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-foreground">{(ru && category.name_ru) || category.name_en}</h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{Number(category.base_price_per_night).toLocaleString()} ฿</span> {t('за ночь', 'per night')} · {t('гостей до', 'up to')} {category.max_guests} · {t('от', 'from')} {category.min_stay_nights} {t('ноч.', 'nights')} · {t('номеров', 'rooms')}: {rooms.length}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Label htmlFor={`act-${category.id}`}>{t('Продаётся', 'On sale')}</Label>
          <Switch id={`act-${category.id}`} checked={category.is_active}
            onCheckedChange={(v) => saveCategory.mutate({ id: category.id, property_id: category.property_id, name_en: category.name_en, base_price_per_night: category.base_price_per_night, is_active: v })} />
        </div>
      </div>

      <div className="space-y-1">
        {plans.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-foreground">{(ru && p.name_ru) || p.name_en}</span>
            <Badge variant="outline">{p.adjustment_type === 'percent' ? `${p.adjustment_value > 0 ? '+' : ''}${p.adjustment_value}%` : `${p.adjustment_value > 0 ? '+' : ''}${p.adjustment_value} ฿/${t('ночь', 'night')}`}</Badge>
            <Badge variant="outline">{MEAL_LABEL[p.meal_plan]?.[ru ? 'ru' : 'en']}</Badge>
            <Badge variant="outline">{p.is_refundable ? t('Возвратный', 'Refundable') : t('Невозвратный', 'Non-refundable')}</Badge>
          </div>
        ))}
        {plans.length === 0 && <p className="text-sm text-muted-foreground">{t('Добавьте хотя бы один тариф — без него категорию нельзя забронировать.', 'Add at least one rate plan — without it the category cannot be booked.')}</p>}
      </div>

      <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-4">
        <Input placeholder={t('Тариф (рус.)', 'Rate (RU)')} value={plan.name_ru} onChange={(e) => setPlan({ ...plan, name_ru: e.target.value })} />
        <Input placeholder={t('Тариф (англ.)', 'Rate (EN)')} value={plan.name_en} onChange={(e) => setPlan({ ...plan, name_en: e.target.value })} />
        <Select value={plan.type} onValueChange={(v) => setPlan({ ...plan, type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">{t('Поправка, %', 'Adjustment, %')}</SelectItem>
            <SelectItem value="fixed_per_night">{t('Доплата за ночь, ฿', 'Per night, ฿')}</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" value={plan.value} onChange={(e) => setPlan({ ...plan, value: e.target.value })} />
        <Select value={plan.meal} onValueChange={(v) => setPlan({ ...plan, meal: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{MEALS.map((m) => <SelectItem key={m} value={m}>{MEAL_LABEL[m][ru ? 'ru' : 'en']}</SelectItem>)}</SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Switch checked={plan.refundable} onCheckedChange={(v) => setPlan({ ...plan, refundable: v })} />{t('Возвратный', 'Refundable')}
        </label>
        {plan.refundable && <Input type="number" min={0} placeholder={t('Бесплатная отмена, дней', 'Free cancellation, days')} value={plan.cancelDays} onChange={(e) => setPlan({ ...plan, cancelDays: e.target.value })} />}
        <Input type="number" min={1} placeholder={t('Минимум ночей', 'Min nights')} value={plan.minStay} onChange={(e) => setPlan({ ...plan, minStay: e.target.value })} />
        <Button variant="outline" onClick={addPlan} disabled={savePlan.isPending}>{t('Добавить тариф', 'Add rate plan')}</Button>
      </div>
    </CardContent></Card>
  );
}
