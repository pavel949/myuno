import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCrmTasks } from '@/hooks/useCrmTasks';
import { useUpdateCrmTask } from '@/hooks/useCrmTasks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ListTodo, ChevronRight } from 'lucide-react';
import { isPast, isToday } from 'date-fns';
import { toast } from 'sonner';

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
      { onSuccess: () => toast.success(isRu ? '✓' : '✓') }
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
          return (
            <div key={task.id} className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg ${isOverdue ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted/50'}`}>
              <Checkbox onCheckedChange={() => handleComplete(task.id)} className="flex-shrink-0" />
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
