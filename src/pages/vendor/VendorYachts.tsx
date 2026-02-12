import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useVendorYachts } from '@/hooks/useVendorYachts';
import { useVendorProfile } from '@/hooks/useVendor';
import { Yacht } from '@/hooks/useYachts';
import { useFormDraft } from '@/hooks/useFormDraft';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Sailboat, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Ruler,
  Bed,
  Ship,
  Image,
  Settings,
  Eye,
  FileText,
  Anchor,
  Gauge,
  Bath,
  Calendar,
  Shield
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { ApprovalStatusBadge } from '@/components/vendor/ApprovalStatusBadge';
import {
  VendorFormWizard,
  WizardStepContent,
  VendorFormSection,
  FormFieldWithHelp,
  DraftIndicator,
  DraftRestorationBanner,
  CardPreview,
  CardPreviewSection,
} from '@/components/vendor';
import { CancellationPolicySelector } from '@/components/yachts/CancellationPolicySelector';

const yachtTypes = [
  { value: 'motor_yacht', label: 'Motor Yacht', labelRu: 'Моторная яхта' },
  { value: 'catamaran', label: 'Catamaran', labelRu: 'Катамаран' },
  { value: 'speedboat', label: 'Speedboat', labelRu: 'Скоростная лодка' },
  { value: 'superyacht', label: 'Superyacht', labelRu: 'Суперяхта' },
];

interface YachtFormData {
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  yacht_type: string;
  cover_image: string;
  images: string[];
  capacity: string;
  price_half_day: string;
  price_full_day: string;
  location_name: string;
  location_ru: string;
  features_en: string;
  features_ru: string;
  length_meters: string;
  year_built: string;
  beam: string;
  draft: string;
  engines: string;
  cruising_speed: string;
  max_speed: string;
  fuel_capacity: string;
  cabins: string;
  bathrooms: string;
  has_crew: boolean;
  is_featured: boolean;
  cancellation_policy: string;
}

const initialFormData: YachtFormData = {
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  yacht_type: 'motor_yacht',
  cover_image: '',
  images: [],
  capacity: '10',
  price_half_day: '',
  price_full_day: '',
  location_name: '',
  location_ru: '',
  features_en: '',
  features_ru: '',
  length_meters: '',
  year_built: '',
  beam: '',
  draft: '',
  engines: '',
  cruising_speed: '',
  max_speed: '',
  fuel_capacity: '',
  cabins: '',
  bathrooms: '',
  has_crew: true,
  is_featured: false,
  cancellation_policy: 'moderate',
};

