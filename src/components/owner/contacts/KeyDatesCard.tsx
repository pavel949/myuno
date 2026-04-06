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
      setNewLabel('');
      setNewDate('');
      setDialogOpen(false);
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-primary" />
          {isRu ? 'Ключевые даты' : 'Key Dates'}
        </h4>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Добавить дату' : 'Add Key Date'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{isRu ? 'Название' : 'Label'}</Label>
                <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder={isRu ? 'День рождения' : 'Birthday'} />
              </div>
              <div>
                <Label>{isRu ? 'Дата' : 'Date'}</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <Button onClick={handleAdd} disabled={updateContact.isPending} className="w-full">
                {isRu ? 'Добавить' : 'Add'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {keyDates.length === 0 ? (
        <p className="text-xs text-muted-foreground">{isRu ? 'Нет дат' : 'No dates'}</p>
      ) : (
        <div className="space-y-1">
          {keyDates.map((entry, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group">
              <div>
                <p className="text-xs font-medium">{entry.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(entry.date), 'dd MMM yyyy', { locale })}
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
