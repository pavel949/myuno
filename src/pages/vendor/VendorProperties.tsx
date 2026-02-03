import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorProperties, VendorProperty } from '@/hooks/useVendorProperties';
import { useFormDraft } from '@/hooks/useFormDraft';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Building2, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Bed,
  Bath,
  Ruler,
  MapPin,
  Zap,
  FileText,
  Image,
  Eye,
  Users,
  Home,
  DollarSign,
  Settings
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { AirbnbStyleImageUpload } from '@/components/upload/AirbnbStyleImageUpload';
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

// Import centralized taxonomy
import { 
  PROPERTY_TYPES, 
  LISTING_TYPES,
  ALL_AMENITIES,
  PHUKET_DISTRICTS,
  normalizeAmenityId,
  normalizeAmenities,
  normalizeDistrictId,
} from '@/lib/taxonomies';

// Use centralized taxonomy
const propertyTypes = PROPERTY_TYPES.map(t => ({
  id: t.id,
  label: t.labelEn,
  labelRu: t.labelRu,
}));

const listingTypes = LISTING_TYPES.map(l => ({
  id: l.id,
  label: l.labelEn,
  labelRu: l.labelRu,
}));

const pricePeriods = [
  { id: 'day', label: 'Per Day', labelRu: 'За день' },
  { id: 'month', label: 'Per Month', labelRu: 'За месяц' },
  { id: 'year', label: 'Per Year', labelRu: 'За год' },
];

// Use centralized amenities list (canonical IDs)
const amenitiesList = ALL_AMENITIES.map(a => ({
  id: a.id,
  label: a.labelEn,
  labelRu: a.labelRu,
  icon: a.icon,
}));

// Districts for dropdown
const districtOptions = PHUKET_DISTRICTS.map(d => ({
  id: d.id,
  label: d.labelEn,
  labelRu: d.labelRu,
  icon: d.icon,
}));

interface PropertyFormData {
  title_en: string;
  title_ru: string;
  internal_name: string; // For internal tracking
  description_en: string;
  description_ru: string;
  property_type: string;
  listing_type: string;
  price: string;
  price_period: string;
  bedrooms: string;
  bathrooms: string;
  area_sqm: string;
  max_guests: string;
  min_stay_nights: string;
  address: string;
  district: string;
  lat: string;
  lng: string;
  cover_image: string;
  images: string[];
  amenities: string[];
  instant_booking: boolean;
  is_active: boolean;
}

const initialFormData: PropertyFormData = {
  title_en: '',
  title_ru: '',
  internal_name: '',
  description_en: '',
  description_ru: '',
  property_type: 'apartment',
  listing_type: 'rent',
  price: '',
  price_period: 'month',
  bedrooms: '1',
  bathrooms: '1',
  area_sqm: '',
  max_guests: '2',
  min_stay_nights: '1',
  address: '',
  district: '',
  lat: '',
  lng: '',
  cover_image: '',
  images: [],
  amenities: [],
  instant_booking: false,
  is_active: true,
};

