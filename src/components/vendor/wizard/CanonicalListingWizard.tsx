/**
 * CanonicalListingWizard - Production-grade 6-step listing wizard
 * 
 * Strict compliance with:
 * - Taxonomy-locked schemas (category selection is FINAL)
 * - P0-safe submission (debounce, idempotency, duplicate prevention)
 * - Draft auto-save with visual indicators
 * - Single scroll container (no nested scrolls)
 * - Preview-before-publish (REQUIRED step)
 */
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Layers, 
  FileText, 
  Settings, 
  Image as ImageIcon, 
  DollarSign,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  AlertCircle,
  Sparkles,
  Loader2,
  Cloud,
  Save,
  Wand2,
  AlertTriangle,
  X,
  Languages,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { useLookupOptions } from '@/hooks/useLookupValues';
import { CardPreview, CardPreviewSection } from '../CardPreview';
import { useCanonicalSubmit } from '@/hooks/useCanonicalSubmit';
import { useCanonicalDraft } from '@/hooks/useCanonicalDraft';
import { AITranslateButton } from '@/components/ui/AITranslateButton';
import { TranslateAllButton } from '@/components/wizard/TranslateAllButton';
import { CategorySuggestionDialog } from '@/components/category/CategorySuggestionDialog';

// ==================== TYPES ====================

export interface CategoryNode {
  id: string;
  name_en: string;
  name_ru: string;
  icon?: string;
  parent_id?: string | null;
  children?: CategoryNode[];
  schema?: CategorySchema;
}

export interface CategorySchema {
  /** Fields applicable to this category */
  fields: SchemaField[];
  /** Pricing model options */
  pricingModels: ('fixed' | 'per_hour' | 'per_day' | 'per_person')[];
  /** Availability options */
  availabilityTypes: ('instant' | 'request' | 'scheduled')[];
  /** Min/max gallery images */
  minImages: number;
  maxImages: number;
  /** Required licenses/compliance */
  requiredLicenses?: string[];
}

export interface SchemaField {
  key: string;
  labelEn: string;
  labelRu: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'switch' | 'tags' | 'checkbox-group';
  required?: boolean;
  placeholder?: string;
  placeholderRu?: string;
  taxonomyType?: string;
  options?: { value: string; labelEn: string; labelRu: string }[];
  min?: number;
  max?: number;
  maxLength?: number;
  helpTextEn?: string;
  helpTextRu?: string;
}

export interface CanonicalListingData {
  // Core (readonly after category selection)
  category_id: string;
  type_id?: string;
  
  // Basic Info
  title_en: string;
  title_ru: string;
  short_description_en: string;
  short_description_ru: string;
  full_description_en: string;
  full_description_ru: string;
  
  // Features (preset tags from category schema)
  features: string[];
  included: string[];
  excluded: string[];
  
  // Pricing
  pricing_model: 'fixed' | 'per_hour' | 'per_day' | 'per_person';
  base_price: number;
  currency: 'THB';
  
  // Availability
  availability_type: 'instant' | 'request' | 'scheduled';
  calendar_id?: string;
  
  // Media
  cover_image: string;
  gallery: string[];
  
  // Compliance
  licenses: string[];
  terms_acknowledged: boolean;
  
  // Status
  status: 'draft' | 'moderation' | 'active' | 'archived';
  
  // Dynamic fields
  [key: string]: any;
}

const DEFAULT_LISTING: CanonicalListingData = {
  category_id: '',
  title_en: '',
  title_ru: '',
  short_description_en: '',
  short_description_ru: '',
  full_description_en: '',
  full_description_ru: '',
  features: [],
  included: [],
  excluded: [],
  pricing_model: 'fixed',
  base_price: 0,
  currency: 'THB',
  availability_type: 'request',
  cover_image: '',
  gallery: [],
  licenses: [],
  terms_acknowledged: false,
  status: 'draft',
};

// ==================== STEP DEFINITIONS ====================

interface StepConfig {
  id: string;
  titleEn: string;
  titleRu: string;
  icon: React.ReactNode;
  validate: (data: CanonicalListingData, schema?: CategorySchema) => ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: { field: string; message: string }[];
}

