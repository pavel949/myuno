/**
 * PmsTodayPage — /mc/today. Operational "Today" board for PMS operators.
 * Data: usePmsToday (existing bookings + service requests + tasks).
 */
import { Link } from 'react-router-dom';
import { LogIn, LogOut, BedDouble, MessageSquare, RefreshCw, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePmsToday, type TodayBooking, type UnitState } from '@/hooks/usePmsToday';

type T = { en: string; ru: string; th: string };

const STATE_META: Record<UnitState, { label: T; cls: string }> = {
  occupied: { label: { en: 'Occupied', ru: 'Занят', th: 'มีผู้เข้าพัก' }, cls: 'border-primary bg-primary/10 text-primary' },
  dirty: { label: { en: 'Needs cleaning', ru: 'Нужна уборка', th: 'ต้องทำความสะอาด' }, cls: 'border-accent bg-accent/10 text-accent' },
  maintenance: { label: { en: 'Maintenance', ru: 'Ремонт', th: 'ซ่อมบำรุง' }, cls: 'border-destructive bg-destructive/10 text-destructive' },
  clean: { label: { en: 'Vacant · clean', ru: 'Свободен · чисто', th: 'ว่าง · สะอาด' }, cls: 'border-border bg-muted text-muted-foreground' },
};

