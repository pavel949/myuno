import { useState, useEffect, useMemo } from 'react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyProperties, type UnifiedProperty } from '@/hooks/useMyProperties';
import {
  usePropertyReports,
  useGenerateReport,
  useDeleteReport,
  useGeneratePdf,
  useSendReportEmail,
  useMarkReportViewed,
  ReportType,
  PropertyReport
} from '@/hooks/usePropertyReports';
import { usePropertyComplexes, type PropertyComplex } from '@/hooks/usePropertyComplexes';
import { ReportDetailSheet } from '@/components/owner/reports/ReportDetailSheet';
import { ReportWizard, type WizardResult } from '@/components/owner/reports/ReportWizard';
import { AccountingPolicyEditor } from '@/components/owner/reports/AccountingPolicyEditor';
import { useAccountingPolicies } from '@/hooks/useAccountingPolicies';
import { OwnerAccessInviteDialog } from '@/components/owner/reports/OwnerAccessInviteDialog';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FileText, Plus, Download, Trash2, Building2, Calendar,
  TrendingUp, TrendingDown, Eye, FileDown, Send, Loader2,
  LayoutGrid, Briefcase, FileSpreadsheet, UserPlus, Users,
  Home, Layers,
} from 'lucide-react';
import {
  format, subMonths, startOfMonth, endOfMonth,
  subQuarters, startOfQuarter, endOfQuarter,
  subYears, startOfYear, endOfYear
} from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { exportReportExcel } from '@/utils/exportFinancialsExcel';

type ReportScope = 'property' | 'complex' | 'owner' | 'portfolio';

function useOwnerContacts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owner-contacts-for-reports', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: contacts, error } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, email')
        .eq('contact_type', 'owner')
        .order('first_name');
      if (error) throw error;
      if (!contacts?.length) return [];

      const { data: props } = await supabase
        .from('properties')
        .select('id, owner_contact_id')
        .in('owner_contact_id', contacts.map(c => c.id));

      const propsByOwner = new Map<string, string[]>();
      (props || []).forEach((p: any) => {
        if (!p.owner_contact_id) return;
        const list = propsByOwner.get(p.owner_contact_id) || [];
        list.push(p.id);
        propsByOwner.set(p.owner_contact_id, list);
      });

      return contacts.map(c => ({
        ...c,
        propertyIds: propsByOwner.get(c.id) || [],
      }));
    },
    enabled: !!user,
  });
}

function useManagedProperties() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['managed-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('property_delegates')
        .select('property_id, permissions, properties:properties(id, title_en, title_ru)')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) throw error;
      return (data || [])
        .filter((d: any) => (d.permissions as Record<string, boolean>)?.financials)
        .map((d: any) => d.properties)
        .filter(Boolean);
    },
    enabled: !!user,
  });
}

