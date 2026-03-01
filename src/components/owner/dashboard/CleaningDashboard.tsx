import { useLanguage } from '@/contexts/LanguageContext';
import { useOperationalTasks } from '@/hooks/useOperationalTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Sparkles, CheckCircle2, Clock, Play, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow } from 'date-fns';

export function CleaningDashboard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => isRu ? ru : en;
  const navigate = useNavigate();

  const { tasks = [], isLoading } = useOperationalTasks();

  // Filter cleaning tasks for today and tomorrow
  const cleaningTasks = tasks.filter((task: any) => {
    if (task.task_type !== 'cleaning') return false;
    const date = task.scheduled_date;
    if (!date) return false;
    const d = new Date(date);
    return isToday(d) || isTomorrow(d);
  });

  const todayTasks = cleaningTasks.filter((t: any) => isToday(new Date(t.scheduled_date)));
  const tomorrowTasks = cleaningTasks.filter((t: any) => isTomorrow(new Date(t.scheduled_date)));

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
    if (status === 'in_progress') return <Play className="h-3.5 w-3.5 text-info" />;
    return <Clock className="h-3.5 w-3.5 text-warning" />;
  };

  const statusLabel = (status: string) => {
    if (status === 'completed') return t('Done', 'Готово');
    if (status === 'in_progress') return t('In Progress', 'В работе');
    return t('Pending', 'Ожидает');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (cleaningTasks.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="font-semibold text-[15px] flex items-center gap-2 px-1">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('Cleaning Schedule', 'Расписание уборок')}
        </h3>
        <Card className="border-dashed">
          <CardContent className="py-5 text-center text-muted-foreground text-sm">
            {t('No cleanings today or tomorrow', 'Нет уборок на сегодня и завтра')}
          </CardContent>
        </Card>
      </section>
    );
  }

  const completedToday = todayTasks.filter((t: any) => t.status === 'completed').length;

  const renderTasks = (taskList: any[], label: string) => {
    if (taskList.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">{label}</p>
        {taskList.map((task: any) => (
          <Card
            key={task.id}
            className="cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => navigate('/mc/tasks')}
          >
            <CardContent className="p-3 flex items-center gap-3">
              {statusIcon(task.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                {task.scheduled_time && (
                  <p className="text-xs text-muted-foreground">{task.scheduled_time.slice(0, 5)}</p>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {statusLabel(task.status)}
              </Badge>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-[15px] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('Cleaning Schedule', 'Расписание уборок')}
          <Badge variant="secondary" className="text-xs">{cleaningTasks.length}</Badge>
        </h3>
        {todayTasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedToday}/{todayTasks.length} {t('done today', 'готово сегодня')}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {renderTasks(todayTasks, t('Today', 'Сегодня'))}
        {renderTasks(tomorrowTasks, t('Tomorrow', 'Завтра'))}
      </div>
    </section>
  );
}
