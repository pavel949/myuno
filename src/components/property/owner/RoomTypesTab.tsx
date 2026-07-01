/**
 * RoomTypesTab — owner CRUD for a hotel's bookable room types (Part 5B).
 *
 * Mounted as an extra tab in the owner PropertyEditor (hotel properties). Reads
 * via useRoomTypes and writes via useSaveRoomType / useDeleteRoomType. Until the
 * room_types table ships the list is empty and saving surfaces an error toast —
 * there is simply nothing to manage yet. Seasonal per-room rates are a follow-up
 * (2b); this tab covers the room definition + its base nightly rate (2a).
 */
import React, { useState } from 'react';
import { Plus, Pencil, Trash2, BedDouble } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomTypes, type RoomType } from '@/hooks/useRoomTypes';
import { useSaveRoomType, useDeleteRoomType } from '@/hooks/useRoomTypeMutations';

interface RoomTypesTabProps {
  propertyId: string;
}

interface RoomForm {
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  max_occupancy: number;
  base_price_per_night: string;
  total_units: number;
  refundable: boolean;
  is_bookable: boolean;
  is_active: boolean;
}

const emptyForm: RoomForm = {
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  max_occupancy: 2,
  base_price_per_night: '',
  total_units: 1,
  refundable: true,
  is_bookable: true,
  is_active: true,
};

function roomToForm(room: RoomType): RoomForm {
  return {
    name_en: room.name_en,
    name_ru: room.name_ru ?? '',
    description_en: room.description_en ?? '',
    description_ru: room.description_ru ?? '',
    max_occupancy: room.max_occupancy,
    base_price_per_night: room.base_price_per_night != null ? String(room.base_price_per_night) : '',
    total_units: room.total_units,
    refundable: room.refundable ?? true,
    is_bookable: room.is_bookable,
    is_active: room.is_active,
  };
}

