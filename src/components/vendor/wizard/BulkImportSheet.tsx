/**
 * BulkImportSheet - CSV/Excel bulk import component
 * Supports file upload and paste from clipboard
 */
import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Upload,
  FileSpreadsheet,
  ClipboardPaste,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

export type ImportVertical = 'products' | 'services' | 'properties' | 'vehicles' | 'tours';

interface ImportRow {
  id: string;
  data: Record<string, string>;
  status: 'pending' | 'valid' | 'invalid' | 'imported';
  errors: string[];
}

interface BulkImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vertical: ImportVertical;
  onImport: (rows: Record<string, string>[]) => Promise<{ success: number; failed: number }>;
}

const VERTICAL_COLUMNS: Record<ImportVertical, { key: string; label: string; required?: boolean }[]> = {
  products: [
    { key: 'name_en', label: 'Name (EN)', required: true },
    { key: 'name_ru', label: 'Name (RU)' },
    { key: 'description_en', label: 'Description (EN)' },
    { key: 'price', label: 'Price', required: true },
    { key: 'currency', label: 'Currency' },
    { key: 'category', label: 'Category' },
    { key: 'cover_image', label: 'Image URL' },
  ],
  services: [
    { key: 'name_en', label: 'Name (EN)', required: true },
    { key: 'name_ru', label: 'Name (RU)' },
    { key: 'description_en', label: 'Description (EN)' },
    { key: 'price', label: 'Price', required: true },
    { key: 'duration', label: 'Duration (min)' },
    { key: 'category', label: 'Category' },
  ],
  properties: [
    { key: 'title_en', label: 'Title (EN)', required: true },
    { key: 'address', label: 'Address', required: true },
    { key: 'district', label: 'District' },
    { key: 'bedrooms', label: 'Bedrooms' },
    { key: 'price_monthly', label: 'Monthly Price' },
    { key: 'price_daily', label: 'Daily Price' },
  ],
  vehicles: [
    { key: 'name_en', label: 'Name (EN)', required: true },
    { key: 'brand', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'year', label: 'Year' },
    { key: 'price_daily', label: 'Daily Price', required: true },
  ],
  tours: [
    { key: 'name_en', label: 'Name (EN)', required: true },
    { key: 'description_en', label: 'Description (EN)' },
    { key: 'duration_hours', label: 'Duration (hours)' },
    { key: 'price', label: 'Price', required: true },
    { key: 'max_participants', label: 'Max Participants' },
  ],
};

