import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDealScheduledActivities,
  useCreateScheduledActivity,
  useCompleteScheduledActivity,
  useCancelScheduledActivity,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  ScheduledActivityType,
} from '@/hooks/useDealScheduledActivities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, X, CalendarClock } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  dealId: string;
  companyId: string;
}

export function DealScheduledActivities({ dealId, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { data: activities = [] } = useDealScheduledActivities(dealId);
  const createActivity = useCreateScheduledActivity();
  const completeActivity = useCompleteScheduledActivity();
  const cancelActivity = useCancelScheduledActivity();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    activity_type: 'call' as string,
    summary: '',
    due_date: '',
  });

  const pending = activities.filter(a => !a.completed_at && !a.cancelled_at);
  const done = activities.filter(a => a.completed_at || a.cancelled_at);

  const handleCreate = async () => {
    if (!form.summary.trim() || !form.due_date) return;
    await createActivity.mutateAsync({
      company_id: companyId,
      deal_id: dealId,
      contact_id: null,
      activity_type: form.activity_type,
      summary: form.summary.trim(),
      note: null,
      due_date: form.due_date,
      due_time: null,
      assigned_to: user!.id,
      created_by: user!.id,
    });
    setForm({ activity_type: 'call', summary: '', due_date: '' });
    setShowForm(false);
  };

  return (
    <div className="border rounded-xl p-4 bg-card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4 text-primary" />
          {isRu ? 'Запланировано' : 'Scheduled'} ({pending.length})
        </p>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
          <Select value={form.activity_type} onValueChange={v => setForm(f => ({ ...f, activity_type: v }))}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map(t => (
                <SelectItem key={t} value={t}>
                  {ACTIVITY_TYPE_LABELS[t].icon} {isRu ? ACTIVITY_TYPE_LABELS[t].ru : ACTIVITY_TYPE_LABELS[t].en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={isRu ? 'Описание...' : 'Summary...'}
            value={form.summary}
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            className="h-8 text-xs"
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              className="h-8 text-xs flex-1"
            />
            <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={createActivity.isPending || !form.summary.trim() || !form.due_date}>
              {isRu ? 'Добавить' : 'Add'}
            </Button>
          </div>
        </div>
      )}

      {pending.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground">{isRu ? 'Нет запланированных действий' : 'No scheduled activities'}</p>
      )}

      {pending.map(a => {
        const dueDate = parseISO(a.due_date);
        const overdue = isPast(dueDate) && !isToday(dueDate);
        const today = isToday(dueDate);
        const typeConfig = ACTIVITY_TYPE_LABELS[a.activity_type as ScheduledActivityType] || ACTIVITY_TYPE_LABELS.task;

        return (
          <div key={a.id} className={cn(
            'flex items-start gap-2 p-2 rounded-lg border text-sm',
            overdue && 'border-destructive/50 bg-destructive/5',
            today && 'border-primary/50 bg-primary/5',
          )}>
            <Checkbox
              className="mt-0.5"
              onCheckedChange={() => completeActivity.mutate(a.id)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs">
                <span>{typeConfig.icon}</span>{' '}
                {a.summary}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  'text-[10px]',
                  overdue ? 'text-destructive font-medium' : today ? 'text-primary font-medium' : 'text-muted-foreground',
                )}>
                  {format(dueDate, 'dd.MM.yy')}
                  {overdue && ` (${isRu ? 'просрочено' : 'overdue'})`}
                  {today && ` (${isRu ? 'сегодня' : 'today'})`}
                </span>
                <Badge variant="outline" className="text-[9px] h-4">
                  {isRu ? typeConfig.ru : typeConfig.en}
                </Badge>
              </div>
            </div>
            <button onClick={() => cancelActivity.mutate(a.id)} className="text-muted-foreground hover:text-destructive shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      {done.length > 0 && (
        <details className="text-xs">
          <summary className="text-muted-foreground cursor-pointer">{isRu ? 'Завершённые' : 'Completed'} ({done.length})</summary>
          <div className="mt-2 space-y-1">
            {done.map(a => (
              <p key={a.id} className="text-muted-foreground line-through">
                {ACTIVITY_TYPE_LABELS[a.activity_type as ScheduledActivityType]?.icon || '✅'} {a.summary}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
