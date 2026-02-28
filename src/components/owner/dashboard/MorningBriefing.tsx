import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useDayBriefing, type DayItem } from '@/hooks/useDayBriefing';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Sun, LogIn, LogOut, Sparkles, AlertTriangle, CreditCard, ClipboardCheck } from 'lucide-react';

export function MorningBriefing() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const t = (en: string, ru: string, th?: string) => isRu ? ru : isTh && th ? th : en;

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: dayItems = [], isLoading: dayLoading } = useDayBriefing();

  const isLoading = metricsLoading || dayLoading;

  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-xl" />;
  }

  const checkIns = dayItems.filter((i: DayItem) => i.type === 'check_in').length;
  const checkOuts = dayItems.filter((i: DayItem) => i.type === 'check_out').length;
  const cleanings = dayItems.filter((i: DayItem) =>
    i.type === 'staff_task' && i.subtitle?.toLowerCase().includes('clean')
  ).length;
  const overdue = metrics?.ops?.overdueTasks || 0;
  const pendingPayments = metrics?.ops?.pendingInvoices || 0;
  const openTasks = metrics?.ops?.openTasks || 0;

  const chips: { icon: React.ElementType; label: string; count: number; color: string; bg: string }[] = [];

  if (checkIns > 0) chips.push({ icon: LogIn, label: t('Arrivals', 'Заезды', 'เช็คอิน'), count: checkIns, color: 'text-success', bg: 'bg-success/10' });
  if (checkOuts > 0) chips.push({ icon: LogOut, label: t('Departures', 'Выезды', 'เช็คเอาท์'), count: checkOuts, color: 'text-warning', bg: 'bg-warning/10' });
  if (cleanings > 0) chips.push({ icon: Sparkles, label: t('Cleanings', 'Уборки', 'ทำความสะอาด'), count: cleanings, color: 'text-primary', bg: 'bg-primary/10' });
  if (overdue > 0) chips.push({ icon: AlertTriangle, label: t('Overdue', 'Просрочено', 'เกินกำหนด'), count: overdue, color: 'text-destructive', bg: 'bg-destructive/10' });
  if (pendingPayments > 0) chips.push({ icon: CreditCard, label: t('Payments', 'Платежи', 'ชำระเงิน'), count: pendingPayments, color: 'text-warning', bg: 'bg-warning/10' });
  if (openTasks > 0) chips.push({ icon: ClipboardCheck, label: t('Tasks', 'Задачи', 'งาน'), count: openTasks, color: 'text-info', bg: 'bg-info/10' });

  if (chips.length === 0) {
    return (
      <Card className="bg-success/5 border-success/20">
        <CardContent className="py-4 text-center">
          <p className="text-sm font-medium flex items-center justify-center gap-2">
            <Sun className="h-4 w-4 text-success" />
            {t('All clear today! No urgent items.', 'Всё под контролем! Нет срочных задач.', 'ทุกอย่างเรียบร้อย! ไม่มีงานเร่งด่วน')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-2">
      <h3 className="font-semibold text-[15px] flex items-center gap-2 px-1">
        <Sun className="h-4 w-4 text-warning" />
        {t('Morning Briefing', 'Сводка дня', 'สรุปประจำวัน')}
      </h3>
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, i) => {
              const Icon = chip.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    chip.bg, chip.color
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span>{chip.count}</span>
                  <span className="opacity-80">{chip.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
