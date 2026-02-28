import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId, useCompanyMembers } from '@/hooks/useAgentDeals';
import { useCrmTasks, useCreateCrmTask, useUpdateCrmTask, useDeleteCrmTask, CrmTask } from '@/hooks/useCrmTasks';
import { useOperationalTasks, OperationalTask } from '@/hooks/useOperationalTasks';
import { useMyProperties } from '@/hooks/useMyProperties';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus, CheckCircle2, Clock, AlertTriangle, Wrench, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isPast, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import { getCrmTaskConfig, CRM_TASK_TYPE_ORDER } from '@/config/crmTaskTypes';
import { getTaskConfig } from '@/config/taskColors';
import { TaskSummaryKPIs } from './TaskSummaryKPIs';
import { TaskDetailSheet, UnifiedTask } from './TaskDetailSheet';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  high: <AlertTriangle className="h-3 w-3 text-destructive" />,
  urgent: <AlertTriangle className="h-3 w-3 text-destructive" />,
  medium: <Clock className="h-3 w-3 text-warning" />,
  normal: <Clock className="h-3 w-3 text-warning" />,
  low: <CheckCircle2 className="h-3 w-3 text-muted-foreground" />,
};

function normalizeCrmTask(t: CrmTask): UnifiedTask {
  return {
    id: t.id,
    source: 'crm',
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    due_date: t.due_date,
    assigned_to: t.assigned_to,
    property_id: t.property_id,
    task_type: t.task_type,
    raw: t,
  };
}

function normalizeOpsTask(t: OperationalTask): UnifiedTask {
  return {
    id: t.id,
    source: 'ops',
    title: t.title,
    description: t.notes,
    status: t.status,
    priority: t.priority,
    due_date: t.scheduled_date,
    assigned_to: t.assigned_to,
    property_id: t.property_id,
    task_type: t.task_type,
    raw: t,
  };
}

