import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { CONTACT_IMPORT_FIELDS, CONTACT_IMPORT_ALIASES, HEADER_BLACKLIST_PATTERNS } from '@/lib/contactsImportFields';
import { t } from '@/lib/contactsImportI18n';

interface ContactImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '').trim();
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[;,|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function autoMap(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedFields = new Set<string>();
  columns.forEach((col) => {
    const norm = normalize(col);
    // Skip "Type" columns (e.g. "Phone 1 - Type" from Google Contacts)
    if (HEADER_BLACKLIST_PATTERNS.some((bp) => norm.endsWith(bp))) return;
    for (const field of CONTACT_IMPORT_FIELDS) {
      if (usedFields.has(field.key)) continue;
      const aliases = CONTACT_IMPORT_ALIASES[field.key] ?? [field.key.replace(/_/g, '')];
      if (aliases.some((k) => norm === k || norm.includes(k))) {
        mapping[col] = field.key;
        usedFields.add(field.key);
        break;
      }
    }
  });
  return mapping;
}

export function ContactImportSheet({ open, onOpenChange, companyId }: ContactImportSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const lang = isRu ? 'ru' : 'en';
  const { user } = useAuth();
  const qc = useQueryClient();

  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState({ success: 0, skipped: 0 });

  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        if (data.length === 0) { toast.error(t('fileEmpty', lang)); return; }
        const cols = Object.keys(data[0]);
        setRawData(data); setColumns(cols); setMapping(autoMap(cols)); setStep('map');
      },
      error: () => { toast.error(t('readError', lang)); },
    });
  }, [lang]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (!user?.id) return;
    setImporting(true);
    let success = 0;
    let skipped = 0;
    const rows = rawData
      .map((row) => {
        const mapped: Record<string, unknown> = {
          company_id: companyId,
          first_name: '',
          last_name: '-',
          lifecycle_stage: 'lead',
          tags: [],
          is_archived: false,
          created_by: user.id,
        };
        for (const [csvCol, targetField] of Object.entries(mapping)) {
          if (!targetField || !row[csvCol]) continue;
          const raw = String(row[csvCol] ?? '').trim();
          if (raw === '') continue;
          if (['first_name', 'last_name'].includes(targetField)) {
            mapped[targetField] = raw.slice(0, 100);
          } else if (['phone', 'phone2', 'mobile', 'whatsapp'].includes(targetField)) {
            mapped[targetField] = raw.slice(0, 20);
          } else if (targetField === 'email') {
            mapped[targetField] = raw.slice(0, 255);
          } else if (['telegram', 'line_id'].includes(targetField)) {
            mapped[targetField] = raw.slice(0, 50);
          } else if (['notes', 'special_notes'].includes(targetField)) {
            mapped[targetField] = raw.slice(0, 500);
          } else if (targetField === 'tags') {
            mapped.tags = parseTags(raw);
          } else {
            mapped[targetField] = raw;
          }
        }
        return mapped;
      })
      .filter((r) => {
        const first = String(r.first_name ?? '').trim();
        const last = String(r.last_name ?? '').trim();
        return first !== '' || (last !== '' && last !== '-');
      });

    if (rows.length === 0) {
      setImporting(false);
      toast.error(isRu ? 'Нет строк с именем для импорта' : 'No rows with a name to import');
      return;
    }

    // Deduplicate by phone within import set
    const seen = new Set<string>();
    const deduped = rows.filter((r) => {
      const phone = String(r.phone ?? '').trim();
      if (!phone) return true;
      const key = `${r.company_id}::${phone}`;
      if (seen.has(key)) { skipped++; return false; }
      seen.add(key);
      return true;
    });

    for (let i = 0; i < deduped.length; i += 50) {
      const batch = deduped.slice(i, i + 50);
      const { error } = await supabase.from('crm_contacts').insert(batch as any);
      if (error) {
        if (error.code === '23505') {
          for (const row of batch) {
            const { error: e } = await supabase.from('crm_contacts').insert(row as any);
            if (e) { skipped++; } else { success++; }
          }
        } else {
          skipped += batch.length;
          toast.error(error.message);
        }
      } else {
        success += batch.length;
      }
    }
    setImportResult({ success, skipped });
    setStep('done');
    setImporting(false);
    qc.invalidateQueries({ queryKey: ['crm-contacts'] });
    if (success > 0) {
      toast.success(t('importedCount', lang).replace('{n}', String(success)));
    }
  };

  const previewRows = rawData.slice(0, 5);
  const hasMapped = Object.values(mapping).some(v => v);
  const reset = () => { setStep('upload'); setRawData([]); setColumns([]); setMapping({}); };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}
      title={t('title', lang)}
      icon={<Upload className="w-5 h-5 text-primary" />}
      size="lg"
    >
      {step === 'upload' && (
        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed rounded-none p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => {
            const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv';
            input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleFile(file); };
            input.click();
          }}>
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">{t('dropCsv', lang)}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('formatCsv', lang)}</p>
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isRu ? `Найдено ${rawData.length} строк. Сопоставьте колонки:` : `Found ${rawData.length} rows. Map columns:`}
          </p>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {columns.map(col => (
              <div key={col} className="flex items-center gap-3">
                <span className="text-sm font-mono w-32 truncate shrink-0">{col}</span>
                <span className="text-muted-foreground">→</span>
                <Select value={mapping[col] || '_skip'} onValueChange={v => setMapping(m => ({ ...m, [col]: v === '_skip' ? '' : v }))}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,420px)]">
                    <SelectItem value="_skip">{t('skip', lang)}</SelectItem>
                    {CONTACT_IMPORT_FIELDS.map((f) => (
                      <SelectItem key={f.key} value={f.key}>{isRu ? f.labelRu : f.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mapping[col] && <Badge variant="secondary" className="text-[10px]">✓</Badge>}
              </div>
            ))}
          </div>
          {previewRows.length > 0 && (
            <div className="overflow-x-auto max-h-[20vh] overflow-y-auto border rounded-none">
              <p className="text-xs font-medium mb-1 px-2 pt-2">{isRu ? 'Предпросмотр (5 строк):' : 'Preview (5 rows):'}</p>
              <table className="text-xs w-full">
                <thead><tr>{columns.filter(c => mapping[c]).map(c => {
                  const f = CONTACT_IMPORT_FIELDS.find(x => x.key === mapping[c]);
                  return <th key={c} className="text-left p-1.5 border-b font-medium bg-muted/50 sticky top-0">{f ? (isRu ? f.labelRu : f.labelEn) : mapping[c]}</th>;
                })}</tr></thead>
                <tbody>{previewRows.map((row, i) => <tr key={i}>{columns.filter(c => mapping[c]).map(c => <td key={c} className="p-1.5 border-b text-muted-foreground truncate max-w-[150px]">{row[c]}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
          {!hasMapped && (
            <div className="rounded-none bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              ⚠ {t('mapAtLeastOne', lang)}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={reset}>{isRu ? 'Назад' : 'Back'}</Button>
            <Button onClick={handleImport} disabled={importing || !hasMapped}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
              {isRu ? `Импортировать ${rawData.length}` : `Import ${rawData.length}`}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-6">
          <Check className="h-10 w-10 mx-auto text-primary mb-3" />
          <p className="font-medium">{t('importComplete', lang)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('addedSkipped', lang).replace('{success}', String(importResult.success)).replace('{skipped}', String(importResult.skipped))}
          </p>
          <Button className="mt-4" onClick={() => onOpenChange(false)}>{t('done', lang)}</Button>
        </div>
      )}
    </ResponsiveModal>
  );
}
