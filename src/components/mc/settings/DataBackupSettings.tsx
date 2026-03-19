import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Download, Database, Users, DollarSign, FileBarChart, Loader2, Clock, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

type ExportType = 'properties' | 'crm' | 'finance' | 'reports' | 'all';
type ExportFormat = 'json' | 'csv';

const EXPORT_CATEGORIES: { type: ExportType; labelEn: string; labelRu: string; icon: React.ElementType; descEn: string; descRu: string }[] = [
  { type: 'properties', labelEn: 'Properties', labelRu: 'Объекты', icon: Database, descEn: 'All property data and settings', descRu: 'Все данные и настройки объектов' },
  { type: 'crm', labelEn: 'CRM Contacts', labelRu: 'CRM Контакты', icon: Users, descEn: 'Contacts, deals, activities', descRu: 'Контакты, сделки, активности' },
  { type: 'finance', labelEn: 'Finance', labelRu: 'Финансы', icon: DollarSign, descEn: 'Transactions, invoices, reports', descRu: 'Транзакции, счета, отчёты' },
  { type: 'reports', labelEn: 'Reports', labelRu: 'Отчёты', icon: FileBarChart, descEn: 'Analytics and generated reports', descRu: 'Аналитика и сгенерированные отчёты' },
];

interface BackupSettings {
  auto_enabled?: boolean;
  frequency?: 'weekly' | 'monthly';
  format?: ExportFormat;
}

export function DataBackupSettings() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const queryClient = useQueryClient();
  const [exportingType, setExportingType] = useState<ExportType | null>(null);
  const [format, setFormat] = useState<ExportFormat>('json');

  // Load backup settings
  const { data: backupSettings } = useQuery({
    queryKey: ['mc-backup-settings', companyId],
    queryFn: async (): Promise<BackupSettings> => {
      if (!companyId) return {};
      const { data, error } = await supabase
        .from('management_companies')
        .select('backup_settings')
        .eq('id', companyId)
        .single();
      if (error) return {};
      return (data?.backup_settings as BackupSettings) || {};
    },
    enabled: !!companyId,
  });

  // Sync format from saved settings so toggling auto-backup doesn't overwrite it
  useEffect(() => {
    if (backupSettings?.format) setFormat(backupSettings.format);
  }, [backupSettings?.format]);

  const autoEnabled = backupSettings?.auto_enabled ?? false;
  const autoFrequency = backupSettings?.frequency ?? 'monthly';

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (exportType: ExportType) => {
      setExportingType(exportType);
      const { data, error } = await supabase.functions.invoke('export-mc-data', {
        body: { company_id: companyId, export_type: exportType, format },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, exportType) => {
      // Download the data as file
      const isCsv = format === 'csv';
      const content = isCsv && typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const mimeType = isCsv ? 'text/csv;charset=utf-8' : 'application/json';
      const ext = isCsv ? 'csv' : 'json';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}-backup-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(isRu ? 'Экспорт завершён' : 'Export complete');
      setExportingType(null);
    },
    onError: () => {
      toast.error(isRu ? 'Ошибка экспорта' : 'Export failed');
      setExportingType(null);
    },
  });

  // Save auto-backup settings
  const saveAutoBackup = useMutation({
    mutationFn: async (settings: BackupSettings) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase
        .from('management_companies')
        .update({ backup_settings: settings as any })
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mc-backup-settings', companyId] });
      toast.success(isRu ? 'Настройки сохранены' : 'Settings saved');
    },
  });

  const toggleAutoBackup = (enabled: boolean) => {
    saveAutoBackup.mutate({
      ...backupSettings,
      auto_enabled: enabled,
      frequency: autoFrequency,
      format,
    });
  };

  const changeFrequency = (freq: 'weekly' | 'monthly') => {
    saveAutoBackup.mutate({
      ...backupSettings,
      auto_enabled: autoEnabled,
      frequency: freq,
      format,
    });
  };

  return (
    <div className="space-y-6">
      {/* Manual Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            {isRu ? 'Экспорт данных' : 'Data Export'}
          </CardTitle>
          <CardDescription className="text-xs">
            {isRu ? 'Скачайте данные вашей компании' : 'Download your company data'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-xs">{isRu ? 'Формат' : 'Format'}</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXPORT_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isExporting = exportingType === cat.type;
              return (
                <div key={cat.type} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{isRu ? cat.labelRu : cat.labelEn}</p>
                    <p className="text-[10px] text-muted-foreground">{isRu ? cat.descRu : cat.descEn}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    disabled={!!exportingType}
                    onClick={() => exportMutation.mutate(cat.type)}
                  >
                    {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    {isRu ? 'Скачать' : 'Export'}
                  </Button>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Export All */}
          <Button
            onClick={() => exportMutation.mutate('all')}
            disabled={!!exportingType}
            className="w-full gap-2"
          >
            {exportingType === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
            {isRu ? 'Полный бэкап всех данных' : 'Full Backup — All Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Auto Backup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {isRu ? 'Автоматический бэкап' : 'Auto Backup'}
          </CardTitle>
          <CardDescription className="text-xs">
            {isRu ? 'Настройте автоматическое резервное копирование' : 'Schedule automatic data backups'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{isRu ? 'Включить автобэкап' : 'Enable auto backup'}</p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Данные будут сохраняться автоматически' : 'Data will be backed up automatically'}
              </p>
            </div>
            <Switch checked={autoEnabled} onCheckedChange={toggleAutoBackup} />
          </div>

          {autoEnabled && (
            <div className="flex items-center gap-3">
              <Label className="text-xs">{isRu ? 'Частота' : 'Frequency'}</Label>
              <Select value={autoFrequency} onValueChange={(v) => changeFrequency(v as 'weekly' | 'monthly')}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{isRu ? 'Еженедельно' : 'Weekly'}</SelectItem>
                  <SelectItem value="monthly">{isRu ? 'Ежемесячно' : 'Monthly'}</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-[10px]">
                {isRu ? 'Сохраняется в облако' : 'Saved to cloud'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
