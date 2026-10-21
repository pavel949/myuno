import { useCallback, useMemo } from 'react';
import type { ElementType } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDays, format, isPast, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  ArrowRight,
  AlertCircle,
  BriefcaseBusiness,
  CalendarCheck2,
  CircleDollarSign,
  Clock3,
  ListTodo,
  LogIn,
  LogOut,
  Wallet,
  Wrench,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardFilter } from '@/contexts/DashboardFilterContext';
import { useAllPropertyBookings } from '@/hooks/usePropertyBookings';
import { useCrmTasks } from '@/hooks/useCrmTasks';
import { useDayBriefing } from '@/hooks/useDayBriefing';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useOperationalTasks } from '@/hooks/useOperationalTasks';
import { usePropertyFinancialsFull } from '@/hooks/usePropertyFinancials';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';
import { isTaskClosedStatus } from '@/lib/tasks/taskStatus';
import { cn } from '@/lib/utils';

type OverviewUrgency = 'overdue' | 'today' | 'upcoming';

interface OverviewItem {
  id: string;
  title: string;
  subtitle: string;
  urgency: OverviewUrgency;
  detail: string;
  href?: string;
  icon: ElementType;
}

interface OverviewBlockProps {
  title: string;
  icon: ElementType;
  items: OverviewItem[];
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
}

function getUrgencyMeta(urgency: OverviewUrgency, isRu: boolean) {
  switch (urgency) {
    case 'overdue':
      return {
        label: isRu ? 'Просрочено' : 'Overdue',
        className: 'border-destructive/30 bg-destructive/10 text-destructive',
      };
    case 'today':
      return {
        label: isRu ? 'Сегодня' : 'Today',
        className: 'border-info/30 bg-info/10 text-info',
      };
    default:
      return {
        label: isRu ? 'Ближайшие события' : 'Upcoming',
        className: 'border-primary/30 bg-primary/10 text-primary',
      };
  }
}

function formatDateLabel(date: Date, isRu: boolean) {
  if (isToday(date)) return isRu ? 'Сегодня' : 'Today';
  if (isTomorrow(date)) return isRu ? 'Завтра' : 'Tomorrow';
  if (isPast(date) && !isToday(date)) return isRu ? 'Просрочено' : 'Overdue';
  return format(date, 'dd MMM', { locale: isRu ? ru : undefined });
}

