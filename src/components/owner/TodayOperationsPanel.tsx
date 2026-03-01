import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTodayOperations } from '@/hooks/useOperationalTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LogIn, LogOut, Sparkles, Wrench, CheckCircle2, 
  Clock, ArrowRight, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const TASK_CONFIG = {
  check_in: { icon: LogIn, color: 'text-success', bg: 'bg-success/10', label: 'Check-in', labelRu: 'Заезд' },
  check_out: { icon: LogOut, color: 'text-warning', bg: 'bg-warning/10', label: 'Check-out', labelRu: 'Выезд' },
  cleaning: { icon: Sparkles, color: 'text-info', bg: 'bg-info/10', label: 'Cleaning', labelRu: 'Уборка' },
  maintenance: { icon: Wrench, color: 'text-accent-amber', bg: 'bg-accent-amber/10', label: 'Maintenance', labelRu: 'Ремонт' },
  inspection: { icon: ClipboardList, color: 'text-accent-purple', bg: 'bg-accent-purple/10', label: 'Inspection', labelRu: 'Осмотр' },
  meter_reading: { icon: Clock, color: 'text-primary', bg: 'bg-primary/10', label: 'Meters', labelRu: 'Счётчики' },
};

export function TodayOperationsPanel() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { todayTasks, tasksByType, isLoading, completeTask } = useTodayOperations();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  const pendingTasks = todayTasks.filter(t => t.status !== 'completed');

  if (pendingTasks.length === 0) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {isRu ? 'Все задачи выполнены!' : 'All tasks completed!'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'На сегодня задач нет' : 'No tasks for today'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          {isRu ? 'Задачи на сегодня' : "Today's Tasks"}
          <Badge variant="secondary" className="ml-1">{pendingTasks.length}</Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/mc/operations')}>
          {isRu ? 'Все' : 'All'}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {pendingTasks.slice(0, 5).map((task) => {
          const config = TASK_CONFIG[task.task_type as keyof typeof TASK_CONFIG] || TASK_CONFIG.maintenance;
          const Icon = config.icon;
          const propertyTitle = isRu ? task.property?.title_ru : task.property?.title;
          
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className={cn("p-2 rounded-full", config.bg)}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {isRu ? task.title_ru || task.title : task.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {propertyTitle}
                  {task.scheduled_time && ` • ${task.scheduled_time.slice(0, 5)}`}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => completeTask.mutate(task.id)}
                disabled={completeTask.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        
        {pendingTasks.length > 5 && (
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={() => navigate('/mc/operations')}
          >
            {isRu ? `Ещё ${pendingTasks.length - 5} задач` : `${pendingTasks.length - 5} more tasks`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
