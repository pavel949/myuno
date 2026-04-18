import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile, useVendorServices, VendorService } from '@/hooks/useVendor';
import { useFormDraft } from '@/hooks/useFormDraft';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Package, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Users,
  FileText,
  Image as ImageIcon,
  Eye
} from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { CardPreview, CardPreviewSection } from '@/components/vendor/CardPreview';
import { VendorFormWizard, WizardStep, WizardStepContent } from '@/components/vendor/VendorFormWizard';
import { VendorFormSection } from '@/components/vendor/VendorFormSection';
import { FormFieldWithHelp } from '@/components/vendor/FormFieldWithHelp';
import { DraftRestorationBanner, DraftIndicator } from '@/components/vendor/DraftIndicator';

const DRAFT_KEY = 'vendor-service-draft';

interface ServiceFormData {
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  price: string;
  duration_minutes: string;
  max_capacity: string;
  image: string;
  is_active: boolean;
}

const initialFormData: ServiceFormData = {
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  price: '',
  duration_minutes: '',
  max_capacity: '1',
  image: '',
  is_active: true,
};

const VendorServices = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { services, isLoading: servicesLoading, createService, updateService, deleteService } = useVendorServices(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<VendorService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({});

  const {
    formData,
    setFormData,
    lastSaved,
    hasDraft,
    clearDraft,
    restoreDraft,
  } = useFormDraft<ServiceFormData>({
    key: DRAFT_KEY,
    initialData: initialFormData,
  });

  const isRussian = language === 'ru';

  // Validation
  const validateStep = (stepIndex: number): string | null => {
    const newErrors: Partial<Record<keyof ServiceFormData, string>> = {};
    
    if (stepIndex === 0) {
      if (!formData.name_en.trim()) {
        newErrors.name_en = isRussian ? 'Введите название' : 'Name is required';
      }
    }
    
    if (stepIndex === 1) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = isRussian ? 'Введите цену' : 'Price is required';
      }
    }
    
    setErrors(newErrors);
    const firstError = Object.values(newErrors)[0];
    if (firstError) {
      toast.error(firstError);
    }
    return firstError || null;
  };

  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'basic',
      title: 'Basic Info',
      titleRu: 'Основное',
      icon: <FileText className="h-4 w-4" />,
      validate: () => validateStep(0),
    },
    {
      id: 'details',
      title: 'Details',
      titleRu: 'Детали',
      icon: <Clock className="h-4 w-4" />,
      validate: () => validateStep(1),
    },
    {
      id: 'photo',
      title: 'Photo',
      titleRu: 'Фото',
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      id: 'review',
      title: 'Review',
      titleRu: 'Проверка',
      icon: <Eye className="h-4 w-4" />,
    },
  ], [isRussian, formData]);

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  const resetForm = () => {
    setFormData(initialFormData);
    clearDraft();
    setEditingService(null);
    setCurrentStep(0);
    setErrors({});
  };

  const openEditDialog = (service: VendorService) => {
    setEditingService(service);
    setFormData({
      name_en: service.name,
      name_ru: service.name_ru || '',
      description_en: service.description || '',
      description_ru: service.description_ru || '',
      price: service.price.toString(),
      duration_minutes: service.duration_minutes?.toString() || '',
      max_capacity: service.max_capacity.toString(),
      image: (service as any).image || '',
      is_active: service.is_active,
    });
    setCurrentStep(0);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const serviceData = {
        name: formData.name_en,
        name_ru: formData.name_ru || null,
        description: formData.description_en || null,
        description_ru: formData.description_ru || null,
        price: parseFloat(formData.price),
        currency: 'THB',
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        max_capacity: parseInt(formData.max_capacity) || 1,
        image: formData.image || null,
        is_active: formData.is_active,
      };

      if (editingService) {
        const { error } = await updateService(editingService.id, serviceData);
        if (error) throw error;
        toast.success(isRussian ? 'Услуга обновлена' : 'Service updated');
      } else {
        const { error } = await createService(serviceData);
        if (error) throw error;
        toast.success(isRussian ? 'Услуга создана' : 'Service created');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    try {
      const { error } = await deleteService(serviceId);
      if (error) throw error;
      toast.success(isRussian ? 'Услуга удалена' : 'Service deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting service');
    }
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open && !editingService && (formData.name_en || formData.price)) {
      // Keep draft when closing without saving
    }
    setIsDialogOpen(open);
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

  if (!profile) return null;

  return (
    <PageContainer>

        {/* Draft restoration banner */}
        {hasDraft && !isDialogOpen && !editingService && (
          <DraftRestorationBanner
            onRestore={() => {
              restoreDraft();
              setIsDialogOpen(true);
            }}
            onDiscard={clearDraft}
          />
        )}

        <Button 
          className="w-full mb-4" 
          onClick={handleOpenDialog}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRussian ? 'Добавить услугу' : 'Add Service'}
        </Button>

        {servicesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет услуг' : 'No services'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Добавьте свои услуги' : 'Add your services'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {(service as any).image ? (
                      <img 
                        src={(service as any).image} 
                        alt={service.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">
                              {isRussian ? (service.name_ru || service.name) : service.name}
                            </h3>
                            {!service.is_active && (
                              <Badge variant="outline" className="text-xs">
                                {isRussian ? 'Неактивна' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {isRussian ? (service.description_ru || service.description) : service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-bold text-primary">
                              ฿{service.price.toLocaleString()}
                            </span>
                            {service.duration_minutes && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {service.duration_minutes} {isRussian ? 'мин' : 'min'}
                              </span>
                            )}
                            {service.max_capacity > 1 && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {service.max_capacity}
                              </span>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(service)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteConfirmId(service.id)}
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

        {/* Add/Edit Dialog with Wizard */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogContent className="w-[calc(100vw-16px)] sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {editingService 
                    ? (isRussian ? 'Редактировать услугу' : 'Edit Service')
                    : (isRussian ? 'Новая услуга' : 'New Service')}
                </DialogTitle>
                {!editingService && lastSaved && hasDraft && (
                  <DraftIndicator 
                    lastSaved={lastSaved} 
                    hasDraft={hasDraft}
                    onClear={clearDraft}
                    onRestore={restoreDraft}
                  />
                )}
              </div>
            </DialogHeader>

            <div className="grid md:grid-cols-[1fr,280px] gap-6 flex-1 min-h-0 overflow-hidden py-4">
              {/* Form Wizard: min-h-0 keeps footer nav visible inside max-h dialog */}
              <div className="min-h-0 flex flex-col overflow-hidden">
                <VendorFormWizard
                  className="min-h-0 flex-1 flex flex-col overflow-hidden"
                  steps={steps}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  submitLabel="Save Service"
                  submitLabelRu="Сохранить услугу"
                >
                {/* Step 1: Basic Info */}
                <WizardStepContent stepId="basic" currentStepId={steps[currentStep].id}>
                  <VendorFormSection
                    title={isRussian ? 'Основная информация' : 'Basic Information'}
                    description={isRussian ? 'Название и описание услуги' : 'Service name and description'}
                    icon={<FileText className="h-5 w-5" />}
                  >
                    <FormFieldWithHelp
                      label={isRussian ? 'Название услуги' : 'Service Name'}
                      name="name_en"
                      value={formData.name_en}
                      onChange={(v) => setFormData({ ...formData, name_en: v })}
                      placeholder={isRussian ? 'Например: Маникюр' : 'e.g., Manicure'}
                      required
                      error={errors.name_en}
                      isValid={!!formData.name_en.trim()}
                      helpText={isRussian ? 'Краткое название услуги для клиентов' : 'Short service name for customers'}
                      example={isRussian ? 'Пример: Стрижка мужская' : 'Example: Men\'s Haircut'}
                    />

                    <FormFieldWithHelp
                      label={isRussian ? 'Название (RU)' : 'Name (Russian)'}
                      name="name_ru"
                      value={formData.name_ru}
                      onChange={(v) => setFormData({ ...formData, name_ru: v })}
                      placeholder={isRussian ? 'Название на русском' : 'Russian name'}
                      helpText={isRussian ? 'Для русскоязычных клиентов' : 'For Russian-speaking customers'}
                    />

                    <FormFieldWithHelp
                      label={isRussian ? 'Описание' : 'Description'}
                      name="description_en"
                      value={formData.description_en}
                      onChange={(v) => setFormData({ ...formData, description_en: v })}
                      type="textarea"
                      rows={3}
                      placeholder={isRussian ? 'Опишите что включено...' : 'Describe what\'s included...'}
                      helpText={isRussian ? 'Подробности, что входит в услугу' : 'Details about what\'s included'}
                    />

                    <FormFieldWithHelp
                      label={isRussian ? 'Описание (RU)' : 'Description (Russian)'}
                      name="description_ru"
                      value={formData.description_ru}
                      onChange={(v) => setFormData({ ...formData, description_ru: v })}
                      type="textarea"
                      rows={3}
                    />
                  </VendorFormSection>
                </WizardStepContent>

                {/* Step 2: Details */}
                <WizardStepContent stepId="details" currentStepId={steps[currentStep].id}>
                  <VendorFormSection
                    title={isRussian ? 'Цена и длительность' : 'Price & Duration'}
                    description={isRussian ? 'Настройте стоимость и время' : 'Set pricing and timing'}
                    icon={<Clock className="h-5 w-5" />}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormFieldWithHelp
                        label={isRussian ? 'Цена (฿)' : 'Price (฿)'}
                        name="price"
                        value={formData.price}
                        onChange={(v) => setFormData({ ...formData, price: v })}
                        type="number"
                        placeholder="1000"
                        required
                        error={errors.price}
                        isValid={!!formData.price && parseFloat(formData.price) > 0}
                        min={0}
                      />

                      <FormFieldWithHelp
                        label={isRussian ? 'Длительность (мин)' : 'Duration (min)'}
                        name="duration_minutes"
                        value={formData.duration_minutes}
                        onChange={(v) => setFormData({ ...formData, duration_minutes: v })}
                        type="number"
                        placeholder="60"
                        helpText={isRussian ? 'Сколько времени занимает' : 'How long does it take'}
                        min={0}
                      />
                    </div>

                    <FormFieldWithHelp
                      label={isRussian ? 'Макс. клиентов' : 'Max Capacity'}
                      name="max_capacity"
                      value={formData.max_capacity}
                      onChange={(v) => setFormData({ ...formData, max_capacity: v })}
                      type="number"
                      placeholder="1"
                      helpText={isRussian ? 'Сколько клиентов за раз' : 'How many clients at once'}
                      min={1}
                    />

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label htmlFor="is_active" className="font-medium">
                          {isRussian ? 'Услуга активна' : 'Service active'}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {isRussian ? 'Видна клиентам' : 'Visible to customers'}
                        </p>
                      </div>
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                  </VendorFormSection>
                </WizardStepContent>

                {/* Step 3: Photo */}
                <WizardStepContent stepId="photo" currentStepId={steps[currentStep].id}>
                  <VendorFormSection
                    title={isRussian ? 'Фото услуги' : 'Service Photo'}
                    description={isRussian ? 'Добавьте привлекательное фото' : 'Add an attractive photo'}
                    icon={<ImageIcon className="h-5 w-5" />}
                  >
                    <ImageUpload
                      value={formData.image}
                      onChange={(url) => setFormData({ ...formData, image: url })}
                      folder="services"
                      placeholder={isRussian ? 'Загрузить фото' : 'Upload photo'}
                    />
                    <p className="text-sm text-muted-foreground">
                      {isRussian 
                        ? 'Качественное фото повышает доверие клиентов' 
                        : 'A quality photo increases customer trust'}
                    </p>
                  </VendorFormSection>
                </WizardStepContent>

                {/* Step 4: Review */}
                <WizardStepContent stepId="review" currentStepId={steps[currentStep].id}>
                  <VendorFormSection
                    title={isRussian ? 'Проверьте данные' : 'Review Your Service'}
                    description={isRussian ? 'Убедитесь что всё верно' : 'Make sure everything is correct'}
                    icon={<Eye className="h-5 w-5" />}
                  >
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">
                            {isRussian ? 'Название' : 'Name'}
                          </span>
                          <p className="font-medium">{formData.name_en || '-'}</p>
                          {formData.name_ru && (
                            <p className="text-sm text-muted-foreground">{formData.name_ru}</p>
                          )}
                        </div>

                        {formData.description_en && (
                          <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              {isRussian ? 'Описание' : 'Description'}
                            </span>
                            <p className="text-sm">{formData.description_en}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                          <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              {isRussian ? 'Цена' : 'Price'}
                            </span>
                            <p className="font-bold text-primary">
                              ฿{formData.price ? parseFloat(formData.price).toLocaleString() : '-'}
                            </p>
                          </div>
                          {formData.duration_minutes && (
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                {isRussian ? 'Время' : 'Duration'}
                              </span>
                              <p className="font-medium">{formData.duration_minutes} мин</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              {isRussian ? 'Статус' : 'Status'}
                            </span>
                            <p className="font-medium">
                              {formData.is_active 
                                ? (isRussian ? '✓ Активна' : '✓ Active')
                                : (isRussian ? '○ Неактивна' : '○ Inactive')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </VendorFormSection>
                </WizardStepContent>
              </VendorFormWizard>
              </div>

              {/* Preview */}
              <CardPreviewSection className="hidden md:block min-h-0">
                <CardPreview
                  type="service"
                  image={formData.image}
                  title={formData.name_en}
                  titleRu={formData.name_ru}
                  description={formData.description_en}
                  descriptionRu={formData.description_ru}
                  price={formData.price ? parseFloat(formData.price) : undefined}
                  durationMinutes={formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined}
                  maxCapacity={formData.max_capacity ? parseInt(formData.max_capacity) : undefined}
                />
              </CardPreviewSection>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить услугу?' : 'Delete service?'}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </PageContainer>
  );
};

export default VendorServices;
