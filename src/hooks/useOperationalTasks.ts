import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { startOfDay, endOfDay, addDays, format, isToday } from 'date-fns';

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
  const { allProperties, isLoading: propsLoading } = useMyProperties();
  const allPropertyIds = useMemo(() => allProperties.map(p => p.property_id), [allProperties]);
  
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;

  // Stabilize query key to prevent infinite refetches
  const dateStr = options?.date ? format(options.date, 'yyyy-MM-dd') : undefined;
  const dateRangeStr = options?.dateRange 
    ? `${format(options.dateRange.from, 'yyyy-MM-dd')}-${format(options.dateRange.to, 'yyyy-MM-dd')}`
    : undefined;
  const statusArr = options?.status ? (Array.isArray(options.status) ? options.status : [options.status]).sort().join(',') : undefined;
  const typeArr = options?.taskType ? (Array.isArray(options.taskType) ? options.taskType : [options.taskType]).sort().join(',') : undefined;
  const propertyIdsKey = allPropertyIds.join(',');

  const queryKey = ['operational-tasks', user?.id, options?.propertyId, dateStr, dateRangeStr, statusArr, typeArr, propertyIdsKey];
  
  const { data: tasks = [], isLoading: tasksLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id || allPropertyIds.length === 0) return [];

      let query = supabase
        .from('property_operational_tasks')
        .select(`
          *,
          property:owner_properties!property_id (
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
    enabled: !!user?.id,
  });

  // Note: Realtime subscription removed to prevent infinite query loops.
  // The dashboard uses pull-to-refresh and React Query staleTime for data freshness.
  // For real-time updates on specific pages (like Operations), use a separate subscription there.

  // Today's tasks helper
  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.scheduled_date);
    return isToday(taskDate);
  });

  // Tasks by type
  const tasksByType = {
    checkIns: todayTasks.filter(t => t.task_type === 'check_in' && t.status === 'pending'),
    checkOuts: todayTasks.filter(t => t.task_type === 'check_out' && t.status === 'pending'),
    cleaning: todayTasks.filter(t => t.task_type === 'cleaning' && t.status !== 'completed'),
    maintenance: todayTasks.filter(t => t.task_type === 'maintenance' && t.status !== 'completed'),
    meterReadings: todayTasks.filter(t => t.task_type === 'meter_reading' && t.status === 'pending'),
  };

  // Create task
  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase
        .from('property_operational_tasks')
        .insert({
          ...input,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
      toast({
        title: t('Task created', 'Задача создана'),
        description: t('The task has been added', 'Задача добавлена'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('Error', 'Ошибка'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update task status
  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status, notes }: { taskId: string; status: OperationalTask['status']; notes?: string }) => {
      const updates: Record<string, any> = { status };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user?.id;
      }
      
      if (notes) {
        updates.notes = notes;
      }

      const { data, error } = await supabase
        .from('property_operational_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
    },
  });

  // Complete task
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      return updateTaskStatus.mutateAsync({ taskId, status: 'completed' });
    },
    onSuccess: () => {
      toast({
        title: t('Task completed', 'Задача выполнена'),
      });
    },
  });

  return {
    tasks,
    todayTasks,
    tasksByType,
    isLoading: tasksLoading || propsLoading,
    refetch,
    createTask,
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
