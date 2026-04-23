import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ParsedData, FieldMapping } from '@/hooks/useDataImport';
import { importTargets } from '@/lib/importTemplates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

interface ImportPreviewProps {
  parsedData: ParsedData;
  mappings: FieldMapping[];
  targetId: string;
  transformedData: Record<string, any>[];
  onImport: (selectedIndices?: number[]) => Promise<void>;
  isLoading: boolean;
}

export function ImportPreview({ 
  parsedData, 
  mappings, 
  targetId,
  transformedData,
  onImport, 
  isLoading 
}: ImportPreviewProps) {
  const { language } = useLanguage();
  const [selectedRows, setSelectedRows] = useState<Set<number>>(
    new Set(transformedData.map((_, i) => i))
  );
  const [showRawData, setShowRawData] = useState(false);

  const target = importTargets.find(t => t.id === targetId);
  const activeMappings = mappings.filter(m => m.targetField);

  // Validate each row
  const validationResults = useMemo(() => {
    return transformedData.map((row, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Check required fields
      target?.requiredFields.forEach(field => {
        if (!row[field] || row[field] === '') {
          errors.push(`Missing: ${field}`);
        }
      });
      
      // Check data types
      if (row.price && isNaN(parseFloat(row.price))) {
        warnings.push('Invalid price format');
      }
      if (row.rating && (parseFloat(row.rating) < 0 || parseFloat(row.rating) > 5)) {
        warnings.push('Rating out of range (0-5)');
      }
      
      return { index, errors, warnings, isValid: errors.length === 0 };
    });
  }, [transformedData, target]);

  const validCount = validationResults.filter(v => v.isValid).length;
  const invalidCount = validationResults.filter(v => !v.isValid).length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(transformedData.map((_, i) => i)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);
  };

  const handleImport = async () => {
    const indices = Array.from(selectedRows);
    await onImport(indices.length === transformedData.length ? undefined : indices);
  };

  const displayData = showRawData ? parsedData.rows : transformedData;
  const displayHeaders = showRawData 
    ? parsedData.headers 
    : activeMappings.map(m => m.targetField!);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">
            {language === 'ru' ? 'Предпросмотр импорта' : 'Import Preview'}
          </CardTitle>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              {validCount} {language === 'ru' ? 'валидных' : 'valid'}
            </Badge>
            {invalidCount > 0 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {invalidCount} {language === 'ru' ? 'ошибок' : 'errors'}
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="ml-1 text-xs">
                {showRawData 
                  ? (language === 'ru' ? 'Скрыть сырые' : 'Hide raw')
                  : (language === 'ru' ? 'Показать сырые' : 'Show raw')
                }
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px] rounded-none border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 sticky left-0 bg-background">
                  <Checkbox
                    checked={selectedRows.size === transformedData.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-20">
                  {language === 'ru' ? 'Статус' : 'Status'}
                </TableHead>
                {displayHeaders.map((header, i) => (
                  <TableHead key={i} className="min-w-[120px]">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.slice(0, 100).map((row, rowIndex) => {
                const validation = validationResults[rowIndex];
                const isSelected = selectedRows.has(rowIndex);
                
                return (
                  <TableRow 
                    key={rowIndex}
                    className={!validation?.isValid ? 'bg-destructive/5' : ''}
                  >
                    <TableCell className="sticky left-0 bg-background">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(rowIndex, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {rowIndex + 1}
                    </TableCell>
                    <TableCell>
                      {validation?.isValid ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-xs text-destructive">
                            {validation?.errors.length}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    {displayHeaders.map((header, colIndex) => {
                      const value = showRawData 
                        ? row[header] 
                        : row[header];
                      
                      return (
                        <TableCell key={colIndex} className="max-w-[200px]">
                          <span className="truncate block text-sm">
                            {value !== undefined && value !== '' 
                              ? String(value).slice(0, 50) 
                              : <span className="text-muted-foreground">—</span>
                            }
                            {String(value || '').length > 50 && '...'}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
        
        {transformedData.length > 100 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {language === 'ru' 
              ? `Показаны первые 100 из ${transformedData.length} строк`
              : `Showing first 100 of ${transformedData.length} rows`
            }
          </p>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {language === 'ru' 
              ? `Выбрано: ${selectedRows.size} из ${transformedData.length}`
              : `Selected: ${selectedRows.size} of ${transformedData.length}`
            }
          </div>
          
          <Button
            onClick={handleImport}
            disabled={isLoading || selectedRows.size === 0 || validCount === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ru' ? 'Импорт...' : 'Importing...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {language === 'ru' 
                  ? `Импортировать ${selectedRows.size}`
                  : `Import ${selectedRows.size} records`
                }
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
