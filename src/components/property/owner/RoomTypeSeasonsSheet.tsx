/**
 * RoomTypeSeasonsSheet — owner manager for a room type's seasonal rates
 * (Phase 2b / Part 5B). Lists room_type_rate_seasons for one room and lets the
 * owner add / edit / delete them; the same rows feed the guest pricing engine.
 * Dormant until the table ships (list empty, Save surfaces a toast).
 */
import React, { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomTypeRateSeasons, type RoomTypeRateSeason } from '@/hooks/useRoomTypes';
import { useSaveRoomTypeSeason, useDeleteRoomTypeSeason } from '@/hooks/useRoomTypeSeasonMutations';

interface RoomTypeSeasonsSheetProps {
  roomTypeId: string;
  roomName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SeasonForm {
  name_en: string;
  start_date: string;
  end_date: string;
  nightly_rate: string;
  min_stay_nights: number;
}

const emptyForm: SeasonForm = { name_en: '', start_date: '', end_date: '', nightly_rate: '', min_stay_nights: 1 };

function seasonToForm(s: RoomTypeRateSeason): SeasonForm {
  return {
    name_en: s.name_en,
    start_date: s.start_date,
    end_date: s.end_date,
    nightly_rate: String(s.nightly_rate),
    min_stay_nights: s.min_stay_nights ?? 1,
  };
}

export function RoomTypeSeasonsSheet({ roomTypeId, roomName, open, onOpenChange }: RoomTypeSeasonsSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const tt = (en: string, ru: string) => (isRu ? ru : en);

  const { data: seasons = [], isLoading } = useRoomTypeRateSeasons(roomTypeId);
  const saveMutation = useSaveRoomTypeSeason();
  const deleteMutation = useDeleteRoomTypeSeason();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SeasonForm>(emptyForm);

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = () => {
    if (!form.name_en.trim() || !form.start_date || !form.end_date) {
      toast.error(tt('Name and dates are required', 'Укажите название и даты'));
      return;
    }
    if (form.end_date <= form.start_date) {
      toast.error(tt('End date must be after start date', 'Дата окончания должна быть позже начала'));
      return;
    }
    const rate = Number(form.nightly_rate);
    if (!rate || rate <= 0) {
      toast.error(tt('Enter a nightly rate', 'Укажите цену за ночь'));
      return;
    }
    saveMutation.mutate(
      {
        id: editingId ?? undefined,
        room_type_id: roomTypeId,
        name_en: form.name_en.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        nightly_rate: rate,
        min_stay_nights: Math.max(1, form.min_stay_nights),
      },
      {
        onSuccess: () => {
          toast.success(editingId ? tt('Season updated', 'Сезон обновлён') : tt('Season added', 'Сезон добавлен'));
          reset();
        },
        onError: (e: Error) => toast.error(tt('Save failed: ', 'Ошибка сохранения: ') + e.message),
      },
    );
  };

  const handleDelete = (s: RoomTypeRateSeason) => {
    deleteMutation.mutate(
      { id: s.id, roomTypeId },
      {
        onSuccess: () => toast.success(tt('Season deleted', 'Сезон удалён')),
        onError: (e: Error) => toast.error(tt('Delete failed: ', 'Ошибка удаления: ') + e.message),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{tt('Seasonal rates', 'Сезонные тарифы')} — {roomName}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Existing seasons */}
          {isLoading ? (
            <div className="h-12 animate-pulse rounded-none bg-muted" />
          ) : seasons.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tt('No seasons yet.', 'Пока нет сезонов.')}</p>
          ) : (
            <ul className="space-y-2">
              {seasons.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 rounded-none border border-border/60 bg-card p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name_en}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.start_date} → {s.end_date} · {s.nightly_rate} {s.currency ?? 'THB'}/{tt('night', 'ночь')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingId(s.id); setForm(seasonToForm(s)); }} aria-label={tt('Edit', 'Изменить')}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(s)} aria-label={tt('Delete', 'Удалить')}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add / edit form */}
          <div className="space-y-3 rounded-none border border-border/60 p-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {editingId ? tt('Edit season', 'Изменить сезон') : tt('Add season', 'Добавить сезон')}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="rs-name">{tt('Name', 'Название')}</Label>
              <Input id="rs-name" value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} placeholder="High season" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rs-start">{tt('Start', 'Начало')}</Label>
                <Input id="rs-start" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rs-end">{tt('End', 'Конец')}</Label>
                <Input id="rs-end" type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rs-rate">{tt('Rate / night', 'Цена / ночь')}</Label>
                <Input id="rs-rate" type="number" min={0} value={form.nightly_rate} onChange={(e) => setForm((f) => ({ ...f, nightly_rate: e.target.value }))} placeholder="5000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rs-min">{tt('Min nights', 'Мин. ночей')}</Label>
                <Input id="rs-min" type="number" min={1} value={form.min_stay_nights} onChange={(e) => setForm((f) => ({ ...f, min_stay_nights: Number(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="flex gap-2">
              {editingId && (
                <Button variant="outline" size="sm" onClick={reset}>
                  {tt('Cancel', 'Отмена')}
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5">
                <Plus className="h-4 w-4" />
                {editingId ? tt('Save', 'Сохранить') : tt('Add', 'Добавить')}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
