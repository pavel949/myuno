import React, { useCallback, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react';
import { ParsedData } from '@/hooks/useDataImport';

interface FileImporterProps {
  onFileSelect: (file: File) => Promise<ParsedData | null>;
  parsedData: ParsedData | null;
  isLoading: boolean;
  onClear: () => void;
}

export function FileImporter({ onFileSelect, parsedData, isLoading, onClear }: FileImporterProps) {
  const { language } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        await onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onFileSelect(files[0]);
    }
    e.target.value = '';
  }, [onFileSelect]);

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  if (parsedData) {
    return (
      <Card className="border-2 border-dashed border-success/50 bg-success/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-medium">{parsedData.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' 
                    ? `${parsedData.rows.length} строк • ${parsedData.headers.length} колонок`
                    : `${parsedData.rows.length} rows • ${parsedData.headers.length} columns`
                  }
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Preview first 3 columns */}
          <div className="mt-4 overflow-x-auto">
            <div className="text-xs text-muted-foreground mb-2">
              {language === 'ru' ? 'Превью колонок:' : 'Column preview:'}
            </div>
            <div className="flex flex-wrap gap-2">
              {parsedData.headers.map((header, i) => (
                <span 
                  key={i} 
                  className="px-2 py-1 bg-muted rounded text-xs font-mono"
                >
                  {header}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-2 border-dashed transition-colors ${
        isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {isLoading ? (
            <>
              <div className="p-3 bg-muted rounded-full animate-pulse">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              </div>
              <Progress value={50} className="w-48" />
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Обработка файла...' : 'Processing file...'}
              </p>
            </>
          ) : (
            <>
              <div className="p-3 bg-muted rounded-full">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {language === 'ru' 
                    ? 'Перетащите файл сюда' 
                    : 'Drag and drop file here'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' 
                    ? 'или нажмите для выбора' 
                    : 'or click to browse'
                  }
                </p>
              </div>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span className="cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {language === 'ru' ? 'Выбрать файл' : 'Select File'}
                  </span>
                </Button>
              </label>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 bg-muted rounded">.xlsx</span>
                <span className="px-2 py-0.5 bg-muted rounded">.xls</span>
                <span className="px-2 py-0.5 bg-muted rounded">.csv</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
