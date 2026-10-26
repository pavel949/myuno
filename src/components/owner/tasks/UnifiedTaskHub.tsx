import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId, useCompanyMembers } from '@/hooks/useAgentDeals';
import { useCrmTasks, useCreateCrmTask, useUpdateCrmTask, useDeleteCrmTask, CrmTask } from '@/hooks/useCrmTasks';
import { useOperationalTasks, OperationalTask } from '@/hooks/useOperationalTasks';
import { useMyProperties } from '@/hooks/useMyProperties';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Plus, CheckCircle2, Clock, AlertTriangle, Wrench, Briefcase, ClipboardPlus } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getCrmTaskConfig, CRM_TASK_TYPE_ORDER } from '@/config/crmTaskTypes';
import { getTaskConfig } from '@/config/taskColors';
import { TaskSummaryKPIs } from './TaskSummaryKPIs';
import { TaskDetailSheet, UnifiedTask } from './TaskDetailSheet';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { isTaskClosedStatus, isTaskCompletedStatus } from '@/lib/tasks/taskStatus';
import { bangkokTodayISO, civilDateKey, parseCivilDate, toBangkokDateKey } from '@/lib/hotelDates';
import { getTodayReturnPath } from '@/lib/tasks/taskNavigation';

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
  const t = (en: string, ru: string, th?: string) => isRu ? ru : language === 'th' ? (th || en) : en;
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const setSearchParams = useCallback((next: URLSearchParams, options?: { replace?: boolean }) => {
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, options);
  }, [navigate, location.pathname, location.hash]);
  const assigneeParam = searchParams.get('assignee');
  const tabParam = searchParams.get('tab');
  const statusParam = searchParams.get('status');
  const activeTab = tabParam === 'business' || tabParam === 'operations' ? tabParam : 'all';
  const statusFilter = statusParam === 'all' || statusParam === 'completed' ? statusParam : 'active';
  const detailId = searchParams.get('id');
  const detailSource = searchParams.get('source');
  const detailCompany = searchParams.get('company');
  const detailRequested = searchParams.has('id') || searchParams.has('source');
  const validDetail = !!detailId && (detailSource === 'crm' || detailSource === 'ops');
  const returnTo = getTodayReturnPath(searchParams.get('returnTo'));
  const [sheetOpen, setSheetOpen] = useState(false);
  const updateFilter = (key: 'tab' | 'status', value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next);
  };
  const closeDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('id');
    next.delete('source');
    setSearchParams(next);
  };

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState<'business' | 'operations'>('business');
  const [taskType, setTaskType] = useState('follow_up');
  const [opsTaskType, setOpsTaskType] = useState<OperationalTask['task_type']>('cleaning');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('self');
  const [propertyId, setPropertyId] = useState<string>('none');

  const { data: company, isLoading: companyLoading, error: companyError, refetch: refetchCompany } = useMyCompanyId();
  const companyId = company?.company_id;
  useEffect(() => {
    if (searchParams.get('action') !== 'create' || !companyId || !user) return;
    setSheetOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('action');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, companyId, user]);
  const { data: crmTasks = [], isLoading: crmLoading, error: crmError, refetch: refetchCrm } = useCrmTasks();
  const { tasks: opsTasks, isLoading: opsLoading, error: opsError, refetch: refetchOps,createTask:createOpsTask,editTask:editOpsTask,deleteTask:deleteOpsTask } = useOperationalTasks();
  const opsCreateRequest=useRef<string | null>(null);
  const { data: members = [] } = useCompanyMembers(companyId);
  const { activeProperties, isLoading: propertiesLoading, error: propertiesError, refetch: refetchProperties } = useMyProperties();
  const allProperties = activeProperties || [];
  const createCrmTask = useCreateCrmTask();
  const updateCrmTask = useUpdateCrmTask();
  const deleteCrmTask = useDeleteCrmTask();
  const { notifyAssignment } = useTaskNotifications();

  const propertyIds = useMemo(() => new Set((activeProperties || []).map(p => p.property_id)), [activeProperties]);
  const propertyScopeKey = JSON.stringify([...propertyIds].sort());
  const selectionKey = JSON.stringify([detailSource, detailId, detailCompany]);
  const propertiesReady = !companyLoading && !!companyId && !propertiesLoading && !propertiesError;
  // A URL selection is bound to the context in which it was opened. Do not let
  // stale reader arrays re-resolve that selection after an actor/company/scope switch.
  const currentScope = {
    selectionKey,
    actorId: user?.id || null,
    companyId: companyId || null,
    propertyScopeKey: propertiesReady ? propertyScopeKey : null,
    invalidated: false,
  };
  const [selectionScope, setSelectionScope] = useState(currentScope);
  let boundScope = selectionScope.selectionKey === selectionKey ? selectionScope : currentScope;
  const scopeChanged = !!(
    (boundScope.actorId && boundScope.actorId !== user?.id) ||
    (boundScope.companyId && boundScope.companyId !== companyId) ||
    (boundScope.propertyScopeKey !== null && propertiesReady && boundScope.propertyScopeKey !== propertyScopeKey)
  );
  if (boundScope !== selectionScope || (detailRequested && (
    (!boundScope.actorId && currentScope.actorId) ||
    (!boundScope.companyId && currentScope.companyId) ||
    (boundScope.propertyScopeKey === null && currentScope.propertyScopeKey !== null) ||
    (scopeChanged && !boundScope.invalidated)
  ))) {
    boundScope = {
      ...boundScope,
      actorId: boundScope.actorId || currentScope.actorId,
      companyId: boundScope.companyId || currentScope.companyId,
      propertyScopeKey: boundScope.propertyScopeKey ?? currentScope.propertyScopeKey,
      invalidated: boundScope.invalidated || scopeChanged,
    };
    setSelectionScope(boundScope);
  }

  const contextReady = !!user && !!companyId && !companyLoading && !companyError && propertiesReady;
  const scopedCrmTasks = useMemo(() => contextReady && !crmLoading && !crmError
    ? (crmTasks || []).filter(task => task.company_id === companyId && (!task.property_id || propertyIds.has(task.property_id)))
    : [], [contextReady, crmLoading, crmError, crmTasks, companyId, propertyIds]);
  const scopedOpsTasks = useMemo(() => contextReady && !opsLoading && !opsError
    ? (opsTasks || []).filter(task => propertyIds.has(task.property_id))
    : [], [contextReady, opsLoading, opsError, opsTasks, propertyIds]);

  // Resolve by source AND ID from the current loaded scope only; never query a
  // supplied ID or fall back to the other source when it is missing.
  const allUnified = useMemo(() => [...scopedCrmTasks.map(normalizeCrmTask), ...scopedOpsTasks.map(normalizeOpsTask)]
    .sort((a, b) => (toBangkokDateKey(a.due_date) || '9999').localeCompare(toBangkokDateKey(b.due_date) || '9999')),
  [scopedCrmTasks, scopedOpsTasks]);
  const detailError = companyError || propertiesError || (detailSource === 'crm' ? crmError : opsError);
  const detailLoading = companyLoading || propertiesLoading || (detailSource === 'crm' ? crmLoading : opsLoading);
  const detailScopeValid = validDetail && !boundScope.invalidated && !scopeChanged && !!user &&
    (!detailCompany || !companyId || detailCompany === companyId);
  const detailTask = detailScopeValid && contextReady && !detailLoading && !detailError
    ? allUnified.find(task => task.source === detailSource && task.id === detailId) || null
    : null;
  const detailState = !detailScopeValid ? 'unavailable' : detailError ? 'error' : detailLoading ? 'loading' : 'unavailable';
  const openDetail = (task: UnifiedTask) => {
    const next = new URLSearchParams(searchParams);
    next.set('source', task.source);
    next.set('id', task.id);
    if (companyId) next.set('company', companyId);
    setSearchParams(next);
  };
  const retryTasks = () => {
    if (companyError) void refetchCompany?.();
    if (propertiesError) void refetchProperties?.();
    void refetchCrm?.();
    void refetchOps?.();
  };

  // Filter
  const filtered = useMemo(() => {
    let items = activeTab === 'business' ? allUnified.filter(t => t.source === 'crm')
      : activeTab === 'operations' ? allUnified.filter(t => t.source === 'ops')
      : allUnified;

    if (statusFilter === 'active') items = items.filter(t => !isTaskClosedStatus(t.status));
    else if (statusFilter === 'completed') items = items.filter(t => isTaskCompletedStatus(t.status));

    if (assigneeParam) items = items.filter(t => t.assigned_to === assigneeParam);

    return items;
  }, [allUnified, activeTab, statusFilter, assigneeParam]);

  const isLoading = companyLoading || propertiesLoading || crmLoading || opsLoading;
  const loadError = companyError || propertiesError || crmError || opsError;
  const todayKey = bangkokTodayISO();
  const tomorrowKey = civilDateKey(addDays(parseCivilDate(todayKey), 1));

  const getDueDateLabel = (date: string | null) => {
    const day = toBangkokDateKey(date);
    if (!day) return null;
    if (day === todayKey) return t('Today', 'Сегодня', 'วันนี้');
    if (day === tomorrowKey) return t('Tomorrow', 'Завтра', 'พรุ่งนี้');
    if (day < todayKey) return t('Overdue', 'Просрочено', 'เกินกำหนด');
    return `${day.slice(8, 10)}.${day.slice(5, 7)}`;
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

  const invalidateOverviewQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['day-briefing'] });
    queryClient.invalidateQueries({ queryKey: ['property-financials-full'] });
    queryClient.invalidateQueries({ queryKey: ['property-financials-paginated'] });
    queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
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
        opsCreateRequest.current??=crypto.randomUUID();
        await createOpsTask.mutateAsync({
          request_id:opsCreateRequest.current,
          property_id: propertyId,
          task_type: opsTaskType,
          title: title.trim(),
          description: description || undefined,
          scheduled_date: dueDate ? format(new Date(dueDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          scheduled_time: dueDate ? format(new Date(dueDate), 'HH:mm') : undefined,
          priority: priority === 'medium' ? 'normal' : priority as any,
          assigned_to: assignedTo === 'self' ? user.id : assignedTo,
        });
        opsCreateRequest.current=null;
        invalidateOverviewQueries();
      }
      toast.success(t('Task created', 'Задача создана'));
      setSheetOpen(false);
      setTitle(''); setDescription(''); setDueDate(''); setAssignedTo('self'); setPropertyId('none');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleQuickComplete = async (task: UnifiedTask) => {
    try {
      await handleUpdate(task.id, task.source, { status: 'completed', completed_at: new Date().toISOString() });
      if(task.source==='crm')logActivity('task_completed', 'crm_task', task.id, { title: task.title });
      toast.success(t('Done', 'Выполнено'));
    }catch(error){toast.error(error instanceof Error?error.message:t('Task was not saved','Задача не сохранена'));}
  };

  const handleUpdate = async (id: string, source: 'crm' | 'ops', updates: Record<string, any>) => {
    if (source === 'crm') {
      const next = { ...updates };
      if (next.status && next.status !== 'completed' && next.completed_at === undefined) {
        next.completed_at = null;
      }
      await updateCrmTask.mutateAsync({ id, ...next });
    } else {
      const next = { ...updates };
      if (next.status === 'completed' && next.completed_by === undefined) {
        next.completed_by = user?.id ?? null;
      }
      if (next.status && next.status !== 'completed') {
        if (next.completed_at === undefined) next.completed_at = null;
        if (next.completed_by === undefined) next.completed_by = null;
      }
      await editOpsTask.mutateAsync({taskId:id,patch:next});
      invalidateOverviewQueries();
    }
    queryClient.invalidateQueries({ queryKey: ['day-briefing'] });
  };

  const handleDelete = async (id: string, source: 'crm' | 'ops') => {
    if (source === 'crm') {
      await deleteCrmTask.mutateAsync(id);
    } else {
      await deleteOpsTask.mutateAsync(id);
      invalidateOverviewQueries();
    }
    logActivity('task_deleted', source === 'crm' ? 'crm_task' : 'ops_task', id);
  };

  const propertiesList = allProperties.map(p => ({ property_id: p.property_id, title: isRu ? (p.title_ru || p.title) : p.title }));

  const OPS_TYPES: OperationalTask['task_type'][] = ['cleaning', 'maintenance', 'check_in', 'check_out', 'inspection', 'meter_reading'];

  return (
    <PageContainer>
      <PageHeader
        title={t('Tasks', 'Задачи', 'งาน')}
        subtitle={t('Business and operational tasks in one place', 'Бизнес и операционные задачи в одном месте', 'รวมงานธุรกิจและงานปฏิบัติการไว้ในที่เดียว')}
        showBack
        fallbackPath={returnTo || (location.pathname.startsWith('/mc/') ? '/mc/today' : '/owner')}
      />

      {returnTo && (
        <Button asChild variant="outline" size="sm" className="mb-4">
          <Link to={returnTo}>{t('Back to Today', 'Вернуться к обзору дня', 'กลับไปวันนี้')}</Link>
        </Button>
      )}

      {!isLoading && !loadError && <TaskSummaryKPIs crmTasks={scopedCrmTasks} opsTasks={scopedOpsTasks} />}

      <div className="flex flex-wrap items-center justify-between gap-2 mt-6 mb-4">
        <Tabs value={activeTab} onValueChange={value => updateFilter('tab', value)}>
          <TabsList>
            <TabsTrigger value="all">{t('All', 'Все', 'ทั้งหมด')}</TabsTrigger>
            <TabsTrigger value="business">
              <Briefcase className="h-3.5 w-3.5 mr-1" />
              {t('Business', 'Бизнес', 'ธุรกิจ')}
            </TabsTrigger>
            <TabsTrigger value="operations">
              <Wrench className="h-3.5 w-3.5 mr-1" />
              {t('Operations', 'Операции', 'ปฏิบัติการ')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button size="sm" onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('New', 'Новая', 'ใหม่')}
        </Button>

        <ResponsiveModal
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={t('New Task', 'Новая задача')}
          icon={<ClipboardPlus className="w-5 h-5 text-primary" />}
          size="lg"
          footer={
            <Button className="w-full sm:w-auto min-w-[200px]" onClick={handleCreate} disabled={createCrmTask.isPending||createOpsTask?.isPending}>
              {t('Create Task', 'Создать задачу')}
            </Button>
          }
        >
            <div className="space-y-4">
              {/* Category toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTaskCategory('business')}
                  className={cn('flex-1 flex flex-col items-center gap-1 py-2.5 rounded-none border text-sm transition-all',
                    taskCategory === 'business' ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:bg-muted'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    {t('Business', 'Бизнес', 'ธุรกิจ')}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {t('Clients, deals, calls', 'Клиенты, сделки, звонки')}
                  </span>
                </button>
                <button
                  onClick={() => setTaskCategory('operations')}
                  className={cn('flex-1 flex flex-col items-center gap-1 py-2.5 rounded-none border text-sm transition-all',
                    taskCategory === 'operations' ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:bg-muted'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" />
                    {t('Operations', 'Операции', 'ปฏิบัติการ')}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {t('Cleaning, repairs, check-ins', 'Уборка, ремонт, заезды')}
                  </span>
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
                          className={cn('flex flex-col items-center gap-1 rounded-none p-2 text-xs border transition-all',
                            taskType === type ? 'border-primary bg-primary/10 font-medium' : 'border-transparent hover:bg-muted/60'
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-none flex items-center justify-center', config.bgColor)}>
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
                          className={cn('flex flex-col items-center gap-1 rounded-none p-2 text-xs border transition-all',
                            opsTaskType === type ? 'border-primary bg-primary/10 font-medium' : 'border-transparent hover:bg-muted/60'
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-none flex items-center justify-center', config.bgColor)}>
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
            </div>
        </ResponsiveModal>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {['active', 'completed', 'all'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => updateFilter('status', s)}>
            {s === 'active' ? t('Active', 'Активные', 'กำลังดำเนินการ') : s === 'completed' ? t('Done', 'Выполненные', 'เสร็จแล้ว') : t('All', 'Все', 'ทั้งหมด')}
          </Button>
        ))}
      </div>

      {/* Task list */}
      {loadError ? (
        <Card className="p-6 space-y-3" role="alert">
          <p>{t('Could not load tasks. Please try again.', 'Не удалось загрузить задачи. Повторите попытку.', 'โหลดงานไม่สำเร็จ โปรดลองอีกครั้ง')}</p>
          <Button variant="outline" onClick={retryTasks}>{t('Retry', 'Повторить', 'ลองอีกครั้ง')}</Button>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-none" />)}
        </div>
      ) : !filtered.length ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{t('No tasks', 'Нет задач', 'ไม่มีงาน')}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const dueLabel = getDueDateLabel(task.due_date);
            const dueDay = toBangkokDateKey(task.due_date);
            const isOverdue = dueDay && dueDay < todayKey && !isTaskClosedStatus(task.status);
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
                  isTaskCompletedStatus(task.status) && 'opacity-60'
                )}
                onClick={() => openDetail(task)}
              >
                <Checkbox
                  checked={isTaskCompletedStatus(task.status)}
                  onCheckedChange={(e) => { if (e && !isTaskCompletedStatus(task.status)) handleQuickComplete(task); }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0"
                />
                <div className={cn('w-9 h-9 rounded-none flex items-center justify-center flex-shrink-0',
                  isCrm ? (config as any).bgColor : (config as any).bgColor
                )}>
                  <TypeIcon className={cn('h-4 w-4', isCrm ? (config as any).color : (config as any).color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', isTaskCompletedStatus(task.status) && 'line-through text-muted-foreground')}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {PRIORITY_ICONS[task.priority]}
                    <span className="text-xs text-muted-foreground">{typeLabel}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {task.source === 'crm' ? t('CRM', 'CRM') : t('Ops', 'Опер', 'ปฏิบัติการ')}
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

      {detailRequested && detailTask ? (
        <TaskDetailSheet
          key={`${boundScope.actorId}:${boundScope.companyId}:${propertyScopeKey}:${detailTask.source}:${detailTask.id}`}
          task={detailTask}
          open
          onOpenChange={open => { if (!open) closeDetail(); }}
          members={members}
          properties={propertiesList}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : detailRequested ? (
        <ResponsiveModal
          open
          onOpenChange={open => { if (!open) closeDetail(); }}
          title={t('Task details', 'Детали задачи', 'รายละเอียดงาน')}
          size="sm"
          footer={<Button variant="outline" onClick={closeDetail}>{t('Back to tasks', 'К списку задач', 'กลับไปที่รายการงาน')}</Button>}
        >
          <p role={detailState === 'error' ? 'alert' : 'status'}>
            {detailState === 'loading'
              ? t('Loading task…', 'Загрузка задачи…', 'กำลังโหลดงาน…')
              : detailState === 'error'
                ? t('Could not load this task. Please try again.', 'Не удалось загрузить задачу. Повторите попытку.', 'โหลดงานนี้ไม่สำเร็จ โปรดลองอีกครั้ง')
                : t('This task is unavailable in the current company or property scope.', 'Эта задача недоступна в текущей компании или выбранных объектах.', 'งานนี้ไม่พร้อมใช้งานในบริษัทหรือขอบเขตอสังหาริมทรัพย์ปัจจุบัน')}
          </p>
          {detailState === 'error' && <Button variant="outline" onClick={retryTasks}>{t('Retry', 'Повторить', 'ลองอีกครั้ง')}</Button>}
        </ResponsiveModal>
      ) : null}
    </PageContainer>
  );
}