export function UnifiedTaskHub() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => isRu ? ru : en;
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const assigneeParam = searchParams.get('assignee');

  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<UnifiedTask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState<'business' | 'operations'>('business');
  const [taskType, setTaskType] = useState('follow_up');
  const [opsTaskType, setOpsTaskType] = useState('cleaning');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('self');
  const [propertyId, setPropertyId] = useState<string>('none');

  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;
  const { data: crmTasks = [], isLoading: crmLoading } = useCrmTasks();
  const { tasks: opsTasks, isLoading: opsLoading } = useOperationalTasks();
  const { data: members = [] } = useCompanyMembers(companyId);
  const { allProperties } = useMyProperties();
  const createCrmTask = useCreateCrmTask();
  const updateCrmTask = useUpdateCrmTask();
  const deleteCrmTask = useDeleteCrmTask();
  const { notifyAssignment } = useTaskNotifications();

  // Normalize all tasks
  const allUnified = useMemo(() => {
    const crm = (crmTasks || []).map(normalizeCrmTask);
    const ops = (opsTasks || []).map(normalizeOpsTask);
    return [...crm, ...ops].sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [crmTasks, opsTasks]);

  // Filter
  const filtered = useMemo(() => {
    let items = activeTab === 'business' ? allUnified.filter(t => t.source === 'crm')
      : activeTab === 'operations' ? allUnified.filter(t => t.source === 'ops')
      : allUnified;

    if (statusFilter === 'active') items = items.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    else if (statusFilter === 'completed') items = items.filter(t => t.status === 'completed');

    if (assigneeParam) items = items.filter(t => t.assigned_to === assigneeParam);

    return items;
  }, [allUnified, activeTab, statusFilter, assigneeParam]);

  const isLoading = crmLoading || opsLoading;

  const getDueDateLabel = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    if (isToday(d)) return t('Today', 'Сегодня');
    if (isTomorrow(d)) return t('Tomorrow', 'Завтра');
    if (isPast(d)) return t('Overdue', 'Просрочено');
    return format(d, 'dd.MM');
  };

  const logActivity = async (action: string, entityType: string, entityId?: string, meta?: Record<string, unknown>) => {
    if (!user) return;
    await supabase.from('team_activity_log').insert({
      user_id: user.id,
      action_type: action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      metadata: meta ?? null,
    } as any).then(() => {});
  };

  const handleCreate = async () => {
    if (!companyId || !user) return;
    if (!title.trim()) { toast.error(t('Title required', 'Введите название')); return; }

    try {
      if (taskCategory === 'business') {
        const result = await createCrmTask.mutateAsync({
          company_id: companyId,
          title: title.trim(),
          description: description || undefined,
          task_type: taskType,
          priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          created_by: user.id,
          assigned_to: assignedTo === 'self' ? user.id : assignedTo,
          property_id: propertyId !== 'none' ? propertyId : undefined,
        });
        logActivity('task_created', 'crm_task', result?.id, { title: title.trim(), task_type: taskType });
        const realAssignee = assignedTo === 'self' ? user.id : assignedTo;
        if (realAssignee !== user.id) {
          notifyAssignment({ assigneeId: realAssignee, taskTitle: title.trim(), taskId: result?.id, taskSource: 'crm', propertyId: propertyId !== 'none' ? propertyId : null });
        }
      } else {
        if (propertyId === 'none') { toast.error(t('Select property', 'Выберите объект')); return; }
        const { data, error } = await supabase.from('property_operational_tasks').insert({
          property_id: propertyId,
          task_type: opsTaskType,
          title: title.trim(),
          description: description || null,
          scheduled_date: dueDate ? format(new Date(dueDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          scheduled_time: dueDate ? format(new Date(dueDate), 'HH:mm') : null,
          priority: priority === 'medium' ? 'normal' : priority as any,
          assigned_to: assignedTo === 'self' ? user.id : assignedTo,
          status: 'pending',
        } as any).select('id').single();
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
        logActivity('task_created', 'ops_task', data?.id, { title: title.trim(), task_type: opsTaskType });
        const realAssignee = assignedTo === 'self' ? user.id : assignedTo;
        if (realAssignee !== user.id) {
          notifyAssignment({ assigneeId: realAssignee, taskTitle: title.trim(), taskId: data?.id, taskSource: 'ops', propertyId: propertyId });
        }
      }
      toast.success(t('Task created', 'Задача создана'));
      setSheetOpen(false);
      setTitle(''); setDescription(''); setDueDate(''); setAssignedTo('self'); setPropertyId('none');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleQuickComplete = (task: UnifiedTask) => {
    handleUpdate(task.id, task.source, { status: 'completed', completed_at: new Date().toISOString() });
    logActivity('task_completed', task.source === 'crm' ? 'crm_task' : 'ops_task', task.id, { title: task.title });
    toast.success(t('Done', 'Выполнено'));
  };

  const handleUpdate = async (id: string, source: 'crm' | 'ops', updates: Record<string, any>) => {
    if (source === 'crm') {
      updateCrmTask.mutate({ id, ...updates });
    } else {
      await supabase.from('property_operational_tasks').update(updates as any).eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
    }
    queryClient.invalidateQueries({ queryKey: ['day-briefing'] });
  };

  const handleDelete = async (id: string, source: 'crm' | 'ops') => {
    if (source === 'crm') {
      deleteCrmTask.mutate(id);
    } else {
      await supabase.from('property_operational_tasks').delete().eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
    }
    logActivity('task_deleted', source === 'crm' ? 'crm_task' : 'ops_task', id);
  };

  const propertiesList = allProperties.map(p => ({ property_id: p.property_id, title: isRu ? (p.title_ru || p.title) : p.title }));

  const OPS_TYPES = ['cleaning', 'maintenance', 'check_in', 'check_out', 'inspection', 'meter_reading'];

  return (
    <PageContainer>
      <PageHeader
        title={t('Tasks', 'Задачи')}
        subtitle={t('Business and operational tasks in one place', 'Бизнес и операционные задачи в одном месте')}
        showBack
        fallbackPath="/owner"
      />

      <TaskSummaryKPIs crmTasks={crmTasks || []} opsTasks={opsTasks || []} />

      <div className="flex items-center justify-between mt-6 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">{t('All', 'Все')}</TabsTrigger>
            <TabsTrigger value="business">
              <Briefcase className="h-3.5 w-3.5 mr-1" />
              {t('Business', 'Бизнес')}
            </TabsTrigger>
            <TabsTrigger value="operations">
              <Wrench className="h-3.5 w-3.5 mr-1" />
              {t('Operations', 'Операции')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t('New', 'Новая')}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t('New Task', 'Новая задача')}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              {/* Category toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTaskCategory('business')}
                  className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-all',
                    taskCategory === 'business' ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:bg-muted'
                  )}
                >
                  <Briefcase className="h-4 w-4" />
                  {t('Business', 'Бизнес')}
                </button>
                <button
                  onClick={() => setTaskCategory('operations')}
                  className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-all',
                    taskCategory === 'operations' ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:bg-muted'
                  )}
                >
                  <Wrench className="h-4 w-4" />
                  {t('Operations', 'Операции')}
                </button>
              </div>

              <div>
                <Label>{t('Task', 'Задача')} *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('Task title...', 'Название задачи...')} />
              </div>

              <div>
                <Label>{t('Description', 'Описание')}</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('Details...', 'Подробности...')} rows={3} />
              </div>

              {/* Task type selection */}
              {taskCategory === 'business' ? (
                <div>
                  <Label>{t('Type', 'Тип')}</Label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                    {CRM_TASK_TYPE_ORDER.slice(0, 8).map(type => {
                      const config = getCrmTaskConfig(type);
                      const Icon = config.icon;
                      return (
                        <button key={type} type="button" onClick={() => setTaskType(type)}
                          className={cn('flex flex-col items-center gap-1 rounded-lg p-2 text-xs border transition-all',
                            taskType === type ? 'border-primary bg-primary/10 font-medium' : 'border-transparent hover:bg-muted/60'
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
                            <Icon className={cn('h-4 w-4', config.color)} />
                          </div>
                          <span className="truncate w-full text-center">{isRu ? config.labelRu : config.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <Label>{t('Task Type', 'Тип задачи')}</Label>
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                    {OPS_TYPES.map(type => {
                      const config = getTaskConfig(type);
                      const Icon = config.icon;
                      return (
                        <button key={type} type="button" onClick={() => setOpsTaskType(type)}
                          className={cn('flex flex-col items-center gap-1 rounded-lg p-2 text-xs border transition-all',
                            opsTaskType === type ? 'border-primary bg-primary/10 font-medium' : 'border-transparent hover:bg-muted/60'
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
                            <Icon className={cn('h-4 w-4', config.color)} />
                          </div>
                          <span className="truncate w-full text-center">{isRu ? config.labelRu : config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('Priority', 'Приоритет')}</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">{t('🔴 High', '🔴 Высокий')}</SelectItem>
                      <SelectItem value="medium">{t('🟡 Medium', '🟡 Средний')}</SelectItem>
                      <SelectItem value="low">{t('🟢 Low', '🟢 Низкий')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('Due Date', 'Срок')}</Label>
                  <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              {members.length > 1 && (
                <div>
                  <Label>{t('Assign to', 'Назначить')}</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">{t('Myself', 'Себе')}</SelectItem>
                      {members.filter(m => m.user_id !== user?.id).map(m => (
                        <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(taskCategory === 'operations' || allProperties.length > 0) && (
                <div>
                  <Label>{t('Property', 'Объект')} {taskCategory === 'operations' ? '*' : ''}</Label>
                  <Select value={propertyId} onValueChange={setPropertyId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('No property', 'Без объекта')}</SelectItem>
                      {allProperties.map(p => (
                        <SelectItem key={p.property_id} value={p.property_id}>{isRu ? p.title_ru || p.title : p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button className="w-full" onClick={handleCreate} disabled={createCrmTask.isPending}>
                {t('Create Task', 'Создать задачу')}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {['active', 'completed', 'all'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
            {s === 'active' ? t('Active', 'Активные') : s === 'completed' ? t('Done', 'Выполненные') : t('All', 'Все')}
          </Button>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : !filtered.length ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{t('No tasks', 'Нет задач')}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const dueLabel = getDueDateLabel(task.due_date);
            const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'completed';
            const isCrm = task.source === 'crm';
            const config = isCrm ? getCrmTaskConfig(task.task_type) : getTaskConfig(task.task_type);
            const TypeIcon = config.icon;
            const typeLabel = isCrm
              ? (isRu ? (config as any).labelRu : (config as any).labelEn)
              : (isRu ? (config as any).labelRu : (config as any).label);
            const memberName = members.find(m => m.user_id === task.assigned_to)?.name;

            return (
              <Card
                key={`${task.source}-${task.id}`}
                className={cn(
                  'p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors',
                  isOverdue && 'border-destructive/40',
                  task.status === 'completed' && 'opacity-60'
                )}
                onClick={() => { setDetailTask(task); setDetailOpen(true); }}
              >
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={(e) => { e && task.status !== 'completed' && handleQuickComplete(task); }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0"
                />
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  isCrm ? (config as any).bgColor : (config as any).bgColor
                )}>
                  <TypeIcon className={cn('h-4 w-4', isCrm ? (config as any).color : (config as any).color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', task.status === 'completed' && 'line-through text-muted-foreground')}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {PRIORITY_ICONS[task.priority]}
                    <span className="text-xs text-muted-foreground">{typeLabel}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {task.source === 'crm' ? t('CRM', 'CRM') : t('Ops', 'Опер')}
                    </Badge>
                    {dueLabel && (
                      <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {dueLabel}
                      </Badge>
                    )}
                    {memberName && (
                      <span className="text-[10px] text-muted-foreground">→ {memberName}</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <TaskDetailSheet
        task={detailTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        members={members}
        properties={propertiesList}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </PageContainer>
  );
}
