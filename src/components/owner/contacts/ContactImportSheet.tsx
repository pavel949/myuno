import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateContact } from '@/hooks/useCrmContacts';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface ContactImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

const TARGET_FIELDS = [
  { name: 'first_name', label: 'First Name', labelRu: 'Имя', required: true },
  { name: 'last_name', label: 'Last Name', labelRu: 'Фамилия', required: true },
  { name: 'phone', label: 'Phone', labelRu: 'Телефон', required: false },
  { name: 'email', label: 'Email', labelRu: 'Email', required: false },
  { name: 'whatsapp', label: 'WhatsApp', labelRu: 'WhatsApp', required: false },
  { name: 'telegram', label: 'Telegram', labelRu: 'Telegram', required: false },
  { name: 'contact_type', label: 'Type', labelRu: 'Тип', required: false },
  { name: 'source', label: 'Source', labelRu: 'Источник', required: false },
  { name: 'nationality', label: 'Nationality', labelRu: 'Гражданство', required: false },
  { name: 'company_name', label: 'Company', labelRu: 'Компания', required: false },
  { name: 'notes', label: 'Notes', labelRu: 'Заметки', required: false },
];

function autoMap(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const aliases: Record<string, string[]> = {
    first_name: ['first_name', 'firstname', 'first', 'имя', 'name'],
    last_name: ['last_name', 'lastname', 'last', 'surname', 'фамилия'],
    phone: ['phone', 'tel', 'telephone', 'mobile', 'телефон'],
    email: ['email', 'e-mail', 'почта', 'емейл'],
    whatsapp: ['whatsapp', 'wa'],
    telegram: ['telegram', 'tg'],
    contact_type: ['type', 'contact_type', 'тип'],
    source: ['source', 'источник'],
    nationality: ['nationality', 'гражданство', 'nation'],
    company_name: ['company', 'company_name', 'компания'],
    notes: ['notes', 'note', 'заметки', 'comment', 'comments'],
  };
  columns.forEach(col => {
    const lower = col.toLowerCase().trim();
    for (const [field, keys] of Object.entries(aliases)) {
      if (keys.includes(lower) && !Object.values(mapping).includes(field)) {
        mapping[col] = field;
        break;
      }
    }
  });
  return mapping;
}

export function ContactImportSheet({ open, onOpenChange, companyId }: ContactImportSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
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
        if (data.length === 0) { toast.error(isRu ? 'Файл пуст' : 'File is empty'); return; }
        const cols = Object.keys(data[0]);
        setRawData(data); setColumns(cols); setMapping(autoMap(cols)); setStep('map');
      },
      error: () => { toast.error(isRu ? 'Ошибка чтения файла' : 'Failed to read file'); },
    });
  }, [isRu]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    setImporting(true);
    let success = 0; let skipped = 0;
    const rows = rawData.map(row => {
      const mapped: Record<string, any> = { company_id: companyId, first_name: '', last_name: '', tags: [], is_archived: false, created_by: user?.id || null };
      for (const [csvCol, targetField] of Object.entries(mapping)) {
        if (targetField && row[csvCol]) mapped[targetField] = row[csvCol].trim();
      }
      return mapped;
    }).filter(r => r.first_name || r.last_name);

    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase.from('crm_contacts').insert(batch as any);
      if (error) skipped += batch.length; else success += batch.length;
    }
    setImportResult({ success, skipped }); setStep('done'); setImporting(false);
    qc.invalidateQueries({ queryKey: ['crm-contacts'] });
    toast.success(isRu ? `Импортировано: ${success}` : `Imported: ${success}`);
  };

  const previewRows = rawData.slice(0, 5);
  const reset = () => { setStep('upload'); setRawData([]); setColumns([]); setMapping({}); };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}
      title={isRu ? 'Импорт контактов' : 'Import Contacts'}
      icon={<Upload className="w-5 h-5 text-primary" />}
      size="lg"
    >
      {step === 'upload' && (
        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => {
            const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv';
            input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleFile(file); };
            input.click();
          }}>
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">{isRu ? 'Перетащите CSV файл или нажмите' : 'Drop CSV file or click to browse'}</p>
          <p className="text-xs text-muted-foreground mt-1">{isRu ? 'Формат: CSV с заголовками' : 'Format: CSV with headers'}</p>
        </div>
      )}

      {step === 'map' && (
        <>
          <p className="text-sm text-muted-foreground">
            {isRu ? `Найдено ${rawData.length} строк. Сопоставьте колонки:` : `Found ${rawData.length} rows. Map columns:`}
          </p>
          <div className="space-y-2">
            {columns.map(col => (
              <div key={col} className="flex items-center gap-3">
                <span className="text-sm font-mono w-32 truncate shrink-0">{col}</span>
                <span className="text-muted-foreground">→</span>
                <Select value={mapping[col] || '_skip'} onValueChange={v => setMapping(m => ({ ...m, [col]: v === '_skip' ? '' : v }))}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_skip">{isRu ? 'Пропустить' : 'Skip'}</SelectItem>
                    {TARGET_FIELDS.map(f => <SelectItem key={f.name} value={f.name}>{isRu ? f.labelRu : f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {mapping[col] && <Badge variant="secondary" className="text-[10px]">✓</Badge>}
              </div>
            ))}
          </div>
          {previewRows.length > 0 && (
            <div className="overflow-x-auto">
              <p className="text-xs font-medium mb-1">{isRu ? 'Предпросмотр (5 строк):' : 'Preview (5 rows):'}</p>
              <table className="text-xs w-full">
                <thead><tr>{columns.filter(c => mapping[c]).map(c => <th key={c} className="text-left p-1 border-b font-medium">{mapping[c]}</th>)}</tr></thead>
                <tbody>{previewRows.map((row, i) => <tr key={i}>{columns.filter(c => mapping[c]).map(c => <td key={c} className="p-1 border-b text-muted-foreground truncate max-w-[120px]">{row[c]}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>{isRu ? 'Назад' : 'Back'}</Button>
            <Button onClick={handleImport} disabled={importing || !Object.values(mapping).some(v => v)}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
              {isRu ? `Импортировать ${rawData.length}` : `Import ${rawData.length}`}
            </Button>
          </div>
        </>
      )}

      {step === 'done' && (
        <div className="text-center py-6">
          <Check className="h-10 w-10 mx-auto text-primary mb-3" />
          <p className="font-medium">{isRu ? 'Импорт завершён' : 'Import complete'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? `Добавлено: ${importResult.success}, пропущено: ${importResult.skipped}` : `Added: ${importResult.success}, skipped: ${importResult.skipped}`}
          </p>
          <Button className="mt-4" onClick={() => onOpenChange(false)}>{isRu ? 'Готово' : 'Done'}</Button>
        </div>
      )}
    </ResponsiveModal>
  );
}
