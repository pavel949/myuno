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
      setReminderAt('');
      setNote('');
      setDialogOpen(false);
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissMutation.mutateAsync(id);
      toast(isRu ? 'Готово' : 'Done');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const activeReminders = reminders.filter(r => !r.is_dismissed);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Bell className="h-4 w-4 text-warning" />
          {isRu ? 'Напоминания' : 'Reminders'}
          {activeReminders.length > 0 && (
            <span className="text-xs text-warning">({activeReminders.length})</span>
          )}
        </h4>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Новое напоминание' : 'New Reminder'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{isRu ? 'Дата и время' : 'Date & Time'}</Label>
                <Input type="datetime-local" value={reminderAt} onChange={e => setReminderAt(e.target.value)} />
              </div>
              <div>
                <Label>{isRu ? 'Заметка' : 'Note'}</Label>
                <Input value={note} onChange={e => setNote(e.target.value)} placeholder={isRu ? 'Позвонить клиенту' : 'Call client'} />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
      ) : activeReminders.length === 0 ? (
        <p className="text-xs text-muted-foreground">{isRu ? 'Нет напоминаний' : 'No reminders'}</p>
      ) : (
        <div className="space-y-1">
          {activeReminders.map(r => (
            <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">
                  {format(new Date(r.reminder_at), 'dd MMM HH:mm', { locale })}
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
