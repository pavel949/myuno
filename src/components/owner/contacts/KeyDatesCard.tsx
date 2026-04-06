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
      toast(isRu)toast.error(isRu)}
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
