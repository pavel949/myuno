import React, { useRef } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileJson } from 'lucide-react';
import { Translation } from '@/hooks/useTranslationsAdmin';
import { toast } from 'sonner';

interface ImportExportPanelProps {
  translations: Translation[];
  onImport: (translations: Omit<Translation, 'id' | 'updated_at' | 'updated_by' | 'is_custom'>[]) => Promise<boolean>;
}

export function ImportExportPanel({ translations, onImport }: ImportExportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = translations.map(t => ({
      key: t.key,
      category: t.category,
      value_ru: t.value_ru,
      value_en: t.value_en,
      value_th: t.value_th,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Экспортировано ${translations.length} переводов`);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error('Invalid format: expected array');
      }

      // Validate and transform
      const validated = data.map((item: any, index: number) => {
        if (!item.key || !item.value_ru || !item.value_en) {
          throw new Error(`Item ${index + 1}: missing required fields (key, value_ru, value_en)`);
        }
        return {
          key: String(item.key),
          category: item.category ? String(item.category) : null,
          value_ru: String(item.value_ru),
          value_en: String(item.value_en),
          value_th: item.value_th ? String(item.value_th) : null,
        };
      });

      await onImport(validated);
    } catch (err) {
      logger.error('Import error:', err);
      toast.error(`Ошибка импорта: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />
        Импорт
      </Button>
      
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="h-4 w-4 mr-2" />
        Экспорт
      </Button>
    </div>
  );
}
