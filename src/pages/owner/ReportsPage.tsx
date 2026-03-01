import { useState, useEffect, useMemo } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  FileDown,
  Send,
  Loader2,
  LayoutGrid,
  Briefcase,
  FileSpreadsheet,
  Settings2,
  UserPlus,
  Users,
  Home,
  Layers,
  Filter,
  Sparkles,
} from 'lucide-react';
import {
  format,
  subMonths, startOfMonth, endOfMonth,
  subQuarters, startOfQuarter, endOfQuarter,
  subYears, startOfYear, endOfYear
} from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { exportReportExcel } from '@/utils/exportFinancialsExcel';
import { ReportSettingsSheet, ReportConfig } from '@/components/owner/reports/ReportSettingsSheet';
import { ReportWizard } from '@/components/owner/reports/ReportWizard';
import { AccountingPolicyEditor } from '@/components/owner/reports/AccountingPolicyEditor';
import { useAccountingPolicies, useAccountingPolicyForProperty } from '@/hooks/useAccountingPolicies';
import { OwnerAccessInviteDialog } from '@/components/owner/reports/OwnerAccessInviteDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

/** Report scope: what entity are we generating/filtering for */
type ReportScope = 'property' | 'complex' | 'owner' | 'portfolio';

/** Hook to fetch owner contacts + their property IDs via owner_contact_id */
function useOwnerContacts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owner-contacts-for-reports', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get owner-type contacts
      const { data: contacts, error } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, email')
        .eq('contact_type', 'owner')
        .order('first_name');
      if (error) throw error;
      if (!contacts?.length) return [];

      // Get properties linked to each owner contact
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

const REPORT_CONFIG_KEY = 'uno-report-config';

