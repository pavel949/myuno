import { useLanguage } from '@/contexts/LanguageContext';
import { PropertyBooking } from '@/hooks/usePropertyBookings';
import { OperationalTask } from '@/hooks/useOperationalTasks';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  User, 
  LogIn, 
  LogOut, 
  Sparkles, 
  Wrench, 
  Search, 
  Gauge,
  CheckCircle2,
  Clock,
  CalendarDays
} from 'lucide-react';

interface CalendarDayEventsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  bookings: PropertyBooking[];
  tasks: OperationalTask[];
  onAddTask: () => void;
  onViewBooking: (booking: PropertyBooking) => void;
  onCompleteTask: (taskId: string) => void;
}

const TASK_CONFIG: Record<OperationalTask['task_type'], {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
  labelRu: string;
}> = {
  check_in: { icon: LogIn, color: 'text-success', bgColor: 'bg-success/10', label: 'Check-in', labelRu: 'Заезд' },
  check_out: { icon: LogOut, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Check-out', labelRu: 'Выезд' },
  cleaning: { icon: Sparkles, color: 'text-info', bgColor: 'bg-info/10', label: 'Cleaning', labelRu: 'Уборка' },
  maintenance: { icon: Wrench, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Maintenance', labelRu: 'Ремонт' },
  inspection: { icon: Search, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Inspection', labelRu: 'Осмотр' },
  meter_reading: { icon: Gauge, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', label: 'Meters', labelRu: 'Счётчики' },
};

export function CalendarDayEventsSheet({
  open,
  onOpenChange,
  date,
  bookings,
  tasks,
  onAddTask,
  onViewBooking,
  onCompleteTask,
}: CalendarDayEventsSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!date) return null;

  const hasEvents = bookings.length > 0 || tasks.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {format(date, 'd MMMM yyyy', { locale: isRu ? ru : undefined })}
            </div>
            <Button size="sm" onClick={onAddTask} className="gap-1">
              <Plus className="h-4 w-4" />
              {isRu ? 'Задача' : 'Task'}
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6 overflow-y-auto">
          {!hasEvents ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{isRu ? 'Нет событий на этот день' : 'No events for this day'}</p>
              <Button variant="outline" className="mt-4" onClick={onAddTask}>
                <Plus className="h-4 w-4 mr-1" />
                {isRu ? 'Добавить задачу' : 'Add Task'}
              </Button>
            </div>
          ) : (
            <>
              {/* Bookings */}
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
                        <Card 
                          key={booking.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => onViewBooking(booking)}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isCheckIn ? "bg-success/10" : isCheckOut ? "bg-warning/10" : "bg-primary/10"
                            )}>
                              {isCheckIn ? (
                                <LogIn className="h-5 w-5 text-success" />
                              ) : isCheckOut ? (
                                <LogOut className="h-5 w-5 text-warning" />
                              ) : (
                                <User className="h-5 w-5 text-primary" />
                              )}
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
                              <Badge variant="outline" className="text-xs capitalize shrink-0">
                                {booking.source}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {tasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    {isRu ? 'Задачи' : 'Tasks'}
                  </h4>
                  <div className="space-y-2">
                    {tasks.map((task) => {
                      const config = TASK_CONFIG[task.task_type];
                      const Icon = config.icon;
                      const isCompleted = task.status === 'completed';
                      
                      return (
                        <Card 
                          key={task.id} 
                          className={cn(isCompleted && "opacity-60")}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              config.bgColor
                            )}>
                              <Icon className={cn("h-5 w-5", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium text-sm truncate",
                                isCompleted && "line-through"
                              )}>
                                {isRu ? (task.title_ru || task.title) : task.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isRu ? config.labelRu : config.label}
                                {task.scheduled_time && ` • ${task.scheduled_time.slice(0, 5)}`}
                              </p>
                            </div>
                            {!isCompleted && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCompleteTask(task.id);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {isCompleted && (
                              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
