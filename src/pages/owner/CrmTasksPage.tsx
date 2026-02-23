import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId, useCompanyMembers } from '@/hooks/useAgentDeals';
import { useCrmTasks, useCreateCrmTask, useUpdateCrmTask, useDeleteCrmTask, CrmTask } from '@/hooks/useCrmTasks';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, CheckCircle2, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isPast, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import { CRM_TASK_TYPE_ORDER, getCrmTaskConfig } from '@/config/crmTaskTypes';

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  high: <AlertTriangle className="h-3 w-3 text-destructive" />,
  medium: <Clock className="h-3 w-3 text-warning" />,
  low: <CheckCircle2 className="h-3 w-3 text-muted-foreground" />,
};

export default function CrmTasksPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;
  const { data: tasks, isLoading } = useCrmTasks({ status: statusFilter === 'all' ? undefined : statusFilter });
  const { data: members } = useCompanyMembers(companyId);
  const { allProperties } = useMyProperties();
  const createTask = useCreateCrmTask();
  const updateTask = useUpdateCrmTask();
  const deleteTask = useDeleteCrmTask();

  // Form
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState('follow_up');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('self');
  const [propertyId, setPropertyId] = useState<string>('none');

  const handleCreate = async () => {
    if (!companyId || !user) return;
    if (!title.trim()) {
      toast.error(isRu ? 'Введите название задачи' : 'Task title required');
      return;
    }
    try {
      await createTask.mutateAsync({
        company_id: companyId,
        title: title.trim(),
        task_type: taskType,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        created_by: user.id,
        assigned_to: assignedTo === 'self' ? user.id : assignedTo,
        property_id: propertyId !== 'none' ? propertyId : undefined,
      });
      toast.success(isRu ? 'Задача создана' : 'Task created');
      setSheetOpen(false);
      setTitle('');
      setDueDate('');
      setAssignedTo('self');
      setPropertyId('none');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleComplete = (task: CrmTask) => {
    updateTask.mutate(
      { id: task.id, status: 'completed', completed_at: new Date().toISOString() },
      { onSuccess: () => toast.success(isRu ? 'Выполнено' : 'Done') }
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTaskId) return;
    deleteTask.mutate(deleteTaskId, {
      onSuccess: () => {
        toast.success(isRu ? 'Задача удалена' : 'Task deleted');
        setDeleteTaskId(null);
      },
    });
  };

  const getDueDateLabel = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    if (isToday(d)) return isRu ? 'Сегодня' : 'Today';
    if (isTomorrow(d)) return isRu ? 'Завтра' : 'Tomorrow';
    if (isPast(d)) return isRu ? 'Просрочено' : 'Overdue';
    return format(d, 'dd.MM');
  };

  // Apply priority filter
  const filteredTasks = (tasks || []).filter(t => priorityFilter === 'all' || t.priority === priorityFilter);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isRu ? 'Задачи CRM' : 'CRM Tasks'}</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {isRu ? 'Новая' : 'New'}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{isRu ? 'Новая задача' : 'New Task'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>{isRu ? 'Задача' : 'Task'} *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={isRu ? 'Позвонить клиенту...' : 'Call client...'} />
              </div>

              {/* Task Type Grid with icons */}
              <div>
                <Label>{isRu ? 'Тип задачи' : 'Task Type'}</Label>
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {CRM_TASK_TYPE_ORDER.map(type => {
                    const config = getCrmTaskConfig(type);
                    const Icon = config.icon;
                    const isSelected = taskType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTaskType(type)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-all border",
                          isSelected
                            ? "border-primary bg-primary/10 font-medium"
                            : "border-transparent hover:bg-muted/60"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor)}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <span className="truncate w-full text-center">
                          {isRu ? config.labelRu : config.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRu ? 'Приоритет' : 'Priority'}</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">{isRu ? '🔴 Высокий' : '🔴 High'}</SelectItem>
                      <SelectItem value="medium">{isRu ? '🟡 Средний' : '🟡 Medium'}</SelectItem>
                      <SelectItem value="low">{isRu ? '🟢 Низкий' : '🟢 Low'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isRu ? 'Срок' : 'Due Date'}</Label>
                  <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              {/* Assign to team member */}
              {members && members.length > 1 && (
                <div>
                  <Label>{isRu ? 'Назначить' : 'Assign to'}</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">{isRu ? 'Себе' : 'Myself'}</SelectItem>
                      {members.filter(m => m.user_id !== user?.id).map(m => (
                        <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Link to property */}
              {allProperties.length > 0 && (
                <div>
                  <Label>{isRu ? 'Объект' : 'Property'}</Label>
                  <Select value={propertyId} onValueChange={setPropertyId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{isRu ? 'Без объекта' : 'No property'}</SelectItem>
                      {allProperties.map(p => (
                        <SelectItem key={p.property_id} value={p.property_id}>{isRu ? p.title_ru : p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button className="w-full" onClick={handleCreate} disabled={createTask.isPending}>
                {isRu ? 'Создать задачу' : 'Create Task'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Status + Priority Filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {['pending', 'completed', 'all'].map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
              {s === 'pending' ? (isRu ? 'Активные' : 'Active') :
               s === 'completed' ? (isRu ? 'Выполненные' : 'Done') :
               isRu ? 'Все' : 'All'}
            </Button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {['all', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={cn(
                'px-2 py-0.5 text-xs rounded-full border transition-colors',
                priorityFilter === p ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground border-border',
              )}
            >
              {p === 'all' ? (isRu ? 'Все' : 'All') :
               p === 'high' ? (isRu ? '🔴 Высокий' : '🔴 High') :
               p === 'medium' ? (isRu ? '🟡 Средний' : '🟡 Medium') :
               isRu ? '🟢 Низкий' : '🟢 Low'}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : !filteredTasks.length ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            {statusFilter === 'pending' 
              ? (isRu ? 'Нет активных задач' : 'No active tasks')
              : (isRu ? 'Нет задач' : 'No tasks')}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const dueLabel = getDueDateLabel(task.due_date);
            const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status === 'pending';
            const config = getCrmTaskConfig(task.task_type);
            const TypeIcon = config.icon;

            return (
              <Card key={task.id} className={cn(
                "p-3 flex items-center gap-3",
                isOverdue && "border-destructive/40",
                task.status === 'completed' && "opacity-60"
              )}>
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => task.status === 'pending' && handleComplete(task)}
                  className="flex-shrink-0"
                />
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", config.bgColor)}>
                  <TypeIcon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", task.status === 'completed' && "line-through text-muted-foreground")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {PRIORITY_ICONS[task.priority]}
                    <span className="text-xs text-muted-foreground">
                      {isRu ? config.labelRu : config.labelEn}
                    </span>
                    {dueLabel && (
                      <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {dueLabel}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => setDeleteTaskId(task.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={open => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить задачу?' : 'Delete task?'}</AlertDialogTitle>
            <AlertDialogDescription>{isRu ? 'Это действие нельзя отменить' : 'This action cannot be undone'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
