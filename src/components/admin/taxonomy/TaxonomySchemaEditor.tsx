import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  Settings2,
  Type,
  Hash,
  ToggleLeft,
  List,
  Image,
  DollarSign,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useTaxonomyDefinitions, TaxonomyDefinition } from '@/hooks/useTaxonomyDefinitions';

// Schema field types
type FieldType = 'text' | 'number' | 'switch' | 'select' | 'textarea';

interface SchemaFieldOption {
  value: string;
  labelEn: string;
  labelRu: string;
}

interface SchemaField {
  key: string;
  labelEn: string;
  labelRu: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  options?: SchemaFieldOption[];
}

interface MetadataSchema {
  fields: SchemaField[];
  pricingModels: string[];
  availabilityTypes: string[];
  minImages: number;
  maxImages: number;
  requiredLicenses?: string[];
}

const FIELD_TYPE_OPTIONS: { value: FieldType; labelEn: string; labelRu: string; icon: React.ReactNode }[] = [
  { value: 'text', labelEn: 'Text', labelRu: 'Текст', icon: <Type className="h-4 w-4" /> },
  { value: 'number', labelEn: 'Number', labelRu: 'Число', icon: <Hash className="h-4 w-4" /> },
  { value: 'switch', labelEn: 'Toggle', labelRu: 'Переключатель', icon: <ToggleLeft className="h-4 w-4" /> },
  { value: 'select', labelEn: 'Select', labelRu: 'Выбор', icon: <List className="h-4 w-4" /> },
  { value: 'textarea', labelEn: 'Text Area', labelRu: 'Многострочный текст', icon: <Type className="h-4 w-4" /> },
];

const PRICING_MODEL_OPTIONS = [
  { value: 'fixed', labelEn: 'Fixed Price', labelRu: 'Фиксированная цена' },
  { value: 'per_hour', labelEn: 'Per Hour', labelRu: 'За час' },
  { value: 'per_day', labelEn: 'Per Day', labelRu: 'За день' },
  { value: 'per_night', labelEn: 'Per Night', labelRu: 'За ночь' },
  { value: 'per_km', labelEn: 'Per Kilometer', labelRu: 'За километр' },
  { value: 'negotiable', labelEn: 'Negotiable', labelRu: 'Договорная' },
];

const AVAILABILITY_TYPE_OPTIONS = [
  { value: 'instant', labelEn: 'Instant Booking', labelRu: 'Мгновенное бронирование' },
  { value: 'request', labelEn: 'On Request', labelRu: 'По запросу' },
  { value: 'scheduled', labelEn: 'Scheduled', labelRu: 'По расписанию' },
];

interface TaxonomySchemaEditorProps {
  typeKey: string;
}

const DEFAULT_SCHEMA: MetadataSchema = {
  fields: [],
  pricingModels: ['fixed'],
  availabilityTypes: ['request'],
  minImages: 1,
  maxImages: 10,
};

