import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaxonomy } from '@/hooks/useTaxonomy';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MoreHorizontal, 
  Download, 
  Upload, 
  Wand2, 
  ToggleLeft,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  typeKey: string;
}

export default function TaxonomyBulkActions({ typeKey }: Props) {
  const { language } = useLanguage();
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;
  
  const { options, create, bulkUpdate } = useTaxonomy(typeKey, { includeInactive: true });
  
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [aiImportDialogOpen, setAiImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Export as JSON
  const handleExport = () => {
    const exportData = options.map(opt => ({
      key: opt.value,
      labelEn: opt.labelEn,
      labelRu: opt.labelRu,
      icon: opt.icon,
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${typeKey}-taxonomy.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(t('Exported successfully', 'Экспортировано'));
  };

  // Import from JSON
  const handleImport = async () => {
    try {
      setIsImporting(true);
      const data = JSON.parse(importText);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid format');
      }

      let created = 0;
      for (const item of data) {
        if (!item.key || !item.labelEn) continue;
        
        // Check if exists
        const exists = options.find(o => o.value === item.key);
        if (exists) continue;
        
        await create({
          value_key: item.key,
          value_en: item.labelEn,
          value_ru: item.labelRu || null,
          icon: item.icon || null,
          color: null,
          parent_id: null,
          sort_order: options.length + created + 1,
          is_active: true,
          metadata: {},
        });
        created++;
      }

      toast.success(t(`Imported ${created} values`, `Импортировано ${created} значений`));
      setImportDialogOpen(false);
      setImportText('');
    } catch (error) {
      toast.error(t('Invalid JSON format', 'Неверный формат JSON'));
    } finally {
      setIsImporting(false);
    }
  };

  // Deactivate all
  const handleDeactivateAll = async () => {
    if (!confirm(t('Deactivate all values?', 'Деактивировать все значения?'))) return;
    
    try {
      await bulkUpdate(options.map(o => ({ id: o.id, is_active: false })));
      toast.success(t('All values deactivated', 'Все значения деактивированы'));
    } catch (error) {
      toast.error(t('Failed to deactivate', 'Не удалось деактивировать'));
    }
  };

  // Activate all
  const handleActivateAll = async () => {
    try {
      await bulkUpdate(options.map(o => ({ id: o.id, is_active: true })));
      toast.success(t('All values activated', 'Все значения активированы'));
    } catch (error) {
      toast.error(t('Failed to activate', 'Не удалось активировать'));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            {t('Actions', 'Действия')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('Export JSON', 'Экспорт JSON')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            {t('Import JSON', 'Импорт JSON')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAiImportDialogOpen(true)}>
            <Wand2 className="h-4 w-4 mr-2" />
            {t('AI Import', 'AI Импорт')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleActivateAll}>
            <CheckCircle className="h-4 w-4 mr-2 text-success" />
            {t('Activate All', 'Активировать все')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeactivateAll} className="text-accent-amber">
            <ToggleLeft className="h-4 w-4 mr-2" />
            {t('Deactivate All', 'Деактивировать все')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Import from JSON', 'Импорт из JSON')}</DialogTitle>
            <DialogDescription>
              {t(
                'Paste JSON array with objects containing: key, labelEn, labelRu, icon',
                'Вставьте JSON массив с объектами: key, labelEn, labelRu, icon'
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`[
  { "key": "villa", "labelEn": "Villa", "labelRu": "Вилла", "icon": "🏡" },
  { "key": "condo", "labelEn": "Condo", "labelRu": "Кондо", "icon": "🏢" }
]`}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              {t('Cancel', 'Отмена')}
            </Button>
            <Button onClick={handleImport} disabled={isImporting || !importText.trim()}>
              {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('Import', 'Импортировать')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Import Dialog */}
      <Dialog open={aiImportDialogOpen} onOpenChange={setAiImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('AI Import', 'AI Импорт')}</DialogTitle>
            <DialogDescription>
              {t(
                'Describe the values you want to add in plain text, AI will structure them',
                'Опишите значения, которые хотите добавить, AI структурирует их'
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder={t(
                'Example: Add property types for Phuket rentals - villas with private pools, condos in complexes, traditional Thai houses, modern apartments...',
                'Пример: Добавить типы недвижимости для аренды на Пхукете - виллы с бассейнами, кондо в комплексах, традиционные тайские дома...'
              )}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              {t('AI will generate keys, labels in EN/RU, and suggest icons', 'AI сгенерирует ключи, названия на EN/RU и предложит иконки')}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiImportDialogOpen(false)}>
              {t('Cancel', 'Отмена')}
            </Button>
            <Button disabled>
              <Wand2 className="h-4 w-4 mr-2" />
              {t('Generate', 'Сгенерировать')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
