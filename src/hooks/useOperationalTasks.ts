import { bangkokTodayISO } from '@/lib/hotelDates';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { startOfDay, endOfDay, addDays, format, isToday } from 'date-fns';
import { CompanyAccessLifetime, StaleCompanyAccessOperation, bindCompanyAccessOperation, type BoundCompanyAccessOperation } from '@/lib/companyAccessOperation';
import { createManagedOperationalTask, editManagedOperationalTask } from '@/lib/managedTaskCommands';

export interface OperationalTask {
  id: string;
  property_id: string;
  booking_id: string | null;
  task_type: 'check_in' | 'check_out' | 'cleaning' | 'maintenance' | 'inspection' | 'meter_reading';
  title: string;
  title_ru: string | null;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  property?: {
    id: string;
    title: string;
    title_ru: string;
    cover_image: string | null;
  };
  booking?: {
    id: string;
    guest_name: string | null;
    check_in: string;
    check_out: string;
  };
}

export interface CreateTaskInput {
  /** Reuse on uncertain-response retry; canonical task ID, not a property ID. */
  request_id?: string;
  property_id: string;
  booking_id?: string;
  task_type: OperationalTask['task_type'];
  title: string;
  title_ru?: string;
  description?: string;
  scheduled_date: string;
  scheduled_time?: string;
  priority?: OperationalTask['priority'];
  assigned_to?: string;
  notes?: string;
}