const WIZARD_STEPS: StepConfig[] = [
  {
    id: 'category',
    titleEn: 'Category',
    titleRu: 'Категория',
    icon: <Layers className="h-4 w-4" />,
    validate: (data) => ({
      valid: !!data.category_id,
      errors: data.category_id ? [] : [{ field: 'category_id', message: 'Select a category' }],
    }),
  },
  {
    id: 'basic',
    titleEn: 'Basic Info',
    titleRu: 'Основное',
    icon: <FileText className="h-4 w-4" />,
    validate: (data) => {
      const errors: { field: string; message: string }[] = [];
      if (!data.title_en.trim()) errors.push({ field: 'title_en', message: 'Title is required' });
      if (data.short_description_en.length > 160) {
        errors.push({ field: 'short_description_en', message: 'Max 160 characters' });
      }
      return { valid: errors.length === 0, errors };
    },
  },
  {
    id: 'details',
    titleEn: 'Details',
    titleRu: 'Детали',
    icon: <Settings className="h-4 w-4" />,
    validate: (data, schema) => {
      const errors: { field: string; message: string }[] = [];
      if (schema?.fields) {
        schema.fields.forEach(field => {
          if (field.required && !data[field.key]) {
            errors.push({ field: field.key, message: `${field.labelEn} is required` });
          }
        });
      }
      return { valid: errors.length === 0, errors };
    },
  },
  {
    id: 'pricing',
    titleEn: 'Pricing',
    titleRu: 'Цена',
    icon: <DollarSign className="h-4 w-4" />,
    validate: (data) => {
      const errors: { field: string; message: string }[] = [];
      if (!data.base_price || data.base_price <= 0) {
        errors.push({ field: 'base_price', message: 'Price must be greater than 0' });
      }
      return { valid: errors.length === 0, errors };
    },
  },
  {
    id: 'media',
    titleEn: 'Photos',
    titleRu: 'Фото',
    icon: <ImageIcon className="h-4 w-4" />,
    validate: (data, schema) => {
      const errors: { field: string; message: string }[] = [];
      const minImages = schema?.minImages || 3;
      if (data.gallery.length < minImages) {
        errors.push({ field: 'gallery', message: `At least ${minImages} photos required` });
      }
      return { valid: errors.length === 0, errors };
    },
  },
  {
    id: 'preview',
    titleEn: 'Preview',
    titleRu: 'Предпросмотр',
    icon: <Eye className="h-4 w-4" />,
    validate: (data) => ({
      valid: data.terms_acknowledged,
      errors: data.terms_acknowledged ? [] : [{ field: 'terms_acknowledged', message: 'Accept terms to submit' }],
    }),
  },
];

// ==================== MAIN COMPONENT ====================

interface CanonicalListingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Category tree for selection */
  categories: CategoryNode[];
  /** Provider ID */
  providerId: string;
  /** Table to insert into */
  tableName: string;
  /** Initial data for editing */
  initialData?: Partial<CanonicalListingData>;
  /** Editing existing record */
  editingId?: string | null;
  /** Called on successful submission */
  onSuccess?: () => void;
}