export function BulkImportSheet({ 
  open, 
  onOpenChange, 
  vertical,
  onImport 
}: BulkImportSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [pasteContent, setPasteContent] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const columns = VERTICAL_COLUMNS[vertical];

  const parseCSV = useCallback((content: string) => {
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    if (result.errors.length > 0) {
      toast.error(isRu ? 'Ошибка парсинга CSV' : 'CSV parsing error');
      console.error('CSV errors:', result.errors);
      // Don't return - continue with valid rows, but warn user
    }
    
    // Filter out empty rows and ensure data exists
    const validData = (result.data || []).filter((row: any) => 
      row && typeof row === 'object' && Object.keys(row).length > 0
    );
    
    if (validData.length === 0) {
      toast.error(isRu ? 'Нет данных для импорта' : 'No data to import');
      return;
    }

    const parsedRows: ImportRow[] = validData.map((row: any, index: number) => {
      const errors: string[] = [];
      
      // Validate required fields
      columns.forEach(col => {
        if (col.required && !row[col.key] && !row[columnMapping[col.key]]) {
          errors.push(`${col.label} is required`);
        }
      });

      return {
        id: `row-${index}`,
        data: row,
        status: errors.length > 0 ? 'invalid' : 'valid',
        errors,
      };
    });

    setRows(parsedRows);
    
    // Auto-detect column mapping
    const headers = Object.keys(result.data[0] || {});
    const newMapping: Record<string, string> = {};
    columns.forEach(col => {
      const match = headers.find(h => 
        h === col.key || 
        h.includes(col.key) || 
        col.key.includes(h)
      );
      if (match) newMapping[col.key] = match;
    });
    setColumnMapping(newMapping);

    toast.success(
      isRu 
        ? `Загружено ${parsedRows.length} записей` 
        : `Loaded ${parsedRows.length} rows`
    );
  }, [columns, columnMapping, isRu]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCSV(content);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      toast.error(isRu ? 'Ошибка чтения файла' : 'File read error');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    if (!pasteContent.trim()) {
      toast.error(isRu ? 'Вставьте данные' : 'Paste data first');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      parseCSV(pasteContent);
      setIsProcessing(false);
    }, 100);
  };

  const handleImport = async () => {
    const validRows = rows.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      toast.error(isRu ? 'Нет валидных записей' : 'No valid rows to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Map data according to column mapping
      const mappedData = validRows.map(row => {
        const mapped: Record<string, string> = {};
        columns.forEach(col => {
          const sourceKey = columnMapping[col.key] || col.key;
          mapped[col.key] = row.data[sourceKey] || '';
        });
        return mapped;
      });

      const result = await onImport(mappedData);
      
      // Update row statuses
      setRows(prev => prev.map((row, i) => ({
        ...row,
        status: i < result.success ? 'imported' : row.status,
      })));

      setImportProgress(100);
      toast.success(
        isRu 
          ? `Импортировано: ${result.success}, ошибок: ${result.failed}`
          : `Imported: ${result.success}, failed: ${result.failed}`
      );

      if (result.failed === 0) {
        setTimeout(() => onOpenChange(false), 1500);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(isRu ? 'Ошибка импорта' : 'Import error');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = columns.map(c => c.key).join(',');
    const example = columns.map(c => c.required ? 'Example' : '').join(',');
    const csv = `${headers}\n${example}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vertical}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearRows = () => {
    setRows([]);
    setPasteContent('');
    setColumnMapping({});
  };

  const validCount = rows.filter(r => r.status === 'valid').length;
  const invalidCount = rows.filter(r => r.status === 'invalid').length;
  const importedCount = rows.filter(r => r.status === 'imported').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {isRu ? 'Массовый импорт' : 'Bulk Import'}
            <Badge variant="secondary" className="ml-2">
              {vertical}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Input Mode Tabs */}
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'file' | 'paste')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="gap-2">
                <Upload className="h-4 w-4" />
                {isRu ? 'Файл' : 'File'}
              </TabsTrigger>
              <TabsTrigger value="paste" className="gap-2">
                <ClipboardPaste className="h-4 w-4" />
                {isRu ? 'Вставить' : 'Paste'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4">
              <div className="border-2 border-dashed rounded-none p-6 text-center">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  {isRu ? 'CSV или Excel файл' : 'CSV or Excel file'}
                </p>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="max-w-xs mx-auto"
                />
              </div>
            </TabsContent>

            <TabsContent value="paste" className="mt-4 space-y-3">
              <Textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder={isRu 
                  ? 'Вставьте CSV данные (с заголовками)...'
                  : 'Paste CSV data (with headers)...'
                }
                className="min-h-[150px] font-mono text-sm"
              />
              <Button 
                onClick={handlePaste} 
                disabled={!pasteContent.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardPaste className="h-4 w-4 mr-2" />
                )}
                {isRu ? 'Обработать' : 'Process'}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Template Download */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-none">
            <span className="text-sm text-muted-foreground">
              {isRu ? 'Скачать шаблон' : 'Download template'}
            </span>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>

          {/* Results */}
          {rows.length > 0 && (
            <div className="space-y-3">
              {/* Stats */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-none">
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {rows.length}
                </Badge>
                <Badge variant="secondary" className="gap-1 text-success">
                  <CheckCircle className="h-3 w-3" />
                  {validCount}
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="secondary" className="gap-1 text-destructive">
                    <XCircle className="h-3 w-3" />
                    {invalidCount}
                  </Badge>
                )}
                {importedCount > 0 && (
                  <Badge variant="secondary" className="gap-1 text-primary">
                    <CheckCircle className="h-3 w-3" />
                    {importedCount} imported
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={clearRows}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Column Mapping */}
              <div className="p-3 border rounded-none space-y-2">
                <h4 className="text-sm font-medium">
                  {isRu ? 'Сопоставление колонок' : 'Column Mapping'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {columns.slice(0, 4).map(col => (
                    <div key={col.key} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 truncate">
                        {col.label}
                        {col.required && <span className="text-destructive">*</span>}
                      </span>
                      <Select
                        value={columnMapping[col.key] || ''}
                        onValueChange={(v) => setColumnMapping(prev => ({
                          ...prev,
                          [col.key]: v
                        }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(rows[0]?.data || {}).map(header => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Table */}
              <ScrollArea className="h-[200px] border rounded-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead className="w-10"></TableHead>
                      {columns.slice(0, 3).map(col => (
                        <TableHead key={col.key} className="text-xs">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, i) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          {row.status === 'valid' && (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                          {row.status === 'invalid' && (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          {row.status === 'imported' && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </TableCell>
                        {columns.slice(0, 3).map(col => (
                          <TableCell key={col.key} className="text-xs">
                            {row.data[columnMapping[col.key] || col.key] || '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {rows.length > 10 && (
                <p className="text-xs text-center text-muted-foreground">
                  {isRu 
                    ? `Показано 10 из ${rows.length}` 
                    : `Showing 10 of ${rows.length}`
                  }
                </p>
              )}
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-xs text-center text-muted-foreground">
                {isRu ? 'Импорт...' : 'Importing...'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t shrink-0">
          <Button
            className="w-full"
            onClick={handleImport}
            disabled={validCount === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isRu ? 'Импорт...' : 'Importing...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {isRu 
                  ? `Импортировать ${validCount} записей` 
                  : `Import ${validCount} rows`
                }
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
