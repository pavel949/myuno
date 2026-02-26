import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CalendarDays, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CrmTask } from '@/hooks/useCrmTasks';
import { OperationalTask } from '@/hooks/useOperationalTasks';
import { isPast, isToday, isThisWeek } from 'date-fns';

interface TaskSummaryKPIsProps {
  crmTasks: CrmTask[];
  opsTasks: OperationalTask[];
}

export function TaskSummaryKPIs({ crmTasks, opsTasks }: TaskSummaryKPIsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Combine for counting
  const allItems = [
    ...crmTasks.map(t => ({ due: t.due_date, status: t.status })),
    ...opsTasks.map(t => ({ due: t.scheduled_date, status: t.status })),
  ];

  const overdue = allItems.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.due && isPast(new Date(t.due)) && !isToday(new Date(t.due))).length;
  const today = allItems.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.due && isToday(new Date(t.due))).length;
  const thisWeek = allItems.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.due && isThisWeek(new Date(t.due))).length;
  const completed = allItems.filter(t => t.status === 'completed').length;

  const kpis = [
    { label: isRu ? 'Просрочено' : 'Overdue', value: overdue, icon: AlertTriangle, color: 'text-destructive' },
    { label: isRu ? 'Сегодня' : 'Today', value: today, icon: CalendarDays, color: 'text-warning' },
    { label: isRu ? 'Эта неделя' : 'This Week', value: thisWeek, icon: CalendarCheck, color: 'text-info' },
    { label: isRu ? 'Выполнено' : 'Completed', value: completed, icon: CheckCircle2, color: 'text-success' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted">
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
