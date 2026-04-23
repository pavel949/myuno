import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCrmTasks, useUpdateCrmTask, CrmTask } from '@/hooks/useCrmTasks';
import { AgentDeal, formatValue } from '@/hooks/useAgentDeals';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  CheckCircle2, Clock, AlertTriangle, Phone, Calendar,
  ArrowRight, Star, Flame,
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MyDayWidgetProps {
  deals: AgentDeal[];
}

export function MyDayWidget({ deals }: MyDayWidgetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allTasks = [] } = useCrmTasks({ status: 'active' });
  const updateTask = useUpdateCrmTask();

  const myTasks = useMemo(() => {
    return allTasks
      .filter(t => t.assigned_to === user?.id || !t.assigned_to)
      .slice(0, 8);
  }, [allTasks, user?.id]);

  const overdueTasks = useMemo(
    () => myTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))),
    [myTasks],
  );
  const todayTasks = useMemo(
    () => myTasks.filter(t => t.due_date && isToday(new Date(t.due_date))),
    [myTasks],
  );
  const upcomingTasks = useMemo(
    () => myTasks.filter(t => t.due_date && isTomorrow(new Date(t.due_date))),
    [myTasks],
  );

  // Deals needing follow-up (overdue next_action_date)
  const followUpDeals = useMemo(() => {
    return deals.filter(d => {
      if (!d.next_action_date) return false;
      const nd = new Date(d.next_action_date);
      return isPast(nd) || isToday(nd);
    }).slice(0, 5);
  }, [deals]);

  const completeTask = async (task: CrmTask) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      toast.success(isRu ? 'Задача выполнена' : 'Task completed');
    } catch { /* handled by hook */ }
  };

  const totalItems = overdueTasks.length + todayTasks.length + followUpDeals.length;
  if (totalItems === 0 && upcomingTasks.length === 0) return null;

  return (
    <div className="rounded-none border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-warning" />
          <h3 className="font-semibold text-sm">
            {isRu ? 'Мой день' : 'My Day'}
          </h3>
          {overdueTasks.length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {overdueTasks.length} {isRu ? 'просрочено' : 'overdue'}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(APP_ROUTES.MC_TASKS)}>
          {isRu ? 'Все задачи' : 'All tasks'}
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider">
            {isRu ? 'Просрочено' : 'Overdue'}
          </p>
          {overdueTasks.map(t => (
            <TaskRow key={t.id} task={t} isRu={isRu} isOverdue onComplete={() => completeTask(t)} />
          ))}
        </div>
      )}

      {/* Today's tasks */}
      {todayTasks.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">
            {isRu ? 'Сегодня' : 'Today'}
          </p>
          {todayTasks.map(t => (
            <TaskRow key={t.id} task={t} isRu={isRu} onComplete={() => completeTask(t)} />
          ))}
        </div>
      )}

      {/* Follow-up deals */}
      {followUpDeals.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-warning uppercase tracking-wider flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {isRu ? 'Нужен контакт' : 'Follow-up needed'}
          </p>
          {followUpDeals.map(d => (
            <button
              key={d.id}
              onClick={() => navigate(`${APP_ROUTES.MC_SALES}/${d.id}`)}
              className="w-full flex items-center gap-2 p-2 rounded-none hover:bg-muted/50 transition-colors text-left"
            >
              <Flame className="h-3.5 w-3.5 text-warning shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{d.client_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {d.next_action || (isRu ? 'Связаться' : 'Contact')}
                  {d.deal_value ? ` · ${formatValue(d.deal_value, d.currency)}` : ''}
                </p>
              </div>
              {d.is_vip && <Badge variant="outline" className="text-[9px] text-warning border-warning/30 px-1">VIP</Badge>}
            </button>
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcomingTasks.length > 0 && todayTasks.length === 0 && overdueTasks.length === 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isRu ? 'Завтра' : 'Tomorrow'}
          </p>
          {upcomingTasks.slice(0, 3).map(t => (
            <TaskRow key={t.id} task={t} isRu={isRu} onComplete={() => completeTask(t)} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, isRu, isOverdue, onComplete }: {
  task: CrmTask; isRu: boolean; isOverdue?: boolean; onComplete: () => void;
}) {
  const navigate = useNavigate();
  const priorityColors: Record<string, string> = {
    urgent: 'text-destructive',
    high: 'text-warning',
    normal: 'text-muted-foreground',
    low: 'text-muted-foreground/60',
  };

  return (
    <div className={cn(
      'flex items-center gap-2 p-2 rounded-none group transition-colors',
      isOverdue ? 'bg-destructive/5' : 'hover:bg-muted/30',
    )}>
      <Checkbox
        className="h-4 w-4 shrink-0"
        onCheckedChange={() => onComplete()}
      />
      <button
        onClick={() => {
          if (task.deal_id) navigate(`${APP_ROUTES.MC_SALES}/${task.deal_id}`);
          else navigate(APP_ROUTES.MC_TASKS);
        }}
        className="flex-1 min-w-0 text-left"
      >
        <p className={cn('text-xs font-medium truncate', isOverdue && 'text-destructive')}>
          {task.title}
        </p>
        {task.due_date && (
          <p className={cn('text-[10px]', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
            {format(new Date(task.due_date), 'dd MMM HH:mm')}
          </p>
        )}
      </button>
      <span className={cn('text-[10px]', priorityColors[task.priority] || 'text-muted-foreground')}>
        {task.priority === 'urgent' && <AlertTriangle className="h-3 w-3" />}
      </span>
    </div>
  );
}
