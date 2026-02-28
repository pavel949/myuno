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
import { ru, th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ACTIVITY_ICONS = {
  check_in: { icon: LogIn, color: 'text-success', bg: 'bg-success/10' },
  check_out: { icon: LogOut, color: 'text-warning', bg: 'bg-warning/10' },
  cleaning: { icon: Sparkles, color: 'text-info', bg: 'bg-info/10' },
  maintenance: { icon: Wrench, color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
};

export function ActivityBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  
  // Get recently completed tasks
  const { tasks, isLoading } = useOperationalTasks({
    status: 'completed'
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-16 w-full" />
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
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{isRu ? 'АКТИВНОСТЬ' : isTh ? 'กิจกรรม' : 'ACTIVITY'}</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {isRu ? 'Нет недавних действий' : isTh ? 'ไม่มีกิจกรรมล่าสุด' : 'No recent activity'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getLocale = () => isRu ? ru : isTh ? th : undefined;

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
      onClick={() => navigate('/owner/operations?tab=completed')}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{isRu ? 'АКТИВНОСТЬ' : isTh ? 'กิจกรรม' : 'ACTIVITY'}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Activity list - compact */}
        <div className="space-y-1.5">
          {recentTasks.map((task) => {
            const config = ACTIVITY_ICONS[task.task_type as keyof typeof ACTIVITY_ICONS] 
              || { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted' };
            const Icon = config.icon;
            const timeAgo = formatDistanceToNow(new Date(task.completed_at!), {
              addSuffix: true,
              locale: getLocale()
            });

            return (
              <div 
                key={task.id}
                className="flex items-center gap-2 py-1"
              >
                <div className={cn("p-1 rounded-full shrink-0", config.bg)}>
                  <Icon className={cn("h-3 w-3", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {isRu ? task.title_ru || task.title : task.title}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {timeAgo}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
