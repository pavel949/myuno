/**
 * CSV / XLSX Import Wizard for AI Intake.
 * 3 шага: upload (parse) → preview & map vertical → submit as bulk_text.
 *
 * Reuses the shared parseSpreadsheetFile() (papaparse + exceljs, no new deps)
 * and feeds rows to the existing intake-listing-agent via the bulk_text mode,
 * so the same approve / validation / health-score pipeline applies downstream.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileSpreadsheet, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { parseSpreadsheetFile, ParsedSpreadsheet } from '@/lib/parseSpreadsheet';
import { INTAKE_VERTICALS } from '@/lib/intakeVerticals';
import type { IntakeMode } from './IntakeModeSelector';

interface CSVImportWizardProps {
  isProcessing: boolean;
  onAnalyze: (options: {
    mode: IntakeMode;
    rawText?: string;
    forceVertical?: string;
  }) => Promise<void>;
}

type Step = 'upload' | 'preview';

export function CSVImportWizard({ isProcessing, onAnalyze }: CSVImportWizardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [parsing, setParsing] = useState(false);
  const [forceVertical, setForceVertical] = useState<string>('auto');

  const handleFile = useCallback(
    async (f: File) => {
      setParsing(true);
      try {
        const result = await parseSpreadsheetFile(f);
        if (result.rows.length === 0) {
          toast.error(isRu ? 'Файл пустой' : 'File is empty');
          return;
        }
        setFile(f);
        setParsed(result);
        setStep('preview');
        toast.success(
          isRu
            ? `Распарсено ${result.rows.length} строк`
            : `Parsed ${result.rows.length} rows`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Parse error';
        toast.error(msg);
      } finally {
        setParsing(false);
      }
    },
    [isRu],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFile(null);
    setParsed(null);
    setStep('upload');
  };

  /**
   * Convert rows to the `bulk_text` format the AI Intake agent already understands
   * (records separated by `---`, `key: value` per line). The agent then auto-extracts
   * fields per row, so column mapping is implicit and tolerant.
   */
  const rawText = useMemo(() => {
    if (!parsed) return '';
    return parsed.rows
      .map((row) => {
        const lines = parsed.headers
          .map((h) => {
            const v = (row[h] ?? '').toString().trim();
            return v ? `${h}: ${v}` : null;
          })
          .filter(Boolean);
        return lines.join('\n');
      })
      .filter((b) => b.length > 0)
      .join('\n---\n');
  }, [parsed]);

  const handleSubmit = async () => {
    if (!parsed || parsed.rows.length === 0) return;
    await onAnalyze({
      mode: 'bulk_text',
      rawText,
      forceVertical: forceVertical !== 'auto' ? forceVertical : undefined,
    });
  };

  // ---------- STEP 1: upload ----------
  if (step === 'upload') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {isRu ? 'Импорт из CSV / Excel' : 'CSV / Excel Import'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            <input
              type="file"
              accept=".csv,.tsv,.xlsx"
              className="hidden"
              disabled={parsing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {parsing ? (
              <Loader2 className="h-10 w-10 mb-3 text-primary animate-spin" />
            ) : (
              <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
            )}
            <div className="text-base font-medium">
              {parsing
                ? isRu
                  ? 'Парсинг...'
                  : 'Parsing...'
                : isRu
                  ? 'Перетащите файл или нажмите'
                  : 'Drop file or click to browse'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              .csv, .tsv, .xlsx · {isRu ? 'до 10 МБ' : 'up to 10 MB'}
            </div>
          </label>

          <div className="mt-4 text-xs text-muted-foreground">
            {isRu
              ? 'AI автоматически определит категорию, извлечёт поля и подготовит листинги. После импорта — стандартная очередь approve.'
              : 'AI auto-detects the vertical, extracts fields and prepares listings. After import — standard approve queue.'}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------- STEP 2: preview ----------
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 min-w-0">
            <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
            <span className="truncate">{file?.name}</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={reset} disabled={isProcessing}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {parsed?.rows.length} {isRu ? 'строк' : 'rows'}
          </Badge>
          <Badge variant="secondary">
            {parsed?.headers.length} {isRu ? 'колонок' : 'columns'}
          </Badge>
        </div>

        {/* Vertical hint */}
        <div className="space-y-2">
          <Label>{isRu ? 'Категория (опционально)' : 'Category (optional)'}</Label>
          <Select value={forceVertical} onValueChange={setForceVertical}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                {isRu ? '🤖 Авто-определение' : '🤖 Auto-detect'}
              </SelectItem>
              {INTAKE_VERTICALS.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.icon} {isRu ? v.nameRu : v.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Подсказка категории ускорит обработку, если все строки одного типа.'
              : 'Hinting a category speeds up processing if all rows are the same type.'}
          </p>
        </div>

        {/* Preview table — first 5 rows */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0">
                <tr>
                  {parsed?.headers.map((h) => (
                    <th key={h} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed?.rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t">
                    {parsed.headers.map((h) => (
                      <td key={h} className="px-2 py-1.5 truncate max-w-[180px]">
                        {row[h] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsed && parsed.rows.length > 5 && (
            <div className="text-xs text-muted-foreground text-center py-1.5 border-t bg-muted/30">
              {isRu
                ? `+ ещё ${parsed.rows.length - 5} строк`
                : `+ ${parsed.rows.length - 5} more rows`}
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isProcessing || !parsed?.rows.length}
          size="lg"
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isRu ? 'AI анализ...' : 'AI analyzing...'}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {isRu
                ? `Импортировать ${parsed?.rows.length} строк`
                : `Import ${parsed?.rows.length} rows`}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
