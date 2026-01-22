import { OperationalTask } from '@/hooks/useOperationalTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  LogIn, 
  LogOut, 
  Sparkles, 
  Wrench, 
  Search, 
  Gauge,
  CheckCircle2
} from 'lucide-react';

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

interface OperationalTaskCardProps {
  task: OperationalTask;
  isRu: boolean;
  onComplete: (id: string) => void;
  onStartProgress?: (id: string) => void;
  isPending: boolean;
  compact?: boolean;
  completed?: boolean;
}

export function OperationalTaskCard({ 
  task, 
  isRu, 
  onComplete, 
  onStartProgress, 
  isPending, 
  compact, 
  completed 
}: OperationalTaskCardProps) {
  const config = TASK_CONFIG[task.task_type];
  const Icon = config.icon;
  
  return (
    <Card className={cn(
      "transition-all",
      completed && "opacity-60",
      task.priority === 'urgent' && !completed && "border-destructive/50"
    )}>
      <CardContent className={cn("flex items-center gap-3", compact ? "p-3" : "p-4")}>
        <div className={cn(
          "rounded-lg flex items-center justify-center shrink-0",
          config.bgColor,
          compact ? "w-10 h-10" : "w-12 h-12"
        )}>
          <Icon className={cn(config.color, compact ? "h-5 w-5" : "h-6 w-6")} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("font-medium truncate", compact && "text-sm")}>
              {isRu ? (task.title_ru || task.title) : task.title}
            </p>
            {task.priority === 'urgent' && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                {isRu ? 'Срочно' : 'Urgent'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {task.property?.title || (isRu ? 'Объект' : 'Property')}
            {task.scheduled_time && ` • ${task.scheduled_time.slice(0, 5)}`}
          </p>
          {task.description && !compact && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>

        {!completed && (
          <div className="flex items-center gap-2 shrink-0">
            {task.status === 'pending' && onStartProgress && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStartProgress(task.id)}
                disabled={isPending}
              >
                {isRu ? 'Начать' : 'Start'}
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button 
                size="sm" 
                onClick={() => onComplete(task.id)}
                disabled={isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {isRu ? 'Готово' : 'Done'}
              </Button>
            )}
          </div>
        )}

        {completed && task.completed_at && (
          <p className="text-xs text-muted-foreground shrink-0">
            {format(new Date(task.completed_at), 'HH:mm', { locale: isRu ? ru : undefined })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { TASK_CONFIG };