export default function ReportsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { allProperties: ownedProperties } = useMyProperties();
  const { data: managedProperties } = useManagedProperties();
  const { data: reports, isLoading } = usePropertyReports();
  const { data: complexes } = usePropertyComplexes();
  const { data: ownerContacts } = useOwnerContacts();
  const generateReport = useGenerateReport();
  const deleteReport = useDeleteReport();
  const generatePdf = useGeneratePdf();
  const sendReportEmail = useSendReportEmail();
  const markViewed = useMarkReportViewed();
  const { data: accountingPolicies } = useAccountingPolicies();

  const { getValue, setValue } = useUrlFilters();
  const activeTab = getValue('tab', 'all') as 'all' | 'portfolio';
  const setActiveTab = (v: 'all' | 'portfolio') => setValue('tab', v === 'all' ? null : v);
  const [showWizard, setShowWizard] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedReportForSend, setSelectedReportForSend] = useState<string | null>(null);
  const [previewBeforeSend, setPreviewBeforeSend] = useState<PropertyReport | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [viewReport, setViewReport] = useState<PropertyReport | null>(null);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showOwnerInvite, setShowOwnerInvite] = useState(false);
  const [policyEditorPropertyId, setPolicyEditorPropertyId] = useState<string | null>(null);
  const [generateScope, setGenerateScope] = useState<ReportScope>('property');
  const [selectedComplexId, setSelectedComplexId] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const filterScope = getValue('scope', 'all') as 'all' | 'complex' | 'owner';
  const setFilterScope = (v: 'all' | 'complex' | 'owner') => setValue('scope', v === 'all' ? null : v);
  const filterComplexId = getValue('complex', '');
  const setFilterComplexId = (v: string) => setValue('complex', v || null);
  const filterOwnerId = getValue('owner', '');
  const setFilterOwnerId = (v: string) => setValue('owner', v || null);

  const allSelectableProperties = useMemo(() => {
    const deduped = [
      ...(ownedProperties || []),
      ...(managedProperties || []).filter(
        (mp: any) => !(ownedProperties || []).some((op: any) => op.id === mp.id)
      ),
    ];
    return deduped;
  }, [ownedProperties, managedProperties]);

  const scopePropertyIds = useMemo<string[]>(() => {
    if (generateScope === 'property') return selectedPropertyId ? [selectedPropertyId] : [];
    if (generateScope === 'portfolio') return allSelectableProperties.map((p: any) => p.id || p.property_id);
    if (generateScope === 'complex' && selectedComplexId) {
      return allSelectableProperties
        .filter((p: any) => p.complex_id === selectedComplexId)
        .map((p: any) => p.id || p.property_id);
    }
    if (generateScope === 'owner' && selectedOwnerId) {
      const owner = (ownerContacts || []).find(o => o.id === selectedOwnerId);
      return (owner?.propertyIds || []).filter(id =>
        allSelectableProperties.some((p: any) => (p.id || p.property_id) === id)
      );
    }
    return [];
  }, [generateScope, selectedPropertyId, selectedComplexId, selectedOwnerId, allSelectableProperties, ownerContacts]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (filterScope === 'all') return reports;
    if (filterScope === 'complex' && filterComplexId) {
      const complexPropIds = allSelectableProperties
        .filter((p: any) => p.complex_id === filterComplexId)
        .map((p: any) => p.id || p.property_id);
      return reports.filter(r => complexPropIds.includes(r.property_id));
    }
    if (filterScope === 'owner' && filterOwnerId) {
      const owner = (ownerContacts || []).find(o => o.id === filterOwnerId);
      return reports.filter(r => (owner?.propertyIds || []).includes(r.property_id));
    }
    return reports;
  }, [reports, filterScope, filterComplexId, filterOwnerId, allSelectableProperties, ownerContacts]);

  // Auto-fill from accounting policy
  useEffect(() => {
    if (!selectedPropertyId || !accountingPolicies) return;
    const policy = accountingPolicies.find(p => p.property_id === selectedPropertyId);
    if (policy) {
      setSelectedReportType(policy.default_report_type as ReportType);
    }
  }, [selectedPropertyId, accountingPolicies]);

  const isManager = (managedProperties || []).length > 0;

  const getReportPeriod = (type: ReportType): { start: string; end: string } => {
    const now = new Date();
    switch (type) {
      case 'monthly':
      case 'owner_statement':
      case 'pnl':
      case 'management':
      case 'per_booking': {
        const lastMonth = subMonths(now, 1);
        return { start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), end: format(endOfMonth(lastMonth), 'yyyy-MM-dd') };
      }
      case 'quarterly': {
        const lastQ = subQuarters(now, 1);
        return { start: format(startOfQuarter(lastQ), 'yyyy-MM-dd'), end: format(endOfQuarter(lastQ), 'yyyy-MM-dd') };
      }
      case 'annual': {
        const lastYear = subYears(now, 1);
        return { start: format(startOfYear(lastYear), 'yyyy-MM-dd'), end: format(endOfYear(lastYear), 'yyyy-MM-dd') };
      }
      case 'custom':
        return { start: customStart, end: customEnd };
    }
  };

  const handleWizardComplete = async (result: WizardResult) => {
    const ids = result.propertyIds;
    if (ids.length === 0) return;

    if (ids.length === 1) {
      generateReport.mutate({
        property_id: ids[0],
        report_type: result.reportType,
        period_start: result.periodStart,
        period_end: result.periodEnd,
      }, {
        onSuccess: () => setShowWizard(false),
      });
    } else {
      setIsBatchGenerating(true);
      try {
        for (const propId of ids) {
          await generateReport.mutateAsync({
            property_id: propId,
            report_type: result.reportType,
            period_start: result.periodStart,
            period_end: result.periodEnd,
          });
        }
        setShowWizard(false);
      } finally {
        setIsBatchGenerating(false);
      }
    }
  };

  const handleGeneratePdf = (report: PropertyReport) => {
    generatePdf.mutate({ report, language: isRu ? 'ru' : 'en' });
  };

  const handleSendEmail = () => {
    if (!selectedReportForSend || !emailRecipients.trim()) return;
    const emails = emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
    if (!emails.length) return;
    sendReportEmail.mutate({
      reportId: selectedReportForSend,
      recipientEmails: emails,
      language: isRu ? 'ru' : 'en',
    }, {
      onSuccess: () => {
        setShowSendDialog(false);
        setSelectedReportForSend(null);
        setPreviewBeforeSend(null);
        setEmailRecipients('');
      }
    });
  };

  // Open send flow with preview first
  const handleOpenSendFlow = (report: PropertyReport) => {
    setSelectedReportForSend(report.id);
    setPreviewBeforeSend(report);
    // Auto-fill email from owner contact
    const ownerContact = (ownerContacts || []).find(o => o.propertyIds?.includes(report.property_id));
    if (ownerContact?.email) {
      setEmailRecipients(ownerContact.email);
    } else {
      setEmailRecipients('');
    }
  };

  const handleConfirmSend = () => {
    setPreviewBeforeSend(null);
    setShowSendDialog(true);
  };

  const getReportTypeLabel = (type: ReportType) => {
    const labels: Record<ReportType, { en: string; ru: string }> = {
      monthly: { en: 'Monthly', ru: 'Ежемесячный' },
      quarterly: { en: 'Quarterly', ru: 'Квартальный' },
      annual: { en: 'Annual', ru: 'Годовой' },
      custom: { en: 'Custom', ru: 'Произвольный' },
      management: { en: 'Management', ru: 'Управленческий' },
      owner_statement: { en: 'Owner Statement', ru: 'Отчёт собственнику' },
      pnl: { en: 'P&L Report', ru: 'Отчёт P&L' },
      per_booking: { en: 'Per Booking', ru: 'По заездам' },
    };
    return labels[type]?.[isRu ? 'ru' : 'en'] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      generating: { variant: 'secondary', label: isRu ? 'Генерация...' : 'Generating...' },
      draft: { variant: 'outline', label: isRu ? 'Черновик' : 'Draft' },
      ready: { variant: 'default', label: isRu ? 'Готов' : 'Ready' },
      sent: { variant: 'default', label: isRu ? 'Отправлен' : 'Sent' },
      viewed: { variant: 'secondary', label: isRu ? 'Просмотрен' : 'Viewed' },
      error: { variant: 'destructive', label: isRu ? 'Ошибка' : 'Error' },
    };
    const { variant, label } = variants[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US', {
      style: 'currency', currency: 'THB', minimumFractionDigits: 0,
    }).format(amount);

  const portfolioRows = (managedProperties || []).map((mp: any) => {
    const propReports = (reports || []).filter(r => r.property_id === mp.id);
    const totalIncome = propReports.reduce((s, r) => s + (r.data?.income?.total || 0), 0);
    const totalExpenses = propReports.reduce((s, r) => s + (r.data?.expenses?.total || 0), 0);
    const avgOccupancy = propReports.length
      ? Math.round(propReports.reduce((s, r) => s + ((r.data as any)?.occupancy?.rate || 0), 0) / propReports.length)
      : 0;
    return { property: mp, totalIncome, totalExpenses, netIncome: totalIncome - totalExpenses, avgOccupancy, reportsCount: propReports.length };
  });

  const ReportCard = ({ report }: { report: PropertyReport }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="font-medium text-sm">{getReportTypeLabel(report.report_type as ReportType)}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {report.property?.title || (isRu ? 'Объект' : 'Property')}
                  </p>
                </div>
              </div>
              {getStatusBadge(report.status)}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <Calendar className="h-3 w-3" />
              {format(new Date(report.period_start), 'dd MMM', { locale: isRu ? ru : enUS })}
              {' — '}
              {format(new Date(report.period_end), 'dd MMM yyyy', { locale: isRu ? ru : enUS })}
            </p>

            {report.data && (
              <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                <div>
                  <p className="text-[10px] text-muted-foreground">{isRu ? 'Доход' : 'Income'}</p>
                  <p className="text-sm font-medium text-success">{formatCurrency(report.data.income?.total || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{isRu ? 'Расходы' : 'Expenses'}</p>
                  <p className="text-sm font-medium text-destructive">{formatCurrency(report.data.expenses?.total || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{isRu ? 'Чистый' : 'Net'}</p>
                  <p className={`text-sm font-medium ${report.data.net_income >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(report.data.net_income || 0)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex md:flex-col gap-1.5 p-3 bg-muted/30 justify-center">
            <Button variant="ghost" size="sm" className="h-8" onClick={() => {
              setViewReport(report);
              if (report.status === 'ready' || report.status === 'sent') markViewed.mutate(report.id);
            }}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              <span className="hidden md:inline">{isRu ? 'Просмотр' : 'View'}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => handleGeneratePdf(report)} disabled={generatePdf.isPending}>
              <FileDown className="h-3.5 w-3.5 mr-1" />
              PDF
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => exportReportExcel(report, isRu ? 'ru' : 'en')}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
              Excel
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => handleOpenSendFlow(report)}>
              <Send className="h-3.5 w-3.5 mr-1" />
              <span className="hidden md:inline">{isRu ? 'Отправить' : 'Send'}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={() => setDeleteReportId(report.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Scope selector options (only show those with data)
  const scopeOptions = useMemo(() => {
    const opts: { value: ReportScope; icon: typeof Home; label: string; disabled?: boolean }[] = [
      { value: 'property', icon: Home, label: isRu ? 'Объект' : 'Property' },
    ];
    if ((complexes || []).length > 0) {
      opts.push({ value: 'complex', icon: Layers, label: isRu ? 'Комплекс' : 'Complex' });
    }
    if ((ownerContacts || []).filter((o: any) => o.propertyIds?.length > 0).length > 0) {
      opts.push({ value: 'owner', icon: Users, label: isRu ? 'Собственник' : 'Owner' });
    }
    if (allSelectableProperties.length > 1) {
      opts.push({ value: 'portfolio', icon: Briefcase, label: isRu ? 'Портфель' : 'Portfolio' });
    }
    return opts;
  }, [complexes, ownerContacts, allSelectableProperties, isRu]);

  return (
    <PageContainer>
      <BackButton fallbackPath="/mc/finance" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{isRu ? 'Отчёты' : 'Reports'}</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {isRu ? 'Финансовые отчёты по объектам' : 'Financial reports for properties'}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setShowOwnerInvite(true)}>
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              {isRu ? 'Создать' : 'Create'}
            </Button>
          </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'portfolio')}>
        {isManager && (
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              {isRu ? 'Отчёты' : 'Reports'}
            </TabsTrigger>
            <TabsTrigger value="portfolio">
              <Briefcase className="h-4 w-4 mr-1.5" />
              {isRu ? 'Портфель' : 'Portfolio'}
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="all">
          {/* Filter chips */}
          {((complexes || []).length > 0 || (ownerContacts || []).filter((o: any) => o.propertyIds?.length > 0).length > 0) && (
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
              <button
                onClick={() => { setFilterScope('all'); setFilterComplexId(''); setFilterOwnerId(''); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 border transition-colors ${
                  filterScope === 'all' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary border-border text-muted-foreground'
                }`}
              >
                {isRu ? 'Все' : 'All'} ({reports?.length || 0})
              </button>
              {(complexes || []).map((c: PropertyComplex) => {
                const count = (reports || []).filter(r => {
                  const prop = allSelectableProperties.find((p: any) => (p.id || p.property_id) === r.property_id);
                  return prop && (prop as any).complex_id === c.id;
                }).length;
                if (count === 0) return null;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setFilterScope('complex'); setFilterComplexId(c.id); setFilterOwnerId(''); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 border transition-colors ${
                      filterScope === 'complex' && filterComplexId === c.id
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-secondary border-border text-muted-foreground'
                    }`}
                  >
                    {isRu ? c.name_ru || c.name : c.name} ({count})
                  </button>
                );
              })}
              {(ownerContacts || []).filter((o: any) => o.propertyIds?.length > 0).map((o: any) => {
                const count = (reports || []).filter(r => (o.propertyIds || []).includes(r.property_id)).length;
                if (count === 0) return null;
                return (
                  <button
                    key={o.id}
                    onClick={() => { setFilterScope('owner'); setFilterOwnerId(o.id); setFilterComplexId(''); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 border transition-colors ${
                      filterScope === 'owner' && filterOwnerId === o.id
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-secondary border-border text-muted-foreground'
                    }`}
                  >
                    {o.first_name} {o.last_name?.[0] || ''}. ({count})
                  </button>
                );
              })}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="grid gap-3">
              {filteredReports.map((report) => <ReportCard key={report.id} report={report} />)}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">{isRu ? 'Пока нет отчётов' : 'No reports yet'}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isRu ? 'Создайте первый отчёт' : 'Generate your first report'}
                </p>
                <Button onClick={() => setShowGenerateDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  {isRu ? 'Создать' : 'Create'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio">
          <div className="space-y-4">
            {portfolioRows.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <Card><CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{isRu ? 'Доход' : 'Income'}</p>
                  <p className="text-sm font-bold text-success">{formatCurrency(portfolioRows.reduce((s, r) => s + r.totalIncome, 0))}</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{isRu ? 'Расходы' : 'Expenses'}</p>
                  <p className="text-sm font-bold text-destructive">{formatCurrency(portfolioRows.reduce((s, r) => s + r.totalExpenses, 0))}</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{isRu ? 'Чистый' : 'Net'}</p>
                  <p className="text-sm font-bold">{formatCurrency(portfolioRows.reduce((s, r) => s + r.netIncome, 0))}</p>
                </CardContent></Card>
              </div>
            )}

            {portfolioRows.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-medium text-muted-foreground text-xs">{isRu ? 'Объект' : 'Property'}</th>
                          <th className="text-right p-3 font-medium text-muted-foreground text-xs">{isRu ? 'Доход' : 'Income'}</th>
                          <th className="text-right p-3 font-medium text-muted-foreground text-xs">{isRu ? 'Расходы' : 'Expenses'}</th>
                          <th className="text-right p-3 font-medium text-muted-foreground text-xs">{isRu ? 'Чистый' : 'Net'}</th>
                          <th className="text-center p-3 font-medium text-muted-foreground text-xs">{isRu ? 'Отчётов' : '#'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioRows.map((row) => (
                          <tr key={row.property.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="p-3 font-medium text-sm">{isRu ? row.property.title_ru || row.property.title : row.property.title}</td>
                            <td className="p-3 text-right text-success text-sm">{formatCurrency(row.totalIncome)}</td>
                            <td className="p-3 text-right text-destructive text-sm">{formatCurrency(row.totalExpenses)}</td>
                            <td className={`p-3 text-right font-bold text-sm ${row.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {formatCurrency(row.netIncome)}
                            </td>
                            <td className="p-3 text-center"><Badge variant="outline" className="text-[10px]">{row.reportsCount}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">{isRu ? 'Нет управляемых объектов' : 'No managed properties'}</h3>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Send Email Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Отправить отчёт' : 'Send Report'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="email@example.com"
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
            />
            <Button onClick={handleSendEmail} className="w-full" disabled={!emailRecipients.trim() || sendReportEmail.isPending}>
              {sendReportEmail.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {isRu ? 'Отправить' : 'Send'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReportDetailSheet report={viewReport} open={!!viewReport} onOpenChange={(open) => { if (!open) setViewReport(null); }} />

      <AlertDialog open={!!deleteReportId} onOpenChange={() => setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить отчёт?' : 'Delete report?'}</AlertDialogTitle>
            <AlertDialogDescription>{isRu ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteReportId) { deleteReport.mutate(deleteReportId); setDeleteReportId(null); } }} className="bg-destructive text-destructive-foreground">
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OwnerAccessInviteDialog open={showOwnerInvite} onOpenChange={setShowOwnerInvite} />

      {policyEditorPropertyId && (
        <AccountingPolicyEditor
          open={!!policyEditorPropertyId}
          onOpenChange={(open) => { if (!open) setPolicyEditorPropertyId(null); }}
          propertyId={policyEditorPropertyId}
          propertyTitle={(() => {
            const p = allSelectableProperties.find((pr: any) => (pr.id || pr.property_id) === policyEditorPropertyId);
            return p ? (isRu ? p.title_ru || p.title : p.title) || '' : '';
          })()}
          existing={(accountingPolicies || []).find((p: any) => p.property_id === policyEditorPropertyId) || null}
        />
      )}
    </PageContainer>
  );
}
