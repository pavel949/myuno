import { useState, useMemo, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMultiPropertyBookings } from '@/hooks/useMultiPropertyBookings';
import { useOperationalTasks } from '@/hooks/useOperationalTasks';
import { CalendarDayEventsSheet } from './CalendarDayEventsSheet';
import { BookingDetailSheet } from './BookingDetailSheet';
import { TaskDetailSheet } from './TaskDetailSheet';
import { type PropertyBooking } from '@/hooks/usePropertyBookings';
import { type OperationalTask } from '@/hooks/useOperationalTasks';
import { type PropertyComplex } from '@/hooks/usePropertyComplexes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format, addDays, subDays, isToday, startOfWeek } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Sparkles, Wrench, FileText, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { UnifiedProperty } from '@/hooks/useMyProperties';

interface MultiPropertyTimelineProps {
  properties: UnifiedProperty[];
  isLoading?: boolean;
  complexes?: PropertyComplex[];
}

const DAYS_TO_SHOW = 30;
const CELL_WIDTH = 44;
const LABEL_WIDTH = 180;

export function MultiPropertyTimeline({ properties, isLoading: propsLoading, complexes = [] }: MultiPropertyTimelineProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const propertyIds = useMemo(() => properties.map(p => p.property_id), [properties]);

  // Sort properties: grouped by complex (alphabetically), then no-complex at the end, then by title within group
  const sortedProperties = useMemo(() => {
    const complexMap = new Map(complexes.map(c => [c.id, isRu ? (c.name_ru || c.name) : c.name]));
    return [...properties].sort((a, b) => {
      const aComplex = a.complex_id ? complexMap.get(a.complex_id) || '' : 'zzz';
      const bComplex = b.complex_id ? complexMap.get(b.complex_id) || '' : 'zzz';
      if (aComplex !== bComplex) return aComplex.localeCompare(bComplex);
      const aTitle = isRu ? a.title_ru : a.title;
      const bTitle = isRu ? b.title_ru : b.title;
      return aTitle.localeCompare(bTitle);
    });
  }, [properties, complexes, isRu]);

  // Build complex group headers for rendering
  const complexGroups = useMemo(() => {
    const groups: { complexId: string | null; complexName: string; startIndex: number }[] = [];
    let lastComplexId: string | null | undefined = undefined;
    sortedProperties.forEach((p, idx) => {
      if (p.complex_id !== lastComplexId) {
        const complexName = p.complex_id
          ? complexes.find(c => c.id === p.complex_id)?.[isRu ? 'name_ru' : 'name'] || complexes.find(c => c.id === p.complex_id)?.name || ''
          : '';
        groups.push({ complexId: p.complex_id, complexName, startIndex: idx });
        lastComplexId = p.complex_id;
      }
    });
    return groups;
  }, [sortedProperties, complexes, isRu]);

  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Day events sheet state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showEventsSheet, setShowEventsSheet] = useState(false);

  // Direct detail sheet state
  const [detailBooking, setDetailBooking] = useState<PropertyBooking | null>(null);
  const [detailTask, setDetailTask] = useState<OperationalTask | null>(null);

  const { bookingsByProperty, isLoading: bookingsLoading } = useMultiPropertyBookings(startDate, DAYS_TO_SHOW);

  const { tasks, completeTask, updateTaskStatus } = useOperationalTasks({
    dateRange: { from: startDate, to: addDays(startDate, DAYS_TO_SHOW) },
  });

  const taskMap = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    tasks?.forEach(task => {
      const key = `${task.property_id}_${task.scheduled_date}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks]);

  // Operational overlay: document deadlines + planned expenses
  const endDate = addDays(startDate, DAYS_TO_SHOW);
  const rangeStart = format(startDate, 'yyyy-MM-dd');
  const rangeEnd = format(endDate, 'yyyy-MM-dd');

  const { data: docDeadlines } = useQuery({
    queryKey: ['timeline-doc-deadlines', rangeStart, rangeEnd, propertyIds.join(',')],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const { data } = await supabase
        .from('property_documents')
        .select('id, property_id, title, expiry_date')
        .in('property_id', propertyIds)
        .gte('expiry_date', rangeStart)
        .lte('expiry_date', rangeEnd);
      return data || [];
    },
    enabled: propertyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: plannedExpenses } = useQuery({
    queryKey: ['timeline-expenses', rangeStart, rangeEnd, propertyIds.join(',')],
    queryFn: async () => {
      if (!user?.id || propertyIds.length === 0) return [];
      const { data } = await supabase
        .from('property_financials')
        .select('id, property_id, description, transaction_date, amount, status')
        .in('property_id', propertyIds)
        .eq('transaction_type', 'expense')
        .eq('status', 'pending')
        .gte('transaction_date', rangeStart)
        .lte('transaction_date', rangeEnd);
      return data || [];
    },
    enabled: !!user?.id && propertyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const docDeadlineMap = useMemo(() => {
    const map = new Map<string, any[]>();
    docDeadlines?.forEach(doc => {
      const key = `${doc.property_id}_${doc.expiry_date}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(doc);
    });
    return map;
  }, [docDeadlines]);

  const expenseMap = useMemo(() => {
    const map = new Map<string, any[]>();
    plannedExpenses?.forEach(exp => {
      const key = `${exp.property_id}_${exp.transaction_date}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(exp);
    });
    return map;
  }, [plannedExpenses]);

  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < DAYS_TO_SHOW; i++) result.push(addDays(startDate, i));
    return result;
  }, [startDate]);

  const goBack = () => setStartDate(d => subDays(d, 7));
  const goForward = () => setStartDate(d => addDays(d, 7));
  const goToday = () => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const todayIndex = days.findIndex(d => isToday(d));

  const handleCellClick = useCallback((day: Date, propertyId: string) => {
    setSelectedDate(day);
    setSelectedPropertyId(propertyId);
    setShowEventsSheet(true);
  }, []);

  const handleBookingBarClick = useCallback((booking: PropertyBooking, e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailBooking(booking);
  }, []);

  const handleTaskIconClick = useCallback((task: OperationalTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailTask(task);
  }, []);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate || !selectedPropertyId) return { bookings: [], tasks: [] };
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const propertyBookings = bookingsByProperty.get(selectedPropertyId) || [];
    const dayBookings = propertyBookings.filter(b => dateKey >= b.check_in && dateKey < b.check_out);
    const dayTasks = taskMap.get(`${selectedPropertyId}_${dateKey}`) || [];
    return { bookings: dayBookings, tasks: dayTasks };
  }, [selectedDate, selectedPropertyId, bookingsByProperty, taskMap]);

  // Find property title for detail sheets
  const getPropertyTitle = (propertyId: string) => {
    const p = properties.find(pr => pr.property_id === propertyId);
    return p ? (isRu ? p.title_ru : p.title) : '';
  };

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
            {/* Sticky property labels */}
            <div className="flex-shrink-0 z-10 bg-background border-r" style={{ width: LABEL_WIDTH }}>
              <div className="h-10 border-b flex items-center px-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {isRu ? 'Объект' : 'Property'}
                </span>
              </div>
              {sortedProperties.map((property, idx) => {
                const group = complexGroups.find(g => g.startIndex === idx);
                return (
                  <div key={property.property_id}>
                    {group && group.complexName && (
                      <div className="h-7 border-b flex items-center px-2 bg-muted/50">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
                          {group.complexName}
                        </span>
                      </div>
                    )}
                    <div className="h-14 border-b last:border-b-0 flex items-center gap-2 px-2">
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
                  </div>
                );
              })}
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

                {/* Property rows */}
                {sortedProperties.map((property, idx) => {
                  const propertyBookings = bookingsByProperty.get(property.property_id) || [];
                  const group = complexGroups.find(g => g.startIndex === idx);

                  return (
                    <div key={property.property_id}>
                      {group && group.complexName && (
                        <div className="h-7 border-b bg-muted/50" />
                      )}
                      <div className="h-14 border-b last:border-b-0 flex relative">
                      {/* Day cells */}
                      {days.map((day, dayIdx) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        const today = isToday(day);
                        const dayTasks = taskMap.get(`${property.property_id}_${dateKey}`) || [];
                        const hasCleaning = dayTasks.some(t => t.task_type === 'cleaning');
                        const hasMaintenance = dayTasks.some(t => t.task_type === 'maintenance');
                        const cleaningTask = dayTasks.find(t => t.task_type === 'cleaning');
                        const maintenanceTask = dayTasks.find(t => t.task_type === 'maintenance');
                        const cellDocs = docDeadlineMap.get(`${property.property_id}_${dateKey}`) || [];
                        const cellExpenses = expenseMap.get(`${property.property_id}_${dateKey}`) || [];

                        return (
                          <button
                            key={dayIdx}
                            onClick={() => handleCellClick(day, property.property_id)}
                            className={cn(
                              "flex-shrink-0 border-r last:border-r-0 flex items-end justify-center pb-1 transition-colors",
                              "hover:bg-muted/50 active:bg-muted",
                              isWeekend && "bg-muted/20",
                              today && "bg-primary/5",
                              cellDocs.length > 0 && "bg-destructive/5",
                            )}
                            style={{ width: CELL_WIDTH }}
                          >
                            <div className="flex gap-0.5 flex-wrap justify-center">
                              {hasCleaning && (
                                <button
                                  onClick={(e) => cleaningTask && handleTaskIconClick(cleaningTask, e)}
                                  className="hover:scale-125 transition-transform"
                                >
                                  <Sparkles className="h-3 w-3 text-info" />
                                </button>
                              )}
                              {hasMaintenance && (
                                <button
                                  onClick={(e) => maintenanceTask && handleTaskIconClick(maintenanceTask, e)}
                                  className="hover:scale-125 transition-transform"
                                >
                                  <Wrench className="h-3 w-3 text-accent-foreground" />
                                </button>
                              )}
                              {cellDocs.length > 0 && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help">
                                        <FileText className="h-3 w-3 text-destructive" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs max-w-[200px]">
                                      {cellDocs.map((d: any) => d.title).join(', ')}
                                      <br />
                                      <span className="text-destructive font-medium">
                                        {isRu ? 'Истекает' : 'Expires'}
                                      </span>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {cellExpenses.length > 0 && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help">
                                        <DollarSign className="h-3 w-3 text-warning" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs max-w-[200px]">
                                      {cellExpenses.map((e: any) => `${e.description || isRu ? 'Оплата' : 'Payment'}: ฿${Number(e.amount).toLocaleString()}`).join(', ')}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {/* Booking bars overlay */}
                      {propertyBookings.map((booking) => {
                        const checkIn = new Date(booking.check_in);
                        const checkOut = new Date(booking.check_out);
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
                              "hover:opacity-90 hover:shadow-sm transition-all",
                              isStart && "rounded-l-md ml-0.5",
                              isEnd && "rounded-r-md mr-0.5",
                            )}
                            style={{
                              left: left + (isStart ? 2 : 0),
                              width: width - (isStart ? 2 : 0) - (isEnd ? 2 : 0),
                            }}
                            onClick={(e) => handleBookingBarClick(booking, e)}
                          >
                            <span className="truncate">{guestName}</span>
                          </div>
                        );
                      })}

                      {/* Today marker */}
                      {todayIndex >= 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-20 pointer-events-none"
                          style={{ left: todayIndex * CELL_WIDTH + CELL_WIDTH / 2 }}
                        />
                      )}
                      </div>
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
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-destructive" />
            <span>{isRu ? 'Документ' : 'Document'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-warning" />
            <span>{isRu ? 'Оплата' : 'Payment'}</span>
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
          availability={undefined}
          onAddTask={() => {}}
          onViewBooking={(b) => setDetailBooking(b)}
          onCompleteTask={(id) => completeTask.mutate(id)}
          onStartTaskProgress={(id) => updateTaskStatus.mutate({ taskId: id, status: 'in_progress' })}
          propertyTitle={getPropertyTitle(selectedPropertyId)}
        />
      )}

      {/* Direct booking detail */}
      <BookingDetailSheet
        open={!!detailBooking}
        onOpenChange={(v) => { if (!v) setDetailBooking(null); }}
        booking={detailBooking}
        propertyTitle={detailBooking ? getPropertyTitle(detailBooking.property_id) : undefined}
      />

      {/* Direct task detail */}
      <TaskDetailSheet
        open={!!detailTask}
        onOpenChange={(v) => { if (!v) setDetailTask(null); }}
        task={detailTask}
        onComplete={(id) => completeTask.mutate(id)}
        onStartProgress={(id) => updateTaskStatus.mutate({ taskId: id, status: 'in_progress' })}
      />
    </>
  );
}
