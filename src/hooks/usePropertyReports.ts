import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getAccessiblePropertyIds } from '@/hooks/usePropertyFinancials';

export type ReportType = 'monthly' | 'quarterly' | 'annual' | 'custom' | 'management' | 'owner_statement' | 'pnl';
export type ReportStatus = 'generating' | 'draft' | 'ready' | 'sent' | 'viewed' | 'error';

export interface ReportData {
  income: {
    total: number;
    by_category: Record<string, number>;
    transactions: Array<{
      id: string;
      date: string;
      amount: number;
      category: string;
      description: string;
    }>;
  };
  expenses: {
    total: number;
    by_category: Record<string, number>;
    transactions: Array<{
      id: string;
      date: string;
      amount: number;
      category: string;
      description: string;
      vendor?: string;
    }>;
  };
  occupancy: {
    nights_booked: number;
    total_nights: number;
    rate: number;
    bookings_count: number;
  };
  bookings: Array<{
    id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    total_amount: number;
    source: string;
  }>;
  maintenance: Array<{
    id: string;
    type: string;
    cost: number;
    date: string;
    description: string;
  }>;
  net_income: number;
  management_commission?: number;
  owner_net_income?: number;
  roi_percent?: number;
  mom_change?: number;
  highlights?: string[];
  recommendations?: string[];
  // P&L specific
  gross_profit?: number;
  operating_expenses?: number;
  operating_income?: number;
  expense_ratio?: number;
  // Owner Statement specific
  owner_payout?: number;
  deductions?: Array<{ category: string; amount: number; description: string }>;
  deposit_held?: number;
  deposit_returned?: number;
}

export interface PropertyReport {
  id: string;
  property_id: string;
  owner_id: string;
  generated_by: string | null;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  data: ReportData;
  summary_text: string | null;
  summary_text_ru: string | null;
  pdf_url: string | null;
  status: ReportStatus;
  error_message: string | null;
  sent_at: string | null;
  sent_to: string[] | null;
  viewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  property?: {
    id: string;
    title: string;
    title_ru: string | null;
  };
}

export interface GenerateReportInput {
  property_id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  includeIncome?: boolean;
  includeExpenses?: boolean;
  incomeCategories?: string[];
  expenseCategories?: string[];
}

// Fetch reports for a property (owners + delegates with financials permission)
export function usePropertyReports(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-reports', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('property_reports')
        .select(`
          *,
          property:properties(id, title_en, title_ru)
        `)
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        // Load all accessible property IDs (owned + managed)
        const ids = await getAccessiblePropertyIds(user.id);
        if (ids.length === 0) return [];
        query = query.in('property_id', ids);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PropertyReport[];
    },
    enabled: !!user,
  });
}

