import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/hooks/usePropertyFinancials';
import { useCompanyCategorySettings } from '@/hooks/useCompanyCategorySettings';
import { getCategoryDefaults, type CategoryClass, type CategoryGroup, type AllocationMethod } from '@/lib/categoryDefaults';
import { toast } from 'sonner';
import { useMemo } from 'react';

export interface FinancialCategory {
  code: string;
  name_en: string;
  name_ru: string;
  icon?: string;
  color?: string;
  isCustom?: boolean;
  category_class: CategoryClass;
  category_group: CategoryGroup;
  affects_net_profit: boolean;
  is_tax_deductible: boolean;
  allocation_method: AllocationMethod;
}

export function useFinancialCategories(type: 'expense' | 'income') {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const { enabledCodes, settings } = useCompanyCategorySettings(type);

  const { data: customCategories = [], isLoading } = useQuery({
    queryKey: ['financial-categories', companyId, type],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('financial_categories' as any)
        .select('code,name_en,name_ru,icon,color,category_class,category_group,affects_net_profit,is_tax_deductible,allocation_method')
        .eq('company_id', companyId)
        .eq('category_type', type)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Array<{
        code: string;
        name_en: string;
        name_ru: string;
        icon: string | null;
        color: string | null;
        category_class: string | null;
        category_group: string | null;
        affects_net_profit: boolean | null;
        is_tax_deductible: boolean | null;
        allocation_method: string | null;
      }>;
    },
    enabled: !!user && !!companyId,
  });

  const standardCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Memoize the entire merge to avoid rebuilding on every render
  const categories = useMemo<FinancialCategory[]>(() => {
    // Build overrides map from company settings
    const overridesMap = new Map<string, {
      category_class?: string | null;
      category_group?: string | null;
      affects_net_profit?: boolean | null;
      is_tax_deductible?: boolean | null;
      allocation_method?: string | null;
      custom_name_en?: string | null;
      custom_name_ru?: string | null;
    }>();
    if (settings) {
      for (const s of settings) {
        overridesMap.set(s.category_code, s);
      }
    }

    const filteredStandard = enabledCodes
      ? standardCategories.filter(c => enabledCodes.has(c.value))
      : standardCategories;

    const standardCodes = new Set(filteredStandard.map(c => c.value));

    return [
      ...filteredStandard.map(c => {
        const defaults = getCategoryDefaults(c.value, type);
        const override = overridesMap.get(c.value);
        return {
          code: c.value,
          name_en: override?.custom_name_en || c.labelEn,
          name_ru: override?.custom_name_ru || c.labelRu,
          category_class: (override?.category_class as CategoryClass) || defaults.class,
          category_group: (override?.category_group as CategoryGroup) || defaults.group,
          affects_net_profit: override?.affects_net_profit ?? defaults.affectsProfit,
          is_tax_deductible: override?.is_tax_deductible ?? defaults.taxDeductible,
          allocation_method: (override?.allocation_method as AllocationMethod) || defaults.allocation,
        };
      }),
      ...customCategories
        .filter(c => !standardCodes.has(c.code))
        .map(c => ({
          code: c.code,
          name_en: c.name_en,
          name_ru: c.name_ru,
          icon: c.icon || undefined,
          color: c.color || undefined,
          isCustom: true as const,
          category_class: (c.category_class as CategoryClass) || 'variable' as const,
          category_group: (c.category_group as CategoryGroup) || 'other' as const,
          affects_net_profit: c.affects_net_profit ?? true,
          is_tax_deductible: c.is_tax_deductible ?? false,
          allocation_method: (c.allocation_method as AllocationMethod) || 'direct' as const,
        })),
    ];
  }, [standardCategories, enabledCodes, settings, customCategories, type]);

  return { categories, isLoading };
}

export function useCreateFinancialCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();

  return useMutation({
    mutationFn: async (data: {
      category_type: 'expense' | 'income';
      code: string;
      name_en: string;
      name_ru: string;
      icon?: string;
      color?: string;
      category_class?: string;
      category_group?: string;
      affects_net_profit?: boolean;
      is_tax_deductible?: boolean;
      allocation_method?: string;
    }) => {
      if (!user || !activeCompany) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('financial_categories' as any)
        .insert({
          company_id: activeCompany.company_id,
          created_by: user.id,
          ...data,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast.success(vars.category_type === 'expense' ? 'Статья расхода добавлена' : 'Статья дохода добавлена');
    },
    onError: (err: Error) => {
      if (err.message.includes('unique')) {
        toast.error('Категория с таким кодом уже существует');
      } else {
        toast.error('Ошибка: ' + err.message);
      }
    },
  });
}
