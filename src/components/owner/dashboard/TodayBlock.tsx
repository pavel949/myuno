import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTodayOperations } from '@/hooks/useOperationalTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarCheck, LogIn, LogOut, Sparkles, Wrench, 
  CheckCircle2, ArrowRight, Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TASK_ICONS = {
  check_in: { icon: LogIn, color: 'text-success', bg: 'bg-success/10' },
  check_out: { icon: LogOut, color: 'text-warning', bg: 'bg-warning/10' },
  cleaning: { icon: Sparkles, color: 'text-info', bg: 'bg-info/10' },
  maintenance: { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  inspection: { icon: Camera, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

export function TodayBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { todayTasks, tasksByType, isLoading } = useTodayOperations();

  const pendingTasks = todayTasks.filter(t => t.status !== 'completed');
  const taskCounts = Object.entries(tasksByType).filter(([_, tasks]) => 
    tasks.some(t => t.status !== 'completed')
  );

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-32 mb-3" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // All done state
  if (pendingTasks.length === 0) {
    return (
      <Card 
        className="overflow-hidden border-success/20 bg-gradient-to-br from-success/5 to-transparent cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/owner/operations')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{isRu ? 'Сегодня' : 'Today'}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-success">
                {isRu ? 'Все задачи выполнены!' : 'All tasks completed!'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Можно отдыхать' : 'Time to relax'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/owner/operations')}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">{isRu ? 'Сегодня' : 'Today'}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Task count summary */}
        <p className="text-2xl font-bold mb-3">
          {pendingTasks.length} {isRu 
            ? (pendingTasks.length === 1 ? 'задача' : 'задач') 
            : (pendingTasks.length === 1 ? 'task' : 'tasks')}
        </p>

        {/* Task type pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {taskCounts.map(([type, tasks]) => {
            const config = TASK_ICONS[type as keyof typeof TASK_ICONS] || TASK_ICONS.maintenance;
            const Icon = config.icon;
            const count = tasks.filter(t => t.status !== 'completed').length;
            if (count === 0) return null;
            
            return (
              <div 
                key={type}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium",
                  config.bg, config.color
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Main action */}
        <Button 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/owner/operations');
          }}
        >
          {isRu ? 'Открыть задачи' : 'Open tasks'}
        </Button>
      </CardContent>
    </Card>
  );
}
