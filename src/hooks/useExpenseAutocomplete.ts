import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VendorSuggestion {
  name: string;
  count: number;
  category?: string;
}

interface AutocompleteData {
  recentVendors: VendorSuggestion[];
  frequentCategories: { category: string; count: number }[];
  suggestVendor: (input: string) => VendorSuggestion[];
  suggestCategory: (vendor: string) => string | null;
  isLoading: boolean;
}

export function useExpenseAutocomplete(): AutocompleteData {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['expense-autocomplete', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('property_financials')
        .select('vendor_name, category')
        .eq('transaction_type', 'expense')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching expense history:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const recentVendors = useMemo(() => {
    if (!transactions) return [];

    const vendorData = new Map<string, { count: number; category?: string }>();

    transactions.forEach(t => {
      if (t.vendor_name) {
        const existing = vendorData.get(t.vendor_name);
        if (existing) {
          existing.count++;
        } else {
          vendorData.set(t.vendor_name, { 
            count: 1, 
            category: t.category || undefined 
          });
        }
      }
    });

    return [...vendorData.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [transactions]);

  const frequentCategories = useMemo(() => {
    if (!transactions) return [];

    const categoryCounts = new Map<string, number>();

    transactions.forEach(t => {
      if (t.category) {
        categoryCounts.set(t.category, (categoryCounts.get(t.category) || 0) + 1);
      }
    });

    return [...categoryCounts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [transactions]);

  const vendorCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    
    // Build vendor → category mapping from most recent first
    transactions?.forEach(t => {
      if (t.vendor_name && t.category && !map.has(t.vendor_name)) {
        map.set(t.vendor_name, t.category);
      }
    });

    return map;
  }, [transactions]);

  const suggestVendor = (input: string): VendorSuggestion[] => {
    if (!input.trim()) return recentVendors.slice(0, 5);

    const searchTerm = input.toLowerCase();
    return recentVendors
      .filter(v => v.name.toLowerCase().includes(searchTerm))
      .slice(0, 5);
  };

  const suggestCategory = (vendor: string): string | null => {
    return vendorCategoryMap.get(vendor) || null;
  };

  return {
    recentVendors,
    frequentCategories,
    suggestVendor,
    suggestCategory,
    isLoading,
  };
}
