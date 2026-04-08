/**
 * Import ODOO contacts from Excel/CSV (Contact__res_partner___7_.xlsx format).
 * Columns: Complete Name, Phone, Email, Salesperson, Activities, City, Country, Tags
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { supabase } from '@/integrations/supabase/client';
import { parseSpreadsheetFile } from '@/lib/parseSpreadsheet';
import {
  processOdooRows,
  toImportPayload,
  type CleanedOdooContact,
} from '@/lib/odooImportContacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

function exportToCsv(
  rows: { headers: string[]; data: (string | number | null)[][] },
  filename: string
) {
  const lines = [rows.headers.join(',')];
  for (const row of rows.data) {
    lines.push(
      row
        .map((c) => {
          const s = String(c ?? '');
          return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    );
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportOdooContactsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id ?? undefined;

  const { data: salespersonMap } = useQuery({
    queryKey: ['company-members-profiles', companyId],
    queryFn: async (): Promise<Map<string, string>> => {
      if (!companyId) return new Map();
      const { data: members } = await supabase
        .from('management_company_members')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('is_active', true);
      const userIds = [...new Set((members ?? []).map((m: { user_id: string }) => m.user_id))];
      if (userIds.length === 0) return new Map();
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      const map = new Map<string, string>();
      for (const p of profiles ?? []) {
        const name = (p as { full_name?: string }).full_name?.trim();
        if (name) map.set(name.toLowerCase(), (p as { id: string }).id);
      }
      return map;
    },
    enabled: !!companyId,
  });

  const salespersonToUserId = useCallback(
    (name: string): string | null => {
      if (!name?.trim() || !salespersonMap) return null;
      const n = name.trim().toLowerCase();
      return salespersonMap.get(n) ?? null;
    },
    [salespersonMap]
  );

  const [file, setFile] = useState<File | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [processed, setProcessed] = useState<{
    toImport: CleanedOdooContact[];
    skipped: CleanedOdooContact[];
    stats: ReturnType<typeof processOdooRows>['stats'];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    imported: number;
    updated: number;
    skipped: number;
    errors: { row: number; reason: string }[];
  } | null>(null);

  const t = (en: string, ru: string) => (isRu ? ru : en);

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.toLowerCase().split('.').pop() ?? '';
    if (!['csv', 'tsv', 'xlsx'].includes(ext)) {
      toast.error(t('Use CSV, TSV or XLSX', 'Используйте CSV, TSV или XLSX'));
      return;
    }
    setFileLoading(true);
    setFile(f);
    setProcessed(null);
    setResult(null);
    try {
      const { headers, rows } = await parseSpreadsheetFile(f);
      if (rows.length === 0) {
        toast.error(t('File is empty', 'Файл пуст'));
        return;
      }
      const { toImport, skipped, stats } = processOdooRows(rows);
      setProcessed({ toImport, skipped, stats });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Parse error');
    } finally {
      setFileLoading(false);
    }
  }, [isRu]);

  const handleImport = useCallback(async () => {
    if (!companyId || !user || !processed?.toImport.length) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    const payloads = processed.toImport.map((c) => toImportPayload(c, salespersonToUserId));
    const total = payloads.length;
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: { row: number; reason: string }[] = [];

    const runEdgeFunction = async () => {
      const { data, error } = await supabase.functions.invoke('import-odoo-contacts', {
        body: { contacts: payloads, company_id: companyId },
      });
      if (error) throw error;
      return data;
    };

    const runClientFallback = async () => {
      const BATCH = 50;
      for (let i = 0; i < payloads.length; i += BATCH) {
        setProgress(Math.round(((i + BATCH) / payloads.length) * 100));
        const batch = payloads.slice(i, i + BATCH);
        for (let batchIdx = 0; batchIdx < batch.length; batchIdx++) {
          const p = batch[batchIdx];
          const globalIdx = i + batchIdx;
          const rowNum = processed!.toImport[globalIdx]?.rowIndex ?? globalIdx + 1;
          const phone = p.phone as string | null;
          const email = p.email as string | null;
          if (!phone && !email) continue;
          let existingId: string | null = null;
          if (phone) {
            const { data } = await supabase
              .from('crm_contacts')
              .select('id')
              .eq('company_id', companyId!)
              .eq('phone', phone)
              .limit(1)
              .maybeSingle();
            existingId = data?.id ?? null;
          }
          if (!existingId && email) {
            const { data } = await supabase
              .from('crm_contacts')
              .select('id')
              .eq('company_id', companyId!)
              .eq('email', email)
              .limit(1)
              .maybeSingle();
            existingId = data?.id ?? null;
          }
           const row: Record<string, unknown> = {
             first_name: p.first_name,
             last_name: p.last_name,
             phone: p.phone,
             email: p.email,
             address_city: p.address_city,
             address_country: p.address_country,
             tags: (p.tags as string[] | null) ?? [],
             contact_type: p.contact_type,
             lifecycle_stage: p.lifecycle_stage,
             is_company: p.is_company ?? false,
             company_name: p.company_name,
             linked_user_id: (p.linked_user_id as string | null) ?? null,
             source: 'odoo_import',
           };
          if (existingId) {
            const { error } = await supabase.from('crm_contacts').update(row as any).eq('id', existingId);
            if (error) errors.push({ row: rowNum, reason: error.message });
            else updated++;
          } else {
             const { error } = await supabase.from('crm_contacts').insert({
               ...row,
               company_id: companyId!,
               created_by: user!.id,
             } as any);
            if (error) errors.push({ row: rowNum, reason: error.message });
            else imported++;
          }
        }
      }
    };

    try {
      const data = await runEdgeFunction();
      if (data?.errors?.length) errors.push(...data.errors);
      imported = data?.imported ?? 0;
      updated = data?.updated ?? 0;
      skipped = data?.skipped ?? 0;
      setProgress(100);
      setResult({ imported, updated, skipped, errors });
      toast.success(
        t(
          `Imported ${imported} new, updated ${updated}`,
          `Импортировано ${imported} новых, обновлено ${updated}`
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const useFallback =
        /failed to fetch|failed to send|function.*not found|network|edge function/i.test(msg);

      if (useFallback) {
        toast.info(
          t(
            'Edge function unavailable, importing directly...',
            'Edge-функция недоступна, импортирую напрямую...'
          )
        );
        try {
          await runClientFallback();
          setProgress(100);
          setResult({ imported, updated, skipped, errors });
          toast.success(
            t(
              `Imported ${imported} new, updated ${updated}`,
              `Импортировано ${imported} новых, обновлено ${updated}`
            )
          );
        } catch (fallbackErr) {
          toast.error(fallbackErr instanceof Error ? fallbackErr.message : 'Import failed');
          setResult({
            imported: 0,
            updated: 0,
            skipped: total,
            errors: [{ row: 0, reason: fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error' }],
          });
        }
      } else {
        toast.error(msg);
        setResult({
          imported: 0,
          updated: 0,
          skipped: total,
          errors: [{ row: 0, reason: msg }],
        });
      }
    } finally {
      setImporting(false);
    }
  }, [companyId, user, processed, isRu, salespersonToUserId]);

  const previewRows = useMemo(
    () => processed?.toImport.slice(0, 10) ?? [],
    [processed]
  );

  const exportImported = () => {
    if (!processed?.toImport.length) return;
    const headers = [
      'first_name',
      'last_name',
      'phone',
      'email',
      'address_city',
      'address_country',
      'tags',
      'contact_type',
      'lifecycle_stage',
    ];
    const data = processed.toImport.map((c) => [
      c.first_name,
      c.last_name,
      c.phone ?? '',
      c.email ?? '',
      c.address_city ?? '',
      c.address_country ?? '',
      c.tags.join(';'),
      c.contact_type ?? '',
      c.lifecycle_stage ?? '',
    ]);
    exportToCsv(
      { headers, data },
      `odoo-imported-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const exportSkipped = () => {
    if (!processed?.skipped.length) return;
    const headers = ['row', 'name', 'reason'];
    const data = processed.skipped.map((c) => [
      c.rowIndex,
      `${c.first_name} ${c.last_name}`.trim(),
      c.skipReason ?? '',
    ]);
    exportToCsv(
      { headers, data },
      `odoo-skipped-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  if (!companyId) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
        <p className="text-muted-foreground">
          {t('Link your account to a management company.', 'Привяжите аккаунт к управляющей компании.')}
        </p>
        <Button variant="outline" onClick={() => navigate(APP_ROUTES.MC_CONTACTS)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('Back', 'Назад')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t('Import ODOO Contacts', 'Импорт контактов ODOO')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'Upload Excel/CSV from ODOO res.partner export. Columns: Complete Name, Phone, Email, City, Country, Tags.',
              'Загрузите Excel/CSV из экспорта ODOO res.partner. Колонки: Complete Name, Phone, Email, City, Country, Tags.'
            )}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(APP_ROUTES.MC_CONTACTS_IMPORT)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('Back to Import', 'Назад к импорту')}
        </Button>
      </div>

      {/* File upload */}
      <Card
        className={cn(
          'border-2 border-dashed cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-muted/30'
        )}
        onClick={() => document.getElementById('odoo-file-input')?.click()}
      >
        <input
          id="odoo-file-input"
          type="file"
          accept=".csv,.tsv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
        <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center gap-2 text-center">
          {fileLoading ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {file
              ? file.name
              : t('Drop or click to upload', 'Перетащите или нажмите для загрузки')}
          </p>
          <p className="text-xs text-muted-foreground">.xlsx, .csv, .tsv</p>
        </CardContent>
      </Card>

      {/* Stats */}
      {processed && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              {t('Import preview', 'Предпросмотр импорта')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {processed.stats.total} {t('rows', 'строк')}
              </Badge>
              <Badge variant="default">
                {processed.stats.toImport} {t('to import', 'к импорту')}
              </Badge>
              <Badge variant="outline" className="text-warning">
                {processed.stats.skipped} {t('skipped', 'пропущено')}
              </Badge>
              {Object.entries(processed.stats.skipReasons).map(([reason, count]) => (
                <Badge key={reason} variant="outline" className="text-muted-foreground">
                  {count} × {reason}
                </Badge>
              ))}
            </div>

            {/* Preview table */}
            {previewRows.length > 0 && (
              <ScrollArea className="rounded-md border max-h-[240px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">{t('Name', 'Имя')}</th>
                      <th className="text-left p-2">{t('Phone', 'Телефон')}</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">{t('City', 'Город')}</th>
                      <th className="text-left p-2">{t('Tags', 'Теги')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">
                          {r.first_name} {r.last_name}
                        </td>
                        <td className="p-2">{r.phone ?? '—'}</td>
                        <td className="p-2 truncate max-w-[140px]">{r.email ?? '—'}</td>
                        <td className="p-2">{r.address_city ?? '—'}</td>
                        <td className="p-2">{r.tags.slice(0, 2).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            )}

            <Button
              onClick={handleImport}
              disabled={importing || processed.stats.toImport === 0}
              className="w-full sm:w-auto"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {t('Confirm import', 'Подтвердить импорт')}
            </Button>

            {importing && (
              <Progress value={progress} className="h-2" />
            )}
          </CardContent>
        </Card>
      )}

      {/* Result summary */}
      {result && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('Import result', 'Результат импорта')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-success">{result.imported} {t('imported', 'импортировано')}</Badge>
              <Badge variant="secondary">{result.updated} {t('updated', 'обновлено')}</Badge>
              <Badge variant="outline">{result.skipped} {t('skipped', 'пропущено')}</Badge>
              {result.errors.length > 0 && (
                <Badge variant="destructive">{result.errors.length} {t('errors', 'ошибок')}</Badge>
              )}
            </div>
            {result.errors.length > 0 && result.errors.length <= 10 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    {t('Row', 'Строка')} {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
            )}
            {result.errors.length > 10 && (
              <p className="text-xs text-muted-foreground">
                {result.errors.length} {t('errors — see export for details', 'ошибок — см. экспорт')}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={exportImported} disabled={!processed?.toImport.length}>
                <Download className="h-3.5 w-3.5 mr-1" />
                {t('Export imported', 'Экспорт импортированных')}
              </Button>
              <Button variant="outline" size="sm" onClick={exportSkipped} disabled={!processed?.skipped.length}>
                <Download className="h-3.5 w-3.5 mr-1" />
                {t('Export skipped', 'Экспорт пропущенных')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
