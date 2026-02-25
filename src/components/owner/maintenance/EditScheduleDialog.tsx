import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FREQUENCY_LABELS, type MaintenanceFrequency } from '@/config/maintenanceScheduleTemplates';
import { MaintenanceSchedule } from '@/hooks/useMaintenanceSchedules';

const PRIORITY_LABELS = {
  low: { en: 'Low', ru: 'Низкий' },
  normal: { en: 'Normal', ru: 'Обычный' },
  high: { en: 'High', ru: 'Высокий' },
};

interface Props {
  schedule: MaintenanceSchedule | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isRu: boolean;
  onSave: (data: {
    id: string;
    frequency?: string;
    next_due_date?: string;
    estimated_cost?: number;
    currency?: string;
    priority?: string;
    notes?: string | null;
  }) => void;
  isPending: boolean;
}

export function EditScheduleDialog({ schedule, open, onOpenChange, isRu, onSave, isPending }: Props) {
  const [frequency, setFrequency] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState('THB');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (schedule) {
      setFrequency(schedule.frequency);
      setNextDue(schedule.next_due_date?.slice(0, 10) ?? '');
      setCost(String(schedule.estimated_cost ?? 0));
      setCurrency(schedule.currency ?? 'THB');
      setPriority(schedule.priority ?? 'normal');
      setNotes(schedule.notes ?? '');
    }
  }, [schedule]);

  if (!schedule) return null;

  const handleSave = () => {
    onSave({
      id: schedule.id,
      frequency,
      next_due_date: nextDue,
      estimated_cost: Number(cost) || 0,
      currency,
      priority,
      notes: notes || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Редактировать задачу' : 'Edit Schedule'}</DialogTitle>
          <DialogDescription>
            {isRu ? (schedule.title_ru || schedule.title) : schedule.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{isRu ? 'Частота' : 'Frequency'}</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{isRu ? label.ru : label.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{isRu ? 'Следующая дата' : 'Next due date'}</Label>
            <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{isRu ? 'Стоимость' : 'Estimated cost'}</Label>
              <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} min={0} />
            </div>
            <div className="space-y-1.5">
              <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="THB">THB</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="RUB">RUB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{isRu ? 'Приоритет' : 'Priority'}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{isRu ? label.ru : label.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={isRu ? 'Доп. информация...' : 'Additional notes...'} />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={isPending}>
            {isRu ? 'Сохранить' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
