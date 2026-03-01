import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/hooks/usePropertyFinancials';
import { toast } from 'sonner';

export interface CategorySetting {
  id: string;
  category_code: string;
  category_type: string;
  is_enabled: boolean;
  sort_order: number;
  // Classification overrides (null = use default)
  category_class: string | null;
  category_group: string | null;
  affects_net_profit: boolean | null;
  is_tax_deductible: boolean | null;
  allocation_method: string | null;
  custom_name_en: string | null;
  custom_name_ru: string | null;
}

export function useCompanyCategorySettings(type: 'expense' | 'income') {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-category-settings', companyId, type],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('company_category_settings' as any)
        .select('*')
        .eq('company_id', companyId)
        .eq('category_type', type);
      if (error) throw error;
      return data as unknown as CategorySetting[];
    },
    enabled: !!user && !!companyId,
  });

  const hasSettings = settings !== null && settings !== undefined && settings.length > 0;

  const enabledCodes: Set<string> | null = hasSettings
    ? new Set(settings!.filter(s => s.is_enabled).map(s => s.category_code))
    : null;

  return { settings, enabledCodes, hasSettings, isLoading };
}

export function useToggleCategorySetting() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();

  return useMutation({
    mutationFn: async (data: {
      category_type: 'expense' | 'income';
      category_code: string;
      is_enabled: boolean;
    }) => {
      if (!user || !activeCompany) throw new Error('Not authenticated');
      const companyId = activeCompany.company_id;

      const { error } = await supabase
        .from('company_category_settings' as any)
        .upsert(
          {
            company_id: companyId,
            category_type: data.category_type,
            category_code: data.category_code,
            is_enabled: data.is_enabled,
          } as any,
          { onConflict: 'company_id,category_type,category_code' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-category-settings'] });
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
    },
    onError: (err: Error) => {
      toast.error('Ошибка: ' + err.message);
    },
  });
}

/** Update classification overrides for a category */
export function useUpdateCategoryOverrides() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();

  return useMutation({
    mutationFn: async (data: {
      category_type: 'expense' | 'income';
      category_code: string;
      category_class?: string | null;
      category_group?: string | null;
      affects_net_profit?: boolean | null;
      is_tax_deductible?: boolean | null;
      allocation_method?: string | null;
      custom_name_en?: string | null;
      custom_name_ru?: string | null;
    }) => {
      if (!user || !activeCompany) throw new Error('Not authenticated');
      const companyId = activeCompany.company_id;

      const { error } = await supabase
        .from('company_category_settings' as any)
        .upsert(
          {
            company_id: companyId,
            category_type: data.category_type,
            category_code: data.category_code,
            is_enabled: true,
            ...data,
          } as any,
          { onConflict: 'company_id,category_type,category_code' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-category-settings'] });
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast.success('Настройки категории сохранены');
    },
    onError: (err: Error) => {
      toast.error('Ошибка: ' + err.message);
    },
  });
}

/** Initialize all standard categories as enabled for this company */
export function useInitCategorySettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();

  return useMutation({
    mutationFn: async (type: 'expense' | 'income') => {
      if (!user || !activeCompany) throw new Error('Not authenticated');
      const companyId = activeCompany.company_id;
      const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

      const rows = categories.map((c, i) => ({
        company_id: companyId,
        category_type: type,
        category_code: c.value,
        is_enabled: true,
        sort_order: i,
      }));

      const { error } = await supabase
        .from('company_category_settings' as any)
        .upsert(rows as any, { onConflict: 'company_id,category_type,category_code' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-category-settings'] });
    },
  });
}
