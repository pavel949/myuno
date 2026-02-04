import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { IntakeItem } from '@/hooks/useIntakeAgent';
import { useIntakeConfigs } from '@/hooks/useIntakeConfigs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IntakeVerticalBadge } from './IntakeVerticalBadge';
import { IntakeConfidenceBar } from './IntakeConfidenceBar';
import { Save, Loader2 } from 'lucide-react';

interface IntakeItemEditorProps {
  item: IntakeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (itemId: string, updates: Partial<IntakeItem>) => void;
}

export function IntakeItemEditor({ item, open, onOpenChange, onSave }: IntakeItemEditorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: intakeConfigs, isLoading: configsLoading } = useIntakeConfigs();
  
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const [editedTitle, setEditedTitle] = useState({ en: '', ru: '' });
  const [editedDescription, setEditedDescription] = useState({ en: '', ru: '' });

  // Find vertical from DB-driven configs
  const vertical = useMemo(() => 
    item ? intakeConfigs?.find(v => v.id === item.detectedVertical) : undefined,
    [item, intakeConfigs]
  );

  const allFields = useMemo(() => 
    vertical ? [...vertical.requiredFields, ...vertical.optionalFields] : [],
    [vertical]
  );

  // Initialize when item changes
  React.useEffect(() => {
    if (item) {
      const fields: Record<string, any> = {};
      for (const [key, field] of Object.entries(item.extractedFields)) {
        fields[key] = field.value;
      }
      setEditedFields(fields);
      setEditedTitle(item.suggestedTitle || { en: '', ru: '' });
      setEditedDescription(item.suggestedDescription || { en: '', ru: '' });
    }
  }, [item]);

  if (!item) return null;

  if (configsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleFieldChange = (key: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Transform back to ExtractedField format
    const extractedFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(editedFields)) {
      extractedFields[key] = {
        value,
        confidence: 1, // User edited = 100% confidence
        source: 'text' as const
      };
    }

    // Recalculate missing fields
    const requiredFields = vertical?.requiredFields || [];
    const missingRequiredFields = requiredFields.filter(f => {
      const val = editedFields[f];
      return val === undefined || val === null || val === '';
    });

    onSave(item.id, {
      extractedFields,
      suggestedTitle: editedTitle,
      suggestedDescription: editedDescription,
      missingRequiredFields,
      overallConfidence: missingRequiredFields.length === 0 ? 0.95 : 0.6
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRu ? 'Редактировать' : 'Edit Item'}
            <IntakeVerticalBadge verticalId={item.detectedVertical} size="sm" />
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Title fields */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">
                {isRu ? 'Название' : 'Title'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>English</Label>
                  <Input
                    value={editedTitle.en}
                    onChange={(e) => setEditedTitle(prev => ({ ...prev, en: e.target.value }))}
                    placeholder="Title in English"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Русский</Label>
                  <Input
                    value={editedTitle.ru}
                    onChange={(e) => setEditedTitle(prev => ({ ...prev, ru: e.target.value }))}
                    placeholder="Название на русском"
                  />
                </div>
              </div>
            </div>

            {/* Description fields */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">
                {isRu ? 'Описание' : 'Description'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>English</Label>
                  <Textarea
                    value={editedDescription.en}
                    onChange={(e) => setEditedDescription(prev => ({ ...prev, en: e.target.value }))}
                    placeholder="Description in English"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Русский</Label>
                  <Textarea
                    value={editedDescription.ru}
                    onChange={(e) => setEditedDescription(prev => ({ ...prev, ru: e.target.value }))}
                    placeholder="Описание на русском"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Other fields */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">
                {isRu ? 'Поля' : 'Fields'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {allFields
                  .filter(key => !['name_en', 'name_ru', 'description_en', 'description_ru'].includes(key))
                  .map(key => {
                    const fieldConfig = vertical?.fieldLabels[key];
                    const label = fieldConfig 
                      ? (isRu ? fieldConfig.ru : fieldConfig.en)
                      : key;
                    const fieldType = fieldConfig?.type || 'string';
                    const isRequired = vertical?.requiredFields.includes(key);
                    
                    return (
                      <div key={key} className="space-y-2">
                        <Label className="flex items-center gap-1">
                          {label}
                          {isRequired && <span className="text-destructive">*</span>}
                        </Label>
                        {fieldType === 'number' ? (
                          <Input
                            type="number"
                            value={editedFields[key] ?? ''}
                            onChange={(e) => handleFieldChange(key, e.target.value ? Number(e.target.value) : null)}
                            placeholder={label}
                          />
                        ) : (
                          <Input
                            value={editedFields[key] ?? ''}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            placeholder={label}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Source info */}
            {item.sourceUrl && (
              <div className="text-xs text-muted-foreground">
                {isRu ? 'Источник: ' : 'Source: '}
                <a 
                  href={item.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {item.sourceUrl}
                </a>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
