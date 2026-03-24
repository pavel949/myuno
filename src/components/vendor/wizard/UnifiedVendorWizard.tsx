/**
 * UnifiedVendorWizard - Taxonomy-driven wizard for all verticals
 * Single component that handles Products, Services, and Vertical-specific entries
 */
import React, { useState, useMemo, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  FileText, 
  Settings, 
  Image, 
  Eye,
  Sparkles,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Languages
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { useLookupOptions } from '@/hooks/useLookupValues';
import { useFormDraft } from '@/hooks/useFormDraft';
import { CardPreview, CardPreviewSection } from '../CardPreview';
import { VendorFormSection } from '../VendorFormSection';
import { CompactField } from '../FormFieldWithHelp';
import { DraftIndicator } from '../DraftIndicator';
import { AITranslateButton } from '@/components/ui/AITranslateButton';
import { TranslateAllButton } from '@/components/wizard/TranslateAllButton';

export type EntryType = 'product' | 'service' | 'listing';

export interface VerticalConfig {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  icon: React.ReactNode;
  entryType: EntryType;
  /** Taxonomy types to load for this vertical */
  taxonomies?: string[];
  /** Custom fields for this vertical */
  customFields?: CustomFieldConfig[];
  /** Table name for CRUD operations */
  tableName: string;
}

export interface CustomFieldConfig {
  key: string;
  labelEn: string;
  labelRu: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'switch' | 'tags';
  placeholder?: string;
  placeholderRu?: string;
  required?: boolean;
  /** For select type - use taxonomy lookup */
  taxonomyType?: string;
  /** For select type - static options */
  options?: { value: string; labelEn: string; labelRu: string }[];
  step?: number;
  min?: number;
  max?: number;
}

export interface WizardFormData {
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  cover_image: string;
  images: string[];
  price: string;
  original_price: string;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  [key: string]: any;
}

const defaultFormData: WizardFormData = {
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  cover_image: '',
  images: [],
  price: '',
  original_price: '',
  currency: 'THB',
  is_active: true,
  is_featured: false,
};

interface UnifiedVendorWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vertical: VerticalConfig;
  initialData?: Partial<WizardFormData>;
  onSubmit: (data: WizardFormData) => Promise<{ error?: Error | null }>;
  isSubmitting?: boolean;
  editingId?: string | null;
}

