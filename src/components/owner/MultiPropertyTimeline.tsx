import { useState, useMemo, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiPropertyBookings } from '@/hooks/useMultiPropertyBookings';
import { useOperationalTasks } from '@/hooks/useOperationalTasks';
import { CalendarDayEventsSheet } from './CalendarDayEventsSheet';
import { usePropertyBookings, type PropertyBooking } from '@/hooks/usePropertyBookings';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format, addDays, subDays, isToday, isSameDay, startOfWeek } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Sparkles, Wrench, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedProperty } from '@/hooks/useMyProperties';

interface MultiPropertyTimelineProps {
  properties: UnifiedProperty[];
  isLoading?: boolean;
}

const DAYS_TO_SHOW = 30;
const CELL_WIDTH = 44; // px per day column
const LABEL_WIDTH = 180; // px for property name column

export function MultiPropertyTimeline({ properties, isLoading: propsLoading }: MultiPropertyTimelineProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [startDate, setStartDate] = useState(() => {
    // Start from beginning of current week
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showEventsSheet, setShowEventsSheet] = useState(false);

  // Fetch all bookings for visible range
  const { bookingsByProperty, isLoading: bookingsLoading } = useMultiPropertyBookings(startDate, DAYS_TO_SHOW);

  // Fetch all tasks (no property filter)
  const { tasks } = useOperationalTasks({
    dateRange: { from: startDate, to: addDays(startDate, DAYS_TO_SHOW) },
  });

  // Task map: date+property -> tasks
  const taskMap = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    tasks?.forEach(task => {
      const key = `${task.property_id}_${task.scheduled_date}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks]);

  // Generate day columns
  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      result.push(addDays(startDate, i));
    }
    return result;
  }, [startDate]);

  // Navigation
  const goBack = () => setStartDate(d => subDays(d, 7));
  const goForward = () => setStartDate(d => addDays(d, 7));
  const goToday = () => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Find today column index for marker
  const todayIndex = days.findIndex(d => isToday(d));

  // Handle cell click
  const handleCellClick = useCallback((day: Date, propertyId: string) => {
    setSelectedDate(day);
    setSelectedPropertyId(propertyId);
    setShowEventsSheet(true);
  }, []);

  // Get events for selected date/property
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate || !selectedPropertyId) return { bookings: [], tasks: [], availability: undefined };
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const propertyBookings = bookingsByProperty.get(selectedPropertyId) || [];
    const dayBookings = propertyBookings.filter(b => dateKey >= b.check_in && dateKey < b.check_out);
    const dayTasks = taskMap.get(`${selectedPropertyId}_${dateKey}`) || [];
    return { bookings: dayBookings, tasks: dayTasks, availability: undefined };
  }, [selectedDate, selectedPropertyId, bookingsByProperty, taskMap]);

  const isLoadingAll = propsLoading || bookingsLoading;

  if (isLoadingAll && properties.length === 0) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{isRu ? 'Нет объектов для отображения' : 'No properties to display'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday} className="h-8 text-xs">
              {isRu ? 'Сегодня' : 'Today'}
            </Button>
            <Button variant="ghost" size="icon" onClick={goForward} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {format(startDate, 'd MMM', { locale })} — {format(addDays(startDate, DAYS_TO_SHOW - 1), 'd MMM yyyy', { locale })}
          </span>
        </div>

        {/* Timeline grid */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex">
            {/* Sticky property labels column */}
            <div className="flex-shrink-0 z-10 bg-background border-r" style={{ width: LABEL_WIDTH }}>
              {/* Header spacer */}
              <div className="h-10 border-b flex items-center px-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {isRu ? 'Объект' : 'Property'}
                </span>
              </div>
              {/* Property rows */}
              {properties.map(property => (
                <div key={property.property_id} className="h-14 border-b last:border-b-0 flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={property.cover_image || undefined} alt={isRu ? property.title_ru : property.title} />
                    <AvatarFallback className="text-[10px] bg-muted">
                      {(isRu ? property.title_ru : property.title).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate leading-tight">
                    {isRu ? property.title_ru : property.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Scrollable days area */}
            <div ref={scrollRef} className="overflow-x-auto flex-1">
              <div style={{ width: CELL_WIDTH * DAYS_TO_SHOW, minWidth: '100%' }}>
                {/* Day headers */}
                <div className="h-10 border-b flex relative">
                  {days.map((day, i) => {
                    const today = isToday(day);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex-shrink-0 flex flex-col items-center justify-center border-r last:border-r-0",
                          isWeekend && "bg-muted/30",
                          today && "bg-primary/10",
                        )}
                        style={{ width: CELL_WIDTH }}
                      >
                        <span className={cn(
                          "text-[10px] leading-none",
                          today ? "text-primary font-bold" : "text-muted-foreground",
                        )}>
                          {format(day, 'EEE', { locale }).slice(0, 2)}
                        </span>
                        <span className={cn(
                          "text-xs font-medium leading-none mt-0.5",
                          today && "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px]",
                        )}>
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Property rows with bookings */}
                {properties.map(property => {
                  const propertyBookings = bookingsByProperty.get(property.property_id) || [];

                  return (
                    <div key={property.property_id} className="h-14 border-b last:border-b-0 flex relative">
                      {/* Day cells */}
                      {days.map((day, dayIdx) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        const today = isToday(day);
                        const dayTasks = taskMap.get(`${property.property_id}_${dateKey}`) || [];
                        const hasCleaning = dayTasks.some(t => t.task_type === 'cleaning');
                        const hasMaintenance = dayTasks.some(t => t.task_type === 'maintenance');

                        return (
                          <button
                            key={dayIdx}
                            onClick={() => handleCellClick(day, property.property_id)}
                            className={cn(
                              "flex-shrink-0 border-r last:border-r-0 flex items-end justify-center pb-1 transition-colors",
                              "hover:bg-muted/50 active:bg-muted",
                              isWeekend && "bg-muted/20",
                              today && "bg-primary/5",
                            )}
                            style={{ width: CELL_WIDTH }}
                          >
                            {/* Task icons */}
                            <div className="flex gap-0.5">
                              {hasCleaning && <Sparkles className="h-3 w-3 text-info" />}
                              {hasMaintenance && <Wrench className="h-3 w-3 text-accent-foreground" />}
                            </div>
                          </button>
                        );
                      })}

                      {/* Booking bars overlay */}
                      {propertyBookings.map((booking, bIdx) => {
                        const checkIn = new Date(booking.check_in);
                        const checkOut = new Date(booking.check_out);
                        // Calculate position relative to startDate
                        const startOffset = Math.max(0, Math.floor((checkIn.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                        const endOffset = Math.min(DAYS_TO_SHOW, Math.ceil((checkOut.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                        
                        if (startOffset >= DAYS_TO_SHOW || endOffset <= 0) return null;

                        const left = startOffset * CELL_WIDTH;
                        const width = (endOffset - startOffset) * CELL_WIDTH;
                        const isStart = checkIn >= startDate;
                        const isEnd = checkOut <= addDays(startDate, DAYS_TO_SHOW);
                        
                        const guestName = booking.guest_name || '?';
                        const statusColor = booking.status === 'confirmed' 
                          ? 'bg-primary/80 text-primary-foreground' 
                          : booking.status === 'cancelled'
                          ? 'bg-muted text-muted-foreground line-through'
                          : 'bg-secondary text-secondary-foreground';

                        return (
                          <div
                            key={booking.id}
                            className={cn(
                              "absolute h-5 flex items-center px-1.5 text-[10px] font-medium cursor-pointer z-10 top-1",
                              statusColor,
                              "hover:opacity-90 transition-opacity",
                              isStart && "rounded-l-md ml-0.5",
                              isEnd && "rounded-r-md mr-0.5",
                            )}
                            style={{
                              left: left + (isStart ? 2 : 0),
                              width: width - (isStart ? 2 : 0) - (isEnd ? 2 : 0),
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(checkIn < startDate ? startDate : checkIn);
                              setSelectedPropertyId(property.property_id);
                              setShowEventsSheet(true);
                            }}
                          >
                            <span className="truncate">{guestName}</span>
                          </div>
                        );
                      })}

                      {/* Today marker line */}
                      {todayIndex >= 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-20 pointer-events-none"
                          style={{ left: todayIndex * CELL_WIDTH + CELL_WIDTH / 2 }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground justify-center pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-3 rounded bg-primary/80" />
            <span>{isRu ? 'Подтверждено' : 'Confirmed'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-3 rounded bg-secondary" />
            <span>{isRu ? 'Ожидает' : 'Pending'}</span>
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
      {selectedDate && selectedPropertyId && (
        <CalendarDayEventsSheet
          open={showEventsSheet}
          onOpenChange={setShowEventsSheet}
          date={selectedDate}
          bookings={selectedDateEvents.bookings}
          tasks={selectedDateEvents.tasks}
          availability={selectedDateEvents.availability}
          onAddTask={() => {}}
          onViewBooking={() => {}}
          onCompleteTask={() => {}}
        />
      )}
    </>
  );
}