export function CanonicalListingWizard({
  open,
  onOpenChange,
  categories,
  providerId,
  tableName,
  initialData,
  editingId,
  onSuccess,
}: CanonicalListingWizardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [categoryLocked, setCategoryLocked] = useState(!!editingId || !!initialData?.category_id);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  
  // Draft management
  const draftKey = `canonical_${tableName}_${editingId || 'new'}_${providerId}`;
  const {
    data: formData,
    setData: setFormData,
    updateField,
    hasDraft,
    lastSaved,
    isSaving,
    clearDraft,
    hasUnsavedChanges,
  } = useCanonicalDraft<CanonicalListingData>({
    key: draftKey,
    initialData: initialData ? { ...DEFAULT_LISTING, ...initialData } : DEFAULT_LISTING,
  });
  
  // P0-safe submission
  const {
    submit,
    isSubmitting,
    isDuplicateBlocked,
  } = useCanonicalSubmit({
    tableName,
    providerId,
    editingId,
    onSuccess: () => {
      clearDraft();
      onOpenChange(false);
      onSuccess?.();
    },
  });
  
  // Get selected category schema
  const selectedCategory = useMemo(() => {
    const findCategory = (nodes: CategoryNode[], id: string): CategoryNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findCategory(node.children, id);
          if (found) return found;
        }
      }
      return undefined;
    };
    return formData.category_id ? findCategory(categories, formData.category_id) : undefined;
  }, [categories, formData.category_id]);
  
  const categorySchema = selectedCategory?.schema;
  
  // Validation
  const currentValidation = useMemo(() => {
    return WIZARD_STEPS[currentStep].validate(formData, categorySchema);
  }, [currentStep, formData, categorySchema]);
  
  const allStepsValidation = useMemo(() => {
    return WIZARD_STEPS.map(step => step.validate(formData, categorySchema));
  }, [formData, categorySchema]);
  
  const canSubmit = allStepsValidation.every(v => v.valid);
  
  // Handlers
  const handleCategorySelect = useCallback((categoryId: string) => {
    updateField('category_id', categoryId);
    setCategoryLocked(true);
    setCurrentStep(1); // Auto-advance
  }, [updateField]);
  
  const handleNext = useCallback(() => {
    if (!currentValidation.valid) {
      setShowValidationSummary(true);
      return;
    }
    setShowValidationSummary(false);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, currentValidation]);
  
  const handleBack = useCallback(() => {
    setShowValidationSummary(false);
    if (currentStep > 0) {
      // Don't go back to category step if locked
      if (currentStep === 1 && categoryLocked) return;
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, categoryLocked]);
  
  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      setShowValidationSummary(true);
      toast.error(isRu ? 'Исправьте ошибки перед отправкой' : 'Fix errors before submitting');
      return;
    }
    
    await submit({
      ...formData,
      status: 'moderation',
    });
  }, [canSubmit, formData, submit, isRu]);
  
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && !editingId) {
      // Draft auto-saved, just close
    }
    onOpenChange(false);
    setCurrentStep(0);
    setCategoryLocked(false);
    setShowValidationSummary(false);
  }, [hasUnsavedChanges, editingId, onOpenChange]);
  
  // Progress calculation
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  
  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-xl p-0 flex flex-col h-full overflow-hidden"
      >
        {/* Fixed Header */}
        <div className="shrink-0 border-b bg-background">
          {/* Title Row */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              {currentStep > 0 && !(currentStep === 1 && categoryLocked) ? (
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              ) : (
                <div className="w-10" />
              )}
              <div>
                <h2 className="font-semibold">
                  {editingId 
                    ? (isRu ? 'Редактирование' : 'Edit Listing')
                    : (isRu ? 'Новый листинг' : 'New Listing')
                  }
                </h2>
                {selectedCategory && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {categoryLocked && <Lock className="h-3 w-3" />}
                    <span>{isRu ? selectedCategory.name_ru : selectedCategory.name_en}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Draft Indicator */}
              {hasDraft && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{isRu ? 'Сохранение...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3 w-3 text-success" />
                      <span>{isRu ? 'Сохранено' : 'Saved'}</span>
                    </>
                  )}
                </div>
              )}
              
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Step Indicators */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1">
              {WIZARD_STEPS.map((step, index) => {
                const stepValidation = allStepsValidation[index];
                const isComplete = index < currentStep && stepValidation.valid;
                const hasErrors = !stepValidation.valid && index <= currentStep;
                
                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (index < currentStep || isComplete) {
                          if (index === 0 && categoryLocked) return;
                          setCurrentStep(index);
                        }
                      }}
                      disabled={index > currentStep}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all',
                        index === currentStep && 'bg-primary text-primary-foreground',
                        isComplete && 'bg-success/20 text-success cursor-pointer',
                        hasErrors && index < currentStep && 'bg-destructive/20 text-destructive',
                        index > currentStep && 'bg-muted text-muted-foreground',
                        index === 0 && categoryLocked && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-3 w-3" />
                      ) : hasErrors && index < currentStep ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        step.icon
                      )}
                      <span className="hidden sm:inline">
                        {isRu ? step.titleRu : step.titleEn}
                      </span>
                    </button>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div className={cn(
                        'flex-1 h-0.5 rounded',
                        index < currentStep ? 'bg-primary' : 'bg-muted'
                      )} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <Progress value={progress} className="mt-2 h-1" />
          </div>
        </div>
        
        {/* Scrollable Content - SINGLE SCROLL CONTAINER */}
        <ScrollArea className="flex-1">
          <div className="p-4 pb-24">
            {/* Validation Summary */}
            {showValidationSummary && !currentValidation.valid && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {currentValidation.errors.map((err, i) => (
                      <li key={i}>{err.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step Content */}
                {currentStep === 0 && (
                  <CategoryStep
                    categories={categories}
                    selectedId={formData.category_id}
                    onSelect={handleCategorySelect}
                    isLocked={categoryLocked}
                    isRu={isRu}
                  />
                )}
                
                {currentStep === 1 && (
                  <BasicInfoStep
                    data={formData}
                    updateField={updateField}
                    errors={showValidationSummary ? currentValidation.errors : []}
                    isRu={isRu}
                  />
                )}
                
                {currentStep === 2 && (
                  <DetailsStep
                    data={formData}
                    updateField={updateField}
                    schema={categorySchema}
                    errors={showValidationSummary ? currentValidation.errors : []}
                    isRu={isRu}
                  />
                )}
                
                {currentStep === 3 && (
                  <PricingStep
                    data={formData}
                    updateField={updateField}
                    schema={categorySchema}
                    errors={showValidationSummary ? currentValidation.errors : []}
                    isRu={isRu}
                  />
                )}
                
                {currentStep === 4 && (
                  <MediaStep
                    data={formData}
                    updateField={updateField}
                    setData={setFormData}
                    schema={categorySchema}
                    errors={showValidationSummary ? currentValidation.errors : []}
                    isRu={isRu}
                  />
                )}
                
                {currentStep === 5 && (
                  <PreviewStep
                    data={formData}
                    updateField={updateField}
                    category={selectedCategory}
                    allValidation={allStepsValidation}
                    isRu={isRu}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
        
        {/* Fixed Footer Navigation */}
        <div className="shrink-0 flex items-center justify-between p-4 border-t bg-background">
          <div className="text-sm text-muted-foreground">
            {currentStep + 1} / {WIZARD_STEPS.length}
          </div>
          
          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isRu ? 'Далее' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !canSubmit || isDuplicateBlocked}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  {isRu ? 'Отправка...' : 'Submitting...'}
                </>
              ) : isDuplicateBlocked ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {isRu ? 'Подождите...' : 'Wait...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {isRu ? 'На модерацию' : 'Submit for Review'}
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==================== STEP COMPONENTS ====================

interface StepProps<T = CanonicalListingData> {
  data: T;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  errors: { field: string; message: string }[];
  isRu: boolean;
}

// Step 0: Category Selection
interface CategoryStepProps {
  categories: CategoryNode[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLocked: boolean;
  isRu: boolean;
}

function CategoryStep({ categories, selectedId, onSelect, isLocked, isRu }: CategoryStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    
    const query = searchQuery.toLowerCase();
    const filterNodes = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes.filter(node => {
        const nameMatch = 
          node.name_en.toLowerCase().includes(query) ||
          node.name_ru.toLowerCase().includes(query);
        const childMatch = node.children && filterNodes(node.children).length > 0;
        return nameMatch || childMatch;
      }).map(node => ({
        ...node,
        children: node.children ? filterNodes(node.children) : undefined,
      }));
    };
    return filterNodes(categories);
  }, [categories, searchQuery]);
  
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  const renderCategory = (node: CategoryNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;
    
    return (
      <div key={node.id}>
        <button
          type="button"
          onClick={() => hasChildren ? toggleExpand(node.id) : onSelect(node.id)}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
            'hover:bg-muted/50',
            isSelected && 'bg-primary/10 border border-primary',
            depth > 0 && 'ml-4'
          )}
          style={{ marginLeft: depth * 16 }}
        >
          {node.icon && <span className="text-xl">{node.icon}</span>}
          <div className="flex-1">
            <p className="font-medium">{isRu ? node.name_ru : node.name_en}</p>
            {hasChildren && (
              <p className="text-xs text-muted-foreground">
                {node.children!.length} {isRu ? 'подкатегорий' : 'subcategories'}
              </p>
            )}
          </div>
          {hasChildren && (
            <ChevronRight className={cn(
              'h-4 w-4 transition-transform',
              isExpanded && 'rotate-90'
            )} />
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLocked && selectedId) {
    return (
      <div className="text-center py-8">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {isRu
            ? 'Категория заблокирована после выбора'
            : 'Category is locked after selection'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2">
          {isRu ? 'Выберите категорию' : 'Select Category'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isRu 
            ? 'Категория определяет форму и поля листинга. После выбора изменить нельзя.'
            : 'Category determines the listing form and fields. Cannot be changed after selection.'}
        </p>
      </div>
      
      <Input
        placeholder={isRu ? 'Поиск категории...' : 'Search category...'}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />
      
      <div className="space-y-1">
        {filteredCategories.map(cat => renderCategory(cat))}
      </div>

      {/* Suggest category option - Etsy/Amazon style */}
      <div className="pt-4 border-t">
        <button
          type="button"
          onClick={() => setShowSuggestionDialog(true)}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-warning/10 border border-dashed border-warning/30"
        >
          <div className="p-2 rounded-full bg-warning/10">
            <Lightbulb className="h-4 w-4 text-warning" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-warning">
              {isRu ? 'Не нашли категорию?' : "Can't find your category?"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Предложите свою, и мы добавим её!' : 'Suggest one and we\'ll add it!'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-warning" />
        </button>
      </div>

      {/* Category suggestion dialog */}
      <CategorySuggestionDialog
        open={showSuggestionDialog}
        onOpenChange={setShowSuggestionDialog}
        type="service"
        initialName={searchQuery}
      />
    </div>
  );
}

// Step 1: Basic Info
function BasicInfoStep({ data, updateField, errors, isRu }: StepProps) {
  const getError = (field: string) => errors.find(e => e.field === field)?.message;
  
  return (
    <div className="space-y-6">
      {/* Translate All Button */}
      <div className="flex justify-end">
        <TranslateAllButton
          formData={data}
          onUpdate={(updates) => {
            Object.entries(updates).forEach(([key, value]) => {
              updateField(key as keyof CanonicalListingData, value);
            });
          }}
        />
      </div>
      
      <div>
        <h3 className="font-semibold text-lg mb-1">{isRu ? 'Название' : 'Title'}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isRu ? 'Введите название на английском' : 'Enter title in English'}
        </p>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>English *</Label>
              {data.title_ru && (
                <AITranslateButton
                  sourceText={data.title_ru}
                  sourceLang="ru"
                  targetLang="en"
                  onTranslate={(text) => updateField('title_en', text)}
                />
              )}
            </div>
            <Input
              value={data.title_en}
              onChange={(e) => updateField('title_en', e.target.value)}
              placeholder="Enter title..."
              className={cn(getError('title_en') && 'border-destructive')}
              maxLength={100}
            />
            {getError('title_en') && (
              <p className="text-xs text-destructive mt-1">{getError('title_en')}</p>
            )}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Русский</Label>
              {data.title_en && (
                <AITranslateButton
                  sourceText={data.title_en}
                  sourceLang="en"
                  targetLang="ru"
                  onTranslate={(text) => updateField('title_ru', text)}
                />
              )}
            </div>
            <Input
              value={data.title_ru}
              onChange={(e) => updateField('title_ru', e.target.value)}
              placeholder="Введите название..."
              maxLength={100}
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold text-lg mb-1">
          {isRu ? 'Краткое описание' : 'Short Description'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isRu ? 'Максимум 160 символов' : 'Maximum 160 characters'}
        </p>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>English</Label>
              <div className="flex items-center gap-2">
                {data.short_description_ru && (
                  <AITranslateButton
                    sourceText={data.short_description_ru}
                    sourceLang="ru"
                    targetLang="en"
                    onTranslate={(text) => updateField('short_description_en', text)}
                  />
                )}
                <span className={cn(
                  'text-xs',
                  data.short_description_en.length > 160 ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {data.short_description_en.length}/160
                </span>
              </div>
            </div>
            <Textarea
              value={data.short_description_en}
              onChange={(e) => updateField('short_description_en', e.target.value)}
              placeholder="Brief description..."
              className={cn(
                'min-h-[80px]',
                getError('short_description_en') && 'border-destructive'
              )}
              maxLength={160}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Русский</Label>
              <div className="flex items-center gap-2">
                {data.short_description_en && (
                  <AITranslateButton
                    sourceText={data.short_description_en}
                    sourceLang="en"
                    targetLang="ru"
                    onTranslate={(text) => updateField('short_description_ru', text)}
                  />
                )}
                <span className="text-xs text-muted-foreground">
                  {data.short_description_ru.length}/160
                </span>
              </div>
            </div>
            <Textarea
              value={data.short_description_ru}
              onChange={(e) => updateField('short_description_ru', e.target.value)}
              placeholder="Краткое описание..."
              className="min-h-[80px]"
              maxLength={160}
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold text-lg mb-1">
          {isRu ? 'Полное описание' : 'Full Description'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>English</Label>
              {data.full_description_ru && (
                <AITranslateButton
                  sourceText={data.full_description_ru}
                  sourceLang="ru"
                  targetLang="en"
                  onTranslate={(text) => updateField('full_description_en', text)}
                />
              )}
            </div>
            <Textarea
              value={data.full_description_en}
              onChange={(e) => updateField('full_description_en', e.target.value)}
              placeholder="Detailed description..."
              className="min-h-[120px]"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Русский</Label>
              {data.full_description_en && (
                <AITranslateButton
                  sourceText={data.full_description_en}
                  sourceLang="en"
                  targetLang="ru"
                  onTranslate={(text) => updateField('full_description_ru', text)}
                />
              )}
            </div>
            <Textarea
              value={data.full_description_ru}
              onChange={(e) => updateField('full_description_ru', e.target.value)}
              placeholder="Подробное описание..."
              className="min-h-[120px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Details (Schema-driven)
interface DetailsStepProps extends StepProps {
  schema?: CategorySchema;
}

function DetailsStep({ data, updateField, schema, errors, isRu }: DetailsStepProps) {
  const getError = (field: string) => errors.find(e => e.field === field)?.message;
  
  if (!schema?.fields?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isRu 
          ? 'Нет дополнительных полей для этой категории'
          : 'No additional fields for this category'}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-1">{isRu ? 'Детали' : 'Details'}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isRu 
            ? 'Заполните поля, специфичные для выбранной категории'
            : 'Fill in fields specific to your category'}
        </p>
      </div>
      
      <div className="space-y-4">
        {schema.fields.map(field => (
          <SchemaFieldRenderer
            key={field.key}
            field={field}
            value={data[field.key]}
            onChange={(v) => updateField(field.key as keyof CanonicalListingData, v)}
            error={getError(field.key)}
            isRu={isRu}
          />
        ))}
      </div>
    </div>
  );
}

// Step 3: Pricing
interface PricingStepProps extends StepProps {
  schema?: CategorySchema;
}

function PricingStep({ data, updateField, schema, errors, isRu }: PricingStepProps) {
  const getError = (field: string) => errors.find(e => e.field === field)?.message;
  const pricingModels = schema?.pricingModels || ['fixed'];
  const availabilityTypes = schema?.availabilityTypes || ['request'];
  
  const pricingModelLabels: Record<string, { en: string; ru: string }> = {
    fixed: { en: 'Fixed Price', ru: 'Фикс. цена' },
    per_hour: { en: 'Per Hour', ru: 'За час' },
    per_day: { en: 'Per Day', ru: 'За день' },
    per_person: { en: 'Per Person', ru: 'За человека' },
  };
  
  const availabilityLabels: Record<string, { en: string; ru: string }> = {
    instant: { en: 'Instant Booking', ru: 'Мгновенное' },
    request: { en: 'Request to Book', ru: 'По запросу' },
    scheduled: { en: 'Calendar Based', ru: 'По календарю' },
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-1">{isRu ? 'Ценообразование' : 'Pricing'}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isRu ? 'Валюта зафиксирована: THB' : 'Currency is locked: THB'}
        </p>
      </div>
      
      {/* Pricing Model */}
      {pricingModels.length > 1 && (
        <div>
          <Label className="mb-2 block">{isRu ? 'Модель цены' : 'Pricing Model'}</Label>
          <div className="grid grid-cols-2 gap-2">
            {pricingModels.map(model => (
              <button
                key={model}
                type="button"
                onClick={() => updateField('pricing_model', model)}
                className={cn(
                  'p-3 rounded-lg border text-sm transition-colors',
                  data.pricing_model === model 
                    ? 'border-primary bg-primary/10' 
                    : 'hover:border-primary/50'
                )}
              >
                {isRu ? pricingModelLabels[model].ru : pricingModelLabels[model].en}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Price Input */}
      <div>
        <Label className="mb-2 block">{isRu ? 'Цена (THB)' : 'Price (THB)'} *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
          <Input
            type="number"
            value={data.base_price || ''}
            onChange={(e) => updateField('base_price', Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="0"
            className={cn('pl-8', getError('base_price') && 'border-destructive')}
            min={0}
            step={100}
          />
        </div>
        {getError('base_price') && (
          <p className="text-xs text-destructive mt-1">{getError('base_price')}</p>
        )}
      </div>
      
      {/* Availability Type */}
      <div>
        <Label className="mb-2 block">{isRu ? 'Доступность' : 'Availability'}</Label>
        <div className="space-y-2">
          {availabilityTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => updateField('availability_type', type)}
              className={cn(
                'w-full p-3 rounded-lg border text-left transition-colors',
                data.availability_type === type 
                  ? 'border-primary bg-primary/10' 
                  : 'hover:border-primary/50'
              )}
            >
              <p className="font-medium">
                {isRu ? availabilityLabels[type].ru : availabilityLabels[type].en}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 4: Media
interface MediaStepProps extends StepProps {
  setData: React.Dispatch<React.SetStateAction<CanonicalListingData>>;
  schema?: CategorySchema;
}

function MediaStep({ data, updateField, setData, schema, errors, isRu }: MediaStepProps) {
  const minImages = schema?.minImages || 3;
  const maxImages = schema?.maxImages || 12;
  const getError = (field: string) => errors.find(e => e.field === field)?.message;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-1">{isRu ? 'Фотографии' : 'Photos'}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isRu 
            ? `Минимум ${minImages} фото, максимум ${maxImages}`
            : `Minimum ${minImages} photos, maximum ${maxImages}`}
        </p>
      </div>
      
      {/* Gallery Upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>{isRu ? 'Галерея' : 'Gallery'} *</Label>
          <Badge variant={data.gallery.length >= minImages ? 'default' : 'destructive'}>
            {data.gallery.length}/{minImages}+ {isRu ? 'мин.' : 'min.'}
          </Badge>
        </div>
        
        <UnifiedMediaUploader
          mode="gallery"
          value={data.gallery}
          onChange={(urls) => {
            const galleryUrls = Array.isArray(urls) ? urls : [urls];
            setData(prev => ({
              ...prev,
              gallery: galleryUrls,
              cover_image: galleryUrls[0] || prev.cover_image,
            }));
          }}
          folder="listings"
          bucket="vendor-uploads"
          maxItems={maxImages}
          enableQualityTips
        />
        
        {getError('gallery') && (
          <p className="text-xs text-destructive mt-2">{getError('gallery')}</p>
        )}
      </div>
      
      {data.gallery.length > 0 && (
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <p className="text-muted-foreground">
            {isRu 
              ? 'Первое фото будет использовано как обложка'
              : 'First photo will be used as cover image'}
          </p>
        </div>
      )}
    </div>
  );
}

// Step 5: Preview
interface PreviewStepProps {
  data: CanonicalListingData;
  updateField: <K extends keyof CanonicalListingData>(field: K, value: CanonicalListingData[K]) => void;
  category?: CategoryNode;
  allValidation: ValidationResult[];
  isRu: boolean;
}

function PreviewStep({ data, updateField, category, allValidation, isRu }: PreviewStepProps) {
  const hasErrors = allValidation.some(v => !v.valid);
  const allErrors = allValidation.flatMap(v => v.errors);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-1">{isRu ? 'Предпросмотр' : 'Preview'}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isRu 
            ? 'Так будет выглядеть ваш листинг для клиентов'
            : 'This is how your listing will appear to customers'}
        </p>
      </div>
      
      {/* Validation Summary */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">
              {isRu ? 'Исправьте ошибки перед отправкой:' : 'Fix errors before submitting:'}
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {allErrors.map((err, i) => (
                <li key={i}>{err.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Card Preview */}
      <CardPreviewSection>
        <CardPreview
          type="product"
          title={data.title_en}
          titleRu={data.title_ru}
          description={data.short_description_en}
          descriptionRu={data.short_description_ru}
          image={data.cover_image || data.gallery[0]}
          price={data.base_price}
          isNew
          inStock
        />
      </CardPreviewSection>
      
      {/* Gallery Preview */}
      {data.gallery.length > 0 && (
        <div>
          <Label className="mb-2 block">{isRu ? 'Галерея' : 'Gallery'}</Label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.gallery.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className="w-16 h-16 rounded-lg object-cover shrink-0"
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Summary */}
      <div className="space-y-3">
        <div className="p-3 rounded-lg border">
          <h4 className="text-sm font-medium mb-2">{isRu ? 'Детали' : 'Details'}</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">{isRu ? 'Категория' : 'Category'}</div>
            <div>{isRu ? category?.name_ru : category?.name_en}</div>
            <div className="text-muted-foreground">{isRu ? 'Цена' : 'Price'}</div>
            <div>฿{data.base_price.toLocaleString()}</div>
            <div className="text-muted-foreground">{isRu ? 'Доступность' : 'Availability'}</div>
            <div className="capitalize">{data.availability_type.replace('_', ' ')}</div>
          </div>
        </div>
      </div>
      
      {/* Terms Acknowledgment */}
      <div className="p-4 rounded-lg border bg-muted/30">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={data.terms_acknowledged}
            onCheckedChange={(checked) => updateField('terms_acknowledged', !!checked)}
          />
          <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
            {isRu 
              ? 'Я подтверждаю, что вся информация верна и соответствует правилам платформы. Листинг будет отправлен на модерацию.'
              : 'I confirm that all information is accurate and complies with platform policies. Listing will be sent for moderation.'}
          </label>
        </div>
      </div>
    </div>
  );
}

// ==================== SCHEMA FIELD RENDERER ====================

interface SchemaFieldRendererProps {
  field: SchemaField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  isRu: boolean;
}

function SchemaFieldRenderer({ field, value, onChange, error, isRu }: SchemaFieldRendererProps) {
  const { options: taxonomyOptions } = useLookupOptions(field.taxonomyType as any);
  
  const label = isRu ? field.labelRu : field.labelEn;
  const placeholder = isRu ? field.placeholderRu : field.placeholder;
  const helpText = isRu ? field.helpTextRu : field.helpTextEn;
  
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(error && 'border-destructive')}
            maxLength={field.maxLength}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
            className={cn(error && 'border-destructive')}
            min={field.min}
            max={field.max}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn('min-h-[100px]', error && 'border-destructive')}
            maxLength={field.maxLength}
          />
        );
      
      case 'switch':
        return (
          <div className="flex items-center justify-between">
            <span>{label}{field.required && ' *'}</span>
            <Switch checked={!!value} onCheckedChange={onChange} />
          </div>
        );
      
      case 'select': {
        const selectOptions = field.taxonomyType
          ? taxonomyOptions.map(o => ({
              value: o.value,
              labelEn: o.label_en,
              labelRu: o.label_ru
            }))
          : field.options || [];

        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className={cn(error && 'border-destructive')}>
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
        );
      }

      default:
        return null;
    }
  };
  
  if (field.type === 'switch') {
    return (
      <div className="py-2">
        {renderField()}
        {helpText && <p className="text-xs text-muted-foreground mt-1">{helpText}</p>}
      </div>
    );
  }
  
  return (
    <div>
      <Label className="mb-2 block">
        {label}{field.required && ' *'}
      </Label>
      {renderField()}
      {helpText && <p className="text-xs text-muted-foreground mt-1">{helpText}</p>}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

export default CanonicalListingWizard;