export function UnifiedVendorWizard({
  open,
  onOpenChange,
  vertical,
  initialData,
  onSubmit,
  isSubmitting = false,
  editingId,
}: UnifiedVendorWizardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const draftKey = `wizard_${vertical.slug}_${editingId || 'new'}`;
  
  const {
    formData,
    setFormData,
    updateField,
    hasDraft,
    lastSaved,
    clearDraft,
    resetForm,
  } = useFormDraft<WizardFormData>({
    key: draftKey,
    initialData: initialData ? { ...defaultFormData, ...initialData } : defaultFormData,
  });

  const steps = useMemo(() => [
    { 
      id: 'basic', 
      title: 'Basic Info', 
      titleRu: 'Основное',
      icon: <FileText className="h-4 w-4" />,
    },
    { 
      id: 'details', 
      title: 'Details', 
      titleRu: 'Детали',
      icon: <Settings className="h-4 w-4" />,
    },
    { 
      id: 'photos', 
      title: 'Photos', 
      titleRu: 'Фото',
      icon: <Image className="h-4 w-4" />,
    },
    { 
      id: 'review', 
      title: 'Review', 
      titleRu: 'Проверка',
      icon: <Eye className="h-4 w-4" />,
    },
  ], []);

  const validateStep = useCallback((stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (stepIndex === 0) {
      if (!formData.name_en.trim()) {
        newErrors.name_en = isRu ? 'Обязательное поле' : 'Required';
      }
    }
    
    if (stepIndex === 1) {
      if (!formData.price) {
        newErrors.price = isRu ? 'Укажите цену' : 'Required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isRu]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const result = await onSubmit(formData);
    if (!result.error) {
      clearDraft();
      onOpenChange(false);
      setCurrentStep(0);
    }
  };

  const handleAiQuickFill = async () => {
    if (!aiInput.trim()) {
      toast.error(isRu ? 'Введите описание' : 'Enter description');
      return;
    }
    
    setIsAiProcessing(true);
    try {
      // Call AI intake endpoint
      const response = await fetch('/api/ai-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiInput,
          vertical: vertical.slug,
          targetFields: ['name_en', 'name_ru', 'description_en', 'description_ru', 'price', 'currency'],
        }),
      });
      
      if (response.ok) {
        const extracted = await response.json();
        setFormData(prev => ({
          ...prev,
          ...extracted.data,
        }));
        toast.success(isRu ? 'Данные заполнены' : 'Data filled');
        setAiInput('');
      } else {
        // Fallback: basic parsing
        const lines = aiInput.split('\n');
        const firstLine = lines[0] || '';
        setFormData(prev => ({
          ...prev,
          name_en: firstLine.slice(0, 100),
          description_en: aiInput,
        }));
        toast.info(isRu ? 'Базовое заполнение' : 'Basic fill applied');
      }
    } catch (error) {
      logger.error('AI fill error:', error);
      toast.error(isRu ? 'Ошибка AI' : 'AI error');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(0);
    setErrors({});
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {vertical.icon}
              {editingId 
                ? (isRu ? 'Редактировать' : 'Edit')
                : (isRu ? `Новый: ${vertical.nameRu}` : `New: ${vertical.nameEn}`)
              }
            </SheetTitle>
            {hasDraft && (
              <DraftIndicator 
                hasDraft={hasDraft} 
                lastSaved={lastSaved} 
                onClear={clearDraft}
                onRestore={() => {}}
              />
            )}
          </div>
          
          {/* Step Progress */}
          <div className="flex items-center gap-1 mt-3">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => index < currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all',
                    index === currentStep && 'bg-primary text-primary-foreground',
                    index < currentStep && 'bg-primary/20 text-primary cursor-pointer',
                    index > currentStep && 'bg-muted text-muted-foreground'
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step.icon
                  )}
                  <span className="hidden sm:inline">
                    {isRu ? step.titleRu : step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 rounded',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* AI Quick Fill - Step 0 only */}
            {currentStep === 0 && (
              <div className="p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {isRu ? 'AI Быстрое заполнение' : 'AI Quick Fill'}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">Beta</Badge>
                </div>
                <Textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder={isRu 
                    ? 'Вставьте текст из WhatsApp, сайта или напишите описание...'
                    : 'Paste text from WhatsApp, website or write description...'
                  }
                  className="min-h-[80px] text-sm"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full mt-2"
                  onClick={handleAiQuickFill}
                  disabled={isAiProcessing || !aiInput.trim()}
                >
                  {isAiProcessing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      {isRu ? 'Обработка...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      {isRu ? 'Заполнить автоматически' : 'Auto-fill'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step Content */}
            {currentStep === 0 && (
              <BasicInfoStep 
                formData={formData} 
                updateField={updateField}
                errors={errors}
                isRu={isRu}
              />
            )}
            
            {currentStep === 1 && (
              <DetailsStep
                formData={formData}
                updateField={updateField}
                errors={errors}
                isRu={isRu}
                vertical={vertical}
              />
            )}
            
            {currentStep === 2 && (
              <PhotosStep
                formData={formData}
                updateField={updateField}
                setFormData={setFormData}
                isRu={isRu}
              />
            )}
            
            {currentStep === 3 && (
              <ReviewStep
                formData={formData}
                isRu={isRu}
                vertical={vertical}
              />
            )}
          </div>
        </ScrollArea>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-t shrink-0">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {isRu ? 'Назад' : 'Back'}
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>
          
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                {isRu ? 'Сохранение...' : 'Saving...'}
              </>
            ) : currentStep === steps.length - 1 ? (
              isRu ? 'Сохранить' : 'Save'
            ) : (
              <>
                {isRu ? 'Далее' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Step Components
interface StepProps {
  formData: WizardFormData;
  updateField: <K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => void;
  errors?: Record<string, string>;
  isRu: boolean;
}

function BasicInfoStep({ formData, updateField, errors, isRu }: StepProps) {
  return (
    <div className="space-y-4">
      {/* Translate All Button */}
      <div className="flex justify-end">
        <TranslateAllButton
          formData={formData}
          onUpdate={(updates) => {
            Object.entries(updates).forEach(([key, value]) => {
              updateField(key as keyof WizardFormData, value);
            });
          }}
        />
      </div>
      
      <VendorFormSection title={isRu ? 'Название' : 'Name'}>
        <Tabs defaultValue="en" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="ru">Русский</TabsTrigger>
          </TabsList>
          <TabsContent value="en">
            <CompactField label="Name" error={errors?.name_en}>
              <div className="flex gap-2">
                <Input
                  value={formData.name_en}
                  onChange={(e) => updateField('name_en', e.target.value)}
                  placeholder="Enter name..."
                  className="flex-1"
                />
                {formData.name_ru && (
                  <AITranslateButton
                    sourceText={formData.name_ru}
                    sourceLang="ru"
                    targetLang="en"
                    onTranslate={(text) => updateField('name_en', text)}
                  />
                )}
              </div>
            </CompactField>
            <CompactField label="Description" className="mt-3">
              <div className="relative">
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => updateField('description_en', e.target.value)}
                  placeholder="Description..."
                  className="min-h-[100px]"
                />
                {formData.description_ru && (
                  <div className="absolute top-2 right-2">
                    <AITranslateButton
                      sourceText={formData.description_ru}
                      sourceLang="ru"
                      targetLang="en"
                      onTranslate={(text) => updateField('description_en', text)}
                    />
                  </div>
                )}
              </div>
            </CompactField>
          </TabsContent>
          <TabsContent value="ru">
            <CompactField label="Название">
              <div className="flex gap-2">
                <Input
                  value={formData.name_ru}
                  onChange={(e) => updateField('name_ru', e.target.value)}
                  placeholder="Введите название..."
                  className="flex-1"
                />
                {formData.name_en && (
                  <AITranslateButton
                    sourceText={formData.name_en}
                    sourceLang="en"
                    targetLang="ru"
                    onTranslate={(text) => updateField('name_ru', text)}
                  />
                )}
              </div>
            </CompactField>
            <CompactField label="Описание" className="mt-3">
              <div className="relative">
                <Textarea
                  value={formData.description_ru}
                  onChange={(e) => updateField('description_ru', e.target.value)}
                  placeholder="Описание..."
                  className="min-h-[100px]"
                />
                {formData.description_en && (
                  <div className="absolute top-2 right-2">
                    <AITranslateButton
                      sourceText={formData.description_en}
                      sourceLang="en"
                      targetLang="ru"
                      onTranslate={(text) => updateField('description_ru', text)}
                    />
                  </div>
                )}
              </div>
            </CompactField>
          </TabsContent>
        </Tabs>
      </VendorFormSection>
    </div>
  );
}

interface DetailsStepProps extends StepProps {
  vertical: VerticalConfig;
}

function DetailsStep({ formData, updateField, errors, isRu, vertical }: DetailsStepProps) {
  return (
    <div className="space-y-4">
      <VendorFormSection title={isRu ? 'Цена' : 'Pricing'}>
        <div className="grid grid-cols-2 gap-3">
          <CompactField label={isRu ? 'Цена' : 'Price'} error={errors?.price}>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => updateField('price', e.target.value)}
              placeholder="0"
            />
          </CompactField>
          <CompactField label={isRu ? 'Валюта' : 'Currency'}>
            <Select 
              value={formData.currency} 
              onValueChange={(v) => updateField('currency', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">฿ THB</SelectItem>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="RUB">₽ RUB</SelectItem>
              </SelectContent>
            </Select>
          </CompactField>
        </div>
        <CompactField label={isRu ? 'Старая цена' : 'Original Price'} className="mt-3">
          <Input
            type="number"
            value={formData.original_price}
            onChange={(e) => updateField('original_price', e.target.value)}
            placeholder={isRu ? 'Для скидки' : 'For discount'}
          />
        </CompactField>
      </VendorFormSection>

      <VendorFormSection title={isRu ? 'Настройки' : 'Settings'}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'Активен' : 'Active'}</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(v) => updateField('is_active', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'Рекомендуемый' : 'Featured'}</Label>
            <Switch
              checked={formData.is_featured}
              onCheckedChange={(v) => updateField('is_featured', v)}
            />
          </div>
        </div>
      </VendorFormSection>

      {/* Vertical-specific custom fields would go here */}
      {vertical.customFields && vertical.customFields.length > 0 && (
        <VendorFormSection title={isRu ? 'Дополнительно' : 'Additional'}>
          {vertical.customFields.map((field) => (
            <CustomFieldRenderer
              key={field.key}
              field={field}
              value={formData[field.key]}
              onChange={(v) => updateField(field.key as keyof WizardFormData, v)}
              isRu={isRu}
            />
          ))}
        </VendorFormSection>
      )}
    </div>
  );
}

interface PhotosStepProps extends StepProps {
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
}

function PhotosStep({ formData, updateField, setFormData, isRu }: PhotosStepProps) {
  return (
    <div className="space-y-4">
      <VendorFormSection title={isRu ? 'Обложка' : 'Cover Image'}>
        <ImageUpload
          value={formData.cover_image}
          onChange={(url) => updateField('cover_image', url)}
          folder="vendor-images"
        />
      </VendorFormSection>

      <VendorFormSection title={isRu ? 'Галерея' : 'Gallery'}>
        <MultiImageUpload
          value={formData.images}
          onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
          folder="vendor-images"
          maxImages={10}
        />
      </VendorFormSection>
    </div>
  );
}

interface ReviewStepProps {
  formData: WizardFormData;
  isRu: boolean;
  vertical: VerticalConfig;
}

function ReviewStep({ formData, isRu, vertical }: ReviewStepProps) {
  return (
    <div className="space-y-4">
      <CardPreviewSection>
        <CardPreview
          type="product"
          title={formData.name_en}
          titleRu={formData.name_ru}
          description={formData.description_en}
          descriptionRu={formData.description_ru}
          image={formData.cover_image}
          price={formData.price ? parseFloat(formData.price) : undefined}
          isNew={true}
          inStock={formData.is_active}
        />
      </CardPreviewSection>

      <div className="space-y-3">
        <div className="p-3 rounded-lg border">
          <h4 className="text-sm font-medium mb-2">{isRu ? 'Статус' : 'Status'}</h4>
          <div className="flex gap-2">
            {formData.is_active && (
              <Badge variant="secondary" className="text-success">
                {isRu ? 'Активен' : 'Active'}
              </Badge>
            )}
            {formData.is_featured && (
              <Badge variant="secondary" className="text-warning">
                {isRu ? 'Рекомендуемый' : 'Featured'}
              </Badge>
            )}
          </div>
        </div>

        {formData.images.length > 0 && (
          <div className="p-3 rounded-lg border">
            <h4 className="text-sm font-medium mb-2">{isRu ? 'Галерея' : 'Gallery'}</h4>
            <div className="flex gap-1 overflow-x-auto">
              {formData.images.slice(0, 4).map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  alt="" 
                  className="w-12 h-12 rounded object-cover"
                />
              ))}
              {formData.images.length > 4 && (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs">
                  +{formData.images.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        {isRu 
          ? 'После сохранения запись будет отправлена на модерацию.'
          : 'After saving, the entry will be sent for moderation.'
        }
      </div>
    </div>
  );
}

// Custom Field Renderer
interface CustomFieldRendererProps {
  field: CustomFieldConfig;
  value: any;
  onChange: (value: any) => void;
  isRu: boolean;
}

function CustomFieldRenderer({ field, value, onChange, isRu }: CustomFieldRendererProps) {
  const { options: taxonomyOptions } = useLookupOptions(field.taxonomyType as any);
  
  const label = isRu ? field.labelRu : field.labelEn;
  const placeholder = isRu ? field.placeholderRu : field.placeholder;

  switch (field.type) {
    case 'text':
      return (
        <CompactField label={label} className="mt-3">
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </CompactField>
      );
    
    case 'number':
      return (
        <CompactField label={label} className="mt-3">
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        </CompactField>
      );
    
    case 'textarea':
      return (
        <CompactField label={label} className="mt-3">
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </CompactField>
      );
    
    case 'switch':
      return (
        <div className="flex items-center justify-between mt-3">
          <Label>{label}</Label>
          <Switch checked={!!value} onCheckedChange={onChange} />
        </div>
      );
    
    case 'select':
      const selectOptions = field.taxonomyType 
        ? taxonomyOptions.map(o => ({ 
            value: o.value, 
            labelEn: o.label_en, 
            labelRu: o.label_ru 
          }))
        : field.options || [];
      
      return (
        <CompactField label={label} className="mt-3">
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {isRu ? opt.labelRu : opt.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CompactField>
      );
    
    default:
      return null;
  }
}