export function useOperationalTasks(options?: {
  propertyId?: string;
  date?: Date;
  dateRange?: { from: Date; to: Date };
  status?: OperationalTask['status'] | OperationalTask['status'][];
  taskType?: OperationalTask['task_type'] | OperationalTask['task_type'][];
}) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { allProperties, isLoading: propsLoading, error: propertiesError, refetch: refetchProperties } = useMyProperties();
  const allPropertyIds = useMemo(() => allProperties.map(p => p.property_id), [allProperties]);
  const operationLifetimes=useRef(new Set<CompanyAccessLifetime>());
  const pendingTaskCreates=useRef(new Map<string,string>());
  const operationScope=allProperties.map(p=>`${p.property_id}:${p.management_company_id}:${p.checked_task_commands_enforced}`).join(',');
  const mutationScope=JSON.stringify([user?.id,operationScope]);
  const mutationScopeRef=useRef(mutationScope);
  if(mutationScopeRef.current!==mutationScope){
    mutationScopeRef.current=mutationScope;
    for(const lifetime of operationLifetimes.current)lifetime.invalidate();
    operationLifetimes.current.clear();pendingTaskCreates.current.clear();
  }
  useEffect(()=>()=>{for(const lifetime of operationLifetimes.current)lifetime.invalidate();operationLifetimes.current.clear();pendingTaskCreates.current.clear();},[]);
  const withManagedOperation=async<T,>(companyId:string,action:(operation:BoundCompanyAccessOperation)=>Promise<T>)=>{
    if(mutationScopeRef.current!==mutationScope)throw new StaleCompanyAccessOperation();
    const lifetime=new CompanyAccessLifetime(user?.id,companyId);operationLifetimes.current.add(lifetime);
    const lease=lifetime.begin();
    try{return await action(await bindCompanyAccessOperation(lease));}
    finally{lease.finish();lifetime.invalidate();operationLifetimes.current.delete(lifetime);}
  };
  const propertyForMutation=(propertyId:string)=>{
    if(mutationScopeRef.current!==mutationScope)throw new StaleCompanyAccessOperation();
    if(propertiesError||propsLoading)throw new Error('Property access is not ready. Reload before changing a task.');
    const property=allProperties.find(p=>p.property_id===propertyId);
    if(!property||property.management_company_id===undefined)throw new Error('Property company scope could not be verified. Reload before changing a task.');
    if(property.management_company_id&&typeof property.checked_task_commands_enforced!=='boolean')throw new Error('Property task-command activation could not be verified. Reload before changing a task.');
    return property;
  };
  
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;

  // Stabilize query key to prevent infinite refetches
  const dateStr = options?.date ? format(options.date, 'yyyy-MM-dd') : undefined;
  const dateRangeStr = options?.dateRange 
    ? `${format(options.dateRange.from, 'yyyy-MM-dd')}-${format(options.dateRange.to, 'yyyy-MM-dd')}`
    : undefined;
  const statusArr = options?.status ? (Array.isArray(options.status) ? options.status : [options.status]).sort().join(',') : undefined;
  const typeArr = options?.taskType ? (Array.isArray(options.taskType) ? options.taskType : [options.taskType]).sort().join(',') : undefined;
  const propertyIdsKey = allPropertyIds.join(',');

  const queryKey = ['operational-tasks', user?.id, options?.propertyId, dateStr, dateRangeStr, statusArr, typeArr, propertyIdsKey,operationScope];
  
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (propertiesError) throw propertiesError;
      if (!user?.id || allPropertyIds.length === 0) return [];

      let query = supabase
        .from('property_operational_tasks')
        .select(`
          *,
          property:properties!property_id (
            id,
            title,
            title_ru,
            cover_image,
            owner_id
          ),
          booking:property_bookings (
            id,
            guest_name,
            check_in,
            check_out
          )
        `)
        .in('property_id', allPropertyIds)
        .order('scheduled_date', { ascending: true })
        .order('priority', { ascending: false });

      // Filter by property
      if (options?.propertyId) {
        query = query.eq('property_id', options.propertyId);
      }

      // Filter by date
      if (options?.date) {
        const dateStr = format(options.date, 'yyyy-MM-dd');
        query = query.eq('scheduled_date', dateStr);
      }

      // Filter by date range
      if (options?.dateRange) {
        query = query
          .gte('scheduled_date', format(options.dateRange.from, 'yyyy-MM-dd'))
          .lte('scheduled_date', format(options.dateRange.to, 'yyyy-MM-dd'));
      }

      // Filter by status
      if (options?.status) {
        const statuses = Array.isArray(options.status) ? options.status : [options.status];
        query = query.in('status', statuses);
      }

      // Filter by task type
      if (options?.taskType) {
        const types = Array.isArray(options.taskType) ? options.taskType : [options.taskType];
        query = query.in('task_type', types);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as OperationalTask[];
    },
    enabled: !!user?.id && !propsLoading && !propertiesError,
  });

  // Note: Realtime subscription removed to prevent infinite query loops.
  // The dashboard uses pull-to-refresh and React Query staleTime for data freshness.
  // For real-time updates on specific pages (like Operations), use a separate subscription there.

  // Today's tasks helper
  const todayTasks = tasks.filter(task => task.scheduled_date === bangkokTodayISO());

  // Tasks by type
  const tasksByType = {
    checkIns: todayTasks.filter(t => t.task_type === 'check_in' && t.status === 'pending'),
    checkOuts: todayTasks.filter(t => t.task_type === 'check_out' && t.status === 'pending'),
    cleaning: todayTasks.filter(t => t.task_type === 'cleaning' && !['completed', 'cancelled'].includes(t.status)),
    maintenance: todayTasks.filter(t => t.task_type === 'maintenance' && !['completed', 'cancelled'].includes(t.status)),
    meterReadings: todayTasks.filter(t => t.task_type === 'meter_reading' && t.status === 'pending'),
  };

  // Create task
  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const property=propertyForMutation(input.property_id);
      if(property.management_company_id&&property.checked_task_commands_enforced){
        const intent=JSON.stringify({actor:user?.id,company:property.management_company_id,input});
        const request=input.request_id??pendingTaskCreates.current.get(intent)??crypto.randomUUID();
        pendingTaskCreates.current.set(intent,request);
        const saved=await withManagedOperation(property.management_company_id,operation=>createManagedOperationalTask(operation,input,request));
        pendingTaskCreates.current.delete(intent);return saved;
      }
      const {request_id:_requestId,...legacyInput}=input;
      const { data, error } = await supabase
        .from('property_operational_tasks')
        .insert({
          ...legacyInput,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error(t('Task not saved or access denied', 'Задача не сохранена или нет доступа'));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
      toast(t('Task created', 'Задача создана'), { description: t('The task has been added', 'Задача добавлена') });
    },
    onError: (error: Error) => {
      toast.error(t('Error', 'Ошибка'), { description: error.message });
    },
  });

  // Update task status
  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status, notes }: { taskId: string; status: OperationalTask['status']; notes?: string }) => {
      if(tasksError)throw tasksError;
      const task=tasks.find(row=>row.id===taskId);
      if(!task)throw new Error('Task not saved or access denied. Reload this task before changing it.');
      const property=propertyForMutation(task.property_id);
      if(property.management_company_id&&property.checked_task_commands_enforced)return withManagedOperation(property.management_company_id,operation=>editManagedOperationalTask(operation,task,{status,...(notes!==undefined?{notes}:{})}));
      const updates: Record<string, any> = { status };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user?.id;
      }
      
      if (status !== 'completed') {
        updates.completed_at = null;
        updates.completed_by = null;
      }
      if (notes !== undefined) {
        updates.notes = notes;
      }

      const { data, error } = await supabase
        .from('property_operational_tasks')
        .update(updates as never)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error(t('Task not saved or access denied', 'Задача не сохранена или нет доступа'));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
    },
  });

  // Complete task
  const editTask=useMutation({
    mutationFn:async({taskId,patch}:{taskId:string;patch:Record<string,unknown>})=>{
      if(tasksError)throw tasksError;
      const task=tasks.find(row=>row.id===taskId);
      if(!task)throw new Error('Reload this task before changing it');
      const property=propertyForMutation(task.property_id);
      if(property.management_company_id&&property.checked_task_commands_enforced)return withManagedOperation(property.management_company_id,operation=>editManagedOperationalTask(operation,task,patch));
      const {data,error}=await supabase.from('property_operational_tasks').update(patch as never).eq('id',taskId).select().single();
      if(error)throw error;if(!data)throw new Error('Task change was not confirmed');return data;
    },
    onSuccess:()=>{queryClient.invalidateQueries({queryKey:['operational-tasks']});},
  });
  const deleteTask=useMutation({
    mutationFn:async(taskId:string)=>{
      if(tasksError)throw tasksError;
      const task=tasks.find(row=>row.id===taskId);
      if(!task)throw new Error('Reload this task before changing it');
      const property=propertyForMutation(task.property_id);
      if(property.management_company_id&&property.checked_task_commands_enforced)throw new Error('Cancel this managed task instead of deleting its operational history');
      const {data,error}=await supabase.from('property_operational_tasks').delete().eq('id',taskId).select().single();
      if(error)throw error;if(!data)throw new Error('Task deletion was not confirmed');return data;
    },
    onSuccess:()=>{queryClient.invalidateQueries({queryKey:['operational-tasks']});},
  });
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      return updateTaskStatus.mutateAsync({ taskId, status: 'completed' });
    },
    onSuccess: () => {
      toast(t('Task completed', 'Задача выполнена'));
    },
    onError: () => {
      toast.error(t('Could not complete task. Refresh and retry.', 'Не удалось завершить задачу. Обновите и повторите.'));
    },
  });

  return {
    tasks,
    todayTasks,
    tasksByType,
    isLoading: tasksLoading || propsLoading,
    error: propertiesError || tasksError,
    refetch: async () => {
      if (propertiesError) await refetchProperties?.();
      return refetch();
    },
    createTask,
    editTask,
    deleteTask,
    updateTaskStatus,
    completeTask,
  };
}

// Hook for today's operations summary - uses stable date reference
export function useTodayOperations() {
  // Use stable date that doesn't change on every render
  const today = useMemo(() => new Date(), []);
  
  return useOperationalTasks({
    date: today,
    status: ['pending', 'in_progress'],
  });
}
