import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCrmTasks } from '@/hooks/useCrmTasks';
import { useUpdateCrmTask } from '@/hooks/useCrmTasks';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ListTodo, ChevronRight } from 'lucide-react';
import { isPast, isToday } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getCrmTaskConfig } from '@/config/crmTaskTypes';

export function CrmTasksWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data: tasks } = useCrmTasks({ status: 'pending' });
  const updateTask = useUpdateCrmTask();

  // Show only tasks due today or overdue, max 5
  const urgentTasks = (tasks || [])
    .filter(t => t.due_date && (isToday(new Date(t.due_date)) || isPast(new Date(t.due_date))))
    .slice(0, 5);

  if (!urgentTasks.length) return null;

  const handleComplete = (id: string) => {
    updateTask.mutate(
      { id, status: 'completed', completed_at: new Date().toISOString() },
      { onSuccess: () => toast.success('✓') }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">
            {isRu ? 'Задачи на сегодня' : "Today's Tasks"}
          </h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {urgentTasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/owner/tasks')}>
          {isRu ? 'Все' : 'All'} <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
      </div>

      <div className="space-y-1.5">
        {urgentTasks.map(task => {
          const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
          const config = getCrmTaskConfig(task.task_type);
          const TypeIcon = config.icon;
          return (
            <div key={task.id} className={cn(
              "flex items-center gap-2.5 py-1.5 px-2 rounded-lg",
              isOverdue ? 'bg-destructive/5' : 'bg-muted/50'
            )}>
              <Checkbox onCheckedChange={() => handleComplete(task.id)} className="flex-shrink-0" />
              <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0", config.bgColor)}>
                <TypeIcon className={cn("h-3.5 w-3.5", config.color)} />
              </div>
              <span className="text-sm flex-1 truncate">{task.title}</span>
              {isOverdue && (
                <Badge variant="destructive" className="text-[10px] px-1 py-0">!</Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
