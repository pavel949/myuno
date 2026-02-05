import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminProperties } from '@/hooks/useAdminContent';
import { VendorProperty } from '@/hooks/useVendorProperties';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';
import { 
  Building2, 
  Plus, 
  Loader2,
} from 'lucide-react';
import { AirbnbStyleImageUpload } from '@/components/upload/AirbnbStyleImageUpload';
import { PropertyCard } from '@/components/property/PropertyCard';
import { HighlightsSection } from '@/components/owner/property-manage/HighlightsSection';
import { 
  PROPERTY_TYPES as TAXONOMY_PROPERTY_TYPES, 
  PHUKET_DISTRICTS,
  ALL_AMENITIES,
  LISTING_TYPES 
} from '@/lib/taxonomies';

// Use centralized taxonomy
const propertyTypes = TAXONOMY_PROPERTY_TYPES.map(t => ({
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

// Use centralized amenities (all 36)
const amenitiesList = ALL_AMENITIES.map(a => ({
  id: a.id,
  label: a.labelEn,
  labelRu: a.labelRu,
}));

// Use centralized districts (all 22)
const districtOptions = PHUKET_DISTRICTS.map(d => ({
  id: d.id,
  label: d.labelEn,
  labelRu: d.labelRu,
}));

export default function AdminProperties() {
  const navigate = useNavigate();
  const errorLog = createErrorHandler('AdminProperties');
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const { properties, isLoading: propertiesLoading, createProperty, updateProperty, deleteProperty } = useAdminProperties(filterProviderId || undefined);
  
  // Redirect to unified property creation wizard instead of opening dialog
  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      navigate('/owner/properties/new?context=admin&return=/admin/properties');
    }
  }, [searchParams, navigate]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<VendorProperty | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    provider_id: '',
    internal_name: '',
    title_en: '',
    title_ru: '',
    description_en: '',
    description_ru: '',
    property_type: 'apartment',
    listing_modes: ['rent'] as string[],
    price: '',
    price_period: 'month',
    sale_price: '',
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
    images: [] as string[],
    amenities: [] as string[],
    highlights: [] as string[],
    instant_booking: false,
    is_active: true,
  });

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      provider_id: '',
      internal_name: '',
      title_en: '',
      title_ru: '',
      description_en: '',
      description_ru: '',
      property_type: 'apartment',
      listing_modes: ['rent'],
      price: '',
      price_period: 'month',
      sale_price: '',
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
      highlights: [],
      instant_booking: false,
      is_active: true,
    });
    setEditingProperty(null);
  };

  const openEditDialog = (property: VendorProperty) => {
    setEditingProperty(property);
    // Parse listing_modes from property - support both old listing_type and new listing_modes
    const modes = (property as any).listing_modes?.length > 0 
      ? (property as any).listing_modes 
      : [property.listing_type || 'rent'];
    
    setFormData({
      provider_id: property.provider_id || '',
      internal_name: property.internal_name || '',
      title_en: property.title_en,
      title_ru: property.title_ru || '',
      description_en: property.description_en || '',
      description_ru: property.description_ru || '',
      property_type: property.property_type,
      listing_modes: modes,
      price: property.price?.toString() || '',
      price_period: property.price_period || 'month',
      sale_price: (property as any).sale_price?.toString() || '',
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
      highlights: (property as any).highlights || [],
      instant_booking: (property as any).instant_booking ?? false,
      is_active: property.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Validate required fields based on listing modes
    const needsRentPrice = formData.listing_modes.includes('rent');
    const needsSalePrice = formData.listing_modes.includes('sale');
    
    if (!formData.title_en || !formData.provider_id) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }
    
    if (needsRentPrice && !formData.price) {
      toast.error(isRussian ? 'Укажите цену аренды' : 'Please enter rental price');
      return;
    }
    
    if (needsSalePrice && !formData.sale_price) {
      toast.error(isRussian ? 'Укажите цену продажи' : 'Please enter sale price');
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine primary listing_type for backward compatibility
      const primaryListingType = formData.listing_modes.includes('sale') && !formData.listing_modes.includes('rent') 
        ? 'sale' 
        : 'rent';
      
      const propertyData: any = {
        provider_id: formData.provider_id,
        internal_name: formData.internal_name || undefined,
        title_en: formData.title_en,
        title_ru: formData.title_ru || formData.title_en,
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        property_type: formData.property_type,
        listing_type: primaryListingType,
        listing_modes: formData.listing_modes,
        price: parseFloat(formData.price) || undefined,
        price_period: formData.price_period,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : undefined,
        currency: 'THB',
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        area_sqm: formData.area_sqm ? parseInt(formData.area_sqm) : undefined,
        max_guests: parseInt(formData.max_guests) || 2,
        min_stay_nights: parseInt(formData.min_stay_nights) || 1,
        address: formData.address || undefined,
        district: formData.district || undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        cover_image: formData.cover_image || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        amenities: formData.amenities.length > 0 ? formData.amenities : undefined,
        highlights: formData.highlights.length > 0 ? formData.highlights : undefined,
        instant_booking: formData.instant_booking,
        is_active: formData.is_active,
      };

      if (editingProperty) {
        const { error } = await updateProperty(editingProperty.id, propertyData);
        if (error) throw error;
        toast.success(isRussian ? 'Объект обновлён' : 'Property updated');
      } else {
        const { error } = await createProperty(propertyData);
        if (error) throw error;
        toast.success(isRussian ? 'Объект создан' : 'Property created');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      errorLog.error(error, 'save_property');
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
      errorLog.error(error, 'delete_property');
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
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

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Управление недвижимостью' : 'Property Management'}
          showBack
        />

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
                {isRussian ? 'Добавьте недвижимость' : 'Add properties'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                variant="list"
                mode="admin"
               onView={() => openEditDialog(property)}
                onEdit={() => openEditDialog(property)}
                onDelete={() => setDeleteConfirmId(property.id)}
                showApprovalStatus
                showInstantBadge
              />
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProperty 
                  ? (isRussian ? 'Редактировать объект' : 'Edit Property')
                  : (isRussian ? 'Новый объект' : 'New Property')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Provider Selection */}
              <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed">
                <ProviderSelector
                  value={formData.provider_id}
                  onChange={(id) => setFormData(prev => ({ ...prev, provider_id: id }))}
                  label={isRussian ? 'Привязать к провайдеру' : 'Assign to Provider'}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Тип объекта' : 'Property Type'}</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, property_type: value }))}
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
                  <Label>{isRussian ? 'Тип объявления' : 'Listing Mode'}</Label>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {listingTypes.map(type => (
                      <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={formData.listing_modes.includes(type.id)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => {
                              const modes = checked
                                ? [...prev.listing_modes, type.id]
                                : prev.listing_modes.filter(m => m !== type.id);
                              // Ensure at least one mode is selected
                              return { ...prev, listing_modes: modes.length > 0 ? modes : ['rent'] };
                            });
                          }}
                        />
                        <span className="text-sm">{isRussian ? type.labelRu : type.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRussian 
                      ? 'Можно выбрать оба варианта для объектов на аренду и продажу' 
                      : 'Select both for properties available for rent and sale'}
                  </p>
                </div>
              </div>

              {/* Internal Name */}
              <div className="space-y-2">
                <Label>{isRussian ? 'Внутреннее название' : 'Internal Name'}</Label>
                <Input
                  value={formData.internal_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, internal_name: e.target.value }))}
                  placeholder={isRussian ? 'Для внутреннего использования' : 'For internal use only'}
                />
                <p className="text-xs text-muted-foreground">
                  {isRussian 
                    ? 'Не отображается клиентам. Например: "Вилла Петровых"' 
                    : 'Not shown to customers. E.g.: "Villa Petrov Family"'}
                </p>
              </div>

              {/* Photo Upload - Airbnb Style */}
              <div className="space-y-2">
                <Label>{isRussian ? 'Фотографии' : 'Photos'}</Label>
                <AirbnbStyleImageUpload
                  value={formData.cover_image 
                    ? [formData.cover_image, ...formData.images] 
                    : formData.images}
                  onChange={(urls) => {
                    if (urls.length === 0) {
                      setFormData(prev => ({ ...prev, cover_image: '', images: [] }));
                    } else {
                      setFormData(prev => ({ 
                        ...prev, 
                        cover_image: urls[0], 
                        images: urls.slice(1) 
                      }));
                    }
                  }}
                  folder="properties"
                  maxImages={20}
                />
                <p className="text-xs text-muted-foreground">
                  {isRussian 
                    ? 'Первое фото станет обложкой. Перетащите для изменения порядка.' 
                    : 'First photo becomes cover. Drag to reorder.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Название (EN) *' : 'Title (EN) *'}</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Название (RU)' : 'Title (Russian)'}</Label>
                  <Input
                    value={formData.title_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_ru: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Описание (RU)' : 'Description (Russian)'}</Label>
                  <Textarea
                    value={formData.description_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              {/* Rental Price - show if rent mode selected */}
              {formData.listing_modes.includes('rent') && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Цена аренды (฿) *' : 'Rental Price (฿) *'}</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder={isRussian ? 'Цена аренды' : 'Rental price'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Период' : 'Period'}</Label>
                    <Select
                      value={formData.price_period}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, price_period: value }))}
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
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Площадь (м²)' : 'Area (m²)'}</Label>
                    <Input
                      type="number"
                      value={formData.area_sqm}
                      onChange={(e) => setFormData(prev => ({ ...prev, area_sqm: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Sale Price - show if sale mode selected */}
              {formData.listing_modes.includes('sale') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Цена продажи (฿) *' : 'Sale Price (฿) *'}</Label>
                    <Input
                      type="number"
                      value={formData.sale_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                      placeholder={isRussian ? 'Полная стоимость' : 'Full price'}
                    />
                  </div>
                  {!formData.listing_modes.includes('rent') && (
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Площадь (м²)' : 'Area (m²)'}</Label>
                      <Input
                        type="number"
                        value={formData.area_sqm}
                        onChange={(e) => setFormData(prev => ({ ...prev, area_sqm: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Спальни' : 'Bedrooms'}</Label>
                  <Input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Ванные' : 'Bathrooms'}</Label>
                  <Input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Макс. гостей' : 'Max Guests'}</Label>
                  <Input
                    type="number"
                    value={formData.max_guests}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_guests: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Мин. ночей' : 'Min Nights'}</Label>
                  <Input
                    type="number"
                    value={formData.min_stay_nights}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_stay_nights: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Адрес' : 'Address'}</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Район' : 'District'}</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Удобства' : 'Amenities'}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {amenitiesList.map(amenity => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={formData.amenities.includes(amenity.id)}
                        onCheckedChange={() => handleAmenityToggle(amenity.id)}
                      />
                      <label htmlFor={amenity.id} className="text-sm">
                        {isRussian ? amenity.labelRu : amenity.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Highlights - Dynamic from lookup_values */}
              <HighlightsSection
                highlights={formData.highlights}
                onChange={(highlights) => setFormData(prev => ({ ...prev, highlights }))}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Мгновенное бронирование' : 'Instant Booking'}</Label>
                  <Switch
                    checked={formData.instant_booking}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, instant_booking: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Активен' : 'Active'}</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingProperty 
                  ? (isRussian ? 'Сохранить' : 'Save')
                  : (isRussian ? 'Создать' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить объект?' : 'Delete property?'}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {isRussian 
                ? 'Это действие нельзя отменить.'
                : 'This action cannot be undone.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
}