const VendorProperties = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { properties, isLoading: propertiesLoading, createProperty, updateProperty, deleteProperty } = useVendorProperties(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<VendorProperty | null>(null);
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
  } = useFormDraft<PropertyFormData>({
    key: 'vendor_property',
    initialData: initialFormData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const wizardSteps = useMemo(() => [
    { 
      id: 'basic', 
      title: 'Basic Info', 
      titleRu: 'Основное',
      icon: <FileText className="h-4 w-4" />,
      validate: () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title_en.trim()) {
          newErrors.title_en = isRussian ? 'Обязательное поле' : 'Required field';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 ? null : (isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      }
    },
    { 
      id: 'details', 
      title: 'Details', 
      titleRu: 'Детали',
      icon: <Settings className="h-4 w-4" />,
      validate: () => {
        const newErrors: Record<string, string> = {};
        if (!formData.price) {
          newErrors.price = isRussian ? 'Укажите цену' : 'Set price';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 ? null : (isRussian ? 'Укажите цену' : 'Set price');
      }
    },
    { 
      id: 'amenities', 
      title: 'Amenities', 
      titleRu: 'Удобства',
      icon: <Home className="h-4 w-4" />,
      validate: () => null
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

  useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  useEffect(() => {
    if (hasDraft && !editingProperty && !isDialogOpen) {
      setShowDraftBanner(true);
    }
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingProperty(null);
    setCurrentStep(0);
    setErrors({});
    clearDraft();
  };

  const openEditDialog = (property: VendorProperty) => {
    setEditingProperty(property);
    setFormData({
      title_en: property.title_en,
      title_ru: property.title_ru || '',
      internal_name: (property as any).internal_name || '',
      description_en: property.description_en || '',
      description_ru: property.description_ru || '',
      property_type: property.property_type,
      listing_type: property.listing_type,
      price: property.price?.toString() || '',
      price_period: property.price_period || 'month',
      bedrooms: property.bedrooms?.toString() || '1',
      bathrooms: property.bathrooms?.toString() || '1',
      area_sqm: property.area_sqm?.toString() || '',
      max_guests: property.max_guests?.toString() || '2',
      min_stay_nights: property.min_stay_nights?.toString() || '1',
      address: property.address || '',
      district: property.district || '',
      lat: property.lat?.toString() || '',
      lng: property.lng?.toString() || '',
      cover_image: property.cover_image || '',
      images: property.images || [],
      amenities: property.amenities || [],
      instant_booking: (property as any).instant_booking ?? false,
      is_active: property.is_active ?? true,
    });
    setCurrentStep(0);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title_en || !formData.price) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Normalize amenities before saving
      const normalizedAmenities = normalizeAmenities(formData.amenities);
      const normalizedDistrict = normalizeDistrictId(formData.district);
      
      const propertyData: Partial<VendorProperty> = {
        title_en: formData.title_en,
        title_ru: formData.title_ru || formData.title_en,
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        price: parseFloat(formData.price),
        price_period: formData.price_period,
        currency: 'THB',
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        area_sqm: formData.area_sqm ? parseInt(formData.area_sqm) : undefined,
        max_guests: parseInt(formData.max_guests) || 2,
        min_stay_nights: parseInt(formData.min_stay_nights) || 1,
        address: formData.address || undefined,
        district: normalizedDistrict || undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        cover_image: formData.cover_image || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        amenities: normalizedAmenities.length > 0 ? normalizedAmenities : undefined,
        is_active: formData.is_active,
      };

      const dataWithExtras = {
        ...propertyData,
        instant_booking: formData.instant_booking,
      };

      if (editingProperty) {
        const { error } = await updateProperty(editingProperty.id, dataWithExtras);
        if (error) throw error;
        toast.success(isRussian ? 'Объект обновлён' : 'Property updated');
      } else {
        const { error } = await createProperty(dataWithExtras);
        if (error) throw error;
        toast.success(isRussian ? 'Объект создан' : 'Property created');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    try {
      const { error } = await deleteProperty(propertyId);
      if (error) throw error;
      toast.success(isRussian ? 'Объект удалён' : 'Property deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting property');
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    const newAmenities = formData.amenities.includes(amenityId)
      ? formData.amenities.filter(a => a !== amenityId)
      : [...formData.amenities, amenityId];
    updateField('amenities', newAmenities);
  };

  const formatPrice = (price: number, period?: string) => {
    const periodLabel = period === 'day' 
      ? (isRussian ? '/день' : '/day')
      : period === 'month'
        ? (isRussian ? '/мес' : '/mo')
        : period === 'year'
          ? (isRussian ? '/год' : '/yr')
          : '';
    return `฿${price.toLocaleString()}${periodLabel}`;
  };

  const previewData = {
    type: 'property' as const,
    image: formData.cover_image,
    title: formData.title_en,
    titleRu: formData.title_ru,
    description: formData.description_en,
    descriptionRu: formData.description_ru,
    price: formData.price ? parseInt(formData.price) : undefined,
    pricePeriod: formData.price_period,
    propertyType: propertyTypes.find(t => t.id === formData.property_type)?.label,
    bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
    bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
    areaSqm: formData.area_sqm ? parseInt(formData.area_sqm) : undefined,
    district: formData.district,
    instantBooking: formData.instant_booking,
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
          {isRussian ? 'Добавить объект' : 'Add Property'}
        </Button>

        {propertiesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет объектов' : 'No properties'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Добавьте свою недвижимость' : 'Add your properties'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <Card key={property.id} className={!property.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {property.cover_image ? (
                      <img 
                        src={property.cover_image} 
                        alt={property.title_en}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">
                              {isRussian ? property.title_ru : property.title_en}
                            </h3>
                            {(property as any).instant_booking && (
                              <Badge className="bg-amber-500 text-white text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                {isRussian ? 'Мгновенно' : 'Instant'}
                              </Badge>
                            )}
                            <ApprovalStatusBadge 
                              status={(property as any).approval_status} 
                              rejectionReason={(property as any).rejection_reason}
                            />
                            {!property.is_active && (
                              <Badge variant="outline" className="text-xs">
                                {isRussian ? 'Неактивен' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
                            <span className="flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              {property.bedrooms}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              {property.bathrooms}
                            </span>
                            {property.area_sqm && (
                              <span className="flex items-center gap-1">
                                <Ruler className="h-3 w-3" />
                                {property.area_sqm}м²
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">
                              {property.price && formatPrice(property.price, property.price_period)}
                            </span>
                            {property.district && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {property.district}
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
                            <DropdownMenuItem onClick={() => openEditDialog(property)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirmId(property.id)}
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

        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {isRussian ? 'Удалить объект?' : 'Delete property?'}
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

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
        }}>
          <DialogContent className="w-[calc(100vw-16px)] sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {editingProperty 
                    ? (isRussian ? 'Редактировать объект' : 'Edit Property')
                    : (isRussian ? 'Новый объект' : 'New Property')}
                </DialogTitle>
                {!editingProperty && (
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
                  <WizardStepContent stepId="basic" currentStepId={wizardSteps[currentStep].id}>
                    <VendorFormSection
                      title={isRussian ? 'Название объекта' : 'Property Title'}
                      icon={<Building2 className="h-4 w-4" />}
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Название (EN)' : 'Title (EN)'}
                          name="title_en"
                          value={formData.title_en}
                          onChange={(value) => updateField('title_en', value)}
                          placeholder="Modern 2BR Apartment"
                          example="Cozy Villa with Pool"
                          required
                          error={errors.title_en}
                          isValid={formData.title_en.length >= 3}
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Название (RU)' : 'Title (RU)'}
                          name="title_ru"
                          value={formData.title_ru}
                          onChange={(value) => updateField('title_ru', value)}
                          placeholder="Современные апартаменты 2BR"
                          helpText={isRussian ? 'Оставьте пустым для автозаполнения' : 'Leave empty to auto-fill'}
                        />
                      </div>
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Тип объекта' : 'Property Type'}
                      icon={<Home className="h-4 w-4" />}
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{isRussian ? 'Тип недвижимости' : 'Property Type'}</Label>
                          <Select
                            value={formData.property_type}
                            onValueChange={(value) => updateField('property_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {propertyTypes.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                  {isRussian ? type.labelRu : type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{isRussian ? 'Тип объявления' : 'Listing Type'}</Label>
                          <Select
                            value={formData.listing_type}
                            onValueChange={(value) => updateField('listing_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {listingTypes.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                  {isRussian ? type.labelRu : type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Описание' : 'Description'}
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
                          placeholder="Describe your property..."
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Описание (RU)' : 'Description (RU)'}
                          name="description_ru"
                          value={formData.description_ru}
                          onChange={(value) => updateField('description_ru', value)}
                          type="textarea"
                          rows={4}
                          placeholder="Опишите объект..."
                        />
                      </div>
                    </VendorFormSection>
                  </WizardStepContent>

                  <WizardStepContent stepId="details" currentStepId={wizardSteps[currentStep].id}>
                    <VendorFormSection
                      title={isRussian ? 'Цена' : 'Pricing'}
                      icon={<DollarSign className="h-4 w-4" />}
                      badge={isRussian ? 'Важно' : 'Important'}
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Цена (THB)' : 'Price (THB)'}
                          name="price"
                          value={formData.price}
                          onChange={(value) => updateField('price', value)}
                          type="number"
                          placeholder="25000"
                          required
                          error={errors.price}
                          isValid={!!formData.price}
                        />
                        <div className="space-y-2">
                          <Label>{isRussian ? 'Период' : 'Period'}</Label>
                          <Select
                            value={formData.price_period}
                            onValueChange={(value) => updateField('price_period', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {pricePeriods.map(period => (
                                <SelectItem key={period.id} value={period.id}>
                                  {isRussian ? period.labelRu : period.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Параметры' : 'Specifications'}
                      icon={<Settings className="h-4 w-4" />}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Спален' : 'Bedrooms'}
                          name="bedrooms"
                          value={formData.bedrooms}
                          onChange={(value) => updateField('bedrooms', value)}
                          type="number"
                          min={0}
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Ванных' : 'Bathrooms'}
                          name="bathrooms"
                          value={formData.bathrooms}
                          onChange={(value) => updateField('bathrooms', value)}
                          type="number"
                          min={0}
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Площадь (м²)' : 'Area (m²)'}
                          name="area_sqm"
                          value={formData.area_sqm}
                          onChange={(value) => updateField('area_sqm', value)}
                          type="number"
                          placeholder="80"
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Гостей' : 'Guests'}
                          name="max_guests"
                          value={formData.max_guests}
                          onChange={(value) => updateField('max_guests', value)}
                          type="number"
                          min={1}
                        />
                      </div>
                      
                      {formData.listing_type === 'rent' && (
                        <div className="mt-4">
                          <FormFieldWithHelp
                            label={isRussian ? 'Мин. срок (ночей)' : 'Min Stay (nights)'}
                            name="min_stay_nights"
                            value={formData.min_stay_nights}
                            onChange={(value) => updateField('min_stay_nights', value)}
                            type="number"
                            min={1}
                            className="max-w-[200px]"
                          />
                        </div>
                      )}
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Локация' : 'Location'}
                      icon={<MapPin className="h-4 w-4" />}
                      collapsible
                      defaultOpen
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormFieldWithHelp
                          label={isRussian ? 'Район' : 'District'}
                          name="district"
                          value={formData.district}
                          onChange={(value) => updateField('district', value)}
                          placeholder="Bangtao, Phuket"
                        />
                        <FormFieldWithHelp
                          label={isRussian ? 'Адрес' : 'Address'}
                          name="address"
                          value={formData.address}
                          onChange={(value) => updateField('address', value)}
                          placeholder="123 Beach Road"
                        />
                      </div>
                    </VendorFormSection>

                    <VendorFormSection title={isRussian ? 'Опции' : 'Options'}>
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={formData.instant_booking}
                            onCheckedChange={(checked) => updateField('instant_booking', checked)}
                          />
                          <Label className="flex items-center gap-1">
                            <Zap className="h-4 w-4 text-amber-500" />
                            {isRussian ? 'Мгновенное бронирование' : 'Instant Booking'}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => updateField('is_active', checked)}
                          />
                          <Label>{isRussian ? 'Активен' : 'Active'}</Label>
                        </div>
                      </div>
                    </VendorFormSection>
                  </WizardStepContent>

                  <WizardStepContent stepId="amenities" currentStepId={wizardSteps[currentStep].id}>
                    <VendorFormSection
                      title={isRussian ? 'Удобства и услуги' : 'Amenities & Features'}
                      description={isRussian ? 'Выберите все доступные удобства' : 'Select all available amenities'}
                      icon={<Home className="h-4 w-4" />}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {amenitiesList.map(amenity => (
                          <div 
                            key={amenity.id}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                              formData.amenities.includes(amenity.id)
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => handleAmenityToggle(amenity.id)}
                          >
                            <Checkbox
                              checked={formData.amenities.includes(amenity.id)}
                              onCheckedChange={() => handleAmenityToggle(amenity.id)}
                            />
                            <span className="text-sm">
                              {isRussian ? amenity.labelRu : amenity.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {formData.amenities.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-4">
                          {isRussian ? 'Выбрано:' : 'Selected:'} {formData.amenities.length} {isRussian ? 'удобств' : 'amenities'}
                        </p>
                      )}
                    </VendorFormSection>
                  </WizardStepContent>

                  <WizardStepContent stepId="photos" currentStepId={wizardSteps[currentStep].id}>
                    <VendorFormSection
                      title={isRussian ? 'Обложка' : 'Cover Image'}
                      description={isRussian ? 'Главное фото объекта' : 'Main property photo'}
                      icon={<Image className="h-4 w-4" />}
                      badge={isRussian ? 'Рекомендуется' : 'Recommended'}
                    >
                      <ImageUpload
                        value={formData.cover_image}
                        onChange={(url) => updateField('cover_image', url)}
                        folder="properties"
                        placeholder={isRussian ? 'Загрузить обложку' : 'Upload cover'}
                      />
                    </VendorFormSection>

                    <VendorFormSection
                      title={isRussian ? 'Галерея' : 'Gallery'}
                      description={isRussian ? 'До 20 дополнительных фото' : 'Up to 20 additional photos'}
                      icon={<Image className="h-4 w-4" />}
                    >
                      <MultiImageUpload
                        value={formData.images}
                        onChange={(urls) => updateField('images', urls)}
                        folder="properties"
                        maxImages={20}
                      />
                    </VendorFormSection>
                  </WizardStepContent>

                  <WizardStepContent stepId="review" currentStepId={wizardSteps[currentStep].id}>
                    <VendorFormSection
                      title={isRussian ? 'Проверьте данные' : 'Review Your Listing'}
                      description={isRussian ? 'Убедитесь, что всё верно' : 'Make sure everything is correct'}
                      icon={<Eye className="h-4 w-4" />}
                    >
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">{isRussian ? 'Название:' : 'Title:'}</span>{' '}
                            <span className="font-medium">{formData.title_en || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isRussian ? 'Тип:' : 'Type:'}</span>{' '}
                            <span className="font-medium">
                              {propertyTypes.find(t => t.id === formData.property_type)?.[isRussian ? 'labelRu' : 'label']}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isRussian ? 'Цена:' : 'Price:'}</span>{' '}
                            <span className="font-medium">
                              {formData.price ? formatPrice(parseInt(formData.price), formData.price_period) : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isRussian ? 'Спален:' : 'Bedrooms:'}</span>{' '}
                            <span className="font-medium">{formData.bedrooms}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isRussian ? 'Район:' : 'District:'}</span>{' '}
                            <span className="font-medium">{formData.district || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isRussian ? 'Гостей:' : 'Guests:'}</span>{' '}
                            <span className="font-medium">{formData.max_guests}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {formData.instant_booking && (
                            <Badge className="bg-amber-500">
                              <Zap className="h-3 w-3 mr-1" />
                              {isRussian ? 'Мгновенное' : 'Instant'}
                            </Badge>
                          )}
                          {formData.amenities.length > 0 && (
                            <Badge variant="secondary">{formData.amenities.length} {isRussian ? 'удобств' : 'amenities'}</Badge>
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

export default VendorProperties;
