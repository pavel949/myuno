/**
 * Resort ops: villa -> room-key availability grid for one complex.
 * Gated by `feature_flag:layantara_pms`. Read-only except the existing
 * add-booking dialog and the turnover-task backfill.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLayantaraPmsFlagState } from '@/hooks/useLayantaraPms';
import { useComplexKeyGrid } from '@/hooks/useComplexKeyGrid';
import { useResortProjects } from '@/hooks/useResortProjects';
import { usePropertyBookings } from '@/hooks/usePropertyBookings';
import { bangkokTodayISO, parseCivilDate } from '@/lib/hotelDates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResortGrid } from '@/components/owner/pms/ResortGrid';
import { TurnoverBackfillBanner } from '@/components/owner/pms/TurnoverBackfillBanner';
import { AddBookingFromCalendarDialog } from '@/components/owner/AddBookingFromCalendarDialog';
import { BookingDetailSheet } from '@/components/owner/BookingDetailSheet';
import type { HeldBooking } from '@/lib/pms/bookingConflicts';
import type { KeyProperty } from '@/lib/pms/complexHierarchy';

type WindowDays = 14 | 30;

interface DetailTarget { propertyId: string; booking: HeldBooking }

function BookingDetailLoader({ target, title, onClose }: { target: DetailTarget; title: string; onClose: () => void }) {
  const { bookings } = usePropertyBookings(target.propertyId);
  const orderId = target.booking.orderId;
  const found = orderId ? (bookings ?? []).find(b => b.id === orderId || b.order_id === orderId) ?? null : null;
  return <BookingDetailSheet open onOpenChange={open => !open && onClose()} booking={found} propertyTitle={title} />;
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-xl p-4 sm:p-6">
      <div className="border border-border bg-card p-6" role="status">
        <h1 className="font-display text-xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function villaLabelMap(keys: readonly KeyProperty[], language: string): Map<string, string> {
  return new Map(keys.filter(k => !k.parentId).map(k => {
    const title = language === 'ru' && k.titleRu ? k.titleRu : k.title;
    return [k.id, k.unitNumber ? `${k.unitNumber} · ${title}` : title] as const;
  }));
}

export default function ResortOpsPage() {
  const { t, language } = useLanguage();
  const flag = useLayantaraPmsFlagState();
  const projects = useResortProjects();
  const [pickedProject, setPickedProject] = useState<string | null>(null);
  const today = bangkokTodayISO();
  const [from, setFrom] = useState(today);
  const [days, setDays] = useState<WindowDays>(14);
  const [addFor, setAddFor] = useState<{ propertyId: string; date: string } | null>(null);
  const [detail, setDetail] = useState<DetailTarget | null>(null);

  const projectList = projects.data ?? [];
  const projectId = pickedProject ?? (projectList.length === 1 ? projectList[0].id : null);
  const grid = useComplexKeyGrid(flag.enabled ? projectId : null, from, days);
  const villaLabels = useMemo(() => villaLabelMap(grid.keys, language), [grid.keys, language]);

  if (flag.isLoading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (flag.isError) return <Notice title={t('pms.resort.title')} body={t('pms.resort.flagError')} />;
  if (!flag.enabled) return <Notice title={t('pms.resort.title')} body={t('pms.resort.notEnabled')} />;

  const openBooked = (propertyId: string, bookingId: string) => {
    const booking = grid.bookings.find(b => b.id === bookingId);
    if (booking) setDetail({ propertyId, booking });
  };
  const detailTitle = detail ? grid.keys.find(k => k.id === detail.propertyId)?.title ?? '' : '';

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl">{t('pms.resort.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {projectList.length > 1 && (
            <Select value={projectId ?? ''} onValueChange={setPickedProject}>
              <SelectTrigger className="w-52" aria-label={t('pms.resort.project')}>
                <SelectValue placeholder={t('pms.resort.project')} />
              </SelectTrigger>
              <SelectContent>
                {projectList.map(p => (
                  <SelectItem key={p.id} value={p.id}>{language === 'ru' && p.nameRu ? p.nameRu : p.nameEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input type="date" value={from} onChange={e => e.target.value && setFrom(e.target.value)} className="w-40" aria-label={t('pms.resort.from')} />
          {([14, 30] as const).map(n => (
            <Button key={n} size="sm" variant={days === n ? 'default' : 'outline'} onClick={() => setDays(n)}>
              {t(`pms.resort.days${n}`)}
            </Button>
          ))}
        </div>
      </header>

      {projects.isLoading && <Skeleton className="h-10 w-full" />}
      {projects.error && <ErrorBox message={t('pms.resort.loadError')} onRetry={() => projects.refetch()} retry={t('pms.resort.retry')} />}
      {!projects.isLoading && !projects.error && projectList.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('pms.resort.noProjects')}</p>
      )}
      {projectList.length > 1 && !projectId && <p className="text-sm text-muted-foreground">{t('pms.resort.pickProject')}</p>}

      {grid.isLoading && <Skeleton className="h-64 w-full" />}
      {grid.error && <ErrorBox message={t('pms.resort.loadError')} onRetry={() => grid.refetch()} retry={t('pms.resort.retry')} />}

      {grid.hierarchy && !grid.error && (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">{t('pms.resort.villas')}: {grid.hierarchy.villaCount}</Badge>
            <Badge variant="outline">{t('pms.resort.keys')}: {grid.hierarchy.keyCount}</Badge>
            <Badge variant={grid.hierarchy.issues.length > 0 ? 'destructive' : 'outline'}>
              {t('pms.resort.issues')}: {grid.hierarchy.issues.length}
            </Badge>
          </div>
          <TurnoverBackfillBanner bookings={grid.bookings} keys={grid.keys} today={today} />
          <ResortGrid
            rows={grid.rows}
            totals={grid.totals}
            villaLabels={villaLabels}
            onFreeCell={(propertyId, date) => setAddFor({ propertyId, date })}
            onBookedCell={openBooked}
          />
        </>
      )}

      {addFor && (
        <AddBookingFromCalendarDialog
          open
          onOpenChange={open => !open && setAddFor(null)}
          propertyId={addFor.propertyId}
          initialDate={parseCivilDate(addFor.date)}
          onSuccess={() => { setAddFor(null); void grid.refetch(); }}
        />
      )}
      {detail && <BookingDetailLoader target={detail} title={detailTitle} onClose={() => setDetail(null)} />}
    </div>
  );
}

function ErrorBox({ message, onRetry, retry }: { message: string; onRetry: () => void; retry: string }) {
  return (
    <div role="alert" className="flex items-center gap-3 border border-destructive/40 bg-destructive/10 p-3 text-sm">
      <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <Button size="sm" variant="outline" onClick={onRetry}>
        {retry}
      </Button>
    </div>
  );
}