export function RoomTypesTab({ propertyId }: RoomTypesTabProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const tt = (en: string, ru: string) => (isRu ? ru : en);

  const { data: roomTypes = [], isLoading } = useRoomTypes(propertyId);
  const saveMutation = useSaveRoomType();
  const deleteMutation = useDeleteRoomType();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<RoomType | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (room: RoomType) => {
    setEditingId(room.id);
    setForm(roomToForm(room));
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.name_en.trim()) {
      toast.error(tt('Room name (EN) is required', 'Укажите название номера (EN)'));
      return;
    }
    const price = form.base_price_per_night.trim();
    saveMutation.mutate(
      {
        id: editingId ?? undefined,
        property_id: propertyId,
        name_en: form.name_en.trim(),
        name_ru: form.name_ru.trim() || null,
        description_en: form.description_en.trim() || null,
        description_ru: form.description_ru.trim() || null,
        max_occupancy: Math.max(1, form.max_occupancy),
        base_price_per_night: price ? Number(price) : null,
        total_units: Math.max(1, form.total_units),
        refundable: form.refundable,
        is_bookable: form.is_bookable,
        is_active: form.is_active,
      },
      {
        onSuccess: () => {
          toast.success(editingId ? tt('Room updated', 'Номер обновлён') : tt('Room added', 'Номер добавлен'));
          setSheetOpen(false);
        },
        onError: (e: Error) => toast.error(tt('Save failed: ', 'Ошибка сохранения: ') + e.message),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { id: deleteTarget.id, propertyId },
      {
        onSuccess: () => {
          toast.success(tt('Room deleted', 'Номер удалён'));
          setDeleteTarget(null);
        },
        onError: (e: Error) => toast.error(tt('Delete failed: ', 'Ошибка удаления: ') + e.message),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">{tt('Room types', 'Типы номеров')}</h3>
          <p className="text-xs text-muted-foreground">
            {tt(
              'Define bookable room categories and their nightly rate.',
              'Категории номеров и цена за ночь для бронирования.',
            )}
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {tt('Add', 'Добавить')}
        </Button>
      </div>

      {isLoading ? (
        <div className="h-16 animate-pulse rounded-none bg-muted" />
      ) : roomTypes.length === 0 ? (
        <div className="rounded-none border border-dashed border-border/60 p-8 text-center">
          <BedDouble className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            {tt('No room types yet.', 'Пока нет номеров.')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {roomTypes.map((room) => (
            <li
              key={room.id}
              className="flex items-center justify-between gap-3 rounded-none border border-border/60 bg-card p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{isRu ? room.name_ru || room.name_en : room.name_en}</p>
                <p className="text-xs text-muted-foreground">
                  {tt(`Up to ${room.max_occupancy} guests`, `До ${room.max_occupancy} гостей`)}
                  {' · '}
                  {room.total_units} {tt('unit(s)', 'шт.')}
                  {room.base_price_per_night != null && ` · ${room.base_price_per_night} ${room.currency ?? 'THB'}/${tt('night', 'ночь')}`}
                  {!room.is_bookable && ` · ${tt('hidden', 'скрыт')}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(room)} aria-label={tt('Edit', 'Изменить')}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleteTarget(room)}
                  aria-label={tt('Delete', 'Удалить')}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? tt('Edit room type', 'Изменить номер') : tt('New room type', 'Новый номер')}</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rt-name-en">{tt('Name (EN)', 'Название (EN)')}</Label>
              <Input
                id="rt-name-en"
                value={form.name_en}
                onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                placeholder="Deluxe Sea View"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rt-name-ru">{tt('Name (RU)', 'Название (RU)')}</Label>
              <Input
                id="rt-name-ru"
                value={form.name_ru}
                onChange={(e) => setForm((f) => ({ ...f, name_ru: e.target.value }))}
                placeholder="Делюкс с видом на море"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rt-occ">{tt('Max guests', 'Макс. гостей')}</Label>
                <Input
                  id="rt-occ"
                  type="number"
                  min={1}
                  value={form.max_occupancy}
                  onChange={(e) => setForm((f) => ({ ...f, max_occupancy: Number(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rt-units">{tt('Units', 'Кол-во')}</Label>
                <Input
                  id="rt-units"
                  type="number"
                  min={1}
                  value={form.total_units}
                  onChange={(e) => setForm((f) => ({ ...f, total_units: Number(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rt-price">{tt('Base price / night (THB)', 'Цена за ночь (THB)')}</Label>
              <Input
                id="rt-price"
                type="number"
                min={0}
                value={form.base_price_per_night}
                onChange={(e) => setForm((f) => ({ ...f, base_price_per_night: e.target.value }))}
                placeholder="3500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rt-desc-en">{tt('Description (EN)', 'Описание (EN)')}</Label>
              <Textarea
                id="rt-desc-en"
                rows={2}
                value={form.description_en}
                onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rt-desc-ru">{tt('Description (RU)', 'Описание (RU)')}</Label>
              <Textarea
                id="rt-desc-ru"
                rows={2}
                value={form.description_ru}
                onChange={(e) => setForm((f) => ({ ...f, description_ru: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="rt-refundable">{tt('Refundable', 'Возврат средств')}</Label>
              <Switch
                id="rt-refundable"
                checked={form.refundable}
                onCheckedChange={(v) => setForm((f) => ({ ...f, refundable: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="rt-bookable">{tt('Bookable (visible to guests)', 'Доступен для брони')}</Label>
              <Switch
                id="rt-bookable"
                checked={form.is_bookable}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_bookable: v }))}
              />
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              {tt('Cancel', 'Отмена')}
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {tt('Save', 'Сохранить')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt('Delete room type?', 'Удалить номер?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt(
                'This removes the room type and its rates. This cannot be undone.',
                'Номер и его тарифы будут удалены безвозвратно.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt('Cancel', 'Отмена')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {tt('Delete', 'Удалить')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
