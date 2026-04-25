import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getAccessiblePropertyIds } from '@/lib/getAccessiblePropertyIds';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export type ReportType = 'monthly' | 'quarterly' | 'annual' | 'custom' | 'management' | 'owner_statement' | 'pnl' | 'per_booking';
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
    deposit_amount?: number;
    deposit_paid?: boolean;
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
  // Deposit tracking
  booking_deposits: {
    total_expected: number;
    total_paid: number;
    unpaid_count: number;
  };
  security_deposits: {
    total_received: number;
    total_returned: number;
    total_held: number;
    deductions: number;
    items: Array<{
      booking_id: string;
      guest_name: string;
      received: number;
      returned: number;
      deducted: number;
      status: string;
    }>;
  };
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
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id || null;
  return useQuery({
    queryKey: ['property-reports', user?.id, propertyId, activeCompanyId],
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
        // Load all accessible property IDs (owned + managed + MC company)
        const { allIds } = await getAccessiblePropertyIds({ userId: user.id, activeCompanyId });
        if (allIds.length === 0) return [];
        query = query.in('property_id', allIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map title_en -> title for backward compatibility across UI
      type PropertyJoin = { id: string; title_en: string | null; title_ru: string | null };
      type ReportRow = Omit<PropertyReport, 'property'> & { property?: PropertyJoin | null };
      return ((data || []) as unknown as ReportRow[]).map((r) => ({
        ...r,
        property: r.property ? {
          id: r.property.id,
          title: r.property.title_en ?? '',
          title_ru: r.property.title_ru,
        } : undefined,
      })) as PropertyReport[];
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

      // Fetch financial data and bookings (P1: use orders — same source as usePropertyBookings)
      const [{ data: financials, error: finError }, { data: ordersData, error: bookError }] = await Promise.all([
        supabase
          .from('property_financials')
          .select('*')
          .eq('property_id', input.property_id)
          .gte('transaction_date', input.period_start)
          .lte('transaction_date', input.period_end),
        supabase
          .from('orders')
          .select(`
            id, start_at, end_at, total_amount, currency, status, notes, metadata,
            order_items!inner(id, resource_id, item_type, start_at, end_at, amount, metadata),
            order_participants(id, role, name, phone, email)
          `)
          .eq('vertical', 'property')
          .eq('order_items.item_type', 'property')
          .eq('order_items.resource_id', input.property_id)
          .is('deleted_at', null)
          .lte('start_at', `${input.period_end}T23:59:59Z`)
          .gte('end_at', `${input.period_start}T00:00:00Z`),
      ]);

      if (finError) throw finError;
      if (bookError) throw bookError;

      // Map orders to report booking shape (align with usePropertyBookings)
      type OrderItemRow = { id: string; resource_id: string | null; item_type: string | null; start_at: string | null; end_at: string | null; amount: number | null; metadata: Record<string, unknown> | null };
      type ParticipantRow = { id: string; role: string; name: string | null; phone: string | null; email: string | null };
      type OrderRow = {
        id: string;
        start_at: string | null;
        end_at: string | null;
        total_amount: number | null;
        currency: string | null;
        status: string | null;
        notes: string | null;
        metadata: { source?: string; deposit_amount?: number } | null;
        order_items: OrderItemRow[] | null;
        order_participants: ParticipantRow[] | null;
      };
      const bookings = ((ordersData || []) as unknown as OrderRow[]).map((o) => {
        const guest = o.order_participants?.find((p) => p.role === 'guest');
        const item = o.order_items?.[0];
        const checkIn = (item?.start_at || o.start_at || '').split('T')[0];
        const checkOut = (item?.end_at || o.end_at || '').split('T')[0];
        const meta = o.metadata || {};
        return {
          id: o.id,
          guest_name: guest?.name || 'Guest',
          check_in: checkIn,
          check_out: checkOut,
          total_amount: Number(o.total_amount || 0),
          source: meta.source || 'direct',
          deposit_amount: meta.deposit_amount || 0,
          deposit_paid_at: null as string | null, // deposit tracking via booking_operations when available
        };
      });

      // Fetch booking_operations for security deposits (legacy: references property_bookings; empty for orders)
      const bIds = bookings.map((b) => b.id);
      type OperationRow = {
        booking_id: string;
        deposit_amount: number | null;
        deposit_received_at: string | null;
        deposit_returned_amount: number | null;
        deposit_returned_at: string | null;
        deposit_deduction_amount: number | null;
        deposit_return_status: string | null;
      };
      let operations: OperationRow[] = [];
      if (bIds.length > 0) {
        const { data: ops } = await supabase
          .from('booking_operations')
          .select('booking_id, deposit_amount, deposit_received_at, deposit_returned_amount, deposit_returned_at, deposit_deduction_amount, deposit_return_status')
          .in('booking_id', bIds);
        operations = (ops || []) as unknown as OperationRow[];
      }
      const opsMap = new Map(operations.map((o) => [o.booking_id, o]));

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

      type FinancialRow = {
        id: string;
        category: string | null;
        transaction_type: 'income' | 'expense' | string;
        transaction_date: string;
        amount: number | string;
        description: string | null;
        vendor_name: string | null;
      };
      ((financials || []) as unknown as FinancialRow[]).forEach((f) => {
        const cat = (f.category as string) || 'other';
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
            vendor: f.vendor_name ?? undefined,
          });
        }
      });

      // Calculate occupancy
      const startDate = new Date(input.period_start);
      const endDateInclusive = new Date(input.period_end);
      // Treat period_end as inclusive day; convert to exclusive by adding 1 day
      const endExclusiveMs = endDateInclusive.getTime() + 86400000;
      const totalNights = Math.max(0, Math.ceil((endExclusiveMs - startDate.getTime()) / 86400000));

      let nightsBooked = 0;
      (bookings || []).forEach((b) => {
        const checkIn = new Date(b.check_in);
        const checkOut = new Date(b.check_out);

        const overlapStart = Math.max(checkIn.getTime(), startDate.getTime());
        const overlapEnd = Math.min(checkOut.getTime(), endExclusiveMs);
        const nights = Math.max(0, Math.ceil((overlapEnd - overlapStart) / 86400000));
        nightsBooked += nights;
      });

      // Management commission (expenses in category 'management_fee' or 'commission')
      const mgmtCommission = expenses.transactions
        .filter(t => t.category === 'management_fee' || t.category === 'commission')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate booking deposit (prepayment) tracking
      let depositExpected = 0;
      let depositPaid = 0;
      let depositUnpaidCount = 0;
      (bookings || []).forEach((b) => {
        const dep = Number(b.deposit_amount || 0);
        if (dep > 0) {
          depositExpected += dep;
          if (b.deposit_paid_at) {
            depositPaid += dep;
          } else {
            depositUnpaidCount++;
          }
        }
      });

      // Calculate security deposit tracking from booking_operations
      let secTotalReceived = 0;
      let secTotalReturned = 0;
      let secTotalDeductions = 0;
      const securityDepositItems: ReportData['security_deposits']['items'] = [];
      (bookings || []).forEach((b) => {
        const op = opsMap.get(b.id);
        if (!op) return;
        const received = Number(op.deposit_amount || 0);
        const returned = Number(op.deposit_returned_amount || 0);
        const deducted = Number(op.deposit_deduction_amount || 0);
        if (received === 0) return;
        secTotalReceived += received;
        secTotalReturned += returned;
        secTotalDeductions += deducted;
        securityDepositItems.push({
          booking_id: b.id,
          guest_name: b.guest_name || 'Guest',
          received,
          returned,
          deducted,
          status: op.deposit_return_status || (op.deposit_returned_at ? 'returned' : 'held'),
        });
      });

      const reportData: ReportData = {
        income,
        expenses,
        occupancy: {
          nights_booked: nightsBooked,
          total_nights: totalNights,
          rate: totalNights > 0 ? Math.round((nightsBooked / totalNights) * 100) : 0,
          bookings_count: bookings?.length || 0,
        },
        bookings: (bookings || []).map((b) => ({
          id: b.id,
          guest_name: b.guest_name || 'Guest',
          check_in: b.check_in,
          check_out: b.check_out,
          total_amount: Number(b.total_amount || 0),
          source: b.source || 'direct',
          deposit_amount: Number(b.deposit_amount || 0),
          deposit_paid: !!b.deposit_paid_at,
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
        owner_net_income: income.total - expenses.total - mgmtCommission,
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
        // Deposit tracking
        booking_deposits: {
          total_expected: depositExpected,
          total_paid: depositPaid,
          unpaid_count: depositUnpaidCount,
        },
        security_deposits: {
          total_received: secTotalReceived,
          total_returned: secTotalReturned,
          total_held: secTotalReceived - secTotalReturned - secTotalDeductions,
          deductions: secTotalDeductions,
          items: securityDepositItems,
        },
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
          data: reportData as unknown as Record<string, unknown>,
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
