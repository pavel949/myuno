import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, UserPlus, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { parseSpreadsheetFile } from '@/lib/parseSpreadsheet';
import { CONTACT_IMPORT_FIELDS, CONTACT_IMPORT_ALIASES, HEADER_BLACKLIST_PATTERNS } from '@/lib/contactsImportFields';
import { t } from '@/lib/contactsImportI18n';
import { APP_ROUTES } from '@/lib/config/routes';

interface ParsedContact {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  tags?: string[];
  source?: string;
  notes?: string;
  valid: boolean;
  error?: string;
}

const SKIP_COLUMN = '_skip';

export default function ContactImportPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const lang = isRu ? 'ru' : 'en';
  const { data: company, isLoading: companyLoading, error: companyError } = useMyCompanyId();
  const companyId = company?.company_id ?? undefined;

  const [parsed, setParsed] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [rawText, setRawText] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Manual entry state
  const [manual, setManual] = useState({ first_name: '', last_name: '', phone: '', email: '', whatsapp: '', telegram: '', source: 'manual', notes: '' });

  const fieldLabels = CONTACT_IMPORT_FIELDS.reduce((acc, f) => {
    acc[f.key] = isRu ? f.labelRu : f.labelEn;
    return acc;
  }, {} as Record<string, string>);

  const parseVCardFile = useCallback((text: string): ParsedContact[] => {
    const cards = text.split('BEGIN:VCARD').filter(Boolean);
    return cards
      .map((card) => {
        const getField = (name: string) => {
          const match = card.match(new RegExp(`${name}[^:]*:(.+)`, 'i'));
          return match ? match[1].trim() : '';
        };
        const fn = getField('FN');
        const nameParts = getField('N').split(';');
        const tel = getField('TEL');
        const email = getField('EMAIL');
        return {
          first_name: nameParts[1] || fn.split(' ')[0] || fn,
          last_name: nameParts[0] || fn.split(' ').slice(1).join(' ') || '',
          phone: tel,
          email,
          source: 'vcard_import',
          valid: !!(nameParts[1] || fn),
          error: !(nameParts[1] || fn) ? (isRu ? 'Нет имени' : 'Missing name') : undefined,
        };
      })
      .filter((c) => c.first_name || c.last_name);
  }, [isRu]);

  const normalizeHeader = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '').trim();
  const parseTags = (raw: string) =>
    raw
      .split(/[;,|]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

  const applyMapping = useCallback((rows: Record<string, string>[], mapping: Record<string, string>) => {
    const contacts: ParsedContact[] = rows.map((row) => {
      const first = (row[mapping.first_name || ''] || '').trim();
      const last = (row[mapping.last_name || ''] || '').trim();
      const valid = !!(first || last);
      return {
        first_name: first,
        last_name: last,
        phone: (row[mapping.phone || ''] || '').trim(),
        email: (row[mapping.email || ''] || '').trim(),
        whatsapp: (row[mapping.whatsapp || ''] || '').trim(),
        telegram: (row[mapping.telegram || ''] || '').trim(),
        tags: parseTags((row[mapping.tags || ''] || '').trim()),
        source: 'csv_import',
        notes: (row[mapping.notes || ''] || '').trim(),
        valid,
        error: valid ? undefined : (isRu ? 'Нет имени' : 'Missing name'),
      };
    });
    setParsed(contacts);
  }, [isRu]);

  const handleSpreadsheetResult = useCallback((headers: string[], rows: Record<string, string>[]) => {
    setCsvHeaders(headers);
    setRawRows(rows);
    const autoMap: Record<string, string> = {};
    const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
    for (const field of CONTACT_IMPORT_FIELDS) {
      const aliases = CONTACT_IMPORT_ALIASES[field.key] ?? [field.key.replace(/_/g, '')];
      const match = normalizedHeaders.find(({ norm }) => {
        // Skip headers that match blacklist patterns (e.g. "Phone 1 - Type")
        if (HEADER_BLACKLIST_PATTERNS.some((bp) => norm.endsWith(bp))) return false;
        return aliases.some((a) => norm === a || norm.includes(a));
      });
      if (match && !Object.values(autoMap).includes(match.raw)) {
        autoMap[field.key] = match.raw;
      }
    }
    setColumnMapping(autoMap);
    applyMapping(rows, autoMap);
  }, [applyMapping]);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop() ?? '';
    if (ext === 'vcf') {
      setFileLoading(true);
      setCsvHeaders([]);
      setRawRows([]);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) ?? '';
        setParsed(parseVCardFile(text));
        setFileLoading(false);
      };
      reader.readAsText(file);
      return;
    }
    setFileLoading(true);
    try {
      const { headers, rows } = await parseSpreadsheetFile(file);
      if (rows.length === 0) {
        toast.error(t('fileEmpty', lang));
      } else {
        handleSpreadsheetResult(headers, rows);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('readError', lang);
      toast.error(msg);
    } finally {
      setFileLoading(false);
    }
  }, [isRu, parseVCardFile, handleSpreadsheetResult, lang]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && /\.(csv|tsv|xlsx|xls|vcf)$/i.test(file.name)) {
      handleFile(file);
    } else {
      toast.error(t('supportedFormats', lang));
    }
  }, [handleFile, lang]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const triggerFileInput = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  // WhatsApp/Telegram text parsing
  const parseMessengerText = () => {
    const lines = rawText.split('\n').filter(Boolean);
    const contacts: ParsedContact[] = [];
    for (const line of lines) {
      // Try patterns: "Name - Phone" or "Name, Phone" or just phone
      const parts = line.split(/[-,\t]/).map((s) => s.trim());
      if (parts.length >= 2) {
        const namePart = parts[0];
        const phonePart = parts.slice(1).join(' ').trim();
        const nameWords = namePart.split(' ');
        contacts.push({
          first_name: nameWords[0] || '',
          last_name: nameWords.slice(1).join(' ') || '',
          phone: phonePart.replace(/[^\d+]/g, '') || undefined,
          whatsapp: phonePart.replace(/[^\d+]/g, '') || undefined,
          source: 'messenger_import',
          valid: !!nameWords[0],
          error: !nameWords[0] ? (isRu ? 'Нет имени' : 'Missing name') : undefined,
        });
      } else {
        const phone = line.replace(/[^\d+]/g, '');
        if (phone.length >= 7) {
          contacts.push({
            first_name: phone,
            last_name: '',
            phone,
            whatsapp: phone,
            source: 'messenger_import',
            valid: true,
          });
        }
      }
    }
    setParsed(contacts);
  };

  const buildRowFromMapping = (row: Record<string, string>): Record<string, unknown> => {
    const out: Record<string, unknown> = {
      company_id: companyId,
      created_by: user?.id ?? null,
      first_name: '',
      last_name: '-',
      lifecycle_stage: 'lead',
      tags: [],
    };
    const numKeys = new Set(['budget_min', 'budget_max', 'bedrooms_min', 'lead_score', 'scoring']);
    for (const [targetKey, sourceCol] of Object.entries(columnMapping)) {
      if (!sourceCol || !CONTACT_IMPORT_FIELDS.some((f) => f.key === targetKey)) continue;
      const raw = (row[sourceCol] ?? '').trim();
      if (numKeys.has(targetKey)) {
        const n = Number(raw);
        out[targetKey] = Number.isNaN(n) ? null : n;
      } else {
        const val = raw || null;
        if (targetKey === 'first_name') out.first_name = (val as string)?.slice(0, 100) || '';
        else if (targetKey === 'last_name') out.last_name = (val as string)?.slice(0, 100) || '-';
        else if (['phone', 'phone2', 'mobile', 'whatsapp'].includes(targetKey)) out[targetKey] = (val as string)?.slice(0, 20) ?? null;
        else if (targetKey === 'email') out[targetKey] = (val as string)?.slice(0, 255) ?? null;
        else if (['telegram', 'line_id'].includes(targetKey)) out[targetKey] = (val as string)?.slice(0, 50) ?? null;
        else if (['notes', 'special_notes'].includes(targetKey)) out[targetKey] = (val as string)?.slice(0, 500) ?? null;
        else if (targetKey === 'tags') out.tags = parseTags(String(val ?? ''));
        else out[targetKey] = val;
      }
    }
    // Single source of truth for hotness: UI uses `scoring`; `lead_score` stays aligned for legacy/Odoo CSV.
    const sRaw = out.scoring;
    const lRaw = out.lead_score;
    const s = typeof sRaw === 'number' && !Number.isNaN(sRaw) ? sRaw : null;
    const l = typeof lRaw === 'number' && !Number.isNaN(lRaw) ? lRaw : null;
    if (s != null && l == null) out.lead_score = s;
    else if (l != null && s == null) out.scoring = l;
    else if (s != null && l != null && s !== l) out.lead_score = s;

    return out;
  };

  const handleImport = async () => {
    if (!companyId || !user) {
      toast.error(t('companyNotFound', lang));
      return;
    }
    const validIndices = parsed.map((c, i) => (c.valid ? i : -1)).filter((i) => i >= 0);
    if (!validIndices.length) return;

    setImporting(true);
    let success = 0;
    let failed = 0;

    const rowsToInsert: Record<string, unknown>[] =
      rawRows.length > 0
        ? validIndices.map((i) => buildRowFromMapping(rawRows[i] ?? {}))
        : validIndices.map((i) => {
            const c = parsed[i];
            const firstName = String(c?.first_name ?? '').trim();
            const lastName = String(c?.last_name ?? '').trim();
            return {
              company_id: companyId,
              first_name: firstName.slice(0, 100) || '',
              last_name: lastName.slice(0, 100) || '-',
              phone: c?.phone?.slice(0, 20) || null,
              email: c?.email?.slice(0, 255) || null,
              whatsapp: c?.whatsapp?.slice(0, 20) || null,
              telegram: c?.telegram?.slice(0, 50) || null,
              source: c?.source || 'import',
              notes: c?.notes?.slice(0, 500) || null,
              tags: c?.tags || [],
              lifecycle_stage: 'lead',
              created_by: user.id,
            };
          });

    // Deduplicate by phone within the import set (keep first occurrence)
    const seen = new Set<string>();
    const deduped = rowsToInsert.filter((row) => {
      const phone = String(row.phone ?? '').trim();
      if (!phone) return true; // null/empty phones are allowed (no unique constraint)
      const key = `${row.company_id}::${phone}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const BATCH_SIZE = 50;
    for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
      const batch = deduped.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase.from('crm_contacts').insert(batch as any).select('id');
      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation — insert one by one, skipping duplicates
          for (const row of batch) {
            const { data: d, error: e } = await supabase.from('crm_contacts').insert(row as any).select('id');
            if (e) { failed++; } else { success += d?.length || 0; }
          }
        } else {
          failed += batch.length;
          toast.error(`${t('readError', lang)}: ${error.message}`);
        }
      } else {
        success += data?.length || 0;
        failed += batch.length - (data?.length || 0);
      }
    }

    setImportResult({ success, failed });
    setImporting(false);
    if (success > 0) {
      toast.success(t('importedCount', lang).replace('{n}', String(success)));
    }
    if (failed > 0) {
      toast.error(
        success === 0
          ? t('readError', lang)
          : `${isRu ? 'Не удалось импортировать часть контактов' : 'Some contacts failed to import'}: ${failed}`
      );
    }
  };

  // Manual add
  const handleManualAdd = async () => {
    if (!companyId || !user) return;
    if (!manual.first_name.trim()) {
      toast.error(t('enterName', lang));
      return;
    }
    const { error } = await supabase.from('crm_contacts').insert({
      company_id: companyId,
      first_name: manual.first_name.trim().slice(0, 100),
      last_name: manual.last_name.trim().slice(0, 100) || '-',
      phone: manual.phone?.slice(0, 20) || null,
      email: manual.email?.slice(0, 255) || null,
      whatsapp: manual.whatsapp?.slice(0, 20) || null,
      telegram: manual.telegram?.slice(0, 50) || null,
      source: manual.source,
      notes: manual.notes?.slice(0, 500) || null,
      tags: [],
      lifecycle_stage: 'lead',
      created_by: user.id,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success(t('contactAdded', lang));
      setManual({ first_name: '', last_name: '', phone: '', email: '', whatsapp: '', telegram: '', source: 'manual', notes: '' });
    }
  };

  const validCount = parsed.filter((c) => c.valid).length;
  const invalidCount = parsed.length - validCount;

  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка…' : 'Loading…'}</p>
      </div>
    );
  }

  if (companyError || (!companyLoading && !companyId && user)) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{t('title', lang)}</h2>
        <p className="text-sm text-destructive">{t('companyNotFound', lang)}</p>
        <p className="text-xs text-muted-foreground">
          {isRu ? 'Привяжите аккаунт к управляющей компании в настройках.' : 'Link your account to a management company in settings.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{t('title', lang)}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle', lang)}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={APP_ROUTES.MC_CONTACTS_IMPORT_ODOO}>
            {isRu ? 'Импорт из ODOO' : 'Import from ODOO'}
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="file">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="file" className="gap-1 text-xs"><FileSpreadsheet className="h-3.5 w-3.5" /> {t('tabFile', lang)}</TabsTrigger>
          <TabsTrigger value="messenger" className="gap-1 text-xs"><MessageCircle className="h-3.5 w-3.5" /> {t('tabChat', lang)}</TabsTrigger>
          <TabsTrigger value="manual" className="gap-1 text-xs"><UserPlus className="h-3.5 w-3.5" /> {t('tabManual', lang)}</TabsTrigger>
        </TabsList>

        {/* File tab: CSV, TSV, XLSX, vCard — drag-and-drop or pick from disk */}
        <TabsContent value="file" className="space-y-4">
          <input ref={fileRef} type="file" accept=".csv,.tsv,.xlsx,.xls,.vcf" onChange={onFileInputChange} className="hidden" />
          <Card
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`border-2 border-dashed transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
            onClick={triggerFileInput}
          >
            <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center gap-2 text-center">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">{t('dropPrompt', lang)}</p>
              <p className="text-xs text-muted-foreground">{t('dropFormats', lang)}</p>
              {fileLoading && <p className="text-xs text-primary">{t('loading', lang)}</p>}
            </CardContent>
          </Card>

          {csvHeaders.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('columnMappingTitle', lang)}</CardTitle>
                <p className="text-xs text-muted-foreground">{t('columnMappingHint', lang)}</p>
                <Alert className="mt-3 border-muted-foreground/25 bg-muted/30">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <AlertDescription className="text-xs text-muted-foreground">
                    {isRu
                      ? 'В списках и карточке MC используется «Скоринг». Колонку Lead score при импорте подстраиваем под скоринг; при конфликте двух колонок приоритет у скоринга.'
                      : 'MC lists and cards use Score. On import, Lead score is aligned to Score; if both columns differ, Score wins.'}
                  </AlertDescription>
                </Alert>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[40vh] overflow-y-auto">
                {CONTACT_IMPORT_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <span className="text-sm w-40 shrink-0">{fieldLabels[f.key] ?? f.key}{f.required ? ' *' : ''}</span>
                    <Select
                      value={columnMapping[f.key] ? columnMapping[f.key] : SKIP_COLUMN}
                      onValueChange={(v) => {
                        const next = { ...columnMapping, [f.key]: v === SKIP_COLUMN ? '' : v };
                        setColumnMapping(next);
                        if (rawRows.length) applyMapping(rawRows, next);
                      }}
                    >
                      <SelectTrigger className="flex-1"><SelectValue placeholder={t('skip', lang)} /></SelectTrigger>
                      <SelectContent className="max-h-[min(70vh,420px)]">
                        <SelectItem value={SKIP_COLUMN}>{t('skip', lang)}</SelectItem>
                        {csvHeaders.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Messenger Tab */}
        <TabsContent value="messenger" className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <Label>{isRu ? 'Вставьте текст из чата' : 'Paste chat text'}</Label>
              <Textarea
                rows={6}
                placeholder={isRu ? 'Имя - Телефон\nИмя Фамилия, +66123456789\n...' : 'Name - Phone\nFirst Last, +66123456789\n...'}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <Button onClick={parseMessengerText} variant="outline" size="sm">
                {isRu ? 'Разобрать' : 'Parse'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Tab */}
        <TabsContent value="manual">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{isRu ? 'Имя *' : 'First Name *'}</Label>
                  <Input value={manual.first_name} onChange={(e) => setManual((m) => ({ ...m, first_name: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>{isRu ? 'Фамилия' : 'Last Name'}</Label>
                  <Input value={manual.last_name} onChange={(e) => setManual((m) => ({ ...m, last_name: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                  <Input value={manual.phone} onChange={(e) => setManual((m) => ({ ...m, phone: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={manual.email} onChange={(e) => setManual((m) => ({ ...m, email: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={manual.whatsapp} onChange={(e) => setManual((m) => ({ ...m, whatsapp: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Telegram</Label>
                  <Input value={manual.telegram} onChange={(e) => setManual((m) => ({ ...m, telegram: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
                <Textarea value={manual.notes} onChange={(e) => setManual((m) => ({ ...m, notes: e.target.value }))} className="mt-1" rows={2} />
              </div>
              <Button onClick={handleManualAdd} className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                {t('addContact', lang)}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview parsed contacts */}
      {parsed.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {t('preview', lang)} ({parsed.length})
              </CardTitle>
              <div className="flex gap-2">
                {validCount > 0 && <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> {validCount}</Badge>}
                {invalidCount > 0 && <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> {invalidCount}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {parsed.slice(0, 50).map((c, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded-none ${!c.valid ? 'bg-destructive/5' : ''}`}>
                    {c.valid ? <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                    <span className="font-medium">{c.first_name} {c.last_name}</span>
                    {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
                    {c.email && <span className="text-muted-foreground truncate">{c.email}</span>}
                    {c.error && <span className="text-destructive text-xs ml-auto">{c.error}</span>}
                  </div>
                ))}
                {parsed.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    +{parsed.length - 50} {t('more', lang)}...
                  </p>
                )}
              </div>
            </ScrollArea>
            <Button
              onClick={handleImport}
              disabled={importing || !validCount}
              className="w-full mt-4 gap-2"
            >
              <Upload className="h-4 w-4" />
              {importing ? t('importing', lang) : `${t('importBtn', lang)} ${validCount}`}
            </Button>
            {importResult && (
              <p className="text-sm text-center mt-2 text-muted-foreground">
                ✅ {importResult.success} {t('success', lang)}{importResult.failed > 0 && ` · ❌ ${importResult.failed} ${t('failed', lang)}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
