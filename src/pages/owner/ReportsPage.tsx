import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import {
  usePropertyReports,
  useGenerateReport,
  useDeleteReport,
  useGeneratePdf,
  useSendReportEmail,
  ReportType,
  PropertyReport
} from '@/hooks/usePropertyReports';
import { ReportDetailSheet } from '@/components/owner/reports/ReportDetailSheet';
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

// Hook to load managed properties (via property_delegates)
function useManagedProperties() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['managed-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('property_delegates')
        .select('property_id, permissions, owner_properties:owner_properties(id, title, title_ru)')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) throw error;
      return (data || [])
        .filter((d: any) => (d.permissions as Record<string, boolean>)?.financials)
        .map((d: any) => d.owner_properties)
        .filter(Boolean);
    },
    enabled: !!user,
  });
}

export default function ReportsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: ownedProperties } = useOwnerProperties();
  const { data: managedProperties } = useManagedProperties();
  const { data: reports, isLoading } = usePropertyReports();
  const generateReport = useGenerateReport();
  const deleteReport = useDeleteReport();
  const generatePdf = useGeneratePdf();
  const sendReportEmail = useSendReportEmail();

  const [activeTab, setActiveTab] = useState<'all' | 'portfolio'>('all');
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

  // Merge owned + managed for the selector (deduplicated)
  const allSelectableProperties = [
    ...(ownedProperties || []),
    ...(managedProperties || []).filter(
      (mp: any) => !(ownedProperties || []).some((op: any) => op.id === mp.id)
    ),
  ];

  const isManager = (managedProperties || []).length > 0;

  const getReportPeriod = (type: ReportType): { start: string; end: string } => {
    const now = new Date();
    switch (type) {
      case 'monthly': {
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

  const handleGenerate = () => {
    if (!selectedPropertyId) return;
    const period = getReportPeriod(selectedReportType);
    generateReport.mutate({
      property_id: selectedPropertyId,
      report_type: selectedReportType,
      period_start: period.start,
      period_end: period.end,
    }, {
      onSuccess: () => {
        setShowGenerateDialog(false);
        setSelectedPropertyId('');
        setSelectedReportType('monthly');
      }
    });
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
            <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => setViewReport(report)}>
              <Eye className="h-4 w-4 mr-2" />
              {isRu ? 'Просмотр' : 'View'}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => handleGeneratePdf(report)} disabled={generatePdf.isPending}>
              {generatePdf.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              PDF
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
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Отчёты' : 'Reports'}</h1>
          <p className="text-muted-foreground">
            {isRu ? 'Финансовые отчёты по вашим объектам' : 'Financial reports for your properties'}
          </p>
        </div>
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Создать' : 'Create'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Создать новый отчёт' : 'Generate New Report'}</DialogTitle>
              <DialogDescription>
                {isRu ? 'Выберите объект и период для генерации отчёта' : 'Select a property and period to generate a report'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Объект' : 'Property'}</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(ownedProperties || []).length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                          {isRu ? 'Мои объекты' : 'My Properties'}
                        </div>
                        {(ownedProperties || []).map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {isRu ? p.title_ru || p.title : p.title}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {(managedProperties || []).length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                          {isRu ? 'Управляемые объекты' : 'Managed Properties'}
                        </div>
                        {(managedProperties || [])
                          .filter((mp: any) => !(ownedProperties || []).some((op: any) => op.id === mp.id))
                          .map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {isRu ? p.title_ru || p.title : p.title}
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Тип отчёта' : 'Report Type'}</Label>
                <Select value={selectedReportType} onValueChange={(v) => setSelectedReportType(v as ReportType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{isRu ? 'Ежемесячный (прошлый месяц)' : 'Monthly (last month)'}</SelectItem>
                    <SelectItem value="quarterly">{isRu ? 'Квартальный (прошлый квартал)' : 'Quarterly (last quarter)'}</SelectItem>
                    <SelectItem value="annual">{isRu ? 'Годовой (прошлый год)' : 'Annual (last year)'}</SelectItem>
                    <SelectItem value="management">{isRu ? 'Управленческий отчёт (УК)' : 'Management Report'}</SelectItem>
                    <SelectItem value="custom">{isRu ? 'Произвольный период' : 'Custom period'}</SelectItem>
                  </SelectContent>
                </Select>
                {selectedReportType === 'management' && (
                  <p className="text-xs text-muted-foreground">
                    {isRu
                      ? 'Включает заполняемость, комиссию УК, обслуживание и чистый доход собственника'
                      : 'Includes occupancy, mgmt commission, maintenance and owner net income'}
                  </p>
                )}
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

              <Button
                onClick={handleGenerate}
                className="w-full"
                disabled={!selectedPropertyId || generateReport.isPending}
              >
                {generateReport.isPending
                  ? (isRu ? 'Генерация...' : 'Generating...')
                  : (isRu ? 'Создать отчёт' : 'Generate Report')}
              </Button>
            </div>
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
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="grid gap-4">
              {reports.map((report) => <ReportCard key={report.id} report={report} />)}
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
    </div>
  );
}
