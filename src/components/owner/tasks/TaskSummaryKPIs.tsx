import { pickLang } from '@/lib/i18n/pickLang';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CalendarDays, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CrmTask } from '@/hooks/useCrmTasks';
import { OperationalTask } from '@/hooks/useOperationalTasks';
import { isPast, isToday, isThisWeek } from 'date-fns';
import { isTaskClosedStatus, isTaskCompletedStatus } from '@/lib/tasks/taskStatus';

interface TaskSummaryKPIsProps {
  crmTasks: CrmTask[];
  opsTasks: OperationalTask[];
}

export function TaskSummaryKPIs({ crmTasks, opsTasks }: TaskSummaryKPIsProps) {
  const { language } = useLanguage();

  // Combine for counting
  const allItems = [
    ...crmTasks.map(t => ({ due: t.due_date, status: t.status })),
    ...opsTasks.map(t => ({ due: t.scheduled_date, status: t.status })),
  ];

  const overdue = allItems.filter(t => !isTaskClosedStatus(t.status) && t.due && isPast(new Date(t.due)) && !isToday(new Date(t.due))).length;
  const today = allItems.filter(t => !isTaskClosedStatus(t.status) && t.due && isToday(new Date(t.due))).length;
  const thisWeek = allItems.filter(t => !isTaskClosedStatus(t.status) && t.due && isThisWeek(new Date(t.due))).length;
  const completed = allItems.filter(t => isTaskCompletedStatus(t.status)).length;

  const kpis = [
    { label: pickLang(language, { ru: 'Просрочено', en: 'Overdue', th: 'เกินกำหนด' }), value: overdue, icon: AlertTriangle, color: 'text-destructive' },
    { label: pickLang(language, { ru: 'Сегодня', en: 'Today', th: 'วันนี้' }), value: today, icon: CalendarDays, color: 'text-warning' },
    { label: pickLang(language, { ru: 'Эта неделя', en: 'This Week', th: 'สัปดาห์นี้' }), value: thisWeek, icon: CalendarCheck, color: 'text-info' },
    { label: pickLang(language, { ru: 'Выполнено', en: 'Completed', th: 'เสร็จสิ้น' }), value: completed, icon: CheckCircle2, color: 'text-success' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="p-3 flex flex-col items-center text-center gap-1 min-h-[90px] justify-center">
            <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="text-xs text-muted-foreground leading-tight">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
