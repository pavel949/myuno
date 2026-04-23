import { useLanguage } from '@/contexts/LanguageContext';
import { useOperationalTasks, OperationalTask } from '@/hooks/useOperationalTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';
import { getTaskConfig } from '@/config/taskColors';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface CalendarTodayTasksProps {
  propertyId?: string;
}

export function CalendarTodayTasks({ propertyId }: CalendarTodayTasksProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const today = useMemo(() => new Date(), []);
  const { tasks, completeTask, isLoading } = useOperationalTasks({
    propertyId,
    date: today,
  });

  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const allTasks = [...pendingTasks, ...completedTasks];

  if (isLoading) return null;
  if (!propertyId) return null;

  if (allTasks.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {isRu ? 'Задачи на сегодня' : "Today's Tasks"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'На сегодня задач нет' : 'No tasks scheduled for today'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {isRu ? 'Задачи на сегодня' : "Today's Tasks"}
          </span>
          <Badge variant="secondary" className="text-xs">
            {pendingTasks.length}/{allTasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {allTasks.map(task => {
          const config = getTaskConfig(task.task_type);
          const Icon = config.icon;
          const isCompleted = task.status === 'completed';

          return (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-none border transition-colors",
                isCompleted ? "opacity-50 bg-muted/30" : "bg-card hover:bg-muted/50"
              )}
            >
              <div className={cn("w-8 h-8 rounded-none flex items-center justify-center shrink-0", config.bgColor)}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isCompleted && "line-through")}>
                  {isRu ? (task.title_ru || task.title) : task.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? config.labelRu : config.label}
                  {task.scheduled_time && ` • ${task.scheduled_time.slice(0, 5)}`}
                  {task.property && ` • ${isRu ? task.property.title_ru : task.property.title}`}
                </p>
              </div>
              {!isCompleted ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 h-8 w-8 p-0"
                  onClick={() => completeTask.mutate(task.id)}
                >
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground hover:text-success transition-colors" />
                </Button>
              ) : (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