export function OverviewBlock({
  title,
  icon: Icon,
  items,
  summary,
  ctaLabel,
  ctaHref,
  isLoading = false,
  hasError = false,
  onRetry,
}: OverviewBlockProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card className="min-w-0 border-border shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 font-sans text-body font-medium">
          <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0">{title}</span>
          {!hasError && !isLoading && items.length > 0 && (
            <Badge variant="secondary" className="ml-auto font-mono text-caption">{items.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {hasError ? (
          <div role="alert" className="space-y-2">
            <p className="flex items-start gap-2 text-body-sm text-destructive">
              <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
              {isRu ? 'Не удалось загрузить данные. Проверьте раздел или повторите попытку.' : 'Could not load data. Open the section or try again.'}
            </p>
            {onRetry && <Button variant="secondary" onClick={onRetry}>{isRu ? 'Повторить' : 'Retry'}</Button>}
          </div>
        ) : isLoading ? (
          <div role="status" aria-label={isRu ? `Загрузка: ${title}` : `Loading: ${title}`} className="space-y-2 py-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <>
            <p className="text-body-sm leading-relaxed text-muted-foreground">{summary}</p>
            {items.length > 0 && <div className="space-y-2">
              {items.map((item) => {
                const ItemIcon = item.icon;
                const urgency = getUrgencyMeta(item.urgency, isRu);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.href || ctaHref)}
                    className="flex min-h-11 w-full items-start gap-2 border bg-card p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ItemIcon className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-body-sm font-medium">{item.title}</p>
                        <Badge variant="outline" className={cn('shrink-0 text-caption', urgency.className)}>{urgency.label}</Badge>
                      </div>
                      <p className="break-words text-caption text-muted-foreground">{item.subtitle}</p>
                      <p className="text-caption text-muted-foreground">{item.detail}</p>
                    </div>
                  </button>
                );
              })}
            </div>}
          </>
        )}
        <Button asChild variant="ghost" className="h-auto min-h-11 w-full justify-between gap-3 border-t px-0 py-3 text-body-sm">
          <Link to={ctaHref}><span className="whitespace-normal text-left">{ctaLabel}</span><ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function OverviewSection() {
  const { language } = useLanguage();
  const { selectedPropertyId } = useDashboardFilter();
  const isRu = language === 'ru';
  const t = useCallback((en: string, ruText: string) => (isRu ? ruText : en), [isRu]);
  const today = startOfDay(new Date());
  const upcomingWindow = addDays(today, 7);

  const { activeProperties } = useMyProperties();
  const { activeBookings, upcomingBookings, isLoading: bookingsLoading, error: bookingsError, refetch: retryBookings } = useAllPropertyBookings();
  const { data: crmTasks = [], isLoading: crmLoading, isError: crmError, refetch: retryCrm } = useCrmTasks({ status: 'active' });
  const { tasks: opsTasks = [], isLoading: opsLoading, error: opsError, refetch: retryOps } = useOperationalTasks({
    propertyId: selectedPropertyId || undefined,
    status: ['pending', 'in_progress'],
  });
  const { data: financials = [], isLoading: financialsLoading, isError: financialsError, refetch: retryFinancials } = usePropertyFinancialsFull(selectedPropertyId || undefined);
  const { data: dayItems = [], isLoading: briefingLoading, isError: briefingError, refetch: retryBriefing } = useDayBriefing();

  const propertyMap = useMemo(() => {
    return new Map(
      (activeProperties || []).map((property) => [
        property.property_id,
        isRu ? property.title_ru || property.title : property.title,
      ]),
    );
  }, [activeProperties, isRu]);

  const stayItems = useMemo<OverviewItem[]>(() => {
    const allBookings = [...(activeBookings || []), ...(upcomingBookings || [])]
      .filter((booking) => !selectedPropertyId || booking.property_id === selectedPropertyId);

    return allBookings
      .flatMap((booking) => {
        const propertyName = propertyMap.get(booking.property_id) || t('Property', 'Объект');
        const checkInDate = startOfDay(parseISO(booking.check_in));
        const checkOutDate = startOfDay(parseISO(booking.check_out));
        const items: OverviewItem[] = [];

        if (checkInDate >= today && checkInDate <= upcomingWindow) {
          items.push({
            id: `stay-check-in-${booking.id}`,
            title: booking.guest_name || t('Guest arrival', 'Заезд гостя'),
            subtitle: `${propertyName} · ${t('Arrival', 'Заезд')}`,
            urgency: isToday(checkInDate) ? 'today' : 'upcoming',
            detail: `${formatDateLabel(checkInDate, isRu)} · ${t('Prepare keys and arrival instructions', 'Подготовить ключи и инструкции по заезду')}`,
            href: APP_ROUTES.MC_CALENDAR,
            icon: LogIn,
          });
        }

        if (checkOutDate >= today && checkOutDate <= upcomingWindow) {
          items.push({
            id: `stay-check-out-${booking.id}`,
            title: booking.guest_name || t('Guest departure', 'Выезд гостя'),
            subtitle: `${propertyName} · ${t('Departure', 'Выезд')}`,
            urgency: isToday(checkOutDate) ? 'today' : 'upcoming',
            detail: `${formatDateLabel(checkOutDate, isRu)} · ${t('Confirm cleaning and handover', 'Подтвердить уборку и передачу объекта')}`,
            href: APP_ROUTES.MC_CALENDAR,
            icon: LogOut,
          });
        }

        return items;
      })
      .sort((a, b) => {
        const urgencyOrder = { overdue: 0, today: 1, upcoming: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      })
      .slice(0, 4);
  }, [activeBookings, upcomingBookings, propertyMap, selectedPropertyId, today, upcomingWindow, isRu, t]);

  const staySummary = useMemo(() => {
    if (!stayItems.length) {
      return t(
        'No arrivals or departures are scheduled in the next 7 days.',
        'На ближайшие 7 дней заезды и выезды не запланированы.',
      );
    }

    const todayCount = stayItems.filter((item) => item.urgency === 'today').length;
    const upcomingCount = stayItems.filter((item) => item.urgency === 'upcoming').length;

    return t(
      `${todayCount} today and ${upcomingCount} upcoming stay events need coordination.`,
      `${todayCount} событий на сегодня и ${upcomingCount} ближайших заездов/выездов требуют координации.`,
    );
  }, [stayItems, t]);

  const taskItems = useMemo<OverviewItem[]>(() => {
    const normalizedCrm = crmTasks
      .filter((task) => !selectedPropertyId || task.property_id === selectedPropertyId)
      .filter((task) => !isTaskClosedStatus(task.status))
      .map((task) => {
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        return {
          id: `crm-${task.id}`,
          title: task.title,
          subtitle: task.property_id
            ? `${propertyMap.get(task.property_id) || t('Property', 'Объект')} · CRM`
            : 'CRM',
          dueDate,
          href: APP_ROUTES.MC_TASKS,
          icon: ListTodo,
        };
      })
      .filter((task) => task.dueDate);

    const normalizedOps = opsTasks
      .map((task) => {
        const propertyName = propertyMap.get(task.property_id) || t('Property', 'Объект');
        const due = new Date(`${task.scheduled_date}T${task.scheduled_time || '18:00'}`);
        return {
          id: `ops-${task.id}`,
          title: task.title,
          subtitle: `${propertyName} · ${t('Operations', 'Обслуживание объектов')}`,
          dueDate: due,
          href: APP_ROUTES.MC_TASKS,
          icon: Wrench,
        };
      });

    return [...normalizedCrm, ...normalizedOps]
      .filter((task) => task.dueDate && (task.dueDate <= upcomingWindow || isPast(task.dueDate)))
      .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
      .map((task) => {
        const dueDate = task.dueDate!;
        const urgency: OverviewUrgency = isPast(dueDate) && !isToday(dueDate)
          ? 'overdue'
          : isToday(dueDate)
            ? 'today'
            : 'upcoming';

        return {
          id: task.id,
          title: task.title,
          subtitle: task.subtitle,
          urgency,
          detail: `${formatDateLabel(dueDate, isRu)} · ${format(dueDate, 'HH:mm')}`,
          href: task.href,
          icon: task.icon,
        };
      })
      .slice(0, 4);
  }, [crmTasks, opsTasks, propertyMap, selectedPropertyId, upcomingWindow, isRu, t]);

  const taskSummary = useMemo(() => {
    if (!taskItems.length) {
      return t(
        'No overdue or near-term tasks are in the queue.',
        'Просроченных и предстоящих задач нет.',
      );
    }

    const overdue = taskItems.filter((item) => item.urgency === 'overdue').length;
    const todayCount = taskItems.filter((item) => item.urgency === 'today').length;
    const upcoming = taskItems.filter((item) => item.urgency === 'upcoming').length;

    return t(
      `${overdue} overdue, ${todayCount} due today, ${upcoming} upcoming tasks require follow-up.`,
      `${overdue} просрочено, ${todayCount} на сегодня и ${upcoming} ближайших задач требуют контроля.`,
    );
  }, [taskItems, t]);

  const financeItems = useMemo(() => {
    return financials
      .filter((item) => item.status === 'pending' && item.due_date)
      .map((item) => {
        const dueDate = startOfDay(parseISO(item.due_date!));
        return {
          id: item.id,
          title: item.description || item.category || t('Payment item', 'Финансовая операция'),
          subtitle: item.property
            ? (isRu ? item.property.title_ru || item.property.title : item.property.title)
            : t('Portfolio', 'Объекты'),
          urgency: (isPast(dueDate) && !isToday(dueDate) ? 'overdue' : isToday(dueDate) ? 'today' : 'upcoming') as OverviewUrgency,
          detail: `${formatDateLabel(dueDate, isRu)} · ${Number(item.amount || 0).toLocaleString()} ${item.currency || 'THB'}`,
          href: APP_ROUTES.MC_FINANCIALS,
          icon: item.transaction_type === 'income' ? CircleDollarSign : Wallet,
          sortDate: dueDate,
        };
      })
      .filter((item) => item.sortDate <= upcomingWindow || item.urgency === 'overdue')
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .slice(0, 4)
      .map(({ sortDate: _sortDate, ...item }) => item);
  }, [financials, upcomingWindow, isRu, t]);

  const financeSummary = useMemo(() => {
    if (!financeItems.length) {
      return t(
        'No overdue or upcoming payments are expected in the next 7 days.',
        'В ближайшие 7 дней нет просроченных или предстоящих платежей.',
      );
    }

    const overdue = financeItems.filter((item) => item.urgency === 'overdue').length;
    const todayCount = financeItems.filter((item) => item.urgency === 'today').length;
    return t(
      `${overdue} overdue and ${todayCount} due today across ${financeItems.length} finance items.`,
      `${overdue} просрочено и ${todayCount} на сегодня по ${financeItems.length} финансовым позициям.`,
    );
  }, [financeItems, t]);

  const crmReminderItems = useMemo<OverviewItem[]>(() => {
    return dayItems
      .filter((item) => item.type === 'crm_activity')
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.meta?.propertyName
          ? `${item.meta.propertyName}${item.meta?.dueTime ? ` · ${t('Time', 'Время')}: ${item.meta.dueTime}` : ''}`
          : item.meta?.dueTime
            ? `${t('Time', 'Время')}: ${item.meta.dueTime}`
            : t('Scheduled CRM activity', 'Запланированные действия с клиентами'),
        urgency: item.sectionOrder <= 2 ? 'today' : 'upcoming',
        detail: item.sectionOrder <= 2
          ? t('Scheduled for today in CRM.', 'Запланировано на сегодня.')
          : t('Upcoming follow-up from CRM schedule.', 'Ближайшее запланированное действие с клиентом.'),
        href: item.href || APP_ROUTES.MC_SALES,
        icon: BriefcaseBusiness,
      }));
  }, [dayItems, t]);

  const crmReminderSummary = useMemo(() => {
    if (!crmReminderItems.length) {
      return t(
        'No CRM meetings or follow-ups are scheduled right now.',
        'Нет запланированных встреч и напоминаний по клиентам.',
      );
    }

    const todayCount = crmReminderItems.filter((item) => item.urgency === 'today').length;
    const upcomingCount = crmReminderItems.filter((item) => item.urgency === 'upcoming').length;

    return t(
      `${todayCount} CRM touchpoints today and ${upcomingCount} upcoming follow-ups are scheduled.`,
      `${todayCount} действий с клиентами сегодня и ${upcomingCount} ближайших напоминаний.`,
    );
  }, [crmReminderItems, t]);

  return (
    <section className="space-y-4">
      <div className="space-y-1 px-1">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-4 w-4 text-primary" />
          <h2 className="font-sans text-body font-medium text-foreground">
            {t('Today and upcoming', 'Сегодня и ближайшие дни')}
          </h2>
        </div>
        {selectedPropertyId && <p className="text-body-sm text-muted-foreground">
          {propertyMap.get(selectedPropertyId) || t('Selected property', 'Выбранный объект')}
        </p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <OverviewBlock
          title={t('Stays', 'Заезды и выезды')}
          icon={CalendarCheck2}
          items={stayItems}
          summary={staySummary}
          ctaLabel={t('Open calendar', 'Открыть календарь')}
          ctaHref={APP_ROUTES.MC_CALENDAR}
          hasError={!!bookingsError}
          onRetry={() => { void retryBookings(); }}
          isLoading={bookingsLoading}
        />

        <OverviewBlock
          title={t('Tasks', 'Задачи')}
          icon={ListTodo}
          items={taskItems}
          summary={taskSummary}
          ctaLabel={t('Open tasks', 'Открыть задачи')}
          ctaHref={APP_ROUTES.MC_TASKS}
          hasError={crmError || !!opsError}
          onRetry={() => { void retryCrm(); void retryOps(); }}
          isLoading={crmLoading || opsLoading}
        />

        <OverviewBlock
          title={t('Finance', 'Финансовый отчёт')}
          icon={Wallet}
          items={financeItems}
          summary={financeSummary}
          ctaLabel={t('Open financials', 'Открыть финансовый отчёт')}
          ctaHref={APP_ROUTES.MC_FINANCIALS}
          hasError={financialsError}
          onRetry={() => { void retryFinancials(); }}
          isLoading={financialsLoading}
        />

        <OverviewBlock
          title={t('CRM Reminders', 'CRM-напоминания')}
          icon={Clock3}
          items={crmReminderItems}
          summary={crmReminderSummary}
          ctaLabel={t('Open CRM', 'Открыть список клиентов')}
          ctaHref={APP_ROUTES.MC_SALES}
          hasError={briefingError}
          onRetry={() => { void retryBriefing(); }}
          isLoading={briefingLoading}
        />
      </div>
    </section>
  );
}
