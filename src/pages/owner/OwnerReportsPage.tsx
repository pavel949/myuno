import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  ChevronLeft, FileText, Download, Send, Calendar, DollarSign,
  Percent, BedDouble, TrendingUp, BarChart3,
} from 'lucide-react';

interface ReportData {
  revenue: number;
  expenses: number;
  netIncome: number;
  occupancyRate: number;
  bookingsCount: number;
  adr: number;
  bookedNights: number;
}

export default function OwnerReportsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isRu = language === 'ru';
  const { allProperties } = useMyProperties();
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;

  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const prev = subMonths(new Date(), 1);
    return format(prev, 'yyyy-MM');
  });

  const propertyIds = selectedProperty === 'all'
    ? allProperties.map(p => p.property_id)
    : [selectedProperty];

  const periodStart = startOfMonth(new Date(selectedMonth + '-01'));
  const periodEnd = endOfMonth(periodStart);
  const startStr = format(periodStart, 'yyyy-MM-dd');
  const endStr = format(periodEnd, 'yyyy-MM-dd');

  const { data: report, isLoading } = useQuery({
    queryKey: ['owner-report', user?.id, selectedProperty, selectedMonth],
    queryFn: async (): Promise<ReportData> => {
      if (propertyIds.length === 0) return { revenue: 0, expenses: 0, netIncome: 0, occupancyRate: 0, bookingsCount: 0, adr: 0, bookedNights: 0 };

      const [incRes, expRes, bookRes] = await Promise.all([
        supabase.from('property_financials').select('amount').in('property_id', propertyIds).eq('transaction_type', 'income').gte('transaction_date', startStr).lte('transaction_date', endStr),
        supabase.from('property_financials').select('amount').in('property_id', propertyIds).eq('transaction_type', 'expense').gte('transaction_date', startStr).lte('transaction_date', endStr),
        supabase.from('property_bookings').select('check_in, check_out, total_amount').in('property_id', propertyIds).in('status', ['confirmed', 'checked_in', 'completed']).lte('check_in', endStr).gte('check_out', startStr),
      ]);

      const sum = (rows: any[] | null) => (rows || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      const revenue = sum(incRes.data);
      const expenses = sum(expRes.data);

      const daysInMonth = periodEnd.getDate();
      let bookedNights = 0;
      let bookingRevenue = 0;
      for (const b of (bookRes.data || [])) {
        const ci = new Date(Math.max(new Date(b.check_in).getTime(), periodStart.getTime()));
        const co = new Date(Math.min(new Date(b.check_out).getTime(), periodEnd.getTime()));
        const nights = Math.max(0, Math.ceil((co.getTime() - ci.getTime()) / 86400000));
        bookedNights += nights;
        bookingRevenue += Number(b.total_amount || 0);
      }

      const totalNights = Math.max(1, propertyIds.length) * daysInMonth;
      const occupancyRate = Math.min(100, Math.round((bookedNights / totalNights) * 100));
      const adr = bookedNights > 0 ? Math.round(bookingRevenue / bookedNights) : 0;

      return {
        revenue, expenses,
        netIncome: revenue - expenses,
        occupancyRate,
        bookingsCount: bookRes.data?.length || 0,
        adr,
        bookedNights,
      };
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!report) return;
      const { error } = await supabase.from('owner_reports').insert({
        owner_id: user!.id,
        property_id: selectedProperty !== 'all' ? selectedProperty : null,
        company_id: companyId || null,
        report_type: 'monthly',
        title: `${isRu ? 'Отчёт за' : 'Report for'} ${format(periodStart, 'MMMM yyyy', { locale: isRu ? ru : undefined })}`,
        period_start: startStr,
        period_end: endStr,
        data: report as any,
        status: 'generated',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-reports-history'] });
      toast.success(isRu ? 'Отчёт сохранён' : 'Report saved');
    },
  });

  // Past months for selector
  const monthOptions = useMemo(() => {
    const opts = [];
    for (let i = 1; i <= 12; i++) {
      const d = subMonths(new Date(), i);
      opts.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy', { locale: isRu ? ru : undefined }) });
    }
    return opts;
  }, [isRu]);

  const { data: history } = useQuery({
    queryKey: ['owner-reports-history', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('owner_reports')
        .select('id, title, period_start, period_end, status, created_at')
        .eq('owner_id', user!.id)
        .order('period_start', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/owner')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{isRu ? 'Отчёты собственникам' : 'Owner Reports'}</h1>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Ежемесячные отчёты по доходам и загрузке' : 'Monthly revenue & occupancy reports'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-56">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {allProperties.length > 1 && (
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder={isRu ? 'Все объекты' : 'All'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRu ? 'Все объекты' : 'All Properties'}</SelectItem>
              {allProperties.map(p => <SelectItem key={p.property_id} value={p.property_id}>{p.title || p.property_id.slice(0, 8)}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Report KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">{isRu ? 'Доход' : 'Revenue'}</span>
                </div>
                <p className="text-xl font-bold">฿{fmt(report.revenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">{isRu ? 'Расходы' : 'Expenses'}</span>
                </div>
                <p className="text-xl font-bold">฿{fmt(report.expenses)}</p>
              </CardContent>
            </Card>
            <Card className={report.netIncome >= 0 ? 'border-success/30' : 'border-destructive/30'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs text-muted-foreground">{isRu ? 'Чистый доход' : 'Net Income'}</span>
                </div>
                <p className={`text-xl font-bold ${report.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ฿{fmt(report.netIncome)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{isRu ? 'Загрузка' : 'Occupancy'}</span>
                </div>
                <p className="text-xl font-bold">{report.occupancyRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">ADR</span>
                </div>
                <p className="text-xl font-bold">฿{fmt(report.adr)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BedDouble className="h-4 w-4 text-accent-foreground" />
                  <span className="text-xs text-muted-foreground">{isRu ? 'Ночей' : 'Nights'}</span>
                </div>
                <p className="text-xl font-bold">{report.bookedNights}</p>
                <p className="text-xs text-muted-foreground">{report.bookingsCount} {isRu ? 'броней' : 'bookings'}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => saveMutation.mutate()} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {isRu ? 'Сохранить отчёт' : 'Save Report'}
            </Button>
          </div>
        </>
      )}

      {/* Report History */}
      {history && history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{isRu ? 'История отчётов' : 'Report History'}</h2>
          {history.map(r => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), 'dd MMM yyyy', { locale: isRu ? ru : undefined })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
