import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTodayOperations } from '@/hooks/useOperationalTasks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarCheck, LogIn, LogOut, Sparkles, Wrench, 
  CheckCircle2, ChevronRight, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TASK_CONFIG = {
  check_in: { icon: LogIn, color: 'text-success', bg: 'bg-success/10', label: 'Check-in', labelRu: 'Заезд' },
  check_out: { icon: LogOut, color: 'text-warning', bg: 'bg-warning/10', label: 'Check-out', labelRu: 'Выезд' },
  cleaning: { icon: Sparkles, color: 'text-info', bg: 'bg-info/10', label: 'Cleaning', labelRu: 'Уборка' },
  maintenance: { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Maintenance', labelRu: 'Ремонт' },
};

// Map hook keys to task_type values
const TYPE_KEY_MAP: Record<string, keyof typeof TASK_CONFIG> = {
  checkIns: 'check_in',
  checkOuts: 'check_out',
  cleaning: 'cleaning',
  maintenance: 'maintenance',
};

export function OperationsSection() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { todayTasks, tasksByType, isLoading } = useTodayOperations();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const pendingTasks = todayTasks.filter(t => t.status !== 'completed');
  const taskCounts = Object.entries(tasksByType)
    .map(([key, tasks]) => ({
      type: TYPE_KEY_MAP[key] || 'maintenance',
      count: tasks.filter(t => t.status !== 'completed').length
    }))
    .filter(t => t.count > 0);

  // All done - show compact success state
  if (pendingTasks.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">
            {isRu ? 'Операции' : 'Operations'}
          </h2>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/owner/operations')}>
            {isRu ? 'Все' : 'View all'}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        <Card className="p-4 border-success/20 bg-gradient-to-br from-success/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-success">
                {isRu ? 'Всё выполнено!' : 'All tasks complete!'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Нет задач на сегодня' : 'No pending tasks for today'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base">
            {isRu ? 'Сегодня' : 'Today'}
          </h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {pendingTasks.length} {isRu ? 'задач' : 'tasks'}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/owner/operations')}>
          {isRu ? 'Все' : 'View all'}
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Task type cards - grid layout */}
      <div className="grid grid-cols-2 gap-2">
        {taskCounts.map(({ type, count }) => {
          const config = TASK_CONFIG[type];
          const Icon = config.icon;
          
          return (
            <Card 
              key={type}
              className={cn(
                "p-3 cursor-pointer hover:shadow-md transition-all",
                "border-l-4",
                type === 'maintenance' ? 'border-l-orange-500' :
                type === 'check_in' ? 'border-l-success' :
                type === 'check_out' ? 'border-l-warning' :
                'border-l-info'
              )}
              onClick={() => navigate(`/owner/operations?type=${type}`)}
            >
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? config.labelRu : config.label}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
