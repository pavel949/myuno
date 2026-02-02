import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useUpdateOwnerProperty, OwnerProperty } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, MapPin, Bed, Bath, SquareStack, Upload, Loader2, DollarSign, Clock, Users } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { ProjectLocationPicker } from '@/components/property/ProjectLocationPicker';
import { PHUKET_DISTRICTS } from '@/lib/propertyTaxonomy';

export default function EditProperty() {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { data: property, isLoading } = useOwnerProperty(id);
  const updateProperty = useUpdateOwnerProperty();

  const [formData, setFormData] = useState({
    title: '',
    title_ru: '',
    address: '',
    district: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    property_type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    area_sqm: '',
    description: '',
    description_ru: '',
    cover_image: '',
    images: [] as string[],
    management_type: 'full',
    is_rented: false,
    // Basic rental terms
    price_per_night: '',
    min_stay_nights: 1,
    max_guests: 2,
    deposit_amount: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
    instant_booking: false,
  });

  // Populate form when property data is loaded
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        title_ru: property.title_ru || '',
        address: property.address || '',
        district: property.district || '',
        lat: property.lat,
        lng: property.lng,
        property_type: property.property_type || 'apartment',
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1,
        area_sqm: property.area_sqm?.toString() || '',
        description: property.description || '',
        description_ru: property.description_ru || '',
        cover_image: property.cover_image || '',
        images: property.images || [],
        management_type: property.management_type || 'full',
        is_rented: property.is_rented || false,
        price_per_night: property.price_per_night?.toString() || '',
        min_stay_nights: property.min_stay_nights || 1,
        max_guests: property.max_guests || 2,
        deposit_amount: property.deposit_amount?.toString() || '',
        check_in_time: property.check_in_time || '14:00',
        check_out_time: property.check_out_time || '12:00',
        instant_booking: property.instant_booking || false,
      });
    }
  }, [property]);

  // Use centralized taxonomy
  const districts = PHUKET_DISTRICTS;

  const propertyTypes = [
    { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла' },
    { value: 'apartment', labelEn: 'Apartment', labelRu: 'Квартира' },
    { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо' },
    { value: 'house', labelEn: 'House', labelRu: 'Дом' },
  ];

  const managementTypes = [
    { value: 'full', labelEn: 'Full Management', labelRu: 'Полное управление', desc: isRu ? 'UNO берёт на себя всё' : 'UNO handles everything' },
    { value: 'partial', labelEn: 'Service Partner', labelRu: 'Сервис-партнёр', desc: isRu ? 'Операционные задачи UNO' : 'UNO handles operations' },
    { value: 'self', labelEn: 'Listing Only', labelRu: 'Только листинг', desc: isRu ? 'Публикация на платформе' : 'Platform listing only' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    await updateProperty.mutateAsync({
      id,
      title: formData.title,
      title_ru: formData.title_ru,
      address: formData.address,
      district: formData.district,
      lat: formData.lat,
      lng: formData.lng,
      property_type: formData.property_type,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      area_sqm: formData.area_sqm ? Number(formData.area_sqm) : undefined,
      description: formData.description,
      description_ru: formData.description_ru,
      cover_image: formData.cover_image,
      images: formData.images,
      management_type: formData.management_type,
      is_rented: formData.is_rented,
      price_per_night: formData.price_per_night ? Number(formData.price_per_night) : undefined,
      min_stay_nights: formData.min_stay_nights,
      max_guests: formData.max_guests,
      deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : undefined,
      check_in_time: formData.check_in_time,
      check_out_time: formData.check_out_time,
      instant_booking: formData.instant_booking,
    });

    navigate(`/owner/properties/${id}`);
  };

  const handleImageUpload = (url: string) => {
    if (!formData.cover_image) {
      setFormData(prev => ({ ...prev, cover_image: url }));
    } else {
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    }
  };

  const removeImage = (index: number) => {
    if (index === -1) {
      // Remove cover image, promote first gallery image
      if (formData.images.length > 0) {
        setFormData(prev => ({
          ...prev,
          cover_image: prev.images[0],
          images: prev.images.slice(1)
        }));
      } else {
        setFormData(prev => ({ ...prev, cover_image: '' }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Редактирование' : 'Edit Property'}
          showBack
          fallbackPath="/owner/properties"
        />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!property) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Объект не найден' : 'Property Not Found'}
          showBack
          fallbackPath="/owner/properties"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Редактировать объект' : 'Edit Property'}
        showBack
        fallbackPath={`/owner/properties/${id}`}
        subtitle={property.title}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              {isRu ? 'Основная информация' : 'Basic Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{isRu ? 'Название (EN)' : 'Title (EN)'} *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Modern Villa with Pool"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Название (RU)' : 'Title (RU)'}</Label>
                <Input
                  value={formData.title_ru}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_ru: e.target.value }))}
                  placeholder="Современная вилла с бассейном"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Тип недвижимости' : 'Property Type'} *</Label>
              <Select 
                value={formData.property_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, property_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {isRu ? type.labelRu : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  {isRu ? 'Спальни' : 'Bedrooms'}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.bedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  {isRu ? 'Ванные' : 'Bathrooms'}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <SquareStack className="h-3 w-3" />
                  {isRu ? 'Площадь (м²)' : 'Area (m²)'}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.area_sqm}
                  onChange={(e) => setFormData(prev => ({ ...prev, area_sqm: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Rental Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {isRu ? 'Базовые условия аренды' : 'Basic Rental Terms'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Цена за ночь (THB)' : 'Price per night (THB)'}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.price_per_night}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_per_night: e.target.value }))}
                  placeholder="2500"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Депозит (THB)' : 'Deposit (THB)'}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: e.target.value }))}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {isRu ? 'Мин. срок (ночей)' : 'Min stay (nights)'}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.min_stay_nights}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_stay_nights: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {isRu ? 'Макс. гостей' : 'Max guests'}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.max_guests}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_guests: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Заезд' : 'Check-in'}</Label>
                <Input
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Выезд' : 'Check-out'}</Label>
                <Input
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{isRu ? 'Мгновенное бронирование' : 'Instant Booking'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Гости могут бронировать без подтверждения' : 'Guests can book without approval'}
                </p>
              </div>
              <Switch
                checked={formData.instant_booking}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, instant_booking: checked }))}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {isRu 
                ? '💡 Детальные настройки (электричество, уборка, штрафы) доступны в "Условия аренды"' 
                : '💡 Detailed settings (electricity, cleaning, penalties) available in "Rental Terms"'}
            </p>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {isRu ? 'Расположение' : 'Location'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Адрес' : 'Address'} *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Beach Road, Patong"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Район' : 'District'}</Label>
              <Select 
                value={formData.district}
                onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRu ? 'Выберите район' : 'Select district'} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {isRu ? district.labelRu : district.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ProjectLocationPicker
              value={formData.lat && formData.lng ? { 
                lat: formData.lat, 
                lng: formData.lng, 
                address: formData.address 
              } : undefined}
              onChange={(location) => {
                setFormData(prev => ({
                  ...prev,
                  lat: location.lat,
                  lng: location.lng,
                  address: location.address || prev.address,
                }));
              }}
            />

            {formData.lat && formData.lng && (
              <p className="text-xs text-muted-foreground">
                📍 {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {isRu ? 'Фотографии' : 'Photos'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              folder="property-care"
              onChange={handleImageUpload}
              placeholder={isRu ? 'Загрузить фото' : 'Upload Photo'}
            />
            
            {(formData.cover_image || formData.images.length > 0) && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {formData.cover_image && (
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary group">
                    <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-xs text-center py-0.5">
                      {isRu ? 'Обложка' : 'Cover'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImage(-1)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Management Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRu ? 'Тип управления' : 'Management Type'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {managementTypes.map((type) => (
              <div
                key={type.value}
                onClick={() => setFormData(prev => ({ ...prev, management_type: type.value }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  formData.management_type === type.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <p className="font-medium">{isRu ? type.labelRu : type.labelEn}</p>
                <p className="text-sm text-muted-foreground">{type.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Rental Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRu ? 'Статус аренды' : 'Rental Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{isRu ? 'Сдаётся в аренду' : 'Currently Rented'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Объект активно сдаётся' : 'Property is actively rented'}
                </p>
              </div>
              <Switch
                checked={formData.is_rented}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_rented: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRu ? 'Описание' : 'Description'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your property..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label>
              <Textarea
                value={formData.description_ru}
                onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                placeholder="Опишите вашу недвижимость..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button 
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/owner/properties/${id}`)}
          >
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={updateProperty.isPending}
          >
            {updateProperty.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isRu ? 'Сохранение...' : 'Saving...'}
              </>
            ) : (
              isRu ? 'Сохранить изменения' : 'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
