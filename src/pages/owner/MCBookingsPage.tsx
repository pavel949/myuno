import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, isPast, isFuture, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Search, Filter, ChevronDown, MoreHorizontal, Calendar, Users,
  Phone, Mail, MessageCircle, CheckCircle2, XCircle, LogIn, LogOut,
  Plus, Download, Building2, Clock, ArrowUpDown, Eye, Check, X,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAllPropertyBookings, type PropertyBooking } from '@/hooks/usePropertyBookings';
import { supabase } from '@/integrations/supabase/client';
import { BookingDetailSheet } from '@/components/owner/BookingDetailSheet';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'upcoming' | 'active' | 'pending' | 'completed' | 'cancelled';
type SortKey = 'check_in' | 'created_at' | 'total_amount' | 'guest_name';

const STATUS_CONFIG: Record<string, { label: string; labelRu: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color?: string }> = {
  confirmed: { label: 'Confirmed', labelRu: 'Подтверждено', variant: 'default' },
  pending: { label: 'Pending', labelRu: 'Ожидает', variant: 'secondary' },
  cancelled: { label: 'Cancelled', labelRu: 'Отменено', variant: 'destructive' },
  completed: { label: 'Completed', labelRu: 'Завершено', variant: 'outline' },
  checked_in: { label: 'Checked In', labelRu: 'Заселён', variant: 'default', color: 'bg-green-500 hover:bg-green-600' },
};

function getBookingTimeStatus(booking: PropertyBooking): 'upcoming' | 'active' | 'past' {
  const now = new Date();
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  if (isPast(checkOut)) return 'past';
  if (isToday(checkIn) || (isPast(checkIn) && isFuture(checkOut))) return 'active';
  return 'upcoming';
}

