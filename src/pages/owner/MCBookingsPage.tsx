import { pickLang } from '@/lib/i18n/pickLang';
import '@/styles/premium-workspace.css';
import { propertyBookingStatus } from '@/lib/propertyBookingPresentation';
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { format, differenceInCalendarDays } from 'date-fns';
import { bangkokTodayISO, parseCivilDate } from '@/lib/hotelDates';
import { propertyOrderHoldsInventory } from '@/lib/propertyInventory';
import { ru } from 'date-fns/locale';
import {
  Search, Calendar, Users, Phone, Mail,
  Plus, Download, Building2, ArrowUpDown, Check, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCityCurrency } from '@/hooks/useCityCurrency';
import { useAllPropertyBookings, type PropertyBooking } from '@/hooks/usePropertyBookings';
import { supabase } from '@/integrations/supabase/client';
import { BookingDetailSheet } from '@/components/owner/BookingDetailSheet';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'upcoming' | 'active' | 'pending' | 'completed' | 'cancelled';
type SortKey = 'check_in' | 'created_at' | 'total_amount' | 'guest_name';
type BulkAction = 'confirm' | 'cancel';

const STATUS_FILTERS: { value: StatusFilter; label: string; labelRu: string; labelTh: string }[] = [
  { value: 'all', label: 'All', labelRu: 'Все', labelTh: "ทั้งหมด" },
  { value: 'active', label: 'Active', labelRu: 'Активные', labelTh: "กำลังเข้าพัก" },
  { value: 'upcoming', label: 'Upcoming', labelRu: 'Предстоящие', labelTh: "กำลังจะมาถึง" },
  { value: 'pending', label: 'Pending', labelRu: 'Ожидающие', labelTh: "รอดำเนินการ" },
  { value: 'completed', label: 'Completed', labelRu: 'Завершённые', labelTh: "เสร็จสิ้น" },
  { value: 'cancelled', label: 'Cancelled', labelRu: 'Отменённые', labelTh: "ยกเลิกแล้ว" },
];

const SORT_OPTIONS: { key: SortKey; label: string; labelRu: string; labelTh: string }[] = [
  { key: 'check_in', label: 'By check-in date', labelRu: 'По дате заезда', labelTh: "ตามวันเช็คอิน" },
  { key: 'created_at', label: 'By created date', labelRu: 'По дате создания', labelTh: "ตามวันที่สร้าง" },
  { key: 'total_amount', label: 'By amount', labelRu: 'По сумме', labelTh: "ตามยอดเงิน" },
  { key: 'guest_name', label: 'By guest name', labelRu: 'По имени гостя', labelTh: "ตามชื่อผู้เข้าพัก" },
];

// These rows are order projections. Financial releases use order semantics;
// completed/checked-out stays remain historical even before their scheduled end.
function isCurrentStay(booking: PropertyBooking): boolean {
  return propertyOrderHoldsInventory(booking.status)
    && booking.status !== 'completed' && booking.status !== 'checked_out';
}

function getBookingTimeStatus(booking: PropertyBooking): 'upcoming' | 'active' | 'past' {
  const today = bangkokTodayISO();
  if (booking.check_out <= today) return 'past';
  if (booking.check_in <= today && today < booking.check_out) return 'active';
  return 'upcoming';
}

