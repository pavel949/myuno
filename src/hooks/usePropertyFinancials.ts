import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PropertyFinancialFull {
  id: string;
  property_id: string;
  owner_id: string;
  transaction_type: 'income' | 'expense' | 'deposit';
  category?: string;
  amount: number;
  currency?: string;
  description?: string;
  description_ru?: string;
  reference_type?: string;
  reference_id?: string;
  receipt_url?: string;
  transaction_date: string;
  payment_method?: string;
  tax_deductible?: boolean;
  recurring?: boolean;
  recurring_interval?: string;
  due_date?: string;
  paid_date?: string;
  status?: string;
  vendor_name?: string;
  invoice_number?: string;
  notes?: string;
  created_at: string;
  property?: {
    id: string;
    title: string;
    title_ru?: string;
  };
}

export interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  pendingPayments: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

export const INCOME_CATEGORIES = [
  { value: 'rent', labelEn: 'Rental Income', labelRu: 'Доход от аренды' },
  { value: 'deposit', labelEn: 'Security Deposit', labelRu: 'Залог' },
  { value: 'cleaning_fee', labelEn: 'Cleaning Fee', labelRu: 'Плата за уборку' },
  { value: 'late_fee', labelEn: 'Late Fee', labelRu: 'Пеня за просрочку' },
  { value: 'other_income', labelEn: 'Other Income', labelRu: 'Прочие доходы' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'cleaning', labelEn: 'Cleaning', labelRu: 'Уборка' },
  { value: 'maintenance', labelEn: 'Maintenance', labelRu: 'Ремонт и обслуживание' },
  { value: 'repair', labelEn: 'Repair', labelRu: 'Ремонт' },
  { value: 'utilities', labelEn: 'Utilities', labelRu: 'Коммунальные услуги' },
  { value: 'electricity', labelEn: 'Electricity', labelRu: 'Электричество' },
  { value: 'water', labelEn: 'Water', labelRu: 'Вода' },
  { value: 'internet', labelEn: 'Internet/TV', labelRu: 'Интернет/ТВ' },
  { value: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка' },
  { value: 'taxes', labelEn: 'Property Taxes', labelRu: 'Налоги на недвижимость' },
  { value: 'income_tax', labelEn: 'Income Tax', labelRu: 'Налог на доход' },
  { value: 'management_fee', labelEn: 'Management Fee', labelRu: 'Комиссия управляющего' },
  { value: 'platform_fee', labelEn: 'Platform Commission', labelRu: 'Комиссия платформы' },
  { value: 'supplies', labelEn: 'Supplies & Amenities', labelRu: 'Расходники и амениту' },
  { value: 'shopping', labelEn: 'Shopping', labelRu: 'Закупки' },
  { value: 'furniture', labelEn: 'Furniture', labelRu: 'Мебель' },
  { value: 'appliances', labelEn: 'Appliances', labelRu: 'Бытовая техника' },
  { value: 'depreciation', labelEn: 'Depreciation', labelRu: 'Амортизация' },
  { value: 'loan_payment', labelEn: 'Loan/Mortgage', labelRu: 'Кредит/Ипотека' },
  { value: 'legal', labelEn: 'Legal Fees', labelRu: 'Юридические услуги' },
  { value: 'advertising', labelEn: 'Advertising', labelRu: 'Реклама' },
  { value: 'other', labelEn: 'Other', labelRu: 'Прочее' },
  { value: 'other_expense', labelEn: 'Other Expense', labelRu: 'Прочие расходы' },
];

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', labelEn: 'Bank Transfer', labelRu: 'Банковский перевод' },
  { value: 'cash', labelEn: 'Cash', labelRu: 'Наличные' },
  { value: 'card', labelEn: 'Card', labelRu: 'Карта' },
  { value: 'platform', labelEn: 'Via Platform', labelRu: 'Через платформу' },
  { value: 'crypto', labelEn: 'Cryptocurrency', labelRu: 'Криптовалюта' },
];

export function usePropertyFinancialsFull(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-financials-full', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('property_financials')
        .select('*, property:owner_properties(id, title, title_ru)')
        .eq('owner_id', user.id)
        .order('transaction_date', { ascending: false });
      
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PropertyFinancialFull[];
    },
    enabled: !!user,
  });
}

/**
 * Cursor-based paginated financials for scalability
 * Uses transaction_date as cursor for efficient pagination
 */
/**
 * Get property IDs accessible to user:
 * - Properties the user owns
 * - Properties where user is an active delegate with financials permission
 */
