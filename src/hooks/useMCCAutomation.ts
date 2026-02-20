import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_conditions: Record<string, unknown>;
  actions: Record<string, unknown> | unknown[];
  is_active: boolean;
  executions_count: number;
  last_executed_at: string | null;
  user_state_filter: string[];
  landing_filter: string[];
  created_at: string;
  updated_at: string;
}

export interface NewAutomationRule {
  name: string;
  description?: string;
  trigger_type: string;
  trigger_conditions: Record<string, unknown>;
  actions: unknown[];
  is_active?: boolean;
  user_state_filter?: string[];
  landing_filter?: string[];
}

export interface LifecycleTemplate {
  id: string;
  trigger_type: string;
  channel: string;
  title_ru: string;
  title_en: string;
  body_ru: string;
  body_en: string;
  promo_code: string | null;
  discount_percent: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useMCCAutomation() {
  const queryClient = useQueryClient();

  // --- Automation Rules ---
  const rules = useQuery({
    queryKey: ['mcc-automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_automation_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AutomationRule[];
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('mcc_automation_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['mcc-automation-rules'] });
      toast.success(isActive ? 'Правило активировано' : 'Правило отключено');
    },
    onError: () => toast.error('Ошибка при обновлении правила'),
  });

  const createRule = useMutation({
    mutationFn: async (rule: NewAutomationRule) => {
      const { error } = await supabase
        .from('mcc_automation_rules')
        .insert({
          name: rule.name,
          description: rule.description,
          trigger_type: rule.trigger_type,
          trigger_conditions: rule.trigger_conditions as import('@/integrations/supabase/types').Json,
          actions: rule.actions as unknown as import('@/integrations/supabase/types').Json,
          is_active: rule.is_active ?? true,
          executions_count: 0,
          user_state_filter: rule.user_state_filter || [],
          landing_filter: rule.landing_filter || [],
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcc-automation-rules'] });
      toast.success('Правило создано');
    },
    onError: () => toast.error('Ошибка при создании правила'),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mcc_automation_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcc-automation-rules'] });
      toast.success('Правило удалено');
    },
    onError: () => toast.error('Ошибка при удалении правила'),
  });

  // --- Lifecycle Templates ---
  const lifecycleTemplates = useQuery({
    queryKey: ['lifecycle-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lifecycle_templates')
        .select('*')
        .order('trigger_type', { ascending: true });
      if (error) throw error;
      return (data || []) as LifecycleTemplate[];
    },
  });

  const toggleTemplate = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('lifecycle_templates')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifecycle-templates'] });
      toast.success('Шаблон обновлён');
    },
    onError: () => toast.error('Ошибка при обновлении шаблона'),
  });

  const createTemplate = useMutation({
    mutationFn: async (tpl: Omit<LifecycleTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('lifecycle_templates')
        .insert(tpl);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifecycle-templates'] });
      toast.success('Шаблон создан');
    },
    onError: () => toast.error('Ошибка при создании шаблона'),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lifecycle_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifecycle-templates'] });
      toast.success('Шаблон удалён');
    },
    onError: () => toast.error('Ошибка при удалении шаблона'),
  });

  const activeRules = rules.data?.filter(r => r.is_active) || [];
  const totalExecutions = rules.data?.reduce((s, r) => s + (r.executions_count || 0), 0) || 0;

  return {
    rules: rules.data || [],
    activeRules,
    totalExecutions,
    isLoading: rules.isLoading,
    toggleRule: (id: string, isActive: boolean) => toggleRule.mutate({ id, isActive }),
    createRule: (rule: NewAutomationRule) => createRule.mutate(rule),
    deleteRule: (id: string) => deleteRule.mutate(id),
    isCreating: createRule.isPending,
    isDeleting: deleteRule.isPending,
    // Lifecycle templates
    lifecycleTemplates: lifecycleTemplates.data || [],
    isLoadingTemplates: lifecycleTemplates.isLoading,
    toggleTemplate: (id: string, isActive: boolean) => toggleTemplate.mutate({ id, isActive }),
    createTemplate: (tpl: Omit<LifecycleTemplate, 'id' | 'created_at' | 'updated_at'>) => createTemplate.mutate(tpl),
    deleteTemplate: (id: string) => deleteTemplate.mutate(id),
    isCreatingTemplate: createTemplate.isPending,
  };
}
