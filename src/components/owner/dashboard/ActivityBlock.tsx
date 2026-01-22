import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOperationalTasks } from '@/hooks/useOperationalTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, LogIn, LogOut, Sparkles, Wrench, 
  CheckCircle2, ArrowRight 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ACTIVITY_ICONS = {
  check_in: { icon: LogIn, color: 'text-success', bg: 'bg-success/10' },
  check_out: { icon: LogOut, color: 'text-warning', bg: 'bg-warning/10' },
  cleaning: { icon: Sparkles, color: 'text-info', bg: 'bg-info/10' },
  maintenance: { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

export function ActivityBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  // Get recently completed tasks
  const { tasks, isLoading } = useOperationalTasks({
    status: 'completed'
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-32 mb-3" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Get last 5 completed tasks
  const recentTasks = (tasks || [])
    .filter(t => t.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 5);

  if (recentTasks.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{isRu ? 'Активность' : 'Activity'}</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Нет недавних действий' : 'No recent activity'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/owner/operations?tab=completed')}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">{isRu ? 'Активность' : 'Activity'}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Activity list */}
        <div className="space-y-2">
          {recentTasks.map((task) => {
            const config = ACTIVITY_ICONS[task.task_type as keyof typeof ACTIVITY_ICONS] 
              || { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted' };
            const Icon = config.icon;
            const timeAgo = formatDistanceToNow(new Date(task.completed_at!), {
              addSuffix: true,
              locale: isRu ? ru : undefined
            });

            return (
              <div 
                key={task.id}
                className="flex items-center gap-3 py-1.5"
              >
                <div className={cn("p-1.5 rounded-full shrink-0", config.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {isRu ? task.title_ru || task.title : task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.property?.title || ''} • {timeAgo}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
