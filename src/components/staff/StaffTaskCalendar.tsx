import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ServiceOrder } from '@/hooks/useServiceOrders';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  MapPin, 
  Clock, 
  Play, 
  CheckCircle,
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffTaskCalendarProps {
  orders: ServiceOrder[];
  isLoading: boolean;
  onStartOrder: (orderId: string) => void;
  onCompleteOrder: (orderId: string) => void;
  isStarting?: boolean;
  isCompleting?: boolean;
}

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-info/20 text-info',
  high: 'bg-warning/20 text-warning',
  urgent: 'bg-destructive/20 text-destructive',
};

const priorityLabels = {
  low: { en: 'Low', ru: 'Низкий' },
  normal: { en: 'Normal', ru: 'Обычный' },
  high: { en: 'High', ru: 'Высокий' },
  urgent: { en: 'Urgent', ru: 'Срочно' },
};

export function StaffTaskCalendar({ 
  orders, 
  isLoading,
  onStartOrder,
  onCompleteOrder,
  isStarting,
  isCompleting
}: StaffTaskCalendarProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDaySheet, setShowDaySheet] = useState(false);

  // Build task map for calendar
  const taskMap = useMemo(() => {
    const map = new Map<string, ServiceOrder[]>();
    
    orders.forEach(order => {
      if (order.scheduled_at) {
        const dateKey = format(new Date(order.scheduled_at), 'yyyy-MM-dd');
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(order);
      }
    });
    
    return map;
  }, [orders]);

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return taskMap.get(dateKey) || [];
  }, [selectedDate, taskMap]);

  // Calendar day modifiers
  const modifiers = useMemo(() => {
    const assigned: Date[] = [];
    const inProgress: Date[] = [];
    const urgent: Date[] = [];
    
    taskMap.forEach((tasks, dateStr) => {
      const date = new Date(dateStr);
      tasks.forEach(task => {
        if (task.status === 'in_progress') {
          inProgress.push(date);
        } else if (task.status === 'assigned') {
          assigned.push(date);
        }
        if (task.priority === 'urgent' || task.priority === 'high') {
          urgent.push(date);
        }
      });
    });
    
    return { assigned, inProgress, urgent };
  }, [taskMap]);

  const modifiersClassNames = {
    assigned: 'bg-primary/20 text-primary font-medium',
    inProgress: 'bg-warning/20 text-warning font-medium',
    urgent: 'ring-2 ring-destructive ring-inset',
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const dateKey = format(day, 'yyyy-MM-dd');
    if (taskMap.has(dateKey)) {
      setShowDaySheet(true);
    }
  };

  // Custom day content to show task indicators
  const DayContent = ({ date }: { date: Date }) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayTasks = taskMap.get(dateKey) || [];
    
    const hasInProgress = dayTasks.some(t => t.status === 'in_progress');
    const hasAssigned = dayTasks.some(t => t.status === 'assigned');
    const hasUrgent = dayTasks.some(t => t.priority === 'urgent');
    const hasHigh = dayTasks.some(t => t.priority === 'high');
    
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span>{date.getDate()}</span>
        {dayTasks.length > 0 && (
          <div className="absolute bottom-0.5 flex gap-0.5">
            {hasInProgress && <div className="w-1.5 h-1.5 rounded-full bg-warning" />}
            {hasAssigned && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            {(hasUrgent || hasHigh) && <div className="w-1.5 h-1.5 rounded-full bg-destructive" />}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            {isRu ? 'Загрузка...' : 'Loading...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={(date) => date && handleDayClick(date)}
            month={month}
            onMonthChange={setMonth}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            locale={isRu ? ru : undefined}
            className="pointer-events-auto"
            components={{
              DayContent: ({ date }) => <DayContent date={date} />,
            }}
          />
          
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-muted-foreground justify-center border-t pt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span>{isRu ? 'В работе' : 'In Progress'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>{isRu ? 'Назначено' : 'Assigned'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>{isRu ? 'Срочное' : 'Urgent'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tasks Summary */}
      {orders.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {isRu ? 'Ближайшие задания' : 'Upcoming Tasks'}
            </h3>
            <div className="space-y-2">
              {orders
                .filter(o => o.scheduled_at)
                .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
                .slice(0, 5)
                .map(order => (
                  <div 
                    key={order.id} 
                    className={cn(
                      "p-3 rounded-none border cursor-pointer transition-colors hover:bg-muted/50",
                      order.status === 'in_progress' && "border-warning bg-warning/5"
                    )}
                    onClick={() => {
                      if (order.scheduled_at) {
                        setSelectedDate(new Date(order.scheduled_at));
                        setShowDaySheet(true);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {isRu ? order.service_name_ru || order.service_name : order.service_name}
                        </p>
                        {order.property && (
                          <p className="text-xs text-muted-foreground truncate">
                            {isRu ? order.property.title_ru : order.property.title_en}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {order.scheduled_at && format(new Date(order.scheduled_at), 'dd.MM HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day Tasks Sheet */}
      <Sheet open={showDaySheet} onOpenChange={setShowDaySheet}>
        <SheetContent side="bottom" className="h-[80vh] overflow-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>
              {selectedDate && format(selectedDate, isRu ? 'd MMMM yyyy' : 'MMMM d, yyyy', {
                locale: isRu ? ru : undefined
              })}
            </SheetTitle>
          </SheetHeader>

          {selectedDateTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{isRu ? 'Нет заданий на этот день' : 'No tasks for this day'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateTasks.map(order => (
                <Card key={order.id} className={cn(
                  order.status === 'in_progress' && "border-warning"
                )}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">
                          {isRu ? order.service_name_ru || order.service_name : order.service_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{order.order_number}</p>
                      </div>
                      <div className="flex gap-1">
                        <Badge className={priorityColors[order.priority]}>
                          {priorityLabels[order.priority][isRu ? 'ru' : 'en']}
                        </Badge>
                        <Badge variant={order.status === 'in_progress' ? 'default' : 'secondary'}>
                          {order.status === 'in_progress' 
                            ? (isRu ? 'В работе' : 'In Progress')
                            : (isRu ? 'Назначено' : 'Assigned')
                          }
                        </Badge>
                      </div>
                    </div>

                    {order.property && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <div className="font-medium">
                            {isRu ? order.property.title_ru : order.property.title_en}
                          </div>
                          {order.property.address && (
                            <div className="text-muted-foreground">{order.property.address}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {order.scheduled_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(order.scheduled_at), 'HH:mm', {
                            locale: isRu ? ru : undefined
                          })}
                        </span>
                      </div>
                    )}

                    {order.notes && (
                      <div className="text-sm text-muted-foreground bg-muted p-2 rounded-none">
                        {order.notes}
                      </div>
                    )}

                    {order.status === 'in_progress' ? (
                      <Button 
                        className="w-full" 
                        onClick={() => onCompleteOrder(order.id)}
                        disabled={isCompleting}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isRu ? 'Завершить' : 'Complete'}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        className="w-full" 
                        onClick={() => onStartOrder(order.id)}
                        disabled={isStarting}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isRu ? 'Начать' : 'Start'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
