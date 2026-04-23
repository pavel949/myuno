import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CalendarDays, Plus, Pencil, Trash2 } from 'lucide-react';
import { useUpdateContact } from '@/hooks/useCrmContacts';
import type { KeyDateEntry } from '@/types/contact';
import { format, isPast } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { toast } from 'sonner';
interface Props {
  contactId: string;
  keyDates: KeyDateEntry[];
}

export function KeyDatesCard({ contactId, keyDates = [] }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
const updateContact = useUpdateContact();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDate, setNewDate] = useState('');

  const handleAdd = async () => {
    if (!newLabel.trim() || !newDate) return;
    const entry: KeyDateEntry = { label: newLabel.trim(), date: newDate };
    const updated = [...keyDates, entry];
    try {
      await updateContact.mutateAsync({
        id: contactId,
        key_dates: updated,
      } as { id: string; key_dates: KeyDateEntry[] });
      toast(isRu ? 'Дата добавлена' : 'Date added');
      setDialogOpen(false);
      setNewLabel('');
      setNewDate('');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleRemove = async (index: number) => {
    const updated = keyDates.filter((_, i) => i !== index);
    try {
      await updateContact.mutateAsync({
        id: contactId,
        key_dates: updated,
      } as { id: string; key_dates: KeyDateEntry[] });
      toast(isRu ? 'Дата удалена' : 'Date removed');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  return (
    <div className="rounded-none border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {isRu ? 'Важные даты' : 'Key dates'}
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {isRu ? 'Добавить' : 'Add'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Добавить дату' : 'Add key date'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>{isRu ? 'Название' : 'Label'}</Label>
                <Input
                  placeholder={isRu ? 'Напр. Начало аренды, Виза истекает' : 'e.g. Lease start, Visa expiry'}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <div>
                <Label>{isRu ? 'Дата' : 'Date'}</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <Button onClick={handleAdd} disabled={!newLabel.trim() || !newDate || updateContact.isPending} className="w-full">
                {isRu ? 'Добавить' : 'Add'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {keyDates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <CalendarDays className="h-16 w-16 mx-auto opacity-30 mb-2" />
          {isRu ? 'Нет важных дат' : 'No key dates'}
        </div>
      ) : (
        <div className="space-y-2">
          {keyDates.map((entry, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center justify-between p-3 rounded-none border',
                isPast(new Date(entry.date)) ? 'bg-muted/30' : 'bg-background/50'
              )}
            >
              <div>
                <p className="text-sm font-medium">{entry.label}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(entry.date), 'd MMMM yyyy', { locale })}
                  {isPast(new Date(entry.date)) && (
                    <span className="ml-1 text-muted-foreground/70">({isRu ? 'прошло' : 'past'})</span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(i)}
                disabled={updateContact.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