function loadReportConfig(): ReportConfig | null {
  try {
    const saved = localStorage.getItem(REPORT_CONFIG_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

// All known financial categories
const INCOME_CATEGORIES = [
  { value: 'rental', labelEn: 'Rental Income', labelRu: 'Доход от аренды' },
  { value: 'booking', labelEn: 'Booking Income', labelRu: 'Доход от бронирований' },
  { value: 'cleaning_fee', labelEn: 'Cleaning Fee', labelRu: 'Плата за уборку' },
  { value: 'deposit', labelEn: 'Deposit Income', labelRu: 'Депозиты' },
  { value: 'other', labelEn: 'Other Income', labelRu: 'Прочие доходы' },
];

const EXPENSE_CATEGORIES = [
  { value: 'cleaning', labelEn: 'Cleaning', labelRu: 'Уборка' },
  { value: 'maintenance', labelEn: 'Maintenance', labelRu: 'Обслуживание' },
  { value: 'repair', labelEn: 'Repairs', labelRu: 'Ремонт' },
  { value: 'utilities', labelEn: 'Utilities', labelRu: 'Коммунальные' },
  { value: 'management_fee', labelEn: 'Management Fee', labelRu: 'Комиссия УК' },
  { value: 'commission', labelEn: 'Commission', labelRu: 'Комиссия' },
  { value: 'supplies', labelEn: 'Supplies', labelRu: 'Расходные материалы' },
  { value: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка' },
  { value: 'taxes', labelEn: 'Taxes', labelRu: 'Налоги' },
  { value: 'other', labelEn: 'Other Expenses', labelRu: 'Прочие расходы' },
];

// Hook to load managed properties (via property_delegates)
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

  const [activeTab, setActiveTab] = useState<'all' | 'portfolio'>('all');
  const [createMode, setCreateMode] = useState<'wizard' | 'manual'>('wizard');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedReportForSend, setSelectedReportForSend] = useState<string | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [viewReport, setViewReport] = useState<PropertyReport | null>(null);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showOwnerInvite, setShowOwnerInvite] = useState(false);
  const [policyEditorPropertyId, setPolicyEditorPropertyId] = useState<string | null>(null);

  // Report scope state
  const [generateScope, setGenerateScope] = useState<ReportScope>('property');
  const [selectedComplexId, setSelectedComplexId] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // Filter state for report list
  const [filterScope, setFilterScope] = useState<'all' | 'complex' | 'owner'>('all');
  const [filterComplexId, setFilterComplexId] = useState('');
  const [filterOwnerId, setFilterOwnerId] = useState('');

  // Category filter state
  const [includeIncome, setIncludeIncome] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [selectedIncomeCategories, setSelectedIncomeCategories] = useState<string[]>(
    INCOME_CATEGORIES.map(c => c.value)
  );
  const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<string[]>(
    EXPENSE_CATEGORIES.map(c => c.value)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // All properties list (deduped)
  const allSelectableProperties = useMemo(() => {
    const deduped = [
      ...(ownedProperties || []),
      ...(managedProperties || []).filter(
        (mp: any) => !(ownedProperties || []).some((op: any) => op.id === mp.id)
      ),
    ];
    return deduped;
  }, [ownedProperties, managedProperties]);

  // Resolve properties for selected scope
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
      const linkedIds = owner?.propertyIds || [];
      if (linkedIds.length > 0) {
        return allSelectableProperties
          .filter((p: any) => linkedIds.includes(p.id || p.property_id))
          .map((p: any) => p.id || p.property_id);
      }
      return [];
    }
    return [];
  }, [generateScope, selectedPropertyId, selectedComplexId, selectedOwnerId, allSelectableProperties, ownerContacts]);

  // Filtered reports list
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
      const linkedIds = owner?.propertyIds || [];
      return reports.filter(r => linkedIds.includes(r.property_id));
    }
    return reports;
  }, [reports, filterScope, filterComplexId, filterOwnerId, allSelectableProperties, ownerContacts]);

  // Load saved config defaults on mount
  useEffect(() => {
    const cfg = loadReportConfig();
    if (cfg) {
      setSelectedReportType(cfg.defaultType as ReportType);
      setIncludeIncome(cfg.sections.income);
      setIncludeExpenses(cfg.sections.expenses);
    }
  }, []);

  // Auto-fill from accounting policy when property selected in manual mode
  useEffect(() => {
    if (createMode !== 'manual' || !selectedPropertyId || !accountingPolicies) return;
    const policy = accountingPolicies.find(p => p.property_id === selectedPropertyId);
    if (policy) {
      setSelectedReportType(policy.default_report_type as ReportType);
      setIncludeIncome(policy.include_income);
      setIncludeExpenses(policy.include_expenses);
    }
  }, [selectedPropertyId, createMode, accountingPolicies]);

  const isManager = (managedProperties || []).length > 0;

  const getReportPeriod = (type: ReportType): { start: string; end: string } => {
    const now = new Date();
    switch (type) {
      case 'monthly':
      case 'owner_statement':
      case 'pnl': {
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
      case 'management': {
        const lastMonth = subMonths(now, 1);
        return { start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), end: format(endOfMonth(lastMonth), 'yyyy-MM-dd') };
      }
      case 'custom':
        return { start: customStart, end: customEnd };
    }
  };

  const handleGenerate = async () => {
    const period = getReportPeriod(selectedReportType);
    const ids = scopePropertyIds;
    if (ids.length === 0) return;

    if (ids.length === 1) {
      // Single property
      generateReport.mutate({
        property_id: ids[0],
        report_type: selectedReportType,
        period_start: period.start,
        period_end: period.end,
        includeIncome,
        includeExpenses,
        incomeCategories: selectedIncomeCategories,
        expenseCategories: selectedExpenseCategories,
      }, {
        onSuccess: () => {
          setShowGenerateDialog(false);
          setSelectedPropertyId('');
          setSelectedReportType('monthly');
        }
      });
    } else {
      // Batch generation for multiple properties
      setIsBatchGenerating(true);
      try {
        for (const propId of ids) {
          await generateReport.mutateAsync({
            property_id: propId,
            report_type: selectedReportType,
            period_start: period.start,
            period_end: period.end,
            includeIncome,
            includeExpenses,
            incomeCategories: selectedIncomeCategories,
            expenseCategories: selectedExpenseCategories,
          });
        }
        setShowGenerateDialog(false);
        setSelectedPropertyId('');
        setSelectedReportType('monthly');
        setGenerateScope('property');
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
        setEmailRecipients('');
      }
    });
  };

  const openSendDialog = (reportId: string) => {
    setSelectedReportForSend(reportId);
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

  // Portfolio: aggregate by managed property
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
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">{getReportTypeLabel(report.report_type as ReportType)}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {report.property?.title || (isRu ? 'Объект' : 'Property')}
                  </div>
                </div>
              </div>
              {getStatusBadge(report.status)}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(report.period_start), 'dd MMM', { locale: isRu ? ru : enUS })}
                {' — '}
                {format(new Date(report.period_end), 'dd MMM yyyy', { locale: isRu ? ru : enUS })}
              </div>
            </div>

            {report.data && (
              <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Доход' : 'Income'}</p>
                  <p className="font-medium text-success flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {formatCurrency(report.data.income?.total || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Расходы' : 'Expenses'}</p>
                  <p className="font-medium text-destructive flex items-center gap-1">
                    <TrendingDown className="h-3.5 w-3.5" />
                    {formatCurrency(report.data.expenses?.total || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Чистый' : 'Net'}</p>
                  <p className={`font-medium ${report.data.net_income >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(report.data.net_income || 0)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex md:flex-col gap-2 p-4 bg-muted/30 justify-center">
            <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => {
              setViewReport(report);
              if (report.status === 'ready' || report.status === 'sent') {
                markViewed.mutate(report.id);
              }
            }}>
              <Eye className="h-4 w-4 mr-2" />
              {isRu ? 'Просмотр' : 'View'}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => handleGeneratePdf(report)} disabled={generatePdf.isPending}>
              {generatePdf.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              PDF
            </Button>
            <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => exportReportExcel(report, isRu ? 'ru' : 'en')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            {report.pdf_url && (
              <Button variant="outline" size="sm" className="flex-1 md:flex-none" asChild>
                <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  {isRu ? 'Скачать' : 'Download'}
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => openSendDialog(report.id)}>
              <Send className="h-4 w-4 mr-2" />
              {isRu ? 'Отправить' : 'Send'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteReportId(report.id)} disabled={deleteReport.isPending}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PageContainer>
      <BackButton fallbackPath="/owner" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Отчёты' : 'Reports'}</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {isRu ? 'Финансовые отчёты по вашим объектам' : 'Financial reports for your properties'}
          </p>
        </div>
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setShowOwnerInvite(true)}>
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setShowSettings(true)}>
              <Settings2 className="h-4 w-4" />
            </Button>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </DialogTrigger>
          </div>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isRu ? 'Создать отчёт' : 'Generate Report'}</DialogTitle>
              <DialogDescription>
                {isRu ? 'Выберите способ создания отчёта' : 'Choose how to create a report'}
              </DialogDescription>
            </DialogHeader>

            {/* Mode toggle */}
            <div className="flex rounded-lg border p-1 gap-1">
              <button
                onClick={() => setCreateMode('wizard')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  createMode === 'wizard' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {isRu ? 'Визард' : 'Wizard'}
              </button>
              <button
                onClick={() => setCreateMode('manual')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  createMode === 'manual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings2 className="h-4 w-4" />
                {isRu ? 'Вручную' : 'Manual'}
              </button>
            </div>

            {createMode === 'wizard' ? (
              <ReportWizard
                properties={allSelectableProperties.map((p: any) => ({
                  id: p.id || p.property_id,
                  title: p.title || p.title_en || '',
                  title_ru: p.title_ru,
                  complex_id: p.complex_id,
                }))}
                complexes={(complexes || []).map((c: any) => ({ id: c.id, name: c.name || c.name_en, name_ru: c.name_ru }))}
                ownerContacts={(ownerContacts || []).map((o: any) => ({
                  id: o.id,
                  first_name: o.first_name,
                  last_name: o.last_name || '',
                  propertyIds: o.propertyIds || [],
                }))}
                onCancel={() => setShowGenerateDialog(false)}
                onComplete={async (result) => {
                  const ids = result.propertyIds;
                  if (ids.length === 0) return;
                  setIsBatchGenerating(true);
                  try {
                    for (const propId of ids) {
                      await generateReport.mutateAsync({
                        property_id: propId,
                        report_type: result.reportType,
                        period_start: result.periodStart,
                        period_end: result.periodEnd,
                        includeIncome: result.includeIncome,
                        includeExpenses: result.includeExpenses,
                      });
                    }
                    setShowGenerateDialog(false);
                  } finally {
                    setIsBatchGenerating(false);
                  }
                }}
              />
            ) : (
              /* ---- Manual mode ---- */
              <div className="space-y-4">
                {/* Scope selector */}
                <div className="space-y-2">
                  <Label>{isRu ? 'Область отчёта' : 'Report Scope'}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'property' as ReportScope, icon: Home, label: isRu ? 'Объект' : 'Property' },
                      { value: 'complex' as ReportScope, icon: Layers, label: isRu ? 'Комплекс' : 'Complex' },
                      { value: 'owner' as ReportScope, icon: Users, label: isRu ? 'Собственник' : 'Owner' },
                      { value: 'portfolio' as ReportScope, icon: Briefcase, label: isRu ? 'Весь портфель' : 'Full Portfolio' },
                    ] as const).map(s => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.value}
                          onClick={() => setGenerateScope(s.value)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-colors ${
                            generateScope === s.value
                              ? 'bg-primary/10 border-primary/30 text-primary'
                              : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Property selector */}
                {generateScope === 'property' && (
                  <div className="space-y-2">
                    <Label>{isRu ? 'Объект' : 'Property'}</Label>
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                      <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} /></SelectTrigger>
                      <SelectContent>
                        {allSelectableProperties.map((p: any) => (
                          <SelectItem key={p.id || p.property_id} value={p.id || p.property_id}>
                            {isRu ? p.title_ru || p.title : p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Policy indicator */}
                    {selectedPropertyId && (() => {
                      const policy = (accountingPolicies || []).find((p: any) => p.property_id === selectedPropertyId);
                      return (
                        <div className="flex items-center justify-between">
                          {policy ? (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {policy.policy_name || (isRu ? 'Политика настроена' : 'Policy set')}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {isRu ? 'Нет учётной политики' : 'No accounting policy'}
                            </span>
                          )}
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => setPolicyEditorPropertyId(selectedPropertyId)}
                          >
                            {policy ? (isRu ? 'Изменить' : 'Edit') : (isRu ? 'Настроить' : 'Set up')}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {generateScope === 'complex' && (
                  <div className="space-y-2">
                    <Label>{isRu ? 'Комплекс' : 'Complex'}</Label>
                    <Select value={selectedComplexId} onValueChange={setSelectedComplexId}>
                      <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите комплекс' : 'Select complex'} /></SelectTrigger>
                      <SelectContent>
                        {(complexes || []).map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{isRu ? c.name_ru || c.name : c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedComplexId && <p className="text-xs text-muted-foreground">{isRu ? `${scopePropertyIds.length} объект(ов)` : `${scopePropertyIds.length} properties`}</p>}
                  </div>
                )}

                {generateScope === 'owner' && (
                  <div className="space-y-2">
                    <Label>{isRu ? 'Собственник' : 'Owner'}</Label>
                    <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                      <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите собственника' : 'Select owner'} /></SelectTrigger>
                      <SelectContent>
                        {(ownerContacts || []).map((o: any) => (
                          <SelectItem key={o.id} value={o.id}>{o.first_name} {o.last_name} ({o.propertyIds?.length || 0})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {generateScope === 'portfolio' && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-sm text-muted-foreground">
                      {isRu ? `Отчёт для всех ${scopePropertyIds.length} объектов` : `Report for all ${scopePropertyIds.length} properties`}
                    </p>
                  </div>
                )}

                {/* Report type */}
                <div className="space-y-2">
                  <Label>{isRu ? 'Тип отчёта' : 'Report Type'}</Label>
                  <Select value={selectedReportType} onValueChange={(v) => setSelectedReportType(v as ReportType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{isRu ? 'Ежемесячный' : 'Monthly'}</SelectItem>
                      <SelectItem value="quarterly">{isRu ? 'Квартальный' : 'Quarterly'}</SelectItem>
                      <SelectItem value="annual">{isRu ? 'Годовой' : 'Annual'}</SelectItem>
                      <SelectItem value="per_booking">{isRu ? 'По заездам' : 'Per Booking'}</SelectItem>
                      <SelectItem value="owner_statement">{isRu ? 'Отчёт собственнику' : 'Owner Statement'}</SelectItem>
                      <SelectItem value="pnl">{isRu ? 'P&L' : 'P&L'}</SelectItem>
                      <SelectItem value="management">{isRu ? 'Управленческий' : 'Management'}</SelectItem>
                      <SelectItem value="custom">{isRu ? 'Произвольный период' : 'Custom period'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedReportType === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRu ? 'Начало' : 'Start'}</Label>
                      <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRu ? 'Конец' : 'End'}</Label>
                      <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Advanced categories */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        {isRu ? 'Настроить категории' : 'Configure categories'}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-success">{isRu ? 'Доходы' : 'Income'}</Label>
                        <Switch checked={includeIncome} onCheckedChange={setIncludeIncome} />
                      </div>
                      {includeIncome && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {INCOME_CATEGORIES.map(cat => (
                            <label key={cat.value} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={selectedIncomeCategories.includes(cat.value)}
                                onCheckedChange={(checked) => setSelectedIncomeCategories(prev => checked ? [...prev, cat.value] : prev.filter(c => c !== cat.value))}
                              />
                              {isRu ? cat.labelRu : cat.labelEn}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-destructive">{isRu ? 'Расходы' : 'Expenses'}</Label>
                        <Switch checked={includeExpenses} onCheckedChange={setIncludeExpenses} />
                      </div>
                      {includeExpenses && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {EXPENSE_CATEGORIES.map(cat => (
                            <label key={cat.value} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={selectedExpenseCategories.includes(cat.value)}
                                onCheckedChange={(checked) => setSelectedExpenseCategories(prev => checked ? [...prev, cat.value] : prev.filter(c => c !== cat.value))}
                              />
                              {isRu ? cat.labelRu : cat.labelEn}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Button
                  onClick={handleGenerate}
                  className="w-full"
                  disabled={scopePropertyIds.length === 0 || generateReport.isPending || isBatchGenerating}
                >
                  {(generateReport.isPending || isBatchGenerating)
                    ? (isRu ? 'Генерация...' : 'Generating...')
                    : scopePropertyIds.length > 1
                      ? (isRu ? `Создать ${scopePropertyIds.length} отчётов` : `Generate ${scopePropertyIds.length} Reports`)
                      : (isRu ? 'Создать отчёт' : 'Generate Report')}
                </Button>
              </div>
            )}

            {isBatchGenerating && createMode === 'wizard' && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRu ? 'Генерация отчётов...' : 'Generating reports...'}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs: all reports / portfolio (for managers) */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'portfolio')}>
        {isManager && (
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              {isRu ? 'Все отчёты' : 'All Reports'}
            </TabsTrigger>
            <TabsTrigger value="portfolio">
              <Briefcase className="h-4 w-4 mr-1.5" />
              {isRu ? 'Портфель' : 'Portfolio'}
            </TabsTrigger>
          </TabsList>
        )}

        {/* All Reports */}
        <TabsContent value="all">
          {/* Filter ribbon */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => { setFilterScope('all'); setFilterComplexId(''); setFilterOwnerId(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 border transition-colors ${
                filterScope === 'all' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary border-border text-muted-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {isRu ? 'Все' : 'All'}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{reports?.length || 0}</Badge>
            </button>

            {(complexes || []).length > 0 && (
              <>
                <div className="w-px h-5 bg-border shrink-0" />
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 border transition-colors ${
                        filterScope === 'complex' && filterComplexId === c.id
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-secondary border-border text-muted-foreground'
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      {isRu ? c.name_ru || c.name : c.name}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{count}</Badge>
                    </button>
                  );
                })}
              </>
            )}

            {(ownerContacts || []).length > 0 && (
              <>
                <div className="w-px h-5 bg-border shrink-0" />
                {(ownerContacts || []).filter((o: any) => o.propertyIds?.length > 0).map((o: any) => {
                  const count = (reports || []).filter(r => (o.propertyIds || []).includes(r.property_id)).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={o.id}
                      onClick={() => { setFilterScope('owner'); setFilterOwnerId(o.id); setFilterComplexId(''); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 border transition-colors ${
                        filterScope === 'owner' && filterOwnerId === o.id
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-secondary border-border text-muted-foreground'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      {o.first_name} {o.last_name?.[0] || ''}.
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{count}</Badge>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="grid gap-4">
              {filteredReports.map((report) => <ReportCard key={report.id} report={report} />)}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">{isRu ? 'Пока нет отчётов' : 'No reports yet'}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isRu ? 'Создайте первый отчёт для анализа финансов' : 'Generate your first report to analyze finances'}
                </p>
                <Button onClick={() => setShowGenerateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isRu ? 'Создать отчёт' : 'Generate Report'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Portfolio view for managers */}
        <TabsContent value="portfolio">
          <div className="space-y-4">
            {/* Summary totals */}
            {portfolioRows.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Суммарный доход' : 'Total Income'}</p>
                    <p className="text-base font-bold text-success">
                      {formatCurrency(portfolioRows.reduce((s, r) => s + r.totalIncome, 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Суммарные расходы' : 'Total Expenses'}</p>
                    <p className="text-base font-bold text-destructive">
                      {formatCurrency(portfolioRows.reduce((s, r) => s + r.totalExpenses, 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Чистый доход' : 'Net Income'}</p>
                    <p className="text-base font-bold">
                      {formatCurrency(portfolioRows.reduce((s, r) => s + r.netIncome, 0))}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Per-property table */}
            {portfolioRows.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-medium text-muted-foreground">{isRu ? 'Объект' : 'Property'}</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">{isRu ? 'Доход' : 'Income'}</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">{isRu ? 'Расходы' : 'Expenses'}</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">{isRu ? 'Чистый' : 'Net'}</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">{isRu ? 'Заполн.' : 'Occupancy'}</th>
                          <th className="text-center p-3 font-medium text-muted-foreground">{isRu ? 'Отчётов' : 'Reports'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioRows.map((row) => (
                          <tr key={row.property.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-medium">
                              {isRu ? row.property.title_ru || row.property.title : row.property.title}
                            </td>
                            <td className="p-3 text-right text-success">{formatCurrency(row.totalIncome)}</td>
                            <td className="p-3 text-right text-destructive">{formatCurrency(row.totalExpenses)}</td>
                            <td className={`p-3 text-right font-bold ${row.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {formatCurrency(row.netIncome)}
                            </td>
                            <td className="p-3 text-right">
                              <Badge variant="secondary">{row.avgOccupancy}%</Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="outline">{row.reportsCount}</Badge>
                            </td>
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
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">{isRu ? 'Нет управляемых объектов' : 'No managed properties'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isRu
                      ? 'Портфель отображается когда у вас есть доступ к объектам как управляющая компания'
                      : 'Portfolio appears when you have access to properties as a management company'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick: generate management report for each managed property */}
            {(managedProperties || []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  {isRu ? 'Быстрый управленческий отчёт' : 'Quick Management Report'}
                </h3>
                <div className="grid gap-2">
                  {(managedProperties || []).map((mp: any) => (
                    <Button
                      key={mp.id}
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        setSelectedPropertyId(mp.id);
                        setSelectedReportType('management');
                        setShowGenerateDialog(true);
                      }}
                    >
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      {isRu ? mp.title_ru || mp.title : mp.title}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {isRu ? 'Создать отчёт' : 'Create Report'}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Send Email Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Отправить отчёт' : 'Send Report'}</DialogTitle>
            <DialogDescription>
              {isRu ? 'Введите email-адреса получателей (через запятую)' : 'Enter recipient email addresses (comma-separated)'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Email получателей' : 'Recipient Emails'}</Label>
              <Input
                type="text"
                placeholder="email@example.com, owner@example.com"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Можно указать несколько адресов через запятую' : 'You can enter multiple addresses separated by commas'}
              </p>
            </div>
            <Button onClick={handleSendEmail} className="w-full" disabled={!emailRecipients.trim() || sendReportEmail.isPending}>
              {sendReportEmail.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isRu ? 'Отправка...' : 'Sending...'}</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />{isRu ? 'Отправить отчёт' : 'Send Report'}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Detail Sheet */}
      <ReportDetailSheet
        report={viewReport}
        open={!!viewReport}
        onOpenChange={(open) => { if (!open) setViewReport(null); }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReportId} onOpenChange={() => setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить отчёт?' : 'Delete report?'}</AlertDialogTitle>
            <AlertDialogDescription>{isRu ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteReportId) { deleteReport.mutate(deleteReportId); setDeleteReportId(null); } }}
              className="bg-destructive text-destructive-foreground"
            >
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Settings */}
      <ReportSettingsSheet open={showSettings} onOpenChange={setShowSettings} />

      {/* Owner Access Invite */}
      <OwnerAccessInviteDialog open={showOwnerInvite} onOpenChange={setShowOwnerInvite} />

      {/* Accounting Policy Editor */}
      {policyEditorPropertyId && (
        <AccountingPolicyEditor
          open={!!policyEditorPropertyId}
          onOpenChange={(open) => { if (!open) setPolicyEditorPropertyId(null); }}
          propertyId={policyEditorPropertyId}
          propertyTitle={
            (() => {
              const p = allSelectableProperties.find((pr: any) => (pr.id || pr.property_id) === policyEditorPropertyId);
              return p ? (isRu ? p.title_ru || p.title : p.title) || '' : '';
            })()
          }
          existing={(accountingPolicies || []).find((p: any) => p.property_id === policyEditorPropertyId) || null}
        />
      )}
    </PageContainer>
  );
}