export default function MCBookingsPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const { bookings, isLoading } = useAllPropertyBookings();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('check_in');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PropertyBooking | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => {
        const timeStatus = getBookingTimeStatus(b);
        switch (statusFilter) {
          case 'upcoming': return timeStatus === 'upcoming' && b.status !== 'cancelled';
          case 'active': return timeStatus === 'active' || b.status === 'checked_in';
          case 'pending': return b.status === 'pending';
          case 'completed': return b.status === 'completed' || (timeStatus === 'past' && b.status !== 'cancelled');
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
      upcoming: bookings.filter(b => getBookingTimeStatus(b) === 'upcoming' && b.status !== 'cancelled').length,
      active: bookings.filter(b => getBookingTimeStatus(b) === 'active' || b.status === 'checked_in').length,
      pending: bookings.filter(b => b.status === 'pending').length,
    };
  }, [bookings]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

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

  const exportCSV = () => {
    const rows = filteredBookings.map(b => ({
      guest: b.guest_name || '',
      email: b.guest_email || '',
      phone: b.guest_phone || '',
      check_in: b.check_in,
      check_out: b.check_out,
      nights: differenceInDays(new Date(b.check_out), new Date(b.check_in)),
      guests: b.guests_count || '',
      amount: b.total_amount || 0,
      currency: b.currency || 'THB',
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

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Бронирования' : 'Bookings'} />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Бронирования' : 'Bookings'}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button size="sm" onClick={() => navigate('/mc/calendar')}>
              <Plus className="w-4 h-4 mr-1" />
              {isRu ? 'Новое' : 'New'}
            </Button>
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn('text-center p-2 rounded-lg transition-colors', statusFilter === 'all' ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/50')}
        >
          <div className="text-lg font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">{isRu ? 'Всего' : 'Total'}</div>
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={cn('text-center p-2 rounded-lg transition-colors', statusFilter === 'active' ? 'bg-green-500/10 ring-1 ring-green-500' : 'bg-muted/50')}
        >
          <div className="text-lg font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-muted-foreground">{isRu ? 'Сейчас' : 'Active'}</div>
        </button>
        <button
          onClick={() => setStatusFilter('upcoming')}
          className={cn('text-center p-2 rounded-lg transition-colors', statusFilter === 'upcoming' ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/50')}
        >
          <div className="text-lg font-bold">{stats.upcoming}</div>
          <div className="text-xs text-muted-foreground">{isRu ? 'Скоро' : 'Upcoming'}</div>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={cn('text-center p-2 rounded-lg transition-colors', statusFilter === 'pending' ? 'bg-warning/10 ring-1 ring-warning' : 'bg-muted/50')}
        >
          <div className="text-lg font-bold text-warning">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">{isRu ? 'Ожидает' : 'Pending'}</div>
        </button>
      </div>

      {/* Search & Sort */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isRu ? 'Поиск по имени, email, телефону...' : 'Search by name, email, phone...'}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleSort('check_in')}>
              {isRu ? 'По дате заезда' : 'By check-in date'} {sortKey === 'check_in' && (sortAsc ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleSort('created_at')}>
              {isRu ? 'По дате создания' : 'By created date'} {sortKey === 'created_at' && (sortAsc ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleSort('total_amount')}>
              {isRu ? 'По сумме' : 'By amount'} {sortKey === 'total_amount' && (sortAsc ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleSort('guest_name')}>
              {isRu ? 'По имени гостя' : 'By guest name'} {sortKey === 'guest_name' && (sortAsc ? '↑' : '↓')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)} className="mb-4">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all" className="text-xs">{isRu ? 'Все' : 'All'}</TabsTrigger>
          <TabsTrigger value="active" className="text-xs">{isRu ? 'Активные' : 'Active'}</TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs">{isRu ? 'Предстоящие' : 'Upcoming'}</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">{isRu ? 'Ожидающие' : 'Pending'}</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">{isRu ? 'Завершённые' : 'Completed'}</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs">{isRu ? 'Отменённые' : 'Cancelled'}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <Checkbox
            checked={selectedIds.size === filteredBookings.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedIds.size} {isRu ? 'выбрано' : 'selected'}
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Mark confirmed
                const ids = Array.from(selectedIds);
                supabase.from('orders').update({ status: 'confirmed' }).in('id', ids).then(() => {
                  setSelectedIds(new Set());
                  window.location.reload();
                });
              }}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              {isRu ? 'Подтвердить' : 'Confirm'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const ids = Array.from(selectedIds);
                supabase.from('orders').update({ status: 'cancelled' }).in('id', ids).then(() => {
                  setSelectedIds(new Set());
                  window.location.reload();
                });
              }}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              {isRu ? 'Отменить' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">
              {isRu ? 'Нет бронирований' : 'No Bookings'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? (isRu ? 'Ничего не найдено по запросу' : 'No results for this search')
                : (isRu ? 'Бронирования появятся здесь' : 'Bookings will appear here')
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(booking => {
            const checkIn = new Date(booking.check_in);
            const checkOut = new Date(booking.check_out);
            const nights = differenceInDays(checkOut, checkIn);
            const timeStatus = getBookingTimeStatus(booking);
            const statusCfg = STATUS_CONFIG[booking.status || 'pending'] || STATUS_CONFIG.pending;

            return (
              <Card
                key={booking.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedBooking(booking)}
              >
                <CardContent className="p-4">
                  {/* Top row: Guest + Status */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Checkbox
                        checked={selectedIds.has(booking.id)}
                        onCheckedChange={() => toggleSelectBooking(booking.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {booking.guest_name || (isRu ? 'Гость' : 'Guest')}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {booking.guest_phone && (
                          <span className="flex items-center gap-0.5">
                            <Phone className="w-3 h-3" />
                            {booking.guest_phone}
                          </span>
                        )}
                        {booking.guest_email && (
                          <span className="flex items-center gap-0.5 truncate">
                            <Mail className="w-3 h-3" />
                            {booking.guest_email}
                          </span>
                        )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={statusCfg.variant} className={cn('ml-2 flex-shrink-0', statusCfg.color)}>
                      {isRu ? statusCfg.labelRu : statusCfg.label}
                    </Badge>
                  </div>

                  {/* Dates row */}
                  <div className="flex items-center gap-3 text-sm mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{format(checkIn, 'dd MMM', { locale: isRu ? ru : undefined })}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{format(checkOut, 'dd MMM', { locale: isRu ? ru : undefined })}</span>
                    </div>
                    <span className="text-muted-foreground">·</span>
                    <span>{nights} {isRu ? 'н.' : 'n.'}</span>
                    {booking.guests_count && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="flex items-center gap-0.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {booking.guests_count}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Bottom row: Property + Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 truncate flex-1 mr-2">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      {(booking as any).owner_properties?.title
                        || (booking as any).owner_properties?.address
                        || booking.property_id?.slice(0, 8)}
                    </span>
                    {booking.source && booking.source !== 'manual' && (
                      <Badge variant="outline" className="text-xs mr-2">
                        {booking.source}
                      </Badge>
                    )}
                    <span className="font-bold text-sm">
                      {formatPrice(booking.total_amount || 0)}
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
