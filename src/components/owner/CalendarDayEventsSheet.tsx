import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PropertyBooking } from '@/hooks/usePropertyBookings';
import { OperationalTask } from '@/hooks/useOperationalTasks';
import { AvailabilityEntry } from '@/components/property/PropertyCalendar';
import { BookingDetailSheet } from './BookingDetailSheet';
import { TaskDetailSheet } from './TaskDetailSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Plus, User, CheckCircle2, CalendarDays, Lock, Unlock, CalendarPlus, LogIn, LogOut
} from 'lucide-react';
import { getTaskConfig } from '@/config/taskColors';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface CalendarDayEventsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  bookings: PropertyBooking[];
  tasks: OperationalTask[];
  availability?: AvailabilityEntry;
  onAddTask: () => void;
  onViewBooking: (booking: PropertyBooking) => void;
  onCompleteTask: (taskId: string) => void;
  onStartTaskProgress?: (taskId: string) => void;
  onAddBooking?: () => void;
  onBlockDate?: () => void;
  onUnblockDate?: () => void;
  propertyTitle?: string;
}

export function CalendarDayEventsSheet({
  open, onOpenChange, date, bookings, tasks, availability,
  onAddTask, onViewBooking, onCompleteTask, onStartTaskProgress,
  onAddBooking, onBlockDate, onUnblockDate, propertyTitle,
}: CalendarDayEventsSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [selectedBooking, setSelectedBooking] = useState<PropertyBooking | null>(null);
  const [selectedTask, setSelectedTask] = useState<OperationalTask | null>(null);

  if (!date) return null;

  const hasEvents = bookings.length > 0 || tasks.length > 0;
  const isBlocked = availability?.status === 'blocked';
  const hasBookingOnDate = bookings.length > 0;

  const actionButtons = (
    <div className="grid grid-cols-3 gap-2 w-full">
      <Button variant="outline" size="sm" className="gap-1.5"
        onClick={() => { onOpenChange(false); onAddTask(); }}>
        <Plus className="h-4 w-4" />{isRu ? 'Задача' : 'Task'}
      </Button>
      {onAddBooking && !hasBookingOnDate && !isBlocked && (
        <Button variant="outline" size="sm" className="gap-1.5"
          onClick={() => { onOpenChange(false); onAddBooking(); }}>
          <CalendarPlus className="h-4 w-4" />{isRu ? 'Брон.' : 'Book'}
        </Button>
      )}
      {!hasBookingOnDate && (
        isBlocked ? (
          onUnblockDate && (
            <Button variant="outline" size="sm" className="gap-1.5 text-success border-success/30 hover:bg-success/10"
              onClick={() => { onOpenChange(false); onUnblockDate(); }}>
              <Unlock className="h-4 w-4" />{isRu ? 'Открыть' : 'Unblock'}
            </Button>
          )
        ) : (
          onBlockDate && (
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => { onOpenChange(false); onBlockDate(); }}>
              <Lock className="h-4 w-4" />{isRu ? 'Закрыть' : 'Block'}
            </Button>
          )
        )
      )}
    </div>
  );

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        title={format(date, 'd MMMM yyyy', { locale: isRu ? ru : undefined })}
        icon={<CalendarDays className="w-5 h-5 text-primary" />}
        size="md"
        footer={actionButtons}
      >
        {isBlocked && (
          <Badge variant="destructive" className="gap-1">
            <Lock className="h-3 w-3" />{isRu ? 'Закрыто' : 'Blocked'}
          </Badge>
        )}

        {isBlocked && availability?.note && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-muted-foreground">{availability.note}</p>
          </div>
        )}

        {!hasEvents && !isBlocked ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>{isRu ? 'Нет событий на этот день' : 'No events for this day'}</p>
          </div>
        ) : (
          <>
            {bookings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {isRu ? 'Бронирования' : 'Bookings'}
                </h4>
                <div className="space-y-2">
                  {bookings.map((booking) => {
                    const nights = differenceInDays(new Date(booking.check_out), new Date(booking.check_in));
                    const isCheckIn = format(new Date(booking.check_in), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                    const isCheckOut = format(new Date(booking.check_out), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                    return (
                      <Card key={booking.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedBooking(booking)}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                            isCheckIn ? "bg-success/10" : isCheckOut ? "bg-warning/10" : "bg-primary/10")}>
                            {isCheckIn ? <LogIn className="h-5 w-5 text-success" /> :
                             isCheckOut ? <LogOut className="h-5 w-5 text-warning" /> :
                             <User className="h-5 w-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {booking.guest_name || (isRu ? 'Гость' : 'Guest')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {nights} {isRu ? 'ноч.' : 'nights'}
                              {isCheckIn && ` • ${isRu ? 'Заезд' : 'Check-in'}`}
                              {isCheckOut && ` • ${isRu ? 'Выезд' : 'Check-out'}`}
                            </p>
                          </div>
                          {booking.source && booking.source !== 'manual' && (
                            <Badge variant="outline" className="text-xs capitalize shrink-0">{booking.source}</Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {tasks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {isRu ? 'Задачи' : 'Tasks'}
                </h4>
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const config = getTaskConfig(task.task_type);
                    const Icon = config.icon;
                    const isCompleted = task.status === 'completed';
                    return (
                      <Card key={task.id} className={cn("cursor-pointer hover:bg-muted/50 transition-colors", isCompleted && "opacity-60")}
                        onClick={() => setSelectedTask(task)}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor)}>
                            <Icon className={cn("h-5 w-5", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium text-sm truncate", isCompleted && "line-through")}>
                              {isRu ? (task.title_ru || task.title) : task.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {isRu ? config.labelRu : config.label}
                              {task.scheduled_time && ` • ${task.scheduled_time.slice(0, 5)}`}
                              {task.assigned_to && ` • ${task.assigned_to}`}
                            </p>
                          </div>
                          {isCompleted && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </ResponsiveModal>

      <BookingDetailSheet
        open={!!selectedBooking}
        onOpenChange={(v) => { if (!v) setSelectedBooking(null); }}
        booking={selectedBooking}
        propertyTitle={propertyTitle}
      />
      <TaskDetailSheet
        open={!!selectedTask}
        onOpenChange={(v) => { if (!v) setSelectedTask(null); }}
        task={selectedTask}
        onComplete={onCompleteTask}
        onStartProgress={onStartTaskProgress}
      />
    </>
  );
}
