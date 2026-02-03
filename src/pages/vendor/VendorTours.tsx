import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorTours, VendorTour } from '@/hooks/useVendorTours';
import { useFormDraft } from '@/hooks/useFormDraft';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Map, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Users,
  MapPin,
  Star,
  FileText,
  Image,
  CheckCircle,
  Settings
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { ApprovalStatusBadge } from '@/components/vendor/ApprovalStatusBadge';
import {
  CardPreview,
  CardPreviewSection,
  VendorFormSection,
  VendorFormWizard,
  WizardStepContent,
  FormFieldWithHelp,
  DraftIndicator,
  DraftRestorationBanner,
  type WizardStep,
} from '@/components/vendor';

const tourCategories = [
  { id: 'island', label: 'Island Hopping', labelRu: 'Острова' },
  { id: 'cultural', label: 'Cultural', labelRu: 'Культурный' },
  { id: 'adventure', label: 'Adventure', labelRu: 'Приключения' },
  { id: 'nature', label: 'Nature', labelRu: 'Природа' },
  { id: 'food', label: 'Food Tour', labelRu: 'Гастрономический' },
  { id: 'city', label: 'City Tour', labelRu: 'Городской' },
];

const difficultyLevels = [
  { id: 'easy', label: 'Easy', labelRu: 'Лёгкий' },
  { id: 'moderate', label: 'Moderate', labelRu: 'Средний' },
  { id: 'challenging', label: 'Challenging', labelRu: 'Сложный' },
];

interface TourFormData {
  title_en: string;
  title_ru: string;
  description_en: string;
  description_ru: string;
  category: string;
  difficulty: string;
  duration_hours: string;
  price: string;
  max_participants: string;
  meeting_point: string;
  cover_image: string;
  images: string[];
  includes: string;
  highlights: string;
  is_active: boolean;
}

const initialFormData: TourFormData = {
  title_en: '',
  title_ru: '',
  description_en: '',
  description_ru: '',
  category: 'island',
  difficulty: 'easy',
  duration_hours: '4',
  price: '',
  max_participants: '10',
  meeting_point: '',
  cover_image: '',
  images: [],
  includes: '',
  highlights: '',
  is_active: true,
};

