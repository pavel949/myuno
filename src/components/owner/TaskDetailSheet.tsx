import { OperationalTask } from '@/hooks/useOperationalTasks';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, User, CalendarDays, Home, StickyNote, PlayCircle } from 'lucide-react';
import { getTaskConfig } from '@/config/taskColors';

interface TaskDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: OperationalTask | null;
  onComplete?: (id: string) => void;
  onStartProgress?: (id: string) => void;
  isPending?: boolean;
}

const priorityMap: Record<string, { label: string; labelRu: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  urgent: { label: 'Urgent', labelRu: 'Срочно', variant: 'destructive' },
  high: { label: 'High', labelRu: 'Высокий', variant: 'destructive' },
  normal: { label: 'Normal', labelRu: 'Обычный', variant: 'secondary' },
  low: { label: 'Low', labelRu: 'Низкий', variant: 'outline' },
};

const statusLabels: Record<string, { en: string; ru: string }> = {
  pending: { en: 'Pending', ru: 'Ожидает' },
  in_progress: { en: 'In Progress', ru: 'В работе' },
  completed: { en: 'Completed', ru: 'Завершена' },
  cancelled: { en: 'Cancelled', ru: 'Отменена' },
};

export function TaskDetailSheet({ open, onOpenChange, task, onComplete, onStartProgress, isPending }: TaskDetailSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!task) return null;

  const config = getTaskConfig(task.task_type);
  const Icon = config.icon;
  const priority = priorityMap[task.priority] || priorityMap.normal;
  const statusLabel = statusLabels[task.status] || statusLabels.pending;
  const isCompleted = task.status === 'completed';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-xl">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate">{isRu ? (task.title_ru || task.title) : task.title}</p>
              <p className="text-sm font-normal text-muted-foreground">
                {isRu ? config.labelRu : config.label}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6 overflow-y-auto">
          {/* Status & Priority badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={isCompleted ? 'outline' : 'secondary'}>
              {isRu ? statusLabel.ru : statusLabel.en}
            </Badge>
            <Badge variant={priority.variant}>
              {isRu ? priority.labelRu : priority.label}
            </Badge>
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(task.scheduled_date), 'd MMMM yyyy', { locale: isRu ? ru : undefined })}</span>
            </div>
            {task.scheduled_time && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{task.scheduled_time.slice(0, 5)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Property */}
          {task.property && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <Home className="h-4 w-4" />
                {isRu ? 'Объект' : 'Property'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isRu ? (task.property.title_ru || task.property.title) : task.property.title}
              </p>
            </div>
          )}

          {/* Linked booking */}
          {task.booking && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {isRu ? 'Бронирование' : 'Booking'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {task.booking.guest_name || (isRu ? 'Гость' : 'Guest')}
                {' • '}
                {format(new Date(task.booking.check_in), 'd MMM', { locale: isRu ? ru : undefined })}
                {' — '}
                {format(new Date(task.booking.check_out), 'd MMM', { locale: isRu ? ru : undefined })}
              </p>
            </div>
          )}

          {/* Assigned to */}
          {task.assigned_to && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {isRu ? 'Исполнитель' : 'Assigned to'}
              </h4>
              <p className="text-sm text-muted-foreground">{task.assigned_to}</p>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <>
              <Separator />
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{isRu ? 'Описание' : 'Description'}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
              </div>
            </>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <StickyNote className="h-4 w-4" />
                {isRu ? 'Заметки' : 'Notes'}
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}

          {/* Completed info */}
          {isCompleted && task.completed_at && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm">
              <div className="flex items-center gap-2 text-success font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {isRu ? 'Выполнена' : 'Completed'}
              </div>
              <p className="text-muted-foreground mt-1">
                {format(new Date(task.completed_at), 'd MMM yyyy, HH:mm', { locale: isRu ? ru : undefined })}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!isCompleted && (
            <>
              <Separator />
              <div className="flex gap-2">
                {task.status === 'pending' && onStartProgress && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => { onStartProgress(task.id); onOpenChange(false); }}
                    disabled={isPending}
                  >
                    <PlayCircle className="h-4 w-4" />
                    {isRu ? 'Начать' : 'Start'}
                  </Button>
                )}
                {onComplete && (
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => { onComplete(task.id); onOpenChange(false); }}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isRu ? 'Завершить' : 'Complete'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
