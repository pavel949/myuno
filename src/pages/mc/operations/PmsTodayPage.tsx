import '@/styles/premium-workspace.css';
/**
 * /mc/today — presentation of existing usePmsToday projections only.
 * Unit states are inferred signals, not verified readiness or inventory status.
 */
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { BookingDetailSheet } from '@/components/owner/BookingDetailSheet';
import { PageShell } from '@/components/page/PageShell';
import { PageHeader } from '@/components/page/PageHeader';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut, BedDouble, MessageSquare, RefreshCw, Phone, CalendarDays, ListTodo, ArrowRight, AlertTriangle, WifiOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StatusTag, recordedStatusTone } from '@/components/ui/status-tag';
import { cn } from '@/lib/utils';
import { usePmsToday, type TodayBooking, type TodayRequest, type TodayTask, type TodayUnit, type UnitState } from '@/hooks/usePmsToday';
import { useIsOffline } from '@/hooks/useOfflineStatus';

import { toBangkokDateKey } from '@/lib/hotelDates';

const PropertyInquiriesWidget = lazy(() => import('@/components/owner/dashboard/PropertyInquiriesWidget').then(m => ({ default: m.PropertyInquiriesWidget })));

type T = { en: string; ru: string; th: string };
const STATE_META: Record<UnitState, { label: T; cls: string }> = {
  occupied: { label: { en: 'Occupied', ru: 'Гости проживают', th: 'มีผู้เข้าพัก' }, cls: 'border-primary text-primary' },
  dirty: { label: { en: 'Needs cleaning', ru: 'Требуется уборка', th: 'ต้องทำความสะอาด' }, cls: 'border-accent text-accent' },
  maintenance: { label: { en: 'Maintenance', ru: 'Техническое обслуживание', th: 'ซ่อมบำรุง' }, cls: 'border-destructive text-destructive' },
  clean: { label: { en: 'No recorded cleaning or maintenance', ru: 'Нет отмеченной уборки или ремонта', th: 'ไม่มีงานทำความสะอาดหรือซ่อมที่บันทึกไว้' }, cls: 'border-border text-muted-foreground' },
};
const LABELS: Record<string, T> = {
  confirmed: { en: 'Confirmed', ru: 'Подтверждено', th: 'ยืนยันแล้ว' },
  checked_in: { en: 'Checked in', ru: 'Гость заселён', th: 'เช็คอินแล้ว' },
  pending_deposit: { en: 'Pending deposit', ru: 'Ожидается депозит', th: 'รอเงินมัดจำ' },
  deposit_paid: { en: 'Deposit paid', ru: 'Депозит внесён', th: 'ชำระมัดจำแล้ว' },
  in_progress: { en: 'In progress', ru: 'В работе', th: 'กำลังดำเนินการ' },
  pending: { en: 'Pending', ru: 'Ожидает обработки', th: 'รอดำเนินการ' },
  new: { en: 'New', ru: 'Новое', th: 'ใหม่' },
  assigned: { en: 'Assigned', ru: 'Назначено', th: 'มอบหมายแล้ว' },
  scheduled: { en: 'Scheduled', ru: 'Запланировано', th: 'กำหนดเวลาแล้ว' },
  open: { en: 'Open', ru: 'Открыто', th: 'เปิดอยู่' },
  medium: { en: 'Medium priority', ru: 'Средний приоритет', th: 'ความสำคัญปานกลาง' },
  low: { en: 'Low priority', ru: 'Низкий приоритет', th: 'ความสำคัญต่ำ' },
  normal: { en: 'Normal priority', ru: 'Обычный приоритет', th: 'ความสำคัญปกติ' },
  high: { en: 'High priority', ru: 'Высокий приоритет', th: 'ความสำคัญสูง' },
  urgent: { en: 'Urgent', ru: 'Срочно', th: 'เร่งด่วน' },
};
const todayJumpIds = new Set(['today-tasks', 'today-priority', 'today-arrivals', 'today-departures', 'today-in-house', 'today-requests']);
const focusLink = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function PmsTodayPage() {
  const { language } = useLanguage();
  const t = (v: T) => pickLang(language, v);
  const d = usePmsToday();
  const isOffline = useIsOffline();
  const location = useLocation();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const complete = !d.isLoading && !d.error && !d.truncatedSources.length && !d.countUnavailableSources.length;
  const selectedBooking = complete && selectedBookingId
    ? [...d.arrivals, ...d.departures, ...d.inHouse].find(booking => booking.id === selectedBookingId) ?? null : null;
  const stayOpen = Boolean(selectedBooking);
  useEffect(() => {
    const id = location.hash.slice(1);
    if (location.pathname !== APP_ROUTES.MC_TODAY || !complete || !d.hasProperties || stayOpen || !todayJumpIds.has(id)) return;
    const target = document.getElementById(id);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView?.({ block: 'start' });
  }, [location.hash, location.key, location.pathname, complete, d.hasProperties, stayOpen]);
  const dateLabel = new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB', {
    timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long',
  });
  // Reorder existing projections only: never infer due dates, payment or readiness.
  const urgentRequests = d.guestRequests.filter(r => r.priority === 'urgent' || r.priority === 'high');
  const routineRequests = d.guestRequests.filter(r => r.priority !== 'urgent' && r.priority !== 'high');
  const maintenanceUnits = d.units.filter(u => u.state === 'maintenance');
  const cleaningUnits = d.units.filter(u => u.state === 'dirty');
  const label = (value: string) => LABELS[value] ? t(LABELS[value]) : value.replace(/_/g, ' ');
  const openProperty = t({ en: 'Open property', ru: 'Открыть объект', th: 'เปิดที่พัก' });

  const arrivalsTitle = t({ en: 'Arrivals', ru: 'Заезды', th: 'เช็คอิน' });
  const departuresTitle = t({ en: 'Departures', ru: 'Выезды', th: 'เช็คเอาท์' });
  const inHouseTitle = t({ en: 'In-house', ru: 'Проживающие гости', th: 'กำลังเข้าพัก' });
  const requestsTitle = t({ en: 'Guest requests', ru: 'Обращения гостей', th: 'คำขอของแขก' });
  const taskTitle = t({ en: 'Tasks to act on', ru: 'Задачи к выполнению', th: 'งานที่ต้องดำเนินการ' });

  const BookingRow = ({ b, kind }: { b: TodayBooking; kind: 'in' | 'out' | 'stay' }) => {
    const guest = b.guest_name || t({ en: 'Guest', ru: 'Гость', th: 'ผู้เข้าพัก' });
    const property = d.titleOf(b.property_id);
    return <li className="flex min-w-0 items-start gap-2 border-b border-border last:border-0">
      <button type="button" onClick={() => setSelectedBookingId(b.id)}
        aria-label={`${t({ en: 'Open booking', ru: 'Открыть бронирование', th: 'เปิดการจอง' })}: ${guest} · ${property}`}
        className={cn('min-h-11 min-w-0 flex-1 py-3 text-left hover:bg-muted/50', focusLink)}>
        <p title={guest} className="break-words font-medium text-foreground [overflow-wrap:anywhere]">{guest}</p>
        <p title={property} className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{property}{typeof b.guests_count === 'number' && Number.isFinite(b.guests_count) && b.guests_count > 0 ? <> · {b.guests_count} {t({ en: 'guests', ru: 'чел.', th: 'คน' })}</> : null}</p>
        <p className="mt-1 break-words font-mono text-xs text-muted-foreground">
          {t(kind === 'in' ? { en: 'Arrival', ru: 'Заезд', th: 'เช็คอิน' } : kind === 'out' ? { en: 'Departure', ru: 'Выезд', th: 'เช็คเอาท์' } : { en: 'Until', ru: 'До', th: 'ถึง' })}: {toBangkokDateKey(kind === 'in' ? b.check_in : b.check_out) ?? '—'}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {b.status && <StatusTag tone={recordedStatusTone(b.status)} title={b.status}>{label(b.status)}</StatusTag>}
          {b.source && <Badge variant="outline" title={b.source} className="max-w-full whitespace-normal break-words font-mono text-xs [overflow-wrap:anywhere]">{b.source}</Badge>}
        </div>
      </button>
      {b.guest_phone && <Button asChild size="icon" variant="ghost" className="mt-2 shrink-0" aria-label={`${t({ en: 'Call guest', ru: 'Позвонить гостю', th: 'โทรหาผู้เข้าพัก' })}: ${guest}`} title={t({ en: 'Call guest', ru: 'Позвонить гостю', th: 'โทรหาผู้เข้าพัก' })}>
        <a href={`tel:${b.guest_phone}`} aria-label={`${t({ en: 'Call guest', ru: 'Позвонить гостю', th: 'โทรหาผู้เข้าพัก' })}: ${guest}`}><Phone aria-hidden className="size-4" /></a>
      </Button>}
    </li>;
  };

  const RequestRow = ({ r }: { r: TodayRequest }) => {
    const property = d.titleOf(r.property_id);
    return <li className="min-w-0 border-b border-border last:border-0">
      <Link to={APP_ROUTES.MC_PROPERTY_DETAIL(r.property_id)} aria-label={`${openProperty}: ${property} · ${r.service_type.replace(/_/g, ' ')}`} className={cn('block min-h-11 min-w-0 py-3 hover:bg-muted/50', focusLink)}>
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0 flex-1">
            <p title={r.service_type} className="break-words font-medium [overflow-wrap:anywhere]">{r.service_type.replace(/_/g, ' ')}</p>
            <p title={property} className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{property}{r.guest_name ? ` · ${r.guest_name}` : ''}</p>
          </div>
          <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />
        </div>
        {r.description && <p title={r.description} className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{r.description}</p>}
        <div className="mt-2 flex flex-wrap gap-1">
          {r.priority && <Badge variant="outline" className={cn('max-w-full whitespace-normal break-words', (r.priority === 'urgent' || r.priority === 'high') && 'border-destructive text-destructive')}>{label(r.priority)}</Badge>}
          {r.status && <StatusTag tone={recordedStatusTone(r.status)}>{label(r.status)}</StatusTag>}
        </div>
      </Link>
    </li>;
  };

  const TaskRow = ({ task }: { task: TodayTask }) => {
    const title = language === 'ru' ? task.title_ru || task.title : task.title;
    const due = toBangkokDateKey(task.due_date);
    const params = new URLSearchParams({
      source: task.source, id: task.id, company: d.companyId!,
      returnTo: `${location.pathname}${location.search}${location.hash}`,
    });
    return <li className="min-w-0 border-b border-border last:border-0">
      <Link to={`${APP_ROUTES.MC_TASKS}?${params}`} aria-label={`${t({ en: 'Open task', ru: 'Открыть задачу', th: 'เปิดงาน' })}: ${title}`} className={cn('flex min-h-11 min-w-0 items-start gap-3 py-3 hover:bg-muted/50', focusLink)}>
        <div className="min-w-0 flex-1">
          <p className="break-words font-medium [overflow-wrap:anywhere]">{title}</p>
          <p className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{d.titleOf(task.property_id)}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline">{task.source === 'ops' ? t({ en: 'Operations', ru: 'Операции', th: 'งานปฏิบัติการ' }) : 'CRM'}</Badge>
            <StatusTag tone={recordedStatusTone(task.status)}>{task.status ? label(task.status) : t({ en: 'Status not recorded', ru: 'Статус не указан', th: 'ไม่ได้บันทึกสถานะ' })}</StatusTag>
            {task.priority && <Badge variant="outline">{label(task.priority)}</Badge>}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{due ? `${t(due < d.today ? { en: 'Overdue', ru: 'Просрочено', th: 'เกินกำหนด' } : { en: 'Due today', ru: 'На сегодня', th: 'ครบกำหนดวันนี้' })}: ${due}` : t({ en: 'Date not recorded', ru: 'Дата не указана', th: 'ไม่ได้บันทึกวันที่' })}</p>
        </div>
        <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>;
  };

  const UnitRow = ({ u }: { u: TodayUnit }) => <li className="min-w-0 border-b border-border last:border-0">
    <Link to={APP_ROUTES.MC_PROPERTY_DETAIL(u.property_id)} aria-label={`${openProperty}: ${u.title}`} className={cn('flex min-h-11 min-w-0 items-start gap-3 py-3 hover:bg-muted/50', focusLink)}>
      <div className="min-w-0 flex-1">
        <p title={u.title} className="break-words font-medium [overflow-wrap:anywhere]">{u.title}</p>
        <span className={cn('mt-2 inline-block max-w-full border px-2 py-1 text-xs [overflow-wrap:anywhere]', STATE_META[u.state].cls)}>{t(STATE_META[u.state].label)}</span>
        {u.booking?.guest_name && <p title={u.booking.guest_name} className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{u.booking.guest_name}</p>}
      </div>
      <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />
    </Link>
  </li>;

  const Flow = ({ id, icon: Icon, title, count, children }: { id?: string; icon: typeof LogIn; title: string; count: number; children: ReactNode }) => <section aria-labelledby={id} className="min-w-0 rounded-[var(--bible-radius-card)] border border-[color:var(--bible-hairline)] bg-card p-3 sm:p-4">
    <header className="flex min-w-0 items-start gap-2 border-b border-border pb-3">
      <Icon aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />
      <h3 id={id} tabIndex={id ? -1 : undefined} className="min-w-0 flex-1 scroll-mt-28 break-words font-semibold [overflow-wrap:anywhere]">{title}</h3>
      <span className="shrink-0 font-mono tabular-nums text-muted-foreground">{count}</span>
    </header>
    {children}
  </section>;
  const Empty = ({ text }: { text: string }) => <p className="py-5 text-sm text-muted-foreground">{text}</p>;
  const attentionTitle = t({ en: 'Needs attention', ru: 'Требует внимания', th: 'ต้องดำเนินการ' });
  const jumpLinks = [
    { id: 'today-tasks', label: taskTitle, count: d.tasks.length },
    { id: 'today-priority', label: t({ en: 'Priority requests', ru: 'Срочные обращения', th: 'คำขอเร่งด่วน' }), count: urgentRequests.length },
    { id: 'today-arrivals', label: arrivalsTitle, count: d.arrivals.length },
    { id: 'today-departures', label: departuresTitle, count: d.departures.length },
    { id: 'today-in-house', label: inHouseTitle, count: d.inHouse.length },
    { id: 'today-requests', label: t({ en: 'Other requests', ru: 'Другие обращения', th: 'คำขออื่น' }), count: routineRequests.length },
  ];
  const todayTitle = t({ en: 'Today', ru: 'Сегодня', th: 'วันนี้' });

  return <PageShell width="wide" stack="default" className="mc-workspace-page mc-today-page text-foreground">
    <PageHeader
      title={todayTitle}
      subtitle={`${dateLabel} · ${t({ en: 'Phuket', ru: 'Пхукет', th: 'ภูเก็ต' })}`}
      className="border-b border-border pb-4"
      actions={
      <nav aria-label={t({ en: 'Operational navigation', ru: 'Навигация по операциям', th: 'การนำทางการดำเนินงาน' })} className="flex flex-wrap gap-1">
        <Button asChild variant="outline" size="sm" className="min-h-11"><Link to={APP_ROUTES.MC_BOOKINGS_LIST}>{t({ en: 'Bookings', ru: 'Бронирования', th: 'การจอง' })}</Link></Button>
        <Button asChild variant="ghost" size="sm" className="min-h-11"><Link to={APP_ROUTES.MC_CALENDAR}><CalendarDays aria-hidden />{t({ en: 'Calendar', ru: 'Календарь', th: 'ปฏิทิน' })}</Link></Button>
        <Button asChild variant="ghost" size="sm" className="min-h-11"><Link to={APP_ROUTES.MC_TASKS}><ListTodo aria-hidden />{t({ en: 'Tasks', ru: 'Задачи', th: 'งาน' })}</Link></Button>
        <Button variant="ghost" size="sm" className="min-h-11" onClick={() => d.refetch()}><RefreshCw aria-hidden />{t({ en: 'Refresh', ru: 'Обновить', th: 'รีเฟรช' })}</Button>
      </nav>
      }
    />

    {isOffline && (
      <div role="status" className="flex items-start gap-3 rounded-[var(--bible-radius-card)] border border-info/30 bg-info/10 p-4">
        <WifiOff className="size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">{t({ en: 'You’re offline', ru: 'Нет подключения', th: 'คุณออฟไลน์อยู่' })}</p>
          <p className="text-body-sm text-muted-foreground">
            {t({ en: 'Reconnect to refresh today’s workspace.', ru: 'Подключитесь к сети, чтобы обновить сводку на сегодня.', th: 'เชื่อมต่ออินเทอร์เน็ตเพื่อรีเฟรชพื้นที่ทำงานวันนี้' })}
          </p>
        </div>
      </div>
    )}

    {complete && !!d.companyId && !!d.propertyIds?.length && <Suspense fallback={<Skeleton className="h-24" />}>
      <PropertyInquiriesWidget companyScope={{ id: d.companyId, propertyIds: d.propertyIds }} />
    </Suspense>}
    {d.error ? <div role="alert" className="border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
      <p>{t({ en: 'Could not load today’s data. No totals are shown.', ru: 'Не удалось загрузить сведения на сегодня. Счётчики скрыты.', th: 'โหลดข้อมูลวันนี้ไม่สำเร็จ จึงไม่แสดงจำนวน' })}</p>
      <Button variant="outline" size="sm" className="mt-2 min-h-11" onClick={() => d.refetch()}>{t({ en: 'Retry loading', ru: 'Повторить загрузку', th: 'ลองโหลดอีกครั้ง' })}</Button>
    </div> : d.isLoading ? <div role="status" aria-label={t({ en: 'Loading today’s data', ru: 'Загрузка сведений на сегодня', th: 'กำลังโหลดข้อมูลวันนี้' })} className="space-y-6">
      <span className="sr-only">{t({ en: 'Loading today’s data', ru: 'Загрузка сведений на сегодня', th: 'กำลังโหลดข้อมูลวันนี้' })}</span>
      <Skeleton className="h-32 w-full" /><div className="grid gap-4 lg:grid-cols-3">{[0,1,2].map(i => <Skeleton key={i} className="h-48 w-full" />)}</div>
    </div> : !d.hasProperties ? <section className="py-6">
      <h2 className="font-medium">{t({ en: 'No properties', ru: 'Нет объектов', th: 'ไม่มีที่พัก' })}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t({ en: 'Add a property to see arrivals and departures here.', ru: 'Добавьте объект, чтобы видеть здесь заезды и выезды.', th: 'เพิ่มที่พักเพื่อดูการเช็คอินและเช็คเอาท์' })}</p>
      <Button asChild className="mt-4 min-h-11"><Link to={APP_ROUTES.MC_PROPERTIES}>{t({ en: 'Go to properties', ru: 'Перейти к объектам', th: 'ไปที่ที่พัก' })}</Link></Button>
    </section> : (d.truncatedSources.length > 0 || d.countUnavailableSources.length > 0) ? <div role="alert" className="border border-accent bg-accent/10 p-4 text-sm">
      {t({ en: 'Today’s snapshot is incomplete: not all records are loaded, or completeness could not be verified. Counts and readiness signals are withheld. Open Tasks or Calendar to continue.', ru: 'Сводка на сегодня неполная: загружены не все записи или полноту данных не удалось проверить. Счётчики и признаки готовности скрыты. Продолжите в задачах или календаре.', th: 'สรุปวันนี้ไม่ครบถ้วน: โหลดข้อมูลไม่ครบหรือไม่สามารถตรวจสอบความครบถ้วนได้ จึงไม่แสดงจำนวนและสัญญาณความพร้อม โปรดเปิดงานหรือปฏิทินเพื่อดำเนินการต่อ' })}
    </div> : <>
      <ul aria-label={t({ en: 'Jump to a work area', ru: 'Перейти к разделу', th: 'ไปที่ส่วนงาน' })} className="grid min-w-0 grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {jumpLinks.map(({ id, label: linkLabel, count }) => (
          <li key={id} className="min-w-0">
            <Link to={{ pathname: location.pathname, search: location.search, hash: `#${id}` }}
              className={cn('flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-[var(--bible-radius-card)] border border-[color:var(--bible-hairline)] bg-card px-3 py-2 text-sm hover:bg-muted/50', focusLink)}>
              <span className="min-w-0 font-medium [overflow-wrap:anywhere]">{linkLabel}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section aria-labelledby="today-tasks" className="min-w-0">
        <h2 id="today-tasks" tabIndex={-1} className="flex scroll-mt-28 items-start gap-2 font-display text-h3"><ListTodo aria-hidden className="mt-1 size-5 shrink-0" />{taskTitle}<span className="font-mono text-sm text-muted-foreground">{d.tasks.length}</span></h2>
        <p className="mt-2 text-sm text-muted-foreground">{t({ en: 'Open property tasks due today, overdue or without a date. Includes recorded booking preparation.', ru: 'Открытые задачи по объектам на сегодня, просроченные и без даты. Включая отмеченную подготовку к бронированиям.', th: 'งานที่พักที่ครบกำหนดวันนี้ เกินกำหนด หรือไม่มีวันที่ รวมงานเตรียมการจองที่บันทึกไว้' })}</p>
        {d.tasks.length ? <ul className="mt-2">{d.tasks.map(task => <TaskRow key={`${task.source}:${task.id}`} task={task} />)}</ul> : <Empty text={t({ en: 'No open tasks due or undated in the loaded property scope', ru: 'В выбранных объектах нет открытых задач на сегодня, просроченных или без даты', th: 'ไม่มีงานที่ครบกำหนดหรือไม่ระบุวันที่ในขอบเขตที่พักที่โหลด' })} />}
      </section>
      <section aria-labelledby="today-attention" className="min-w-0 border-l-2 border-accent pl-4">
        <h2 id="today-attention" className="flex items-start gap-2 font-display text-h3"><AlertTriangle aria-hidden className="mt-1 size-5 shrink-0 text-accent" />{attentionTitle}</h2>
        <div className="mt-4 grid min-w-0 gap-6 lg:grid-cols-3">
          <Flow id="today-priority" icon={MessageSquare} title={t({ en: 'Priority guest requests', ru: 'Приоритетные обращения', th: 'คำขอเร่งด่วนของแขก' })} count={urgentRequests.length}>
            {urgentRequests.length ? <ul>{urgentRequests.map(r => <RequestRow key={r.id} r={r} />)}</ul> : <Empty text={t({ en: 'No high-priority requests recorded', ru: 'Приоритетных обращений не отмечено', th: 'ไม่มีคำขอเร่งด่วนที่บันทึกไว้' })} />}
          </Flow>
          <Flow icon={AlertTriangle} title={t({ en: 'Maintenance', ru: 'Техническое обслуживание', th: 'ซ่อมบำรุง' })} count={maintenanceUnits.length}>
            {maintenanceUnits.length ? <ul>{maintenanceUnits.map(u => <UnitRow key={u.property_id} u={u} />)}</ul> : <Empty text={t({ en: 'No maintenance signals recorded', ru: 'Признаков ремонта не отмечено', th: 'ไม่มีงานซ่อมที่บันทึกไว้' })} />}
          </Flow>
          <Flow icon={BedDouble} title={t({ en: 'Cleaning', ru: 'Уборка', th: 'ทำความสะอาด' })} count={cleaningUnits.length}>
            {cleaningUnits.length ? <ul>{cleaningUnits.map(u => <UnitRow key={u.property_id} u={u} />)}</ul> : <Empty text={t({ en: 'No cleaning signals recorded', ru: 'Признаков уборки не отмечено', th: 'ไม่มีงานทำความสะอาดที่บันทึกไว้' })} />}
          </Flow>
        </div>
      </section>

      <section aria-labelledby="today-flows" className="min-w-0 border-t border-border pt-5">
        <h2 id="today-flows" className="font-display text-h3">{t({ en: 'Today’s stays', ru: 'Заезды и проживание', th: 'การเข้าพักวันนี้' })}</h2>
        <div className="mt-4 grid min-w-0 gap-6 lg:grid-cols-3">
          <Flow id="today-arrivals" icon={LogIn} title={arrivalsTitle} count={d.arrivals.length}>
            {d.arrivals.length ? <ul>{d.arrivals.map(b => <BookingRow key={b.id} b={b} kind="in" />)}</ul> : <Empty text={t({ en: 'No arrivals today', ru: 'Сегодня заездов нет', th: 'ไม่มีเช็คอินวันนี้' })} />}
          </Flow>
          <Flow id="today-departures" icon={LogOut} title={departuresTitle} count={d.departures.length}>
            {d.departures.length ? <ul>{d.departures.map(b => <BookingRow key={b.id} b={b} kind="out" />)}</ul> : <Empty text={t({ en: 'No departures today', ru: 'Сегодня выездов нет', th: 'ไม่มีเช็คเอาท์วันนี้' })} />}
          </Flow>
          <Flow id="today-in-house" icon={BedDouble} title={inHouseTitle} count={d.inHouse.length}>
            {d.inHouse.length ? <ul>{d.inHouse.map(b => <BookingRow key={b.id} b={b} kind="stay" />)}</ul> : <Empty text={t({ en: 'No guests in-house', ru: 'Проживающих гостей нет', th: 'ไม่มีผู้เข้าพัก' })} />}
          </Flow>
        </div>
      </section>

      <section aria-labelledby="today-requests" className="border-t border-border pt-5">
        <h2 id="today-requests" tabIndex={-1} className="flex scroll-mt-28 items-start gap-2 font-display text-h3">{requestsTitle}<span className="font-mono text-sm text-muted-foreground">{d.guestRequests.length}</span></h2>
        {urgentRequests.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{t({ en: 'High-priority requests are listed above.', ru: 'Приоритетные обращения показаны выше.', th: 'คำขอเร่งด่วนแสดงอยู่ด้านบน' })}</p>}
        {routineRequests.length ? <ul className="mt-2">{routineRequests.map(r => <RequestRow key={r.id} r={r} />)}</ul> : <Empty text={t(d.guestRequests.length ? { en: 'No other open requests', ru: 'Других открытых обращений нет', th: 'ไม่มีคำขออื่นที่เปิดอยู่' } : { en: 'No open guest requests', ru: 'Нерассмотренных обращений нет', th: 'ไม่มีคำขอที่เปิดอยู่' })} />}
      </section>

      <section aria-labelledby="today-units" className="border-t border-border pt-5">
        <h2 id="today-units" className="font-display text-h3">{t({ en: 'Properties', ru: 'Объекты', th: 'ที่พัก' })}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t({ en: 'States are derived from stays, service requests and tasks; they do not confirm inspection or readiness.', ru: 'Состояния определяются по проживанию, заявкам и задачам; они не подтверждают проверку или готовность объекта.', th: 'สถานะมาจากการเข้าพัก คำขอบริการ และงาน ไม่ใช่การยืนยันการตรวจหรือความพร้อม' })}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">{(['occupied','dirty','maintenance','clean'] as UnitState[]).map(s => <div key={s} className="min-w-0">
          <dt className="break-words text-xs text-muted-foreground">{t(STATE_META[s].label)}</dt><dd className="mt-1 font-mono tabular-nums">{d.units.filter(u => u.state === s).length}</dd>
        </div>)}</dl>
        <ul className="mt-4 grid min-w-0 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">{d.units.map(u => <UnitRow key={u.property_id} u={u} />)}</ul>
      </section>
    </>}
    {selectedBooking && <BookingDetailSheet open booking={selectedBooking}
      inventoryBookingId={selectedBooking.canMessageGuest ? selectedBooking.id : undefined} propertyTitle={d.titleOf(selectedBooking.property_id)}
      onOpenChange={open => { if (!open) setSelectedBookingId(null); }} />}
  </PageShell>;
}
