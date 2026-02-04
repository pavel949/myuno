import { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Mail,
  FileDown,
  Send,
  Loader2
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, subQuarters, startOfQuarter, endOfQuarter, subYears, startOfYear, endOfYear } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

export default function ReportsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { data: properties } = useOwnerProperties();
  const { data: reports, isLoading } = usePropertyReports();
  const generateReport = useGenerateReport();
  const deleteReport = useDeleteReport();
  const generatePdf = useGeneratePdf();
  const sendReportEmail = useSendReportEmail();

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedReportForSend, setSelectedReportForSend] = useState<string | null>(null);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getReportPeriod = (type: ReportType): { start: string; end: string } => {
    const now = new Date();
    
    switch (type) {
      case 'monthly': {
        const lastMonth = subMonths(now, 1);
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
        };
      }
      case 'quarterly': {
        const lastQuarter = subQuarters(now, 1);
        return {
          start: format(startOfQuarter(lastQuarter), 'yyyy-MM-dd'),
          end: format(endOfQuarter(lastQuarter), 'yyyy-MM-dd'),
        };
      }
      case 'annual': {
        const lastYear = subYears(now, 1);
        return {
          start: format(startOfYear(lastYear), 'yyyy-MM-dd'),
          end: format(endOfYear(lastYear), 'yyyy-MM-dd'),
        };
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
    if (emails.length === 0) return;
    
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
              {isRu ? 'Создать отчёт' : 'Generate Report'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Создать новый отчёт' : 'Generate New Report'}</DialogTitle>
              <DialogDescription>
                {isRu 
                  ? 'Выберите объект и период для генерации отчёта' 
                  : 'Select a property and period to generate a report'}
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
                    {properties?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {isRu ? p.title_ru || p.title : p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Тип отчёта' : 'Report Type'}</Label>
                <Select value={selectedReportType} onValueChange={(v) => setSelectedReportType(v as ReportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{isRu ? 'Ежемесячный (прошлый месяц)' : 'Monthly (last month)'}</SelectItem>
                    <SelectItem value="quarterly">{isRu ? 'Квартальный (прошлый квартал)' : 'Quarterly (last quarter)'}</SelectItem>
                    <SelectItem value="annual">{isRu ? 'Годовой (прошлый год)' : 'Annual (last year)'}</SelectItem>
                    <SelectItem value="custom">{isRu ? 'Произвольный период' : 'Custom period'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedReportType === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRu ? 'Начало' : 'Start'}</Label>
                    <Input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRu ? 'Конец' : 'End'}</Label>
                    <Input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
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

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Report Info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-medium">
                            {getReportTypeLabel(report.report_type as ReportType)}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {report.property?.title || 'Property'}
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

                    {/* Quick Stats */}
                    {report.data && (
                      <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 pt-3 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {isRu ? 'Доход' : 'Income'}
                          </p>
                          <p className="font-medium text-success flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {formatCurrency(report.data.income?.total || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {isRu ? 'Расходы' : 'Expenses'}
                          </p>
                          <p className="font-medium text-destructive flex items-center gap-1">
                            <TrendingDown className="h-3.5 w-3.5" />
                            {formatCurrency(report.data.expenses?.total || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {isRu ? 'Чистый доход' : 'Net Income'}
                          </p>
                          <p className={`font-medium ${report.data.net_income >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(report.data.net_income || 0)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 p-4 bg-muted/30 justify-center">
                    <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                      <Eye className="h-4 w-4 mr-2" />
                      {isRu ? 'Просмотр' : 'View'}
                    </Button>
                    
                    {/* Generate PDF */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 md:flex-none"
                      onClick={() => handleGeneratePdf(report)}
                      disabled={generatePdf.isPending}
                    >
                      {generatePdf.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4 mr-2" />
                      )}
                      PDF
                    </Button>
                    
                    {/* Download PDF if exists */}
                    {report.pdf_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 md:flex-none"
                        asChild
                      >
                        <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          {isRu ? 'Скачать' : 'Download'}
                        </a>
                      </Button>
                    )}
                    
                    {/* Send via email */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 md:flex-none"
                      onClick={() => openSendDialog(report.id)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isRu ? 'Отправить' : 'Send'}
                    </Button>
                    
                    {/* Delete */}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteReport.mutate(report.id)}
                      disabled={deleteReport.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">
              {isRu ? 'Пока нет отчётов' : 'No reports yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Создайте первый отчёт для анализа финансов' 
                : 'Generate your first report to analyze finances'}
            </p>
            <Button onClick={() => setShowGenerateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Создать отчёт' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Send Email Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Отправить отчёт' : 'Send Report'}</DialogTitle>
            <DialogDescription>
              {isRu 
                ? 'Введите email-адреса получателей (через запятую)' 
                : 'Enter recipient email addresses (comma-separated)'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Email получателей' : 'Recipient Emails'}</Label>
              <Input
                type="text"
                placeholder={isRu ? 'email@example.com, owner@example.com' : 'email@example.com, owner@example.com'}
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {isRu 
                  ? 'Можно указать несколько адресов через запятую' 
                  : 'You can enter multiple addresses separated by commas'}
              </p>
            </div>

            <Button 
              onClick={handleSendEmail} 
              className="w-full"
              disabled={!emailRecipients.trim() || sendReportEmail.isPending}
            >
              {sendReportEmail.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isRu ? 'Отправка...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {isRu ? 'Отправить отчёт' : 'Send Report'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
