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
import { Bell, Plus, Trash2, Check } from 'lucide-react';
import {
  useContactReminders,
  useCreateContactReminder,
  useDismissContactReminder,
  useDeleteContactReminder,
} from '@/hooks/useCrmReminders';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { toast } from 'sonner';
interface Props {
  contactId: string;
  companyId: string;
}

export function RemindersList({ contactId, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
const { user } = useAuth();

  const { data: reminders = [], isLoading } = useContactReminders(contactId);
  const createMutation = useCreateContactReminder();
  const dismissMutation = useDismissContactReminder();
  const deleteMutation = useDeleteContactReminder();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [reminderAt, setReminderAt] = useState('');
  const [note, setNote] = useState('');

  const handleCreate = async () => {
    if (!reminderAt) return;
    try {
      await createMutation.mutateAsync({
        contactId,
        companyId,
        reminderAt: new Date(reminderAt).toISOString(),
        note: note.trim() || undefined,
        createdBy: user?.id,
      });
      toast(isRu ? 'Напоминание создано' : 'Reminder created');
      setDialogOpen(false);
      setReminderAt('');
      setNote('');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissMutation.mutateAsync({ id, contactId });
      toast(isRu ? 'Выполнено' : 'Done');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, contactId });
      toast(isRu ? 'Удалено' : 'Deleted');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  return (
    <div className="rounded-none border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {isRu ? 'Напоминания' : 'Reminders'}
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
              <DialogTitle>{isRu ? 'Новое напоминание' : 'New reminder'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>{isRu ? 'Дата и время' : 'Date & time'}</Label>
                <Input
                  type="datetime-local"
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                />
              </div>
              <div>
                <Label>{isRu ? 'Заметка' : 'Note'}</Label>
                <Input
                  placeholder={isRu ? 'Напр. Позвонить' : 'e.g. Call back'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} disabled={!reminderAt || createMutation.isPending} className="w-full">
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Bell className="h-16 w-16 mx-auto opacity-30 mb-2" />
          {isRu ? 'Нет напоминаний' : 'No reminders'}
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-3 rounded-none border bg-background/50 hover:bg-muted/30 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(r.reminder_at), 'd MMM yyyy, HH:mm', { locale })}
                </p>
                {r.note && <p className="text-xs text-muted-foreground mt-0.5">{r.note}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-success hover:text-success"
                  onClick={() => handleDismiss(r.id)}
                  disabled={dismissMutation.isPending}
                  title={isRu ? 'Выполнено' : 'Done'}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(r.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