export default function PmsTodayPage() {
  const { language } = useLanguage();
  const t = (v: T) => pickLang(language, v);
  const d = usePmsToday();
  const dateLabel = new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const counts = (['occupied', 'dirty', 'maintenance', 'clean'] as UnitState[]).map((s) => ({
    s, n: d.units.filter((u) => u.state === s).length,
  }));

  const BookingRow = ({ b, kind }: { b: TodayBooking; kind: 'in' | 'out' | 'stay' }) => (
    <li className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{b.guest_name || t({ en: 'Guest', ru: 'Гость', th: 'ผู้เข้าพัก' })}</p>
        <p className="truncate text-sm text-muted-foreground">
          {d.titleOf(b.property_id)} · {b.guests_count ?? 1} {t({ en: 'guests', ru: 'гост.', th: 'คน' })}
          {kind === 'stay' && ` · ${t({ en: 'until', ru: 'до', th: 'ถึง' })} ${b.check_out.slice(5, 10)}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {b.source && <Badge variant="outline" className="font-mono text-[10px]">{b.source}</Badge>}
        {b.guest_phone && (
          <Button asChild size="icon" variant="ghost" aria-label={t({ en: 'Call guest', ru: 'Позвонить гостю', th: 'โทรหาผู้เข้าพัก' })}>
            <a href={`tel:${b.guest_phone}`}><Phone className="size-4" /></a>
          </Button>
        )}
      </div>
    </li>
  );

  const Panel = ({ icon: Icon, title, count, children }: { icon: typeof LogIn; title: string; count: number; children: React.ReactNode }) => (
    <section className="border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 font-medium text-foreground"><Icon className="size-4 text-primary" aria-hidden />{title}</h2>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{count}</span>
      </header>
      <div className="px-4">{children}</div>
    </section>
  );

  const Empty = ({ text }: { text: string }) => <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;

  if (!d.isLoading && !d.hasProperties) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="font-serif text-2xl text-foreground">{t({ en: 'Today', ru: 'Сегодня', th: 'วันนี้' })}</h1>
        <p className="mt-2 text-muted-foreground">{t({ en: 'Add a property to see arrivals and departures here.', ru: 'Добавьте объект, чтобы видеть здесь заезды и выезды.', th: 'เพิ่มที่พักเพื่อดูการเช็คอินและเช็คเอาท์' })}</p>
        <Button asChild className="mt-6"><Link to={APP_ROUTES.MC_PROPERTIES}>{t({ en: 'Go to properties', ru: 'К объектам', th: 'ไปที่ที่พัก' })}</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{dateLabel}</p>
          <h1 className="font-serif text-3xl text-foreground">{t({ en: 'Today', ru: 'Сегодня', th: 'วันนี้' })}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => d.refetch()} className="min-h-11">
          <RefreshCw className="mr-2 size-4" />{t({ en: 'Refresh', ru: 'Обновить', th: 'รีเฟรช' })}
        </Button>
      </header>

      {d.error && (
        <div role="alert" className="border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {t({ en: 'Could not load today’s data. Try refreshing.', ru: 'Не удалось загрузить данные на сегодня. Попробуйте обновить.', th: 'โหลดข้อมูลไม่สำเร็จ ลองรีเฟรช' })}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: { en: 'Arrivals', ru: 'Заезды', th: 'เช็คอิน' }, n: d.arrivals.length },
          { l: { en: 'Departures', ru: 'Выезды', th: 'เช็คเอาท์' }, n: d.departures.length },
          { l: { en: 'In-house', ru: 'Проживают', th: 'กำลังเข้าพัก' }, n: d.inHouse.length },
          { l: { en: 'Guest requests', ru: 'Запросы гостей', th: 'คำขอของแขก' }, n: d.guestRequests.length },
        ].map((k) => (
          <div key={k.l.en} className="border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(k.l)}</p>
            {d.isLoading ? <Skeleton className="mt-2 h-8 w-12" /> : <p className="mt-1 font-mono text-3xl tabular-nums text-foreground">{k.n}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel icon={LogIn} title={t({ en: 'Arrivals', ru: 'Заезды', th: 'เช็คอิน' })} count={d.arrivals.length}>
          {d.isLoading ? <Skeleton className="my-4 h-16" /> : d.arrivals.length ? (
            <ul>{d.arrivals.map((b) => <BookingRow key={b.id} b={b} kind="in" />)}</ul>
          ) : <Empty text={t({ en: 'No arrivals today', ru: 'Сегодня заездов нет', th: 'ไม่มีเช็คอินวันนี้' })} />}
        </Panel>
        <Panel icon={LogOut} title={t({ en: 'Departures', ru: 'Выезды', th: 'เช็คเอาท์' })} count={d.departures.length}>
          {d.isLoading ? <Skeleton className="my-4 h-16" /> : d.departures.length ? (
            <ul>{d.departures.map((b) => <BookingRow key={b.id} b={b} kind="out" />)}</ul>
          ) : <Empty text={t({ en: 'No departures today', ru: 'Сегодня выездов нет', th: 'ไม่มีเช็คเอาท์วันนี้' })} />}
        </Panel>
        <Panel icon={BedDouble} title={t({ en: 'In-house', ru: 'Проживают', th: 'กำลังเข้าพัก' })} count={d.inHouse.length}>
          {d.isLoading ? <Skeleton className="my-4 h-16" /> : d.inHouse.length ? (
            <ul>{d.inHouse.map((b) => <BookingRow key={b.id} b={b} kind="stay" />)}</ul>
          ) : <Empty text={t({ en: 'No guests in-house', ru: 'Сейчас никто не проживает', th: 'ไม่มีผู้เข้าพัก' })} />}
        </Panel>
      </div>

      {/* Unit board */}
      <section className="border border-border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="font-medium text-foreground">{t({ en: 'Units', ru: 'Объекты', th: 'ยูนิต' })}</h2>
          <div className="flex flex-wrap gap-2">
            {counts.map(({ s, n }) => (
              <span key={s} className={cn('border px-2 py-0.5 text-xs', STATE_META[s].cls)}>{t(STATE_META[s].label)} · {n}</span>
            ))}
          </div>
        </header>
        {d.isLoading ? <div className="p-4"><Skeleton className="h-24" /></div> : (
          <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {d.units.map((u) => (
              <li key={u.property_id} className="bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate font-medium text-foreground">{u.title}</p>
                  <span className={cn('shrink-0 border px-2 py-0.5 text-xs', STATE_META[u.state].cls)}>{t(STATE_META[u.state].label)}</span>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {u.booking?.guest_name ?? t({ en: 'No guest today', ru: 'Сегодня без гостя', th: 'ไม่มีแขกวันนี้' })}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          {t({
            en: 'Cleaning and maintenance states come from open service requests and tasks.',
            ru: 'Статусы уборки и ремонта берутся из открытых заявок на обслуживание и задач.',
            th: 'สถานะทำความสะอาดและซ่อมบำรุงมาจากคำขอบริการและงานที่เปิดอยู่',
          })}
        </p>
      </section>

      <Panel icon={MessageSquare} title={t({ en: 'Guest requests', ru: 'Запросы гостей', th: 'คำขอของแขก' })} count={d.guestRequests.length}>
        {d.isLoading ? <Skeleton className="my-4 h-16" /> : d.guestRequests.length ? (
          <ul>
            {d.guestRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{r.service_type.replace(/_/g, ' ')}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {d.titleOf(r.property_id)}{r.guest_name ? ` · ${r.guest_name}` : ''}{r.description ? ` · ${r.description}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {r.priority && r.priority !== 'normal' && <Badge variant="outline">{r.priority}</Badge>}
                  <Badge variant="secondary">{r.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty text={t({ en: 'No open guest requests', ru: 'Открытых запросов нет', th: 'ไม่มีคำขอที่เปิดอยู่' })} />}
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="min-h-11"><Link to={APP_ROUTES.MC_CALENDAR}>{t({ en: 'Open calendar', ru: 'Открыть календарь', th: 'เปิดปฏิทิน' })}</Link></Button>
        <Button asChild variant="outline" className="min-h-11"><Link to={APP_ROUTES.MC_TASKS}>{t({ en: 'Open tasks', ru: 'Открыть задачи', th: 'เปิดงาน' })}</Link></Button>
      </div>
    </div>
  );
}