const VendorTours = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { tours, isLoading: toursLoading, createTour, updateTour, deleteTour } = useVendorTours(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<VendorTour | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Form draft auto-save
  const {
    formData,
    setFormData,
    updateField,
    hasDraft,
    lastSaved,
    clearDraft,
    resetForm: resetDraft,
    restoreDraft,
  } = useFormDraft<TourFormData>({
    key: 'tour_form',
    initialData: initialFormData,
  });

  // Form validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    
    if (touched.title_en && !formData.title_en.trim()) {
      errs.title_en = isRussian ? 'Название обязательно' : 'Title is required';
    }
    
    if (touched.price) {
      if (!formData.price) {
        errs.price = isRussian ? 'Укажите цену' : 'Price is required';
      } else if (parseFloat(formData.price) <= 0) {
        errs.price = isRussian ? 'Цена должна быть больше 0' : 'Price must be greater than 0';
      }
    }
    
    if (touched.duration_hours && (!formData.duration_hours || parseInt(formData.duration_hours) <= 0)) {
      errs.duration_hours = isRussian ? 'Укажите длительность' : 'Duration is required';
    }
    
    if (touched.max_participants && (!formData.max_participants || parseInt(formData.max_participants) <= 0)) {
      errs.max_participants = isRussian ? 'Укажите количество участников' : 'Max participants is required';
    }
    
    return errs;
  }, [formData, touched]);

  const isRussian = language === 'ru';

  // Wizard steps
  const wizardSteps: WizardStep[] = [
    { 
      id: 'basic', 
      title: 'Basic Info', 
      titleRu: 'Основное',
      icon: <FileText className="h-4 w-4" />,
      validate: () => {
        if (!formData.title_en.trim()) {
          setTouched(prev => ({ ...prev, title_en: true }));
          return isRussian ? 'Заполните название' : 'Please fill in the title';
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
          setTouched(prev => ({ ...prev, price: true }));
          return isRussian ? 'Укажите цену' : 'Please enter a price';
        }
        return null;
      }
    },
    { 
      id: 'details', 
      title: 'Details', 
      titleRu: 'Детали',
      icon: <Settings className="h-4 w-4" />
    },
    { 
      id: 'media', 
      title: 'Photos', 
      titleRu: 'Фото',
      icon: <Image className="h-4 w-4" />
    },
    { 
      id: 'review', 
      title: 'Review', 
      titleRu: 'Проверка',
      icon: <CheckCircle className="h-4 w-4" />
    },
  ];

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
    resetDraft();
    setTouched({});
    setEditingTour(null);
    setCurrentStep(0);
  };

  const openNewDialog = () => {
    resetForm();
    // Check if there's a saved draft
    if (hasDraft) {
      setShowDraftBanner(true);
    }
    setIsDialogOpen(true);
  };

  const openEditDialog = (tour: VendorTour) => {
    setEditingTour(tour);
    setFormData({
      title_en: tour.title_en,
      title_ru: tour.title_ru || '',
      description_en: tour.description_en || '',
      description_ru: tour.description_ru || '',
      category: tour.category || 'island',
      difficulty: tour.difficulty || 'easy',
      duration_hours: tour.duration_hours?.toString() || '4',
      price: tour.price?.toString() || '',
      max_participants: tour.max_participants?.toString() || '10',
      meeting_point: tour.meeting_point || '',
      cover_image: tour.cover_image || '',
      images: tour.images || [],
      includes: (tour.includes || []).join('\n'),
      highlights: (tour.highlights || []).join('\n'),
      is_active: tour.is_active ?? true,
    });
    setTouched({});
    setCurrentStep(0);
    setShowDraftBanner(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Final validation
    if (!formData.title_en || !formData.price) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const includesArray = formData.includes.split('\n').filter(s => s.trim());
      const highlightsArray = formData.highlights.split('\n').filter(s => s.trim());

      const tourData = {
        title_en: formData.title_en,
        title_ru: formData.title_ru || formData.title_en,
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        category: formData.category,
        difficulty: formData.difficulty,
        duration_hours: parseInt(formData.duration_hours) || 4,
        price: parseFloat(formData.price),
        currency: 'THB',
        max_participants: parseInt(formData.max_participants) || 10,
        meeting_point: formData.meeting_point || undefined,
        cover_image: formData.cover_image || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        includes: includesArray.length > 0 ? includesArray : undefined,
        highlights: highlightsArray.length > 0 ? highlightsArray : undefined,
        is_active: formData.is_active,
      };

      if (editingTour) {
        const { error } = await updateTour(editingTour.id, tourData);
        if (error) throw error;
        toast.success(isRussian ? 'Тур обновлён' : 'Tour updated');
      } else {
        const { error } = await createTour(tourData);
        if (error) throw error;
        toast.success(isRussian ? 'Тур создан' : 'Tour created');
      }

      setIsDialogOpen(false);
      resetForm();
      clearDraft();
    } catch (error) {
      console.error('Error saving tour:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving tour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tourId: string) => {
    try {
      const { error } = await deleteTour(tourId);
      if (error) throw error;
      toast.success(isRussian ? 'Тур удалён' : 'Tour deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting tour:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting tour');
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  if (authLoading || profileLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!profile) return null;

  return (
    <PageContainer>

        <Button 
          className="w-full mb-4" 
          onClick={openNewDialog}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRussian ? 'Добавить тур' : 'Add Tour'}
        </Button>

        {toursLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : tours.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет туров' : 'No tours'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Добавьте свои туры' : 'Add your tours'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tours.map((tour) => (
              <Card key={tour.id} className={!tour.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {tour.cover_image ? (
                      <img 
                        src={tour.cover_image} 
                        alt={tour.title_en}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Map className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium truncate">
                              {isRussian ? tour.title_ru : tour.title_en}
                            </h3>
                            <ApprovalStatusBadge 
                              status={(tour as any).approval_status} 
                              rejectionReason={(tour as any).rejection_reason}
                            />
                            {!tour.is_active && (
                              <Badge variant="outline" className="text-xs">
                                {isRussian ? 'Неактивен' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {tour.duration_hours}h
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {tour.max_participants}
                            </span>
                            {tour.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {tour.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          {tour.meeting_point && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                              <MapPin className="h-3 w-3" />
                              {tour.meeting_point}
                            </p>
                          )}
                          <p className="font-bold text-primary">
                            ฿{tour.price?.toLocaleString()}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(tour)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => setDeleteConfirmId(tour.id)}
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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setShowDraftBanner(false);
          }
          setIsDialogOpen(open);
        }}>
          <DialogContent className="w-[calc(100vw-16px)] sm:max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {editingTour 
                    ? (isRussian ? 'Редактировать тур' : 'Edit Tour')
                    : (isRussian ? 'Новый тур' : 'New Tour')}
                </DialogTitle>
                {!editingTour && (
                  <DraftIndicator
                    hasDraft={hasDraft}
                    lastSaved={lastSaved}
                    onClear={clearDraft}
                    onRestore={restoreDraft}
                  />
                )}
              </div>
            </DialogHeader>

            {/* Draft restoration banner */}
            {showDraftBanner && !editingTour && (
              <DraftRestorationBanner
                onRestore={() => {
                  restoreDraft();
                  setShowDraftBanner(false);
                }}
                onDiscard={() => {
                  resetDraft();
                  setShowDraftBanner(false);
                }}
              />
            )}

            <div className="flex-1 min-h-0 grid md:grid-cols-[1fr,280px] gap-6">
              {/* Wizard Form */}
              <VendorFormWizard
                steps={wizardSteps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel="Create Tour"
                submitLabelRu="Создать тур"
              >
                {/* Step 1: Basic Info */}
                <WizardStepContent stepId="basic" currentStepId={wizardSteps[currentStep].id}>
                  <VendorFormSection
                    title={isRussian ? 'Основная информация' : 'Basic Information'}
                    description={isRussian ? 'Название и описание тура' : 'Tour name and description'}
                    icon={<FileText className="h-4 w-4" />}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isRussian ? 'Категория' : 'Category'}</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => updateField('category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tourCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {isRussian ? cat.labelRu : cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{isRussian ? 'Сложность' : 'Difficulty'}</Label>
                        <Select
                          value={formData.difficulty}
                          onValueChange={(value) => updateField('difficulty', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {difficultyLevels.map(level => (
                              <SelectItem key={level.id} value={level.id}>
                                {isRussian ? level.labelRu : level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <FormFieldWithHelp
                      label={isRussian ? 'Название (EN)' : 'Title (EN)'}
                      name="title_en"
                      value={formData.title_en}
                      onChange={(value) => updateField('title_en', value)}
                      required
                      placeholder="Phi Phi Islands Day Trip"
                      helpText={isRussian ? 'Название на английском для международных гостей' : 'English title for international guests'}
                      error={errors.title_en}
                      isValid={!!formData.title_en && !errors.title_en}
                    />

                    <FormFieldWithHelp
                      label={isRussian ? 'Название (RU)' : 'Title (Russian)'}
                      name="title_ru"
                      value={formData.title_ru}
                      onChange={(value) => updateField('title_ru', value)}
                      placeholder="Экскурсия на острова Пхи-Пхи"
                      example={isRussian ? 'Оставьте пустым для автоперевода' : 'Leave empty for auto-translation'}
                    />

                    <FormFieldWithHelp
                      label={isRussian ? 'Описание (EN)' : 'Description (EN)'}
                      name="description_en"
                      value={formData.description_en}
                      onChange={(value) => updateField('description_en', value)}
                      type="textarea"
                      rows={3}
                      helpText={isRussian ? 'Подробное описание тура' : 'Detailed tour description'}
                    />

                    <FormFieldWithHelp
                      label={isRussian ? 'Описание (RU)' : 'Description (Russian)'}
                      name="description_ru"
                      value={formData.description_ru}
                      onChange={(value) => updateField('description_ru', value)}
                      type="textarea"
                      rows={3}
                    />
                  </VendorFormSection>

                  <VendorFormSection
                    title={isRussian ? 'Цена и время' : 'Price & Time'}
                    icon={<Clock className="h-4 w-4" />}
                    className="mt-6"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormFieldWithHelp
                        label={isRussian ? 'Цена (฿)' : 'Price (฿)'}
                        name="price"
                        value={formData.price}
                        onChange={(value) => updateField('price', value)}
                        type="number"
                        required
                        placeholder="2500"
                        min={0}
                        error={errors.price}
                        isValid={!!formData.price && parseFloat(formData.price) > 0}
                      />
                      <FormFieldWithHelp
                        label={isRussian ? 'Длительность (часы)' : 'Duration (hours)'}
                        name="duration_hours"
                        value={formData.duration_hours}
                        onChange={(value) => updateField('duration_hours', value)}
                        type="number"
                        min={1}
                        max={24}
                        error={errors.duration_hours}
                      />
                    </div>
                  </VendorFormSection>
                </WizardStepContent>

                {/* Step 2: Details */}
                <WizardStepContent stepId="details" currentStepId={wizardSteps[currentStep].id}>
                  <VendorFormSection
                    title={isRussian ? 'Параметры тура' : 'Tour Parameters'}
                    icon={<Settings className="h-4 w-4" />}
                  >
                    <FormFieldWithHelp
                      label={isRussian ? 'Макс. участников' : 'Max Participants'}
                      name="max_participants"
                      value={formData.max_participants}
                      onChange={(value) => updateField('max_participants', value)}
                      type="number"
                      min={1}
                      helpText={isRussian ? 'Максимальное количество гостей в группе' : 'Maximum guests per group'}
                    />

                    <FormFieldWithHelp
                      label={isRussian ? 'Место встречи' : 'Meeting Point'}
                      name="meeting_point"
                      value={formData.meeting_point}
                      onChange={(value) => updateField('meeting_point', value)}
                      placeholder="Chalong Pier"
                      helpText={isRussian ? 'Где гости встречаются с гидом' : 'Where guests meet the guide'}
                    />
                  </VendorFormSection>

                  <VendorFormSection
                    title={isRussian ? 'Что включено' : "What's Included"}
                    icon={<CheckCircle className="h-4 w-4" />}
                    className="mt-6"
                  >
                    <FormFieldWithHelp
                      label={isRussian ? 'Включено в стоимость' : 'Included in price'}
                      name="includes"
                      value={formData.includes}
                      onChange={(value) => updateField('includes', value)}
                      type="textarea"
                      rows={4}
                      placeholder={isRussian 
                        ? "Трансфер из отеля\nОбед\nСнаряжение для снорклинга" 
                        : "Hotel pickup\nLunch\nSnorkeling gear"}
                      example={isRussian ? 'По одному пункту на строку' : 'One item per line'}
                    />

                    <FormFieldWithHelp
                      label={isRussian ? 'Основные моменты' : 'Highlights'}
                      name="highlights"
                      value={formData.highlights}
                      onChange={(value) => updateField('highlights', value)}
                      type="textarea"
                      rows={4}
                      placeholder={isRussian 
                        ? "Посещение Maya Bay\nСнорклинг с рыбками\nЗакат на пляже" 
                        : "Visit Maya Bay\nSnorkeling with fish\nBeach sunset"}
                      example={isRussian ? 'По одному пункту на строку' : 'One item per line'}
                    />
                  </VendorFormSection>
                </WizardStepContent>

                {/* Step 3: Photos */}
                <WizardStepContent stepId="media" currentStepId={wizardSteps[currentStep].id}>
                  <VendorFormSection
                    title={isRussian ? 'Фотографии' : 'Photos'}
                    description={isRussian ? 'Добавьте качественные фото тура' : 'Add high-quality tour photos'}
                    icon={<Image className="h-4 w-4" />}
                    helpText={isRussian 
                      ? 'Первое фото будет использоваться как обложка' 
                      : 'First photo will be used as cover'}
                  >
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Фото обложки' : 'Cover Image'}</Label>
                      <ImageUpload
                        value={formData.cover_image}
                        onChange={(url) => updateField('cover_image', url)}
                        folder="tours"
                        placeholder={isRussian ? 'Загрузить фото' : 'Upload photo'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{isRussian ? 'Галерея фото' : 'Photo Gallery'}</Label>
                      <MultiImageUpload
                        value={formData.images}
                        onChange={(urls) => updateField('images', urls)}
                        folder="tours"
                        maxImages={8}
                      />
                      <p className="text-xs text-muted-foreground">
                        {isRussian ? 'До 8 фотографий' : 'Up to 8 photos'}
                      </p>
                    </div>
                  </VendorFormSection>
                </WizardStepContent>

                {/* Step 4: Review */}
                <WizardStepContent stepId="review" currentStepId={wizardSteps[currentStep].id}>
                  <VendorFormSection
                    title={isRussian ? 'Проверка и публикация' : 'Review & Publish'}
                    description={isRussian ? 'Проверьте данные перед сохранением' : 'Review details before saving'}
                    icon={<CheckCircle className="h-4 w-4" />}
                  >
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{isRussian ? 'Название' : 'Title'}:</span>
                          <span className="font-medium">{formData.title_en || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{isRussian ? 'Категория' : 'Category'}:</span>
                          <span>{tourCategories.find(c => c.id === formData.category)?.[isRussian ? 'labelRu' : 'label']}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{isRussian ? 'Цена' : 'Price'}:</span>
                          <span className="font-bold text-primary">฿{parseFloat(formData.price || '0').toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{isRussian ? 'Длительность' : 'Duration'}:</span>
                          <span>{formData.duration_hours} {isRussian ? 'ч' : 'h'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{isRussian ? 'Участники' : 'Participants'}:</span>
                          <span>{isRussian ? 'до' : 'up to'} {formData.max_participants}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="is_active">{isRussian ? 'Опубликовать сразу' : 'Publish immediately'}</Label>
                          <p className="text-xs text-muted-foreground">
                            {isRussian ? 'Тур станет видимым для клиентов' : 'Tour will be visible to customers'}
                          </p>
                        </div>
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => updateField('is_active', checked)}
                        />
                      </div>
                    </div>
                  </VendorFormSection>
                </WizardStepContent>
              </VendorFormWizard>

              {/* Preview Panel */}
              <CardPreviewSection className="hidden md:block">
                <CardPreview
                  type="tour"
                  image={formData.cover_image}
                  title={formData.title_en}
                  titleRu={formData.title_ru}
                  description={formData.description_en}
                  descriptionRu={formData.description_ru}
                  price={formData.price ? parseFloat(formData.price) : undefined}
                  durationHours={formData.duration_hours ? parseInt(formData.duration_hours) : undefined}
                  maxParticipants={formData.max_participants ? parseInt(formData.max_participants) : undefined}
                  category={formData.category}
                  difficulty={formData.difficulty}
                  meetingPoint={formData.meeting_point}
                />
              </CardPreviewSection>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить тур?' : 'Delete tour?'}</DialogTitle>
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

export default VendorTours;
