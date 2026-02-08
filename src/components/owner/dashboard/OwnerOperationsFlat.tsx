import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTodayOperations } from '@/hooks/useOperationalTasks';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_TYPE_CONFIG } from '@/config/taskColors';

export function OwnerOperationsFlat() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { todayTasks, isLoading } = useTodayOperations();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const pendingTasks = todayTasks.filter(t => t.status !== 'completed');

  if (pendingTasks.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-3">{isRu ? 'Сегодня' : 'Today'}</h2>
        <div className="flex items-center gap-3 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <p className="text-[15px] text-muted-foreground">
            {isRu ? 'Нет задач на сегодня' : 'No tasks for today'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold">
          {isRu ? 'Сегодня' : 'Today'}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {pendingTasks.length} {isRu ? 'задач' : 'tasks'}
          </span>
        </h2>
        <button
          onClick={() => navigate('/owner/operations')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isRu ? 'Все' : 'View all'}
        </button>
      </div>

      <div className="divide-y">
        {pendingTasks.slice(0, 5).map(task => {
          const config = TASK_TYPE_CONFIG[task.task_type] || TASK_TYPE_CONFIG.maintenance;
          const Icon = config.icon;
          const dotColor = task.task_type === 'check_in' ? 'bg-green-500'
            : task.task_type === 'check_out' ? 'bg-yellow-500'
            : task.task_type === 'cleaning' ? 'bg-blue-500'
            : 'bg-orange-500';

          return (
            <button
              key={task.id}
              onClick={() => navigate(`/owner/operations?task=${task.id}`)}
              className="w-full flex items-center gap-4 py-4 text-left hover:opacity-70 transition-opacity"
            >
              <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", dotColor)} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[15px] truncate">
                  {isRu ? config.labelRu : config.label}
                </p>
                {task.property?.title && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {isRu ? (task.property.title_ru || task.property.title) : task.property.title}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