export default function MCBookingsPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { code: cityCurrencyCode } = useCityCurrency();
  const isRu = language === 'ru';

  const { bookings, isLoading, error, refetch } = useAllPropertyBookings();

  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const statusFilter: StatusFilter = STATUS_FILTERS.some(option => option.value === params.get('status')) ? params.get('status') as StatusFilter : 'all';
  const sortKey: SortKey = SORT_OPTIONS.some(option => option.key === params.get('sort')) ? params.get('sort') as SortKey : 'check_in';
  const sortAsc = params.get('direction') === 'asc';
  const setStatusFilter = (value: StatusFilter) => setParams(previous => {
    const next = new URLSearchParams(previous); if (value === 'all') next.delete('status'); else next.set('status', value); return next;
  }, { replace: true, state: location.state });
  // Free-text search can contain guest details; keep it out of shareable URLs.
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<PropertyBooking | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingBulkAction, setPendingBulkAction] = useState<BulkAction | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => {
        const timeStatus = getBookingTimeStatus(b);
        switch (statusFilter) {
          case 'upcoming': return timeStatus === 'upcoming' && isCurrentStay(b);
          case 'active': return timeStatus === 'active' && isCurrentStay(b);
          case 'pending': return b.status === 'pending';
          case 'completed': return b.status === 'completed' || b.status === 'checked_out' || (timeStatus === 'past' && propertyOrderHoldsInventory(b.status));
          case 'cancelled': return b.status === 'cancelled';
          default: return true;
        }
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => {
        const propTitle = (b as any).owner_properties?.title?.toLowerCase() || '';
        return (
          b.guest_name?.toLowerCase().includes(q) ||
          b.guest_email?.toLowerCase().includes(q) ||
          b.guest_phone?.includes(q) ||
          propTitle.includes(q) ||
          b.id.includes(q)
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'check_in':
          cmp = new Date(a.check_in).getTime() - new Date(b.check_in).getTime();
          break;
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'total_amount':
          cmp = (a.total_amount || 0) - (b.total_amount || 0);
          break;
        case 'guest_name':
          cmp = (a.guest_name || '').localeCompare(b.guest_name || '');
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return filtered;
  }, [bookings, statusFilter, searchQuery, sortKey, sortAsc]);

  // Stats
  const stats = useMemo(() => {
    if (!bookings) return { total: 0, upcoming: 0, active: 0, pending: 0 };
    return {
      total: bookings.length,
      upcoming: bookings.filter(b => getBookingTimeStatus(b) === 'upcoming' && isCurrentStay(b)).length,
      active: bookings.filter(b => getBookingTimeStatus(b) === 'active' && isCurrentStay(b)).length,
      pending: bookings.filter(b => b.status === 'pending').length,
    };
  }, [bookings]);

  const toggleSort = (key: SortKey) => setParams(previous => {
    const next = new URLSearchParams(previous);
    next.set('sort', key); next.set('direction', key === sortKey && !sortAsc ? 'asc' : 'desc');
    return next;
  }, { replace: true, state: location.state });

  const toggleSelectBooking = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookings.map(b => b.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setPendingBulkAction(null);
  };

  const executeBulkAction = (action: BulkAction) => {
    const ids = Array.from(selectedIds);
    const status = action === 'confirm' ? 'confirmed' : 'cancelled';
    setBulkBusy(true);
    supabase.from('orders').update({ status }).in('id', ids).then(({ error }) => {
      setBulkBusy(false);
      if (error) {
        toast.error(action === 'confirm'
          ? (pickLang(language, {"ru": "Не удалось подтвердить брони", "en": "Failed to confirm bookings", "th": "ยืนยันการจองไม่สำเร็จ"}))
          : (pickLang(language, {"ru": "Не удалось отменить брони", "en": "Failed to cancel bookings", "th": "ยกเลิกการจองไม่สำเร็จ"})));
        return;
      }
      clearSelection();
      window.location.reload();
    });
  };

  const exportCSV = () => {
    const rows = filteredBookings.map(b => ({
      guest: b.guest_name || '',
      email: b.guest_email || '',
      phone: b.guest_phone || '',
      check_in: b.check_in,
      check_out: b.check_out,
      nights: differenceInCalendarDays(parseCivilDate(b.check_out), parseCivilDate(b.check_in)),
      guests: b.guests_count || '',
      amount: b.total_amount || 0,
      currency: b.currency || cityCurrencyCode,
      status: b.status || 'pending',
      property: (b as any).owner_properties?.title || b.property_id,
      source: b.source || 'manual',
    }));
    const header = Object.keys(rows[0] || {}).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return <PageContainer className="mc-workspace-page mc-bookings-page">
      <PageHeader title={pickLang(language, {"ru": "Бронирования", "en": "Bookings", "th": "การจอง"})} />
      <div role="alert" className="space-y-3 text-sm text-destructive">
        <p>{pickLang(language, {"ru": "Не удалось загрузить бронирования", "en": "Could not load bookings", "th": "ไม่สามารถโหลดการจองได้"})}</p>
        <Button variant="outline" onClick={() => refetch()}>{pickLang(language, {"ru": "Повторить", "en": "Retry", "th": "ลองอีกครั้ง"})}</Button>
      </div>
    </PageContainer>;
  }

  if (isLoading) {
    return (
      <PageContainer className="mc-workspace-page mc-bookings-page">
        <PageHeader title={pickLang(language, {"ru": "Бронирования", "en": "Bookings", "th": "การจอง"})} />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-none" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="mc-workspace-page mc-bookings-page">
      <header className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-h3 text-foreground break-words min-w-0">
          {pickLang(language, {"ru": "Бронирования", "en": "Bookings", "th": "การจอง"})}
        </h1>
        <Button className="w-full sm:w-auto min-h-11" onClick={() => navigate('/mc/calendar')}>
          <Plus className="w-4 h-4" aria-hidden="true" />
          {pickLang(language, {"ru": "Новое бронирование", "en": "New Booking", "th": "เพิ่มการจอง"})}
        </Button>
      </header>

      {/* Compact KPI summary — each tile also selects the matching filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4" role="group" aria-label={pickLang(language, {"ru": "Сводка бронирований", "en": "Bookings summary", "th": "สรุปการจอง"})}>
        {([
          { filter: 'all' as StatusFilter, value: stats.total, label: pickLang(language, {"ru": "Всего", "en": "Total", "th": "ทั้งหมด"}) },
          { filter: 'active' as StatusFilter, value: stats.active, label: pickLang(language, {"ru": "Сейчас", "en": "Active", "th": "กำลังเข้าพัก"}) },
          { filter: 'upcoming' as StatusFilter, value: stats.upcoming, label: pickLang(language, {"ru": "Скоро", "en": "Upcoming", "th": "กำลังจะมาถึง"}) },
          { filter: 'pending' as StatusFilter, value: stats.pending, label: pickLang(language, {"ru": "Ожидает", "en": "Pending", "th": "รอดำเนินการ"}) },
        ]).map(tile => (
          <Button
            key={tile.filter}
            variant="ghost"
            onClick={() => setStatusFilter(tile.filter)}
            aria-pressed={statusFilter === tile.filter}
            className={cn(
              'justify-between gap-2 text-left px-3 py-2 rounded-none transition-colors min-h-11 h-auto',
              statusFilter === tile.filter ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/50',
            )}
          >
            <div className="text-base font-bold leading-tight">{tile.value}</div>
            <div className="text-xs text-muted-foreground">{tile.label}</div>
          </Button>
        ))}
      </div>

      {/* Search, utilities and status share one bounded control area. */}
      <section className="min-w-0 space-y-2 border-y border-border py-3 mb-4" aria-label={pickLang(language, {"ru": "Поиск и фильтры бронирований", "en": "Booking search and filters", "th": "ค้นหาและกรองการจอง"})}>
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={pickLang(language, {"ru": "Поиск по имени, email, телефону...", "en": "Search by name, email, phone...", "th": "ค้นหาชื่อ อีเมล หรือโทรศัพท์..."})}
            aria-label={pickLang(language, {"ru": "Поиск бронирований", "en": "Search bookings", "th": "ค้นหาการจอง"})}
            className="pl-9 min-h-11"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title={pickLang(language, {"ru": "Сортировка", "en": "Sort", "th": "เรียงลำดับ"})} aria-label={pickLang(language, {"ru": "Сортировка", "en": "Sort", "th": "เรียงลำดับ"})}>
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map(opt => (
              <DropdownMenuItem key={opt.key} onClick={() => toggleSort(opt.key)}>
                {pickLang(language, { ru: opt.labelRu, en: opt.label, th: opt.labelTh })} {sortKey === opt.key && (sortAsc ? '↑' : '↓')}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" onClick={exportCSV}
          title={pickLang(language, {"ru": "Экспортировать список в CSV", "en": "Export list to CSV", "th": "ส่งออกรายการเป็น CSV"})}
          aria-label={pickLang(language, {"ru": "Экспортировать список в CSV", "en": "Export list to CSV", "th": "ส่งออกรายการเป็น CSV"})}>
          <Download className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Status filters — bounded grid, no horizontal page overflow */}
      <div
        className="grid grid-cols-2 min-[390px]:grid-cols-3 lg:grid-cols-6 gap-1"
        role="group"
        aria-label={pickLang(language, {"ru": "Фильтр по статусу", "en": "Filter by status", "th": "กรองตามสถานะ"})}
      >
        {STATUS_FILTERS.map(f => (
          <Button
            key={f.value}
            variant="ghost"
            onClick={() => setStatusFilter(f.value)}
            aria-pressed={statusFilter === f.value}
            className={cn(
              'px-2 py-2 text-xs rounded-none border transition-colors whitespace-normal break-words min-h-11 h-auto focus-visible:ring-2 focus-visible:ring-ring',
              statusFilter === f.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground',
            )}
          >
            {pickLang(language, { ru: f.labelRu, en: f.label, th: f.labelTh })}
          </Button>
        ))}
      </div>

      </section>

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 p-2 bg-muted border border-border rounded-none" role="group" aria-label={pickLang(language, {"ru": "Действия с выбранными бронированиями", "en": "Selected booking actions", "th": "การดำเนินการกับการจองที่เลือก"})}>
          <Checkbox
            className="h-11 w-11 shrink-0"
            checked={selectedIds.size === filteredBookings.length}
            onCheckedChange={toggleSelectAll}
            aria-label={pickLang(language, {"ru": "Выбрать все видимые бронирования", "en": "Select all visible bookings", "th": "เลือกการจองที่แสดงทั้งหมด"})}
          />
          <span className="text-sm font-medium">
            {selectedIds.size} {pickLang(language, {"ru": "выбрано", "en": "selected", "th": "รายการที่เลือก"})}
          </span>
          <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto sm:ml-auto">
            {pendingBulkAction === null ? (
              <>
                <Button className="min-h-11 px-2" size="sm" variant="outline" onClick={() => setPendingBulkAction('confirm')}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {pickLang(language, {"ru": "Подтвердить", "en": "Confirm", "th": "ยืนยัน"})}
                </Button>
                <Button className="min-h-11 px-2" size="sm" variant="outline" onClick={() => setPendingBulkAction('cancel')}>
                  <X className="w-3.5 h-3.5 mr-1" />
                  {pickLang(language, {"ru": "Отменить", "en": "Cancel", "th": "ยกเลิก"})}
                </Button>
                <Button className="min-h-11 px-2" size="sm" variant="ghost" onClick={clearSelection}>
                  {pickLang(language, {"ru": "Снять выбор", "en": "Clear", "th": "ล้าง"})}
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-muted-foreground break-words flex-1 min-w-0">
                  {pendingBulkAction === 'confirm'
                    ? (isRu ? `Подтвердить ${selectedIds.size} бронирований?` : `Confirm ${selectedIds.size} bookings?`)
                    : (isRu ? `Отменить ${selectedIds.size} бронирований?` : `Cancel ${selectedIds.size} bookings?`)}
                </span>
                <Button
                  size="sm"
                  className="min-h-11 min-w-11"
                  variant={pendingBulkAction === 'cancel' ? 'destructive' : 'default'}
                  disabled={bulkBusy}
                  onClick={() => executeBulkAction(pendingBulkAction)}
                >
                  {pickLang(language, {"ru": "Да", "en": "Yes", "th": "ใช่"})}
                </Button>
                <Button className="min-h-11 min-w-11" size="sm" variant="ghost" disabled={bulkBusy} onClick={() => setPendingBulkAction(null)}>
                  {pickLang(language, {"ru": "Нет", "en": "No", "th": "ไม่"})}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bookings list */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">
              {pickLang(language, {"ru": "Нет бронирований", "en": "No Bookings", "th": "ยังไม่มีการจอง"})}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? (pickLang(language, {"ru": "Ничего не найдено по запросу", "en": "No results for this search", "th": "ไม่พบผลลัพธ์สำหรับการค้นหานี้"}))
                : (pickLang(language, {"ru": "Бронирования появятся здесь", "en": "Bookings will appear here", "th": "การจองจะแสดงที่นี่"}))
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(booking => {
            const checkIn = parseCivilDate(booking.check_in);
            const checkOut = parseCivilDate(booking.check_out);
            const nights = differenceInCalendarDays(checkOut, checkIn);
            const statusCfg = propertyBookingStatus(booking.status);
            const guestName = booking.guest_name || (pickLang(language, {"ru": "Гость", "en": "Guest", "th": "ผู้เข้าพัก"}));

            return (
              <Card
                key={booking.id}
                className="cursor-pointer min-w-0 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                tabIndex={0}
                role="group"
                aria-label={isRu ? `Бронирование: ${guestName}` : `Booking: ${guestName}`}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setSelectedBooking(booking);
                  }
                }}
                onClick={() => setSelectedBooking(booking)}
              >
                <CardContent className="p-3 sm:p-4">
                  {/* Top row: selection + guest + status */}
                  <div className="flex flex-wrap items-start gap-2 mb-3">
                    <div className="flex items-start gap-2 w-full min-w-0">
                      {/* Selection zone: fully isolated from card click, 44px touch target */}
                      <span
                        role="presentation"
                        className="flex items-center justify-center w-11 h-11 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          className="w-11 h-11"
                          onClick={(e) => e.stopPropagation()}
                          checked={selectedIds.has(booking.id)}
                          onCheckedChange={() => toggleSelectBooking(booking.id)}
                          aria-label={isRu ? `Выбрать бронирование: ${guestName}` : `Select booking: ${guestName}`}
                        />
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm break-words" title={guestName}>{guestName}</h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          {booking.guest_phone && (
                            <span className="flex items-start gap-1 min-w-0 max-w-full">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span className="break-all" title={booking.guest_phone}>{booking.guest_phone}</span>
                            </span>
                          )}
                          {booking.guest_email && (
                            <span className="flex items-start gap-1 min-w-0 max-w-full">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="break-all" title={booking.guest_email}>{booking.guest_email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={statusCfg.variant} className={cn('max-w-full whitespace-normal break-words')}>
                      {pickLang(language, { ru: statusCfg.labelRu, en: statusCfg.label, th: statusCfg.labelTh })}
                    </Badge>
                  </div>

                  {/* Dates row — wraps on narrow screens */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="whitespace-nowrap">{format(checkIn, 'dd MMM', { locale: isRu ? ru : undefined })}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="whitespace-nowrap">{format(checkOut, 'dd MMM', { locale: isRu ? ru : undefined })}</span>
                    </div>
                    <span className="text-muted-foreground hidden sm:inline">·</span>
                    <span className="whitespace-nowrap">{nights} {pickLang(language, {"ru": "н.", "en": "n.", "th": "คืน"})}</span>
                    {booking.guests_count && (
                      <>
                        <span className="text-muted-foreground hidden sm:inline">·</span>
                        <span className="flex items-center gap-0.5 whitespace-nowrap">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {booking.guests_count}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Bottom row: property + amount */}
                  <div className="flex flex-wrap items-start gap-2 border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground flex items-start gap-1 min-w-0 w-full">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="break-words">
                        {(booking as any).owner_properties?.title
                          || (booking as any).owner_properties?.address
                          || booking.property_id?.slice(0, 8)}
                      </span>
                    </span>
                    {booking.source && booking.source !== 'manual' && (
                      <Badge variant="outline" className="text-xs max-w-full whitespace-normal break-all">
                        {booking.source}
                      </Badge>
                    )}
                    <span className="font-mono font-bold text-sm break-all max-w-full ml-auto">
                      {typeof booking.total_amount === 'number' && Number.isFinite(booking.total_amount)
                        ? `${booking.total_amount.toLocaleString(isRu ? 'ru-RU' : 'en-US')} ${booking.currency || (pickLang(language, {"ru": "(валюта неизвестна)", "en": "(currency unavailable)", "th": "(ไม่มีข้อมูลสกุลเงิน)"}))}`
                        : (pickLang(language, {"ru": "Стоимость неизвестна", "en": "Total unavailable", "th": "ไม่มีข้อมูลยอดรวม"}))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Detail Sheet */}
      <BookingDetailSheet
        open={!!selectedBooking}
        onOpenChange={(open) => { if (!open) setSelectedBooking(null); }}
        booking={selectedBooking}
        propertyTitle={(selectedBooking as any)?.owner_properties?.title}
      />
    </PageContainer>
  );
}

