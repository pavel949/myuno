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
      toast(isRu)toast.error(isRu)}
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
