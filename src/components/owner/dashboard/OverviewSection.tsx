import { useCallback, useMemo } from 'react';
import type { ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, isPast, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  ArrowRight,
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
  subtitle: string;
  icon: ElementType;
  items: OverviewItem[];
  summary: string;
  nextAction: string;
  ctaLabel: string;
  ctaHref: string;
  emptyText: string;
  isLoading?: boolean;
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
        label: isRu ? 'Ближайшее' : 'Upcoming',
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

function OverviewBlock({
  title,
  subtitle,
  icon: Icon,
  items,
  summary,
  nextAction,
  ctaLabel,
  ctaHref,
  emptyText,
  isLoading = false,
}: OverviewBlockProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="space-y-3 pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-none" />
          <Skeleton className="h-16 w-full rounded-none" />
          <Skeleton className="h-10 w-full rounded-none" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="h-4 w-4 text-primary" />
              {title}
              <Badge variant="secondary" className="text-[10px]">
                {items.length}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {isRu ? 'Что произошло' : 'What happened'}
          </p>
          <p className="text-sm leading-6">{summary}</p>
        </div>

        <div className="space-y-2">
          {items.length > 0 ? items.map((item) => {
            const ItemIcon = item.icon;
            const urgency = getUrgencyMeta(item.urgency, isRu);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.href || ctaHref)}
                className="flex w-full items-start gap-3 rounded-none border bg-card p-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="rounded-none bg-muted p-2">
                  <ItemIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <Badge variant="outline" className={cn('shrink-0 text-[10px]', urgency.className)}>
                      {urgency.label}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </button>
            );
          }) : (
            <div className="rounded-none border border-dashed p-4 text-sm text-muted-foreground">
              {emptyText}
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-none bg-muted/40 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {isRu ? 'Следующее действие' : 'Next action'}
          </p>
          <p className="text-sm text-foreground">{nextAction}</p>
          <Button variant="outline" className="w-full justify-between" onClick={() => navigate(ctaHref)}>
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
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
  const { activeBookings, upcomingBookings, isLoading: bookingsLoading } = useAllPropertyBookings();
  const { data: crmTasks = [], isLoading: crmLoading } = useCrmTasks({ status: 'active' });
  const { tasks: opsTasks = [], isLoading: opsLoading } = useOperationalTasks({
    propertyId: selectedPropertyId || undefined,
    status: ['pending', 'in_progress'],
  });
  const { data: financials = [], isLoading: financialsLoading } = usePropertyFinancialsFull(selectedPropertyId || undefined);
  const { data: dayItems = [], isLoading: briefingLoading } = useDayBriefing();

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
          subtitle: `${propertyName} · ${t('Operations', 'Операции')}`,
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
        'Нет просроченных или ближайших задач в очереди.',
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
            : t('Portfolio', 'Портфель'),
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
            : t('Scheduled CRM activity', 'Запланированная CRM-активность'),
        urgency: item.sectionOrder <= 2 ? 'today' : 'upcoming',
        detail: item.sectionOrder <= 2
          ? t('Scheduled for today in CRM.', 'Запланировано на сегодня в CRM.')
          : t('Upcoming follow-up from CRM schedule.', 'Ближайшее касание из CRM-расписания.'),
        href: item.href || APP_ROUTES.MC_SALES,
        icon: BriefcaseBusiness,
      }));
  }, [dayItems, t]);

  const crmReminderSummary = useMemo(() => {
    if (!crmReminderItems.length) {
      return t(
        'No CRM meetings or follow-ups are scheduled right now.',
        'Сейчас нет запланированных CRM-встреч или follow-up активностей.',
      );
    }

    const todayCount = crmReminderItems.filter((item) => item.urgency === 'today').length;
    const upcomingCount = crmReminderItems.filter((item) => item.urgency === 'upcoming').length;

    return t(
      `${todayCount} CRM touchpoints today and ${upcomingCount} upcoming follow-ups are scheduled.`,
      `${todayCount} CRM-касаний на сегодня и ${upcomingCount} ближайших follow-up уже стоят в расписании.`,
    );
  }, [crmReminderItems, t]);

  return (
    <section className="space-y-4">
      <div className="space-y-1 px-1">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('Overview', 'Обзор')}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedPropertyId
            ? t(
              `Daily control tower for ${propertyMap.get(selectedPropertyId) || 'selected property'}.`,
              `Ежедневный control tower по объекту ${propertyMap.get(selectedPropertyId) || 'из фильтра'}.`,
            )
            : t(
              'Daily control tower for stays, tasks, cash and CRM follow-ups.',
              'Ежедневный control tower по заездам, задачам, деньгам и CRM follow-up.',
            )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <OverviewBlock
          title={t('Stays', 'Заезды и выезды')}
          subtitle={t('Current and upcoming guest movements', 'Текущие и ближайшие движения гостей')}
          icon={CalendarCheck2}
          items={stayItems}
          summary={staySummary}
          nextAction={t(
            'Open Calendar and confirm arrivals, departures and cleaning handoffs.',
            'Откройте календарь и подтвердите заезды, выезды и передачи на уборку.',
          )}
          ctaLabel={t('Open calendar', 'Открыть календарь')}
          ctaHref={APP_ROUTES.MC_CALENDAR}
          emptyText={t('No check-ins or check-outs need attention yet.', 'Пока нет заездов или выездов, требующих внимания.')}
          isLoading={bookingsLoading}
        />

        <OverviewBlock
          title={t('Tasks', 'Задачи')}
          subtitle={t('Business and operational workload', 'Бизнес- и операционная нагрузка')}
          icon={ListTodo}
          items={taskItems}
          summary={taskSummary}
          nextAction={t(
            'Open Tasks hub to reassign overdue work and confirm today priorities.',
            'Откройте hub задач, чтобы перераспределить просроченное и подтвердить приоритеты на сегодня.',
          )}
          ctaLabel={t('Open tasks', 'Открыть задачи')}
          ctaHref={APP_ROUTES.MC_TASKS}
          emptyText={t('No urgent tasks are blocking the day.', 'Сейчас нет срочных задач, блокирующих день.')}
          isLoading={crmLoading || opsLoading}
        />

        <OverviewBlock
          title={t('Finance', 'Финансы')}
          subtitle={t('Overdue and upcoming cash items', 'Просроченные и ближайшие денежные позиции')}
          icon={Wallet}
          items={financeItems}
          summary={financeSummary}
          nextAction={t(
            'Open Financials to clear overdue items and review expected cash movement.',
            'Откройте финансы, чтобы закрыть просрочки и проверить ожидаемое движение денег.',
          )}
          ctaLabel={t('Open financials', 'Открыть финансы')}
          ctaHref={APP_ROUTES.MC_FINANCIALS}
          emptyText={t('No pending finance items need action right now.', 'Сейчас нет финансовых позиций, требующих действия.')}
          isLoading={financialsLoading}
        />

        <OverviewBlock
          title={t('CRM Reminders', 'CRM-напоминания')}
          subtitle={t('Meetings, follow-ups and scheduled touches', 'Встречи, follow-up и запланированные касания')}
          icon={Clock3}
          items={crmReminderItems}
          summary={crmReminderSummary}
          nextAction={t(
            'Open CRM dashboard to review follow-ups, meetings and client next steps.',
            'Откройте CRM dashboard, чтобы проверить follow-up, встречи и следующие шаги по клиентам.',
          )}
          ctaLabel={t('Open CRM', 'Открыть CRM')}
          ctaHref={APP_ROUTES.MC_SALES}
          emptyText={t('No CRM reminders are queued at the moment.', 'Сейчас нет CRM-напоминаний в очереди.')}
          isLoading={briefingLoading}
        />
      </div>
    </section>
  );
}
