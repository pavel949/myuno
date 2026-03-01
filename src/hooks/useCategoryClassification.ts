import { useMemo } from 'react';
import { useFinancialCategories, type FinancialCategory } from '@/hooks/useFinancialCategories';
import type { CategoryClass, CategoryGroup } from '@/lib/categoryDefaults';

/**
 * Utility hook for filtering and grouping categories by classification dimensions.
 * Used by reports to compute totals by fixed/variable, group, etc.
 */
export function useCategoryClassification(type: 'expense' | 'income') {
  const { categories, isLoading } = useFinancialCategories(type);

  const byClass = useMemo(() => {
    const map = new Map<CategoryClass, FinancialCategory[]>();
    for (const cat of categories) {
      const arr = map.get(cat.category_class) || [];
      arr.push(cat);
      map.set(cat.category_class, arr);
    }
    return map;
  }, [categories]);

  const byGroup = useMemo(() => {
    const map = new Map<CategoryGroup, FinancialCategory[]>();
    for (const cat of categories) {
      const arr = map.get(cat.category_group) || [];
      arr.push(cat);
      map.set(cat.category_group, arr);
    }
    return map;
  }, [categories]);

  const profitAffecting = useMemo(
    () => categories.filter(c => c.affects_net_profit),
    [categories]
  );

  const taxDeductible = useMemo(
    () => categories.filter(c => c.is_tax_deductible),
    [categories]
  );

  /** Sum amounts by class from a Record<categoryCode, amount> */
  const totalsByClass = (amounts: Record<string, number>) => {
    const result: Record<string, number> = {};
    for (const cat of categories) {
      if (amounts[cat.code]) {
        result[cat.category_class] = (result[cat.category_class] || 0) + amounts[cat.code];
      }
    }
    return result;
  };

  /** Sum amounts by group */
  const totalsByGroup = (amounts: Record<string, number>) => {
    const result: Record<string, number> = {};
    for (const cat of categories) {
      if (amounts[cat.code]) {
        result[cat.category_group] = (result[cat.category_group] || 0) + amounts[cat.code];
      }
    }
    return result;
  };

  /** Get codes that match a specific class */
  const codesForClass = (cls: CategoryClass) =>
    categories.filter(c => c.category_class === cls).map(c => c.code);

  /** Get codes that match a specific group */
  const codesForGroup = (grp: CategoryGroup) =>
    categories.filter(c => c.category_group === grp).map(c => c.code);

  return {
    categories,
    byClass,
    byGroup,
    profitAffecting,
    taxDeductible,
    totalsByClass,
    totalsByGroup,
    codesForClass,
    codesForGroup,
    isLoading,
  };
}