// Generate a new report
export function useGenerateReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: GenerateReportInput) => {
      if (!user) throw new Error('Not authenticated');

      // Resolve the actual owner_id for the property (manager creates on behalf of owner)
      const { data: prop, error: propError } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', input.property_id)
        .single();
      if (propError) throw propError;
      const ownerId = prop.owner_id;

      // Fetch financial data for the period
      const [{ data: financials, error: finError }, { data: bookings, error: bookError }] = await Promise.all([
        supabase
          .from('property_financials')
          .select('*')
          .eq('property_id', input.property_id)
          .gte('transaction_date', input.period_start)
          .lte('transaction_date', input.period_end),
        supabase
          .from('property_bookings')
          .select('*')
          .eq('property_id', input.property_id)
          .or(`check_in_date.gte.${input.period_start},check_out_date.lte.${input.period_end}`),
      ]);

      if (finError) throw finError;
      if (bookError) throw bookError;

      // Calculate report data
      const income = {
        total: 0,
        by_category: {} as Record<string, number>,
        transactions: [] as ReportData['income']['transactions'],
      };

      const expenses = {
        total: 0,
        by_category: {} as Record<string, number>,
        transactions: [] as ReportData['expenses']['transactions'],
      };

      const shouldIncludeIncome = input.includeIncome !== false;
      const shouldIncludeExpenses = input.includeExpenses !== false;
      const allowedIncomeCategories = input.incomeCategories;
      const allowedExpenseCategories = input.expenseCategories;

      (financials || []).forEach((f: any) => {
        const cat = f.category || 'other';
        if (f.transaction_type === 'income' && shouldIncludeIncome) {
          if (allowedIncomeCategories && !allowedIncomeCategories.includes(cat)) return;
          income.total += Number(f.amount);
          income.by_category[cat] = (income.by_category[cat] || 0) + Number(f.amount);
          income.transactions.push({
            id: f.id,
            date: f.transaction_date,
            amount: Number(f.amount),
            category: cat,
            description: f.description || '',
          });
        } else if (f.transaction_type === 'expense' && shouldIncludeExpenses) {
          if (allowedExpenseCategories && !allowedExpenseCategories.includes(cat)) return;
          expenses.total += Number(f.amount);
          expenses.by_category[cat] = (expenses.by_category[cat] || 0) + Number(f.amount);
          expenses.transactions.push({
            id: f.id,
            date: f.transaction_date,
            amount: Number(f.amount),
            category: cat,
            description: f.description || '',
            vendor: f.vendor_name,
          });
        }
      });

      // Calculate occupancy
      const startDate = new Date(input.period_start);
      const endDate = new Date(input.period_end);
      const totalNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      let nightsBooked = 0;
      (bookings || []).forEach((b: any) => {
        const checkIn = new Date(b.check_in_date);
        const checkOut = new Date(b.check_out_date);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        nightsBooked += nights;
      });

      // Management commission (expenses in category 'management_fee' or 'commission')
      const mgmtCommission = expenses.transactions
        .filter(t => t.category === 'management_fee' || t.category === 'commission')
        .reduce((sum, t) => sum + t.amount, 0);

      const reportData: ReportData = {
        income,
        expenses,
        occupancy: {
          nights_booked: nightsBooked,
          total_nights: totalNights,
          rate: totalNights > 0 ? Math.round((nightsBooked / totalNights) * 100) : 0,
          bookings_count: bookings?.length || 0,
        },
        bookings: (bookings || []).map((b: any) => ({
          id: b.id,
          guest_name: b.guest_name || 'Guest',
          check_in: b.check_in_date,
          check_out: b.check_out_date,
          total_amount: Number(b.total_amount || 0),
          source: b.source || 'direct',
        })),
        maintenance: expenses.transactions
          .filter(t => t.category === 'maintenance' || t.category === 'repair')
          .map(t => ({
            id: t.id,
            type: t.category,
            cost: t.amount,
            date: t.date,
            description: t.description,
          })),
        net_income: income.total - expenses.total,
        management_commission: mgmtCommission,
        owner_net_income: income.total - expenses.total,
        // P&L fields
        gross_profit: income.total - expenses.transactions
          .filter(t => ['cleaning', 'supplies', 'cleaning_fee'].includes(t.category))
          .reduce((s, t) => s + t.amount, 0),
        operating_expenses: expenses.transactions
          .filter(t => !['cleaning', 'supplies', 'cleaning_fee'].includes(t.category))
          .reduce((s, t) => s + t.amount, 0),
        operating_income: income.total - expenses.total,
        expense_ratio: income.total > 0 ? Math.round((expenses.total / income.total) * 100) : 0,
        // Owner Statement fields
        owner_payout: income.total - expenses.total - mgmtCommission,
        deductions: Object.entries(expenses.by_category).map(([cat, amount]) => ({
          category: cat,
          amount: amount as number,
          description: cat.replace(/_/g, ' '),
        })),
      };

      // Create the report
      const { data, error } = await supabase
        .from('property_reports')
        .insert({
          property_id: input.property_id,
          owner_id: ownerId,
          generated_by: user.id,
          report_type: input.report_type,
          period_start: input.period_start,
          period_end: input.period_end,
          data: reportData as any,
          status: 'ready',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-reports'] });
      toast.success('Отчёт сгенерирован');
    },
    onError: (error) => {
      toast.error('Ошибка генерации отчёта: ' + error.message);
    },
  });
}

// Mark report as viewed
export function useMarkReportViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('property_reports')
        .update({ 
          status: 'viewed',
          viewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-reports'] });
    },
  });
}

// Delete a report
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('property_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-reports'] });
      toast.success('Отчёт удалён');
    },
  });
}

// Generate PDF for a report (client-side using jsPDF)
export function useGeneratePdf() {
  return useMutation({
    mutationFn: async ({ 
      report, 
      language = 'ru' 
    }: { 
      report: PropertyReport; 
      language?: 'en' | 'ru';
    }) => {
      // Dynamically import to reduce bundle size
      const { downloadReportPdf } = await import('@/utils/generateReportPdf');
      
      const propertyTitle = language === 'ru' 
        ? (report.property?.title_ru || report.property?.title || 'Property')
        : (report.property?.title || 'Property');
      
      downloadReportPdf({
        propertyTitle,
        reportType: report.report_type,
        periodStart: report.period_start,
        periodEnd: report.period_end,
        data: report.data,
        language,
        currency: 'THB',
        isManagement: report.report_type === 'management',
      }, `report-${report.property?.title?.replace(/\s+/g, '-') || 'property'}-${report.period_start}.pdf`);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('PDF скачан');
    },
    onError: (error) => {
      toast.error('Ошибка генерации PDF: ' + error.message);
    },
  });
}

// Send report via email
export function useSendReportEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      reportId, 
      recipientEmails, 
      language = 'ru' 
    }: { 
      reportId: string; 
      recipientEmails: string[]; 
      language?: 'en' | 'ru';
    }) => {
      const { data, error } = await supabase.functions.invoke('send-property-report', {
        body: { reportId, recipientEmails, language },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-reports'] });
      toast.success('Отчёт отправлен');
    },
    onError: (error) => {
      toast.error('Ошибка отправки: ' + error.message);
    },
  });
}

// Role-based report access check
export function useCanAccessReportFinancials(propertyId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['report-financials-access', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return { canAccess: false, role: null };
      
      // Check if user is owner
      const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', propertyId)
        .single();
      
      if (property?.owner_id === user.id) {
        return { canAccess: true, role: 'owner' };
      }
      
      // Check delegate permissions
      const { data: delegate } = await supabase
        .from('property_delegates')
        .select('role, permissions')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (delegate) {
        const permissions = delegate.permissions as string[] || [];
        const hasFinancials = permissions.includes('financials') || 
                             permissions.includes('all');
        return { 
          canAccess: hasFinancials, 
          role: delegate.role 
        };
      }
      
      return { canAccess: false, role: null };
    },
    enabled: !!user && !!propertyId,
  });
}