export default function TaxonomySchemaEditor({ typeKey }: TaxonomySchemaEditorProps) {
  const { language } = useLanguage();
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;
  
  const { definitions, update, isUpdating } = useTaxonomyDefinitions();
  const definition = definitions.find(d => d.type_key === typeKey);
  
  const [schema, setSchema] = useState<MetadataSchema>(DEFAULT_SCHEMA);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [fieldForm, setFieldForm] = useState<SchemaField>({
    key: '',
    labelEn: '',
    labelRu: '',
    type: 'text',
    required: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load schema from definition
  useEffect(() => {
    if (definition?.metadata_schema) {
      try {
        const parsed = typeof definition.metadata_schema === 'string' 
          ? JSON.parse(definition.metadata_schema) 
          : definition.metadata_schema;
        setSchema({
          ...DEFAULT_SCHEMA,
          ...parsed,
        });
      } catch (e) {
        console.error('Failed to parse metadata_schema:', e);
        setSchema(DEFAULT_SCHEMA);
      }
    } else {
      setSchema(DEFAULT_SCHEMA);
    }
    setHasChanges(false);
  }, [definition?.id, typeKey]);

  const handleSave = async () => {
    if (!definition) return;
    
    try {
      await update({ id: definition.id, metadata_schema: schema as unknown });
      toast.success(t('Schema saved successfully', 'Схема сохранена'));
      setHasChanges(false);
    } catch (error) {
      toast.error(t('Failed to save schema', 'Ошибка сохранения схемы'));
    }
  };

  const openAddField = () => {
    setFieldForm({
      key: '',
      labelEn: '',
      labelRu: '',
      type: 'text',
      required: false,
    });
    setEditingFieldIndex(null);
    setIsFieldDialogOpen(true);
  };

  const openEditField = (index: number) => {
    setFieldForm({ ...schema.fields[index] });
    setEditingFieldIndex(index);
    setIsFieldDialogOpen(true);
  };

  const saveField = () => {
    const key = fieldForm.key.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key || !fieldForm.labelEn) {
      toast.error(t('Key and English label are required', 'Ключ и английское название обязательны'));
      return;
    }

    const newField = { ...fieldForm, key };
    const newFields = [...schema.fields];
    
    if (editingFieldIndex !== null) {
      newFields[editingFieldIndex] = newField;
    } else {
      // Check for duplicate key
      if (newFields.some(f => f.key === key)) {
        toast.error(t('Field key already exists', 'Поле с таким ключом уже существует'));
        return;
      }
      newFields.push(newField);
    }

    setSchema({ ...schema, fields: newFields });
    setHasChanges(true);
    setIsFieldDialogOpen(false);
  };

  const removeField = (index: number) => {
    const newFields = schema.fields.filter((_, i) => i !== index);
    setSchema({ ...schema, fields: newFields });
    setHasChanges(true);
  };

  const togglePricingModel = (value: string) => {
    const newModels = schema.pricingModels.includes(value)
      ? schema.pricingModels.filter(m => m !== value)
      : [...schema.pricingModels, value];
    setSchema({ ...schema, pricingModels: newModels });
    setHasChanges(true);
  };

  const toggleAvailabilityType = (value: string) => {
    const newTypes = schema.availabilityTypes.includes(value)
      ? schema.availabilityTypes.filter(t => t !== value)
      : [...schema.availabilityTypes, value];
    setSchema({ ...schema, availabilityTypes: newTypes });
    setHasChanges(true);
  };

  if (!definition) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('Definition not found', 'Определение не найдено')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Banner */}
      {hasChanges && (
        <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t('You have unsaved changes', 'Есть несохранённые изменения')}
            </span>
          </div>
          <Button size="sm" onClick={handleSave} disabled={isUpdating}>
            <Save className="h-4 w-4 mr-1" />
            {isUpdating ? t('Saving...', 'Сохранение...') : t('Save', 'Сохранить')}
          </Button>
        </div>
      )}

      <Accordion type="multiple" defaultValue={['fields', 'pricing', 'media']} className="space-y-4">
        {/* Custom Fields */}
        <AccordionItem value="fields" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <span className="font-medium">{t('Custom Fields', 'Поля формы')}</span>
              <Badge variant="secondary" className="ml-2">{schema.fields.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="space-y-3">
              {schema.fields.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('No custom fields yet', 'Пока нет кастомных полей')}</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {schema.fields.map((field, index) => (
                      <div 
                        key={field.key} 
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {language === 'ru' ? field.labelRu || field.labelEn : field.labelEn}
                            </span>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
                                {t('Required', 'Обяз.')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <code className="bg-muted px-1 rounded">{field.key}</code>
                            <span>•</span>
                            <span>{FIELD_TYPE_OPTIONS.find(o => o.value === field.type)?.labelEn}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openEditField(index)}
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <Button variant="outline" className="w-full" onClick={openAddField}>
                <Plus className="h-4 w-4 mr-2" />
                {t('Add Field', 'Добавить поле')}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Pricing Models */}
        <AccordionItem value="pricing" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="font-medium">{t('Pricing Models', 'Модели ценообразования')}</span>
              <Badge variant="secondary" className="ml-2">{schema.pricingModels.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PRICING_MODEL_OPTIONS.map((option) => {
                const isSelected = schema.pricingModels.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => togglePricingModel(option.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium text-sm">
                      {language === 'ru' ? option.labelRu : option.labelEn}
                    </p>
                    <code className="text-xs text-muted-foreground">{option.value}</code>
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability Types */}
        <AccordionItem value="availability" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-info" />
              <span className="font-medium">{t('Availability Types', 'Типы доступности')}</span>
              <Badge variant="secondary" className="ml-2">{schema.availabilityTypes.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AVAILABILITY_TYPE_OPTIONS.map((option) => {
                const isSelected = schema.availabilityTypes.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleAvailabilityType(option.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium text-sm">
                      {language === 'ru' ? option.labelRu : option.labelEn}
                    </p>
                    <code className="text-xs text-muted-foreground">{option.value}</code>
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Media Requirements */}
        <AccordionItem value="media" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-accent-purple" />
              <span className="font-medium">{t('Media Requirements', 'Требования к медиа')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Minimum Images', 'Минимум изображений')}</Label>
                <Input 
                  type="number" 
                  min={0} 
                  max={20}
                  value={schema.minImages}
                  onChange={(e) => {
                    setSchema({ ...schema, minImages: parseInt(e.target.value) || 0 });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('Maximum Images', 'Максимум изображений')}</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={50}
                  value={schema.maxImages}
                  onChange={(e) => {
                    setSchema({ ...schema, maxImages: parseInt(e.target.value) || 10 });
                    setHasChanges(true);
                  }}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFieldIndex !== null 
                ? t('Edit Field', 'Редактировать поле')
                : t('Add Field', 'Добавить поле')
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Key (snake_case)', 'Ключ (snake_case)')}</Label>
                <Input 
                  value={fieldForm.key}
                  onChange={(e) => setFieldForm({ ...fieldForm, key: e.target.value })}
                  placeholder="e.g. warranty_days"
                  disabled={editingFieldIndex !== null}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('Field Type', 'Тип поля')}</Label>
                <Select 
                  value={fieldForm.type} 
                  onValueChange={(v) => setFieldForm({ ...fieldForm, type: v as FieldType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          <span>{language === 'ru' ? opt.labelRu : opt.labelEn}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('Label (English)', 'Название (English)')}</Label>
              <Input 
                value={fieldForm.labelEn}
                onChange={(e) => setFieldForm({ ...fieldForm, labelEn: e.target.value })}
                placeholder="Warranty Days"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('Label (Russian)', 'Название (Русский)')}</Label>
              <Input 
                value={fieldForm.labelRu}
                onChange={(e) => setFieldForm({ ...fieldForm, labelRu: e.target.value })}
                placeholder="Дни гарантии"
              />
            </div>

            {fieldForm.type === 'number' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('Min Value', 'Мин. значение')}</Label>
                  <Input 
                    type="number"
                    value={fieldForm.min ?? ''}
                    onChange={(e) => setFieldForm({ ...fieldForm, min: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('Max Value', 'Макс. значение')}</Label>
                  <Input 
                    type="number"
                    value={fieldForm.max ?? ''}
                    onChange={(e) => setFieldForm({ ...fieldForm, max: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <Label>{t('Required field', 'Обязательное поле')}</Label>
              <Switch 
                checked={fieldForm.required ?? false}
                onCheckedChange={(checked) => setFieldForm({ ...fieldForm, required: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
              {t('Cancel', 'Отмена')}
            </Button>
            <Button onClick={saveField}>
              {editingFieldIndex !== null ? t('Update', 'Обновить') : t('Add', 'Добавить')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
