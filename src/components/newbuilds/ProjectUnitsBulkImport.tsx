/**
 * ProjectUnitsBulkImport — paste CSV/TSV table to bulk-create units.
 * Expected columns (header row optional, order matters):
 *   unit_code, unit_type, floor, area_sqm, bedrooms, bathrooms, price, view_type, status
 */
import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const COLUMNS = ['unit_code', 'unit_type', 'floor', 'area_sqm', 'bedrooms', 'bathrooms', 'price', 'view_type', 'status'] as const;
const VALID_STATUS = new Set(['available', 'reserved', 'sold', 'held']);

interface ParsedRow {
  data: Record<string, any>;
  error?: string;
}

function parseCsv(raw: string): ParsedRow[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  // Detect header
  const first = lines[0].split(/[,\t;]/).map(c => c.trim().toLowerCase());
  const hasHeader = first.some(c => COLUMNS.includes(c as any));
  const headers = hasHeader ? first : (COLUMNS as readonly string[]);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map<ParsedRow>((line, idx) => {
    const cells = line.split(/[,\t;]/).map(c => c.trim());
    const row: Record<string, any> = {};
    headers.forEach((h, i) => {
      const v = cells[i];
      if (v === undefined || v === '') return;
      if (['floor', 'area_sqm', 'bedrooms', 'bathrooms', 'price'].includes(h)) {
        const n = Number(v);
        if (Number.isNaN(n)) {
          return;
        }
        row[h] = n;
      } else {
        row[h] = v;
      }
    });

    if (!row.unit_type) {
      return { data: row, error: `Row ${idx + 1}: unit_type missing` };
    }
    if (row.status && !VALID_STATUS.has(row.status)) {
      return { data: row, error: `Row ${idx + 1}: invalid status "${row.status}"` };
    }
    if (!row.status) row.status = 'available';
    return { data: row };
  });
}

export function ProjectUnitsBulkImport({ projectId, open, onOpenChange }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const qc = useQueryClient();
  const [raw, setRaw] = useState('');
  const [importing, setImporting] = useState(false);

  const parsed = useMemo(() => parseCsv(raw), [raw]);
  const validRows = parsed.filter(r => !r.error);
  const errorRows = parsed.filter(r => r.error);

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error(isRu ? 'Нет валидных строк' : 'No valid rows');
      return;
    }
    setImporting(true);
    try {
      const payload = validRows.map(r => ({
        project_id: projectId,
        unit_code: r.data.unit_code || null,
        unit_type: r.data.unit_type,
        floor: r.data.floor ?? null,
        area_sqm: r.data.area_sqm ?? null,
        bedrooms: r.data.bedrooms ?? null,
        bathrooms: r.data.bathrooms ?? null,
        price: r.data.price ?? null,
        price_per_sqm: r.data.price && r.data.area_sqm ? r.data.price / r.data.area_sqm : null,
        view_type: r.data.view_type || null,
        status: r.data.status || 'available',
        currency: 'THB',
        created_by: user?.id || null,
      }));
      const { error } = await supabase.from('project_units').insert(payload as any);
      if (error) throw error;
      toast.success(isRu ? `Импортировано: ${payload.length}` : `Imported: ${payload.length}`);
      qc.invalidateQueries({ queryKey: ['project-units-grid', projectId] });
      setRaw('');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isRu ? 'Импорт юнитов (CSV/TSV)' : 'Bulk import units (CSV/TSV)'}
    >
      <div className="space-y-4 p-4">
        <Alert>
          <AlertDescription className="text-xs space-y-1">
            <p className="font-medium">{isRu ? 'Колонки (через запятую/таб):' : 'Columns (comma/tab):'}</p>
            <code className="block text-[11px] bg-muted p-2 rounded-none">
              {COLUMNS.join(', ')}
            </code>
            <p className="text-muted-foreground">
              {isRu
                ? 'Заголовок необязателен. Пример: A-301, 1br, 3, 45.5, 1, 1, 4500000, sea, available'
                : 'Header optional. Example: A-301, 1br, 3, 45.5, 1, 1, 4500000, sea, available'}
            </p>
          </AlertDescription>
        </Alert>

        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={isRu
            ? 'Вставьте CSV из Excel/Google Sheets…'
            : 'Paste CSV from Excel/Google Sheets…'}
          rows={10}
          className="font-mono text-xs"
        />

        {parsed.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              {validRows.length} {isRu ? 'валидных' : 'valid'}
            </Badge>
            {errorRows.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                {errorRows.length} {isRu ? 'с ошибками' : 'errors'}
              </Badge>
            )}
          </div>
        )}

        {errorRows.length > 0 && (
          <div className="max-h-32 overflow-y-auto border rounded-none p-2 space-y-1 bg-destructive/5">
            {errorRows.slice(0, 10).map((r, i) => (
              <p key={i} className="text-xs text-destructive">{r.error}</p>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={handleImport} disabled={importing || validRows.length === 0}>
            <Upload className="h-4 w-4 mr-1" />
            {isRu ? `Импортировать (${validRows.length})` : `Import (${validRows.length})`}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
