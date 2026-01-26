import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyBookings, PropertyBooking } from '@/hooks/usePropertyBookings';
import { useOperationalTasks, OperationalTask } from '@/hooks/useOperationalTasks';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDayEventsSheet } from './CalendarDayEventsSheet';
import { CreateServiceTaskDialog } from './CreateServiceTaskDialog';
import { AddBookingFromCalendarDialog } from './AddBookingFromCalendarDialog';
import { BlockDatesDialog } from './BlockDatesDialog';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  CalendarDays, 
  Plus, 
  CalendarPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OwnerProperty {
  id: string;
  title: string;
  title_ru?: string | null;
}

interface UnifiedPropertyCalendarProps {
  propertyId?: string;
  properties?: OwnerProperty[];
}

interface DayEvent {
  type: 'booking' | 'check_in' | 'check_out' | 'cleaning' | 'maintenance' | 'other_task' | 'blocked';
  booking?: PropertyBooking;
  task?: OperationalTask;
}

export function UnifiedPropertyCalendar({ propertyId, properties = [] }: UnifiedPropertyCalendarProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventsSheet, setShowEventsSheet] = useState(false);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [showAddBookingDialog, setShowAddBookingDialog] = useState(false);
  const [showBlockDatesDialog, setShowBlockDatesDialog] = useState(false);
  const [blockDialogMode, setBlockDialogMode] = useState<'block' | 'unblock'>('block');
  const [selectedBooking, setSelectedBooking] = useState<PropertyBooking | null>(null);

  const { bookings, getBookingForDate } = usePropertyBookings(propertyId);
  const { tasks, completeTask } = useOperationalTasks({ 
    propertyId: propertyId || undefined,
  });
  const { availability } = usePropertyAvailabilityManagement(propertyId);

  // Build event map for calendar
  const eventMap = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    
    // Add bookings (continuous range)
    bookings?.forEach(booking => {
      let current = new Date(booking.check_in);
      const end = new Date(booking.check_out);
      
      // Check-in day
      const checkInKey = format(current, 'yyyy-MM-dd');
      if (!map.has(checkInKey)) map.set(checkInKey, []);
      map.get(checkInKey)!.push({ type: 'check_in', booking });
      
      // Stay days
      current = addDays(current, 1);
      while (current < end) {
        const key = format(current, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ type: 'booking', booking });
        current = addDays(current, 1);
      }
      
      // Check-out day
      const checkOutKey = format(end, 'yyyy-MM-dd');
      if (!map.has(checkOutKey)) map.set(checkOutKey, []);
      map.get(checkOutKey)!.push({ type: 'check_out', booking });
    });
    
    // Add blocked dates
    availability?.forEach(entry => {
      if (entry.status === 'blocked') {
        const key = format(entry.date, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ type: 'blocked' });
      }
    });
    
    // Add tasks
    tasks?.forEach(task => {
      const key = task.scheduled_date;
      if (!map.has(key)) map.set(key, []);
      
      let eventType: DayEvent['type'] = 'other_task';
      if (task.task_type === 'cleaning') eventType = 'cleaning';
      else if (task.task_type === 'maintenance') eventType = 'maintenance';
      else if (task.task_type === 'check_in') eventType = 'check_in';
      else if (task.task_type === 'check_out') eventType = 'check_out';
      
      map.get(key)!.push({ type: eventType, task });
    });
    
    return map;
  }, [bookings, tasks, availability]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return { bookings: [], tasks: [], availability: undefined };
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const events = eventMap.get(dateKey) || [];
    
    // Find availability entry for the selected date
    const availabilityEntry = availability?.find(a => 
      format(a.date, 'yyyy-MM-dd') === dateKey
    );
    
    return {
      bookings: events.filter(e => e.booking).map(e => e.booking!),
      tasks: events.filter(e => e.task).map(e => e.task!),
      availability: availabilityEntry,
    };
  }, [selectedDate, eventMap, availability]);

  // Calendar day modifiers
  const modifiers = useMemo(() => {
    const booked: Date[] = [];
    const checkIn: Date[] = [];
    const checkOut: Date[] = [];
    const cleaning: Date[] = [];
    const maintenance: Date[] = [];
    const blocked: Date[] = [];
    
    eventMap.forEach((events, dateStr) => {
      const date = new Date(dateStr);
      events.forEach(event => {
        if (event.type === 'booking') booked.push(date);
        else if (event.type === 'check_in') checkIn.push(date);
        else if (event.type === 'check_out') checkOut.push(date);
        else if (event.type === 'cleaning') cleaning.push(date);
        else if (event.type === 'maintenance') maintenance.push(date);
        else if (event.type === 'blocked') blocked.push(date);
      });
    });
    
    return { booked, checkIn, checkOut, cleaning, maintenance, blocked };
  }, [eventMap]);

  const modifiersClassNames = {
    booked: 'bg-primary/20 text-primary font-medium',
    checkIn: 'ring-2 ring-success ring-inset',
    checkOut: 'ring-2 ring-warning ring-inset',
    cleaning: '',
    maintenance: '',
    blocked: 'bg-destructive/15 text-destructive',
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setShowEventsSheet(true);
  };

  const handleAddTask = () => {
    setShowEventsSheet(false);
    setShowCreateTaskDialog(true);
  };

  const handleAddBooking = () => {
    setShowEventsSheet(false);
    setShowAddBookingDialog(true);
  };

  const handleBlockDate = () => {
    setBlockDialogMode('block');
    setShowEventsSheet(false);
    setShowBlockDatesDialog(true);
  };

  const handleUnblockDate = () => {
    setBlockDialogMode('unblock');
    setShowEventsSheet(false);
    setShowBlockDatesDialog(true);
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask.mutate(taskId);
  };

  // Custom day content to show event indicators
  const DayContent = ({ date }: { date: Date }) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const events = eventMap.get(dateKey) || [];
    
    const hasCheckIn = events.some(e => e.type === 'check_in');
    const hasCheckOut = events.some(e => e.type === 'check_out');
    const hasCleaning = events.some(e => e.type === 'cleaning');
    const hasMaintenance = events.some(e => e.type === 'maintenance');
    const hasOtherTask = events.some(e => e.type === 'other_task');
    const isBlocked = events.some(e => e.type === 'blocked');
    
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span>{date.getDate()}</span>
        {events.length > 0 && (
          <div className="absolute bottom-0.5 flex gap-0.5">
            {isBlocked && <div className="w-1.5 h-1.5 rounded-full bg-destructive" />}
            {hasCheckIn && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
            {hasCheckOut && <div className="w-1.5 h-1.5 rounded-full bg-warning" />}
            {hasCleaning && <div className="w-1.5 h-1.5 rounded-full bg-info" />}
            {hasMaintenance && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
            {hasOtherTask && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {isRu ? 'Операционный календарь' : 'Operations Calendar'}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setSelectedDate(new Date());
                  setShowAddBookingDialog(true);
                }} 
                className="gap-1"
                disabled={!propertyId}
              >
                <CalendarPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{isRu ? 'Брон.' : 'Book'}</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowCreateTaskDialog(true)} 
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{isRu ? 'Задача' : 'Task'}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {propertyId ? (
            <>
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => date && handleDayClick(date)}
                month={month}
                onMonthChange={setMonth}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="pointer-events-auto"
                components={{
                  DayContent: ({ date }) => <DayContent date={date} />,
                }}
              />
              
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-muted-foreground justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-primary/20" />
                  <span>{isRu ? 'Гость' : 'Guest'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span>{isRu ? 'Заезд' : 'Check-in'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span>{isRu ? 'Выезд' : 'Check-out'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span>{isRu ? 'Закрыто' : 'Blocked'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-info" />
                  <span>{isRu ? 'Уборка' : 'Cleaning'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>{isRu ? 'Ремонт' : 'Repair'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{isRu ? 'Выберите объект для просмотра календаря' : 'Select a property to view calendar'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDate && (
        <CalendarDayEventsSheet
          open={showEventsSheet}
          onOpenChange={setShowEventsSheet}
          date={selectedDate}
          bookings={selectedDateEvents.bookings}
          tasks={selectedDateEvents.tasks}
          availability={selectedDateEvents.availability}
          onAddTask={handleAddTask}
          onViewBooking={(booking) => {
            setSelectedBooking(booking);
            // Could open booking details dialog here
          }}
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