export async function getAccessiblePropertyIds(userId: string): Promise<string[]> {
  const [ownedRes, delegatedRes] = await Promise.all([
    supabase
      .from('owner_properties')
      .select('id')
      .eq('owner_id', userId),
    supabase
      .from('property_delegates')
      .select('property_id, permissions')
      .eq('user_id', userId)
      .eq('status', 'active'),
  ]);

  const ownedIds = (ownedRes.data || []).map(p => p.id);
  const delegatedIds = (delegatedRes.data || [])
    .filter(d => {
      const perms = d.permissions as any;
      return perms?.financials === true;
    })
    .map(d => d.property_id);

  return [...new Set([...ownedIds, ...delegatedIds])];
}

export function usePropertyFinancialsPaginated(propertyId?: string, pageSize = 50) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['property-financials-paginated', user?.id, propertyId, pageSize],
    queryFn: async ({ pageParam }) => {
      if (!user) return { data: [], nextCursor: null, hasMore: false };

      // Determine accessible property ids (УК видит управляемые объекты)
      let propertyIds: string[] | undefined;
      if (!propertyId) {
        propertyIds = await getAccessiblePropertyIds(user.id);
        if (propertyIds.length === 0) return { data: [], nextCursor: null, hasMore: false };
      }

      let query = supabase
        .from('property_financials')
        .select('*, property:owner_properties(id, title, title_ru)')
        .order('transaction_date', { ascending: false })
        .limit(pageSize + 1);

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else if (propertyIds) {
        query = query.in('property_id', propertyIds);
      }

      if (pageParam) {
        query = query.lt('transaction_date', pageParam);
      }

      const { data, error } = await query;
      if (error) throw error;

      const items = data as unknown as PropertyFinancialFull[];
      const hasMore = items.length > pageSize;
      const paginatedItems = hasMore ? items.slice(0, pageSize) : items;
      const nextCursor = hasMore && paginatedItems.length > 0
        ? paginatedItems[paginatedItems.length - 1].transaction_date
        : null;

      return { data: paginatedItems, nextCursor, hasMore };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user,
  });
}

/**
 * Get total count of financials for display
 */
export function usePropertyFinancialsCount(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-financials-count', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return 0;

      let query = supabase
        .from('property_financials')
        .select('id', { count: 'exact', head: true });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        const ids = await getAccessiblePropertyIds(user.id);
        if (ids.length === 0) return 0;
        query = query.in('property_id', ids);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

export function useFinancialStats(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial-stats', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return null;

      let query = supabase
        .from('property_financials')
        .select('amount, transaction_type, category, status, transaction_date');

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        const ids = await getAccessiblePropertyIds(user.id);
        if (ids.length === 0) return null;
        query = query.in('property_id', ids);
      }

      const { data, error } = await query;
      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: FinancialStats = {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        pendingPayments: 0,
        thisMonthIncome: 0,
        thisMonthExpenses: 0,
        incomeByCategory: {},
        expensesByCategory: {},
      };

      (data || []).forEach(item => {
        const amount = Number(item.amount);
        const transactionDate = new Date(item.transaction_date);
        const isThisMonth = transactionDate >= startOfMonth;

        if (item.transaction_type === 'income') {
          stats.totalIncome += amount;
          if (isThisMonth) stats.thisMonthIncome += amount;
          if (item.category) {
            stats.incomeByCategory[item.category] = (stats.incomeByCategory[item.category] || 0) + amount;
          }
        } else if (item.transaction_type === 'expense') {
          stats.totalExpenses += amount;
          if (isThisMonth) stats.thisMonthExpenses += amount;
          if (item.category) {
            stats.expensesByCategory[item.category] = (stats.expensesByCategory[item.category] || 0) + amount;
          }
        }

        if (item.status === 'pending') {
          stats.pendingPayments += amount;
        }
      });

      stats.netIncome = stats.totalIncome - stats.totalExpenses;

      return stats;
    },
    enabled: !!user,
  });
}

export function useCreateFinancial() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<PropertyFinancialFull>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: result, error } = await supabase
        .from('property_financials')
        .insert({ 
          ...data, 
          owner_id: user.id,
          transaction_date: data.transaction_date || new Date().toISOString().split('T')[0]
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-financials'] });
      queryClient.invalidateQueries({ queryKey: ['property-financials-full'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['property-care-stats'] });
      toast.success('Транзакция добавлена!');
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });
}

export function useUpdateFinancial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PropertyFinancialFull> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('property_financials')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-financials'] });
      queryClient.invalidateQueries({ queryKey: ['property-financials-full'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['property-care-stats'] });
      toast.success('Транзакция обновлена!');
    },
  });
}

export function useDeleteFinancial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('property_financials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-financials'] });
      queryClient.invalidateQueries({ queryKey: ['property-financials-full'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['property-care-stats'] });
      toast.success('Транзакция удалена!');
    },
  });
}
