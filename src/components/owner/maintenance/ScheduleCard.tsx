import { MaintenanceSchedule } from '@/hooks/useMaintenanceSchedules';
import { getTemplateByCategory, FREQUENCY_LABELS, type MaintenanceCategory } from '@/config/maintenanceScheduleTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isPast, parseISO } from 'date-fns';

interface Props {
  schedule: MaintenanceSchedule;
  isRu: boolean;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (schedule: MaintenanceSchedule) => void;
  isPending: boolean;
}

export function ScheduleCard({ schedule, isRu, onComplete, onDelete, onEdit, isPending }: Props) {
  const template = getTemplateByCategory(schedule.category as MaintenanceCategory);
  const Icon = template?.icon;
  const dueDate = parseISO(schedule.next_due_date);
  const overdue = isPast(dueDate);
  const daysUntil = differenceInDays(dueDate, new Date());

  const statusLabel = overdue
    ? (isRu ? 'Просрочено' : 'Overdue')
    : daysUntil <= 7
      ? (isRu ? `${daysUntil} дн.` : `${daysUntil}d`)
      : format(dueDate, 'dd MMM');

  const freq = FREQUENCY_LABELS[schedule.frequency as keyof typeof FREQUENCY_LABELS];

  return (
    <Card className={cn(
      "transition-all",
      overdue && "border-destructive/50"
    )}>
      <CardContent className="flex items-center gap-3 p-4">
        {Icon && (
          <div className={cn(
            "rounded-none flex items-center justify-center shrink-0 w-11 h-11",
            template?.bgColor
          )}>
            <Icon className={cn("h-5 w-5", template?.color)} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">
              {isRu ? (schedule.title_ru || schedule.title) : schedule.title}
            </p>
            {overdue && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                {isRu ? 'Просрочено' : 'Overdue'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {(schedule.property as any)?.title ?? ''}
            {' • '}
            {isRu ? freq?.ru : freq?.en}
            {schedule.estimated_cost > 0 && ` • ~${schedule.estimated_cost.toLocaleString()} ${schedule.currency}`}
          </p>
          {schedule.last_completed_at && (
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Последнее: ' : 'Last: '}
              {format(parseISO(schedule.last_completed_at), 'dd MMM yyyy')}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn(
            "text-xs font-medium",
            overdue ? "text-destructive" : daysUntil <= 7 ? "text-warning" : "text-muted-foreground"
          )}>
            {statusLabel}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2"
              onClick={() => onEdit(schedule)}
              disabled={isPending}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2"
              onClick={() => onComplete(schedule.id)}
              disabled={isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              {isRu ? 'Готово' : 'Done'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-muted-foreground"
              onClick={() => onDelete(schedule.id)}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