const VendorYachts = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { hasRole } = useUserContext();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { yachts, isLoading: yachtsLoading, createYacht, updateYacht, deleteYacht } = useVendorYachts(profile?.id);
  
  const isAdmin = hasRole('admin');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  const isRussian = language === 'ru';

  const {
    formData,
    setFormData,
    updateField,
    hasDraft,
    lastSaved,
    clearDraft,
    resetForm: resetDraft,
    restoreDraft,
  } = useFormDraft<YachtFormData>({
    key: 'vendor_yacht',
    initialData: initialFormData,
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Wizard steps
  const wizardSteps = useMemo(() => [
    { 
      id: 'basic', 
      title: 'Basic Info', 
      titleRu: 'Основное',
      icon: <FileText className="h-4 w-4" />,
      validate: () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name_en.trim()) {
          newErrors.name_en = isRussian ? 'Обязательное поле' : 'Required field';
        }
        if (!formData.yacht_type) {
          newErrors.yacht_type = isRussian ? 'Выберите тип' : 'Select type';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 ? null : 'Validation failed';
      }
    },
    { 
      id: 'specs', 
      title: 'Specifications', 
      titleRu: 'Характеристики',
      icon: <Settings className="h-4 w-4" />,
      validate: () => {
        const newErrors: Record<string, string> = {};
        if (!formData.price_full_day) {
          newErrors.price_full_day = isRussian ? 'Укажите цену' : 'Set price';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 ? null : 'Validation failed';
      }
    },
    { 
      id: 'photos', 
      title: 'Photos', 
      titleRu: 'Фото',
      icon: <Image className="h-4 w-4" />,
      validate: () => null
    },
    { 
      id: 'review', 
      title: 'Review', 
      titleRu: 'Проверка',
      icon: <Eye className="h-4 w-4" />,
      validate: () => null
    },
  ], [formData, isRussian]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Check for existing draft on mount
  useEffect(() => {
    if (hasDraft && !editingYacht && !isDialogOpen) {
      setShowDraftBanner(true);
    }
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingYacht(null);
    setCurrentStep(0);
    setErrors({});
    clearDraft();
  };

  const openEditDialog = (yacht: Yacht) => {
    setEditingYacht(yacht);
    setFormData({
      name_en: yacht.name_en,
      name_ru: yacht.name_ru || '',
      description_en: yacht.description_en || '',
      description_ru: yacht.description_ru || '',
      yacht_type: yacht.yacht_type,
      cover_image: yacht.cover_image || '',
      images: yacht.images || [],
      capacity: yacht.capacity.toString(),
      price_half_day: yacht.price_half_day?.toString() || '',
      price_full_day: yacht.price_full_day?.toString() || '',
      location_name: yacht.location_name || '',
      location_ru: yacht.location_ru || '',
      features_en: yacht.features_en?.join(', ') || '',
      features_ru: yacht.features_ru?.join(', ') || '',
      length_meters: yacht.length_meters?.toString() || '',
      year_built: yacht.year_built?.toString() || '',
      beam: yacht.beam || '',
      draft: yacht.draft || '',
      engines: yacht.engines || '',
      cruising_speed: yacht.cruising_speed || '',
      max_speed: yacht.max_speed || '',
      fuel_capacity: yacht.fuel_capacity || '',
      cabins: yacht.cabins?.toString() || '',
      bathrooms: yacht.bathrooms?.toString() || '',
      has_crew: yacht.has_crew ?? true,
      is_featured: yacht.is_featured,
      cancellation_policy: (yacht as any).cancellation_policy || 'moderate',
    });
    setCurrentStep(0);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.price_full_day) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const yachtData: Partial<Yacht> & { cancellation_policy?: string } = {
        name_en: formData.name_en,
        name_ru: formData.name_ru || formData.name_en,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        yacht_type: formData.yacht_type,
        cover_image: formData.cover_image || null,
        images: formData.images.length > 0 ? formData.images : [],
        capacity: parseInt(formData.capacity) || 10,
        price_half_day: formData.price_half_day ? parseFloat(formData.price_half_day) : null,
        price_full_day: parseFloat(formData.price_full_day),
        currency: 'THB',
        location_name: formData.location_name || null,
        location_ru: formData.location_ru || null,
        features_en: formData.features_en ? formData.features_en.split(',').map(f => f.trim()).filter(Boolean) : [],
        features_ru: formData.features_ru ? formData.features_ru.split(',').map(f => f.trim()).filter(Boolean) : [],
        length_meters: formData.length_meters ? parseFloat(formData.length_meters) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        beam: formData.beam || null,
        draft: formData.draft || null,
        engines: formData.engines || null,
        cruising_speed: formData.cruising_speed || null,
        max_speed: formData.max_speed || null,
        fuel_capacity: formData.fuel_capacity || null,
        cabins: formData.cabins ? parseInt(formData.cabins) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        has_crew: formData.has_crew,
        is_featured: formData.is_featured,
        cancellation_policy: formData.cancellation_policy,
      };

      if (editingYacht) {
        // If non-admin edits, reset to pending for re-moderation
        const updateData = isAdmin 
          ? yachtData 
          : { ...yachtData, approval_status: 'pending' };
        const { error } = await updateYacht(editingYacht.id, updateData);
        if (error) throw error;
        toast.success(isRussian 
          ? (isAdmin ? 'Яхта обновлена' : 'Яхта обновлена и отправлена на модерацию') 
          : (isAdmin ? 'Yacht updated' : 'Yacht updated and sent for moderation'));
      } else {
        // New listings always start as pending
        const { error } = await createYacht({ 
          ...yachtData, 
          provider_id: profile?.id,
          approval_status: isAdmin ? 'approved' : 'pending'
        });
        if (error) throw error;
        toast.success(isRussian 
          ? (isAdmin ? 'Яхта добавлена' : 'Яхта добавлена и отправлена на модерацию') 
          : (isAdmin ? 'Yacht added' : 'Yacht added and sent for moderation'));
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving yacht:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving yacht');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (yachtId: string) => {
    try {
      const { error } = await deleteYacht(yachtId);
      if (error) throw error;
      toast.success(isRussian ? 'Яхта удалена' : 'Yacht deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting yacht:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting yacht');
    }
  };

  // Preview data for CardPreview - using service type as closest match for yachts
  const previewData = {
    type: 'service' as const,
    image: formData.cover_image,
    title: formData.name_en,
    titleRu: formData.name_ru,
    description: formData.description_en,
    descriptionRu: formData.description_ru,
    price: formData.price_full_day ? parseFloat(formData.price_full_day) : undefined,
    maxCapacity: formData.capacity ? parseInt(formData.capacity) : undefined,
  };

  if (authLoading || profileLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="p-8 text-center">
            <Sailboat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">
              {isRussian ? 'Профиль не найден' : 'Profile not found'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Пожалуйста, настройте ваш профиль вендора' : 'Please set up your vendor profile first'}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>

        {/* Draft restoration banner */}
        {showDraftBanner && (
          <div className="mb-4">
            <DraftRestorationBanner
              onRestore={() => {
                restoreDraft();
                setShowDraftBanner(false);
                setIsDialogOpen(true);
              }}
              onDiscard={() => {
                clearDraft();
                setShowDraftBanner(false);
              }}
            />
          </div>
        )}

        <Button 
          className="w-full mb-4" 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRussian ? 'Добавить яхту' : 'Add Yacht'}
        </Button>

        {yachtsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : yachts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Sailboat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет яхт' : 'No yachts'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Добавьте свою яхту или катамаран' : 'Add your yacht or catamaran'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {yachts.map((yacht) => (
              <Card key={yacht.id} className={!yacht.is_verified ? 'border-amber-500/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {yacht.cover_image ? (
                      <img 
                        src={yacht.cover_image} 
                        alt={yacht.name_en}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Sailboat className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">
                              {isRussian ? yacht.name_ru : yacht.name_en}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {yachtTypes.find(t => t.value === yacht.yacht_type)?.[isRussian ? 'labelRu' : 'label']}
                            </Badge>
                            <ApprovalStatusBadge 
                              status={(yacht as any).approval_status} 
                              rejectionReason={(yacht as any).rejection_reason}
                            />
                            {yacht.is_featured && (
                              <Badge className="text-xs bg-primary">
                                {isRussian ? 'Избранное' : 'Featured'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm mb-1">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {yacht.capacity}
                            </span>
                            {yacht.length_meters && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Ruler className="h-3 w-3" />
                                {yacht.length_meters}m
                              </span>
                            )}
                            {yacht.cabins && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Bed className="h-3 w-3" />
                                {yacht.cabins}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            {yacht.price_half_day && (
                              <span>
                                <span className="text-muted-foreground">{isRussian ? 'Полдня:' : 'Half:'}</span>{' '}
                                <span className="font-bold text-primary">฿{yacht.price_half_day.toLocaleString()}</span>
                              </span>
                            )}
                            <span>
                              <span className="text-muted-foreground">{isRussian ? 'День:' : 'Day:'}</span>{' '}
                              <span className="font-bold text-primary">฿{yacht.price_full_day?.toLocaleString()}</span>
                            </span>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(yacht)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/vendor/yachts/${yacht.id}/calendar`)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              {isRussian ? 'Календарь' : 'Calendar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirmId(yacht.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isRussian ? 'Удалить' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {isRussian ? 'Удалить яхту?' : 'Delete yacht?'}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit/Add Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open && !editingYacht) {
            // Keep draft when closing without editing
          }
          setIsDialogOpen(open);
        }}>
          <DialogContent className="w-[calc(100vw-16px)] sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {editingYacht 
                    ? (isRussian ? 'Редактировать яхту' : 'Edit Yacht')
                    : (isRussian ? 'Новая яхта' : 'New Yacht')}
                </DialogTitle>
                {!editingYacht && (
                  <DraftIndicator
                    hasDraft={hasDraft}
                    lastSaved={lastSaved}
                    onClear={clearDraft}
                    onRestore={restoreDraft}
                  />
                )}
              </div>
            </DialogHeader>

            <VendorFormWizard
              steps={wizardSteps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            >
              <div className="grid lg:grid-cols-[1fr,280px] gap-6 px-6">
                <div className="min-h-[400px]">
                  {/* Step 1: Basic Info */}
                  <WizardStepContent stepId="basic" currentStepId={wizardSteps[currentStep].id}>
                    <VendorFormSection
                      title={isRussian ? 'Название яхты' : 'Yacht Name'}
                      description={isRussian ? 'Укажите название на двух языках' : 'Provide name in two languages'}
                      icon={<Ship className="h-4 w-4" />}
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Название (EN)' : 'Name (EN)'}
                          name="name_en"
                          value={formData.name_en}
                          onChange={(value) => updateField('name_en', value)}
                          placeholder="Luxury Yacht 42ft"
                          example="Princess 65, Sunseeker Manhattan"
                          required
                          error={errors.name_en}
                          isValid={formData.name_en.length >= 3}
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Название (RU)' : 'Name (RU)'}
                          name="name_ru"
                          value={formData.name_ru}
                          onChange={(value) => updateField('name_ru', value)}
                          placeholder="Люксовая яхта 42ft"
                          helpText={isRussian ? 'Оставьте пустым для автозаполнения' : 'Leave empty to auto-fill'}
                        />
                      </div>
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Тип судна' : 'Vessel Type'}
                      icon={<Anchor className="h-4 w-4" />}
                    >
                      <div className="space-y-2">
                        <Label>{isRussian ? 'Тип яхты' : 'Yacht Type'}</Label>
                        <Select
                          value={formData.yacht_type}
                          onValueChange={(value) => updateField('yacht_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {yachtTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {isRussian ? type.labelRu : type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.yacht_type && (
                          <p className="text-sm text-destructive">{errors.yacht_type}</p>
                        )}
                      </div>
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Описание' : 'Description'}
                      description={isRussian ? 'Расскажите о преимуществах и особенностях' : 'Describe highlights and features'}
                      icon={<FileText className="h-4 w-4" />}
                      collapsible
                      defaultOpen={false}
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Описание (EN)' : 'Description (EN)'}
                          name="description_en"
                          value={formData.description_en}
                          onChange={(value) => updateField('description_en', value)}
                          type="textarea"
                          rows={4}
                          placeholder="Describe your yacht..."
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Описание (RU)' : 'Description (RU)'}
                          name="description_ru"
                          value={formData.description_ru}
                          onChange={(value) => updateField('description_ru', value)}
                          type="textarea"
                          rows={4}
                          placeholder="Опишите вашу яхту..."
                        />
                      </div>
                    </VendorFormSection>
                  </WizardStepContent>

                  {/* Step 2: Specifications */}
                  <WizardStepContent stepId="specs" currentStepId={wizardSteps[currentStep].id}>
                    <VendorFormSection
                      title={isRussian ? 'Цена и вместимость' : 'Price & Capacity'}
                      icon={<Users className="h-4 w-4" />}
                      badge={isRussian ? 'Важно' : 'Important'}
                    >
                      <div className="grid md:grid-cols-3 gap-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Цена за день (THB)' : 'Full Day Price (THB)'}
                          name="price_full_day"
                          value={formData.price_full_day}
                          onChange={(value) => updateField('price_full_day', value)}
                          type="number"
                          placeholder="150000"
                          required
                          error={errors.price_full_day}
                          isValid={!!formData.price_full_day}
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Цена за полдня (THB)' : 'Half Day Price (THB)'}
                          name="price_half_day"
                          value={formData.price_half_day}
                          onChange={(value) => updateField('price_half_day', value)}
                          type="number"
                          placeholder="90000"
                          helpText={isRussian ? 'Опционально' : 'Optional'}
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Вместимость' : 'Capacity'}
                          name="capacity"
                          value={formData.capacity}
                          onChange={(value) => updateField('capacity', value)}
                          type="number"
                          placeholder="10"
                        />
                      </div>
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Технические характеристики' : 'Technical Specs'}
                      description={isRussian ? 'Детали для опытных яхтсменов' : 'Details for experienced boaters'}
                      icon={<Settings className="h-4 w-4" />}
                      collapsible
                      defaultOpen
                    >
                      <div className="grid md:grid-cols-4 gap-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Длина (м)' : 'Length (m)'}
                          name="length_meters"
                          value={formData.length_meters}
                          onChange={(value) => updateField('length_meters', value)}
                          type="number"
                          placeholder="20"
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Год постройки' : 'Year Built'}
                          name="year_built"
                          value={formData.year_built}
                          onChange={(value) => updateField('year_built', value)}
                          type="number"
                          placeholder="2020"
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Кают' : 'Cabins'}
                          name="cabins"
                          value={formData.cabins}
                          onChange={(value) => updateField('cabins', value)}
                          type="number"
                          placeholder="3"
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Санузлов' : 'Bathrooms'}
                          name="bathrooms"
                          value={formData.bathrooms}
                          onChange={(value) => updateField('bathrooms', value)}
                          type="number"
                          placeholder="2"
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Ширина' : 'Beam'}
                          name="beam"
                          value={formData.beam}
                          onChange={(value) => updateField('beam', value)}
                          placeholder="5.5m"
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Осадка' : 'Draft'}
                          name="draft"
                          value={formData.draft}
                          onChange={(value) => updateField('draft', value)}
                          placeholder="1.8m"
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Двигатели' : 'Engines'}
                          name="engines"
                          value={formData.engines}
                          onChange={(value) => updateField('engines', value)}
                          placeholder="2x CAT C12"
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Крейсерская скорость' : 'Cruising Speed'}
                          name="cruising_speed"
                          value={formData.cruising_speed}
                          onChange={(value) => updateField('cruising_speed', value)}
                          placeholder="22 knots"
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Макс. скорость' : 'Max Speed'}
                          name="max_speed"
                          value={formData.max_speed}
                          onChange={(value) => updateField('max_speed', value)}
                          placeholder="28 knots"
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Топливный бак' : 'Fuel Capacity'}
                          name="fuel_capacity"
                          value={formData.fuel_capacity}
                          onChange={(value) => updateField('fuel_capacity', value)}
                          placeholder="3000L"
                        />
                      </div>
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Локация и особенности' : 'Location & Features'}
                      icon={<Anchor className="h-4 w-4" />}
                      collapsible
                      defaultOpen={false}
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Локация (EN)' : 'Location (EN)'}
                          name="location_name"
                          value={formData.location_name}
                          onChange={(value) => updateField('location_name', value)}
                          placeholder="Phuket Marina"
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Локация (RU)' : 'Location (RU)'}
                          name="location_ru"
                          value={formData.location_ru}
                          onChange={(value) => updateField('location_ru', value)}
                          placeholder="Марина Пхукет"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Особенности (EN)' : 'Features (EN)'}
                          name="features_en"
                          value={formData.features_en}
                          onChange={(value) => updateField('features_en', value)}
                          placeholder="Jet ski, BBQ, Snorkeling gear"
                          helpText={isRussian ? 'Через запятую' : 'Comma separated'}
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Особенности (RU)' : 'Features (RU)'}
                          name="features_ru"
                          value={formData.features_ru}
                          onChange={(value) => updateField('features_ru', value)}
                          placeholder="Гидроцикл, Барбекю, Снаряжение"
                        />
                      </div>
                    </VendorFormSection>

                    <VendorFormSection title={isRussian ? 'Опции' : 'Options'}>
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={formData.has_crew}
                            onCheckedChange={(checked) => updateField('has_crew', checked)}
                          />
                          <Label>{isRussian ? 'С экипажем' : 'With Crew'}</Label>
                        </div>
                        {/* is_featured removed - admin only */}
                      </div>
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Политика отмены' : 'Cancellation Policy'}
                      description={isRussian ? 'Условия возврата средств для клиентов' : 'Refund conditions for customers'}
                      icon={<Shield className="h-4 w-4" />}
                    >
                      <CancellationPolicySelector
                        value={formData.cancellation_policy}
                        onChange={(value) => updateField('cancellation_policy', value)}
                      />
                    </VendorFormSection>
                  </WizardStepContent>

                  {/* Step 3: Photos */}
                  <WizardStepContent stepId="photos" currentStepId={wizardSteps[currentStep].id}>
                    <VendorFormSection
                      title={isRussian ? 'Обложка' : 'Cover Image'}
                      description={isRussian ? 'Главное фото яхты' : 'Main yacht photo'}
                      icon={<Image className="h-4 w-4" />}
                      badge={isRussian ? 'Рекомендуется' : 'Recommended'}
                    >
                      <ImageUpload
                        value={formData.cover_image}
                        onChange={(url) => updateField('cover_image', url)}
                        folder="yachts"
                        placeholder={isRussian ? 'Загрузить обложку' : 'Upload cover'}
                      />
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Галерея' : 'Gallery'}
                      description={isRussian ? 'До 10 дополнительных фото' : 'Up to 10 additional photos'}
                      icon={<Image className="h-4 w-4" />}
                    >
                      <MultiImageUpload
                        value={formData.images}
                        onChange={(urls) => updateField('images', urls)}
                        folder="yachts"
                        maxImages={10}
                      />
                    </VendorFormSection>
                  </WizardStepContent>

                  {/* Step 4: Review */}
                  <WizardStepContent stepId="review" currentStepId={wizardSteps[currentStep].id}>
                    <VendorFormSection
                      title={isRussian ? 'Проверьте данные' : 'Review Your Listing'}
                      description={isRussian ? 'Убедитесь, что всё верно' : 'Make sure everything is correct'}
                      icon={<Eye className="h-4 w-4" />}
                    >
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">{isRussian ? 'Название:' : 'Name:'}</span>{' '}
                            <span className="font-medium">{formData.name_en || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isRussian ? 'Тип:' : 'Type:'}</span>{' '}
                            <span className="font-medium">
                              {yachtTypes.find(t => t.value === formData.yacht_type)?.[isRussian ? 'labelRu' : 'label']}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isRussian ? 'Цена/день:' : 'Day price:'}</span>{' '}
                            <span className="font-medium">
                              {formData.price_full_day ? `฿${parseFloat(formData.price_full_day).toLocaleString()}` : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isRussian ? 'Вместимость:' : 'Capacity:'}</span>{' '}
                            <span className="font-medium">{formData.capacity} {isRussian ? 'гостей' : 'guests'}</span>
                          </div>
                          {formData.length_meters && (
                            <div>
                              <span className="text-muted-foreground">{isRussian ? 'Длина:' : 'Length:'}</span>{' '}
                              <span className="font-medium">{formData.length_meters}м</span>
                            </div>
                          )}
                          {formData.cabins && (
                            <div>
                              <span className="text-muted-foreground">{isRussian ? 'Кают:' : 'Cabins:'}</span>{' '}
                              <span className="font-medium">{formData.cabins}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {formData.has_crew && (
                            <Badge variant="secondary">{isRussian ? 'С экипажем' : 'With Crew'}</Badge>
                          )}
                          {formData.cover_image && (
                            <Badge variant="outline">{isRussian ? 'Есть фото' : 'Has photo'}</Badge>
                          )}
                          {formData.images.length > 0 && (
                            <Badge variant="outline">{formData.images.length} {isRussian ? 'фото' : 'photos'}</Badge>
                          )}
                        </div>
                      </div>
                    </VendorFormSection>
                  </WizardStepContent>
                </div>

                {/* Live Preview */}
                <CardPreviewSection className="hidden lg:block">
                  <CardPreview {...previewData} />
                </CardPreviewSection>
              </div>
            </VendorFormWizard>
          </DialogContent>
        </Dialog>
      </PageContainer>
  );
};

export default VendorYachts;
