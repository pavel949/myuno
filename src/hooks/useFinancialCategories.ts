import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/hooks/usePropertyFinancials';
import { useCompanyCategorySettings } from '@/hooks/useCompanyCategorySettings';
import { toast } from 'sonner';

export interface FinancialCategory {
  code: string;
  name_en: string;
  name_ru: string;
  icon?: string;
  color?: string;
  isCustom?: boolean;
}

/**
 * Returns merged list of standard + custom categories for active MC,
 * filtered by company_category_settings (if configured).
 */
export function useFinancialCategories(type: 'expense' | 'income') {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const { enabledCodes } = useCompanyCategorySettings(type);

  const { data: customCategories = [], isLoading } = useQuery({
    queryKey: ['financial-categories', companyId, type],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('financial_categories' as any)
        .select('*')
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
      }>;
    },
    enabled: !!user && !!companyId,
  });

  const standardCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Filter standard categories by company settings (null = all enabled)
  const filteredStandard = enabledCodes
    ? standardCategories.filter(c => enabledCodes.has(c.value))
    : standardCategories;

  // Merge: filtered standard first, then custom (skip duplicates by code)
  const standardCodes = new Set(filteredStandard.map(c => c.value));
  const merged: FinancialCategory[] = [
    ...filteredStandard.map(c => ({
      code: c.value,
      name_en: c.labelEn,
      name_ru: c.labelRu,
    })),
    ...customCategories
      .filter(c => !standardCodes.has(c.code))
      .map(c => ({
        code: c.code,
        name_en: c.name_en,
        name_ru: c.name_ru,
        icon: c.icon || undefined,
        color: c.color || undefined,
        isCustom: true,
      })),
  ];

  return { categories: merged, isLoading };
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
