import { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyBookings, PropertyBooking } from '@/hooks/usePropertyBookings';
import { useOperationalTasks, OperationalTask } from '@/hooks/useOperationalTasks';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { usePropertyRentalTerms } from '@/hooks/usePropertyAvailability';
import { usePropertyRateSeasons } from '@/hooks/usePropertyRateSeasons';
import { buildPricingRulesFromSeasons, getEffectiveNightlyRate } from '@/lib/pricingEngine';
import { CalendarDayEventsSheet } from './CalendarDayEventsSheet';
import { CreateServiceTaskDialog } from './CreateServiceTaskDialog';
import { AddBookingFromCalendarDialog } from './AddBookingFromCalendarDialog';
import { BlockDatesDialog } from './BlockDatesDialog';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Sparkles, Wrench, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropertyReference } from '@/types/property';

interface AirbnbCalendarGridProps {
  propertyId?: string;
  properties?: PropertyReference[];
}

interface BookingSpan {
  booking: PropertyBooking;
  startCol: number; // 0-6, which column in the week row
  spanCols: number; // how many cells wide
  isStart: boolean;
  isEnd: boolean;
}

export function AirbnbCalendarGrid({ propertyId, properties = [] }: AirbnbCalendarGridProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventsSheet, setShowEventsSheet] = useState(false);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [showAddBookingDialog, setShowAddBookingDialog] = useState(false);
  const [showBlockDatesDialog, setShowBlockDatesDialog] = useState(false);
  const [blockDialogMode, setBlockDialogMode] = useState<'block' | 'unblock'>('block');

  const { bookings, getBookingForDate } = usePropertyBookings(propertyId);
  const { tasks, completeTask } = useOperationalTasks({ propertyId });
  const { availability } = usePropertyAvailabilityManagement(propertyId);
  const { data: rentalTerms } = usePropertyRentalTerms(propertyId);
  const { data: rateSeasons } = usePropertyRateSeasons(propertyId);

  const basePrice = rentalTerms?.price_per_night ?? 0;
  const seasonalPricing = useMemo(() => {
    if (!rateSeasons?.length || !basePrice) return undefined;
    const rules = buildPricingRulesFromSeasons(
      { price_per_night: basePrice },
      rateSeasons,
    );
    return rules.seasonalPricing;
  }, [rateSeasons, basePrice]);

  const formatPriceShort = useCallback((price: number) => {
    if (!price) return '';
    return price >= 1000
      ? `${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`
      : String(price);
  }, []);

  // Build weeks for the grid
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows: Date[][] = [];
    let day = calStart;
    while (day <= calEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      rows.push(week);
    }
    return rows;
  }, [currentMonth]);

  // Event/task maps
  const taskMap = useMemo(() => {
    const map = new Map<string, OperationalTask[]>();
    tasks?.forEach(task => {
      const key = task.scheduled_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks]);

  const availabilityMap = useMemo(() => {
    const map = new Map<string, { status: string; priceOverride?: number; note?: string }>();
    availability?.forEach(entry => {
      const key = format(entry.date, 'yyyy-MM-dd');
      map.set(key, { status: entry.status, priceOverride: entry.priceOverride, note: entry.note });
    });
    return map;
  }, [availability]);

  // Compute booking spans per week row
  const weekBookingSpans = useMemo(() => {
    if (!bookings?.length) return new Map<number, BookingSpan[]>();
    const result = new Map<number, BookingSpan[]>();

    weeks.forEach((week, weekIdx) => {
      const spans: BookingSpan[] = [];
      const weekStart = week[0];
      const weekEnd = week[6];

      bookings.forEach(booking => {
        const bStart = new Date(booking.check_in);
        const bEnd = new Date(booking.check_out);
        // check_out is exclusive (guest leaves that day)
        const bEndInclusive = addDays(bEnd, -1);

        // Does booking overlap this week?
        if (bStart > weekEnd || bEndInclusive < weekStart) return;

        const startCol = bStart < weekStart ? 0 : week.findIndex(d => isSameDay(d, bStart));
        const endCol = bEndInclusive > weekEnd ? 6 : week.findIndex(d => isSameDay(d, bEndInclusive));
        
        if (startCol === -1 || endCol === -1) return;

        spans.push({
          booking,
          startCol: Math.max(0, startCol),
          spanCols: Math.max(1, endCol - Math.max(0, startCol) + 1),
          isStart: bStart >= weekStart && bStart <= weekEnd,
          isEnd: bEndInclusive >= weekStart && bEndInclusive <= weekEnd,
        });
      });

      if (spans.length) result.set(weekIdx, spans);
    });
    return result;
  }, [weeks, bookings]);

  // Day click handler
  const handleDayClick = useCallback((day: Date) => {
    setSelectedDate(day);
    setShowEventsSheet(true);
  }, []);

  // Sheet event data
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return { bookings: [], tasks: [], availability: undefined };
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    
    const dayBookings: PropertyBooking[] = [];
    bookings?.forEach(b => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      if (dateStr >= b.check_in && dateStr <= b.check_out) {
        dayBookings.push(b);
      }
    });

    const dayTasks = taskMap.get(dateKey) || [];
    const avail = availability?.find(a => format(a.date, 'yyyy-MM-dd') === dateKey);

    return { bookings: dayBookings, tasks: dayTasks, availability: avail };
  }, [selectedDate, bookings, taskMap, availability]);

  const handleAddTask = () => { setShowEventsSheet(false); setShowCreateTaskDialog(true); };
  const handleAddBooking = () => { setShowEventsSheet(false); setShowAddBookingDialog(true); };
  const handleBlockDate = () => { setBlockDialogMode('block'); setShowEventsSheet(false); setShowBlockDatesDialog(true); };
  const handleUnblockDate = () => { setBlockDialogMode('unblock'); setShowEventsSheet(false); setShowBlockDatesDialog(true); };
  const handleCompleteTask = (taskId: string) => { completeTask.mutate(taskId); };

  const dayNames = isRu
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (!propertyId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{isRu ? 'Выберите объект для просмотра календаря' : 'Select a property to view calendar'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-1">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Day names header */}
        <div className="grid grid-cols-7 text-center">
          {dayNames.map(d => (
            <div key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="border rounded-lg overflow-hidden">
          {weeks.map((week, weekIdx) => {
            const spans = weekBookingSpans.get(weekIdx) || [];

            return (
              <div key={weekIdx} className="relative">
                {/* Day cells */}
                <div className="grid grid-cols-7 divide-x border-b last:border-b-0">
                  {week.map((day, dayIdx) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const inMonth = isSameMonth(day, currentMonth);
                    const today = isToday(day);
                    const avail = availabilityMap.get(dateKey);
                    const isBlocked = avail?.status === 'blocked';
                    const priceOverride = avail?.priceOverride;
                    const dayTasks = taskMap.get(dateKey) || [];

                    return (
                      <button
                        key={dayIdx}
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          "h-16 sm:h-20 p-0.5 sm:p-1 flex flex-col items-start text-left transition-colors relative",
                          "hover:bg-muted/50 active:bg-muted",
                          !inMonth && "opacity-30",
                          isBlocked && "bg-destructive/5",
                        )}
                      >
                        {/* Date number */}
                        <span className={cn(
                          "text-xs font-medium leading-none",
                          today && "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px]",
                          isBlocked && "text-destructive",
                        )}>
                          {day.getDate()}
                        </span>

                        {/* Price */}
                        {priceOverride && inMonth && (
                          <span className="text-[9px] text-muted-foreground mt-0.5 leading-none">
                            {priceOverride >= 1000 ? `${(priceOverride / 1000).toFixed(priceOverride % 1000 === 0 ? 0 : 1)}k` : priceOverride}
                          </span>
                        )}

                        {/* Task icons */}
                        {dayTasks.length > 0 && inMonth && (
                          <div className="flex gap-0.5 mt-auto">
                            {dayTasks.slice(0, 3).map(task => {
                              const completed = task.status === 'completed';
                              if (task.task_type === 'cleaning') {
                                return (
                                  <div key={task.id} className="relative">
                                    <Sparkles className={cn("h-3 w-3", completed ? "text-muted-foreground/40" : "text-info")} />
                                    {completed && <CheckCircle2 className="h-2 w-2 text-success absolute -top-0.5 -right-0.5" />}
                                  </div>
                                );
                              }
                              if (task.task_type === 'maintenance') {
                                return (
                                  <div key={task.id} className="relative">
                                    <Wrench className={cn("h-3 w-3", completed ? "text-muted-foreground/40" : "text-accent-foreground")} />
                                    {completed && <CheckCircle2 className="h-2 w-2 text-success absolute -top-0.5 -right-0.5" />}
                                  </div>
                                );
                              }
                              return (
                                <div key={task.id} className={cn("w-1.5 h-1.5 rounded-full", completed ? "bg-muted-foreground/30" : "bg-secondary")} />
                              );
                            })}
                          </div>
                        )}

                        {/* Blocked icon */}
                        {isBlocked && inMonth && (
                          <Lock className="h-3 w-3 text-destructive/60 absolute bottom-0.5 right-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Booking bars overlay */}
                {spans.map((span, i) => {
                  const leftPercent = (span.startCol / 7) * 100;
                  const widthPercent = (span.spanCols / 7) * 100;
                  const guestInitials = span.booking.guest_name
                    ? span.booking.guest_name.split(' ').map(w => w[0]).join('').slice(0, 2)
                    : '?';

                  return (
                    <div
                      key={`${span.booking.id}-${weekIdx}-${i}`}
                      className={cn(
                        "absolute h-5 flex items-center px-1.5 text-[10px] font-medium cursor-pointer z-10",
                        "bg-primary/80 text-primary-foreground hover:bg-primary/90 transition-colors",
                        span.isStart && "rounded-l-md ml-0.5",
                        span.isEnd && "rounded-r-md mr-0.5",
                        !span.isStart && !span.isEnd && "",
                      )}
                      style={{
                        left: `${leftPercent}%`,
                        width: `calc(${widthPercent}% - ${(span.isStart ? 2 : 0) + (span.isEnd ? 2 : 0)}px)`,
                        top: '28px', // below date number
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const checkInDate = new Date(span.booking.check_in);
                        setSelectedDate(checkInDate);
                        setShowEventsSheet(true);
                      }}
                    >
                      {span.isStart && (
                        <span className="truncate">
                          {span.spanCols >= 2 ? span.booking.guest_name || guestInitials : guestInitials}
                        </span>
                      )}
                      {!span.isStart && span.spanCols >= 3 && (
                        <span className="truncate opacity-70">{span.booking.guest_name || ''}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground justify-center pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-3 rounded bg-primary/80" />
            <span>{isRu ? 'Гость' : 'Booked'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-destructive/60" />
            <span>{isRu ? 'Закрыто' : 'Blocked'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-info" />
            <span>{isRu ? 'Уборка' : 'Cleaning'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3 w-3 text-accent-foreground" />
            <span>{isRu ? 'Ремонт' : 'Repair'}</span>
          </div>
        </div>
      </div>

      {/* Day events sheet */}
      {selectedDate && (
        <CalendarDayEventsSheet
          open={showEventsSheet}
          onOpenChange={setShowEventsSheet}
          date={selectedDate}
          bookings={selectedDateEvents.bookings}
          tasks={selectedDateEvents.tasks}
          availability={selectedDateEvents.availability}
          onAddTask={handleAddTask}
          onViewBooking={() => {}}
          onCompleteTask={handleCompleteTask}
          onAddBooking={propertyId ? handleAddBooking : undefined}
          onBlockDate={propertyId ? handleBlockDate : undefined}
          onUnblockDate={propertyId ? handleUnblockDate : undefined}
        />
      )}

      <CreateServiceTaskDialog
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        properties={properties}
        defaultPropertyId={propertyId}
        defaultDate={selectedDate || new Date()}
      />

      {propertyId && (
        <>
          <AddBookingFromCalendarDialog
            open={showAddBookingDialog}
            onOpenChange={setShowAddBookingDialog}
            propertyId={propertyId}
            initialDate={selectedDate || new Date()}
            onSuccess={() => setShowAddBookingDialog(false)}
          />
          <BlockDatesDialog
            open={showBlockDatesDialog}
            onOpenChange={setShowBlockDatesDialog}
            propertyId={propertyId}
            initialDate={selectedDate || new Date()}
            mode={blockDialogMode}
            onSuccess={() => setShowBlockDatesDialog(false)}
          />
        </>
      )}
    </>
  );
}
