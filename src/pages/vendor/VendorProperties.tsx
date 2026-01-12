import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorProperties, VendorProperty } from '@/hooks/useVendorProperties';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
  Loader2,
  Zap
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { CardPreview, CardPreviewSection } from '@/components/vendor/CardPreview';

const propertyTypes = [
  { id: 'villa', label: 'Villa', labelRu: 'Вилла' },
  { id: 'apartment', label: 'Apartment', labelRu: 'Апартаменты' },
  { id: 'condo', label: 'Condo', labelRu: 'Кондо' },
  { id: 'house', label: 'House', labelRu: 'Дом' },
  { id: 'studio', label: 'Studio', labelRu: 'Студия' },
  { id: 'townhouse', label: 'Townhouse', labelRu: 'Таунхаус' },
];

const listingTypes = [
  { id: 'rent', label: 'For Rent', labelRu: 'Аренда' },
  { id: 'sale', label: 'For Sale', labelRu: 'Продажа' },
];

const pricePeriods = [
  { id: 'day', label: 'Per Day', labelRu: 'За день' },
  { id: 'month', label: 'Per Month', labelRu: 'За месяц' },
  { id: 'year', label: 'Per Year', labelRu: 'За год' },
];

const amenitiesList = [
  { id: 'wifi', label: 'Wi-Fi', labelRu: 'Wi-Fi' },
  { id: 'pool', label: 'Pool', labelRu: 'Бассейн' },
  { id: 'gym', label: 'Gym', labelRu: 'Спортзал' },
  { id: 'parking', label: 'Parking', labelRu: 'Парковка' },
  { id: 'ac', label: 'Air Conditioning', labelRu: 'Кондиционер' },
  { id: 'kitchen', label: 'Kitchen', labelRu: 'Кухня' },
  { id: 'washer', label: 'Washer', labelRu: 'Стиральная машина' },
  { id: 'balcony', label: 'Balcony', labelRu: 'Балкон' },
  { id: 'sea_view', label: 'Sea View', labelRu: 'Вид на море' },
  { id: 'security', label: '24h Security', labelRu: 'Охрана 24ч' },
  { id: 'pets', label: 'Pets Allowed', labelRu: 'Можно с питомцами' },
  { id: 'garden', label: 'Garden', labelRu: 'Сад' },
];

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

  const [formData, setFormData] = useState({
    title_en: '',
    title_ru: '',
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
    images: [] as string[],
    amenities: [] as string[],
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
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      title_en: '',
      title_ru: '',
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
    });
    setEditingProperty(null);
  };

  const openEditDialog = (property: VendorProperty) => {
    setEditingProperty(property);
    setFormData({
      title_en: property.title_en,
      title_ru: property.title_ru || '',
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
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title_en || !formData.price) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const propertyData: any = {
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
        district: formData.district || undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        cover_image: formData.cover_image || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        amenities: formData.amenities.length > 0 ? formData.amenities : undefined,
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

  if (authLoading || profileLoading) {
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

  if (!profile) return null;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Недвижимость' : 'Properties'}
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
                            {!property.is_active && (
                              <Badge variant="outline" className="text-xs">
                                {isRussian ? 'Неактивен' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" />
                            {property.district || property.address || (isRussian ? 'Не указано' : 'Not specified')}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
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
                                {property.area_sqm}m²
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-primary">
                            {property.price ? formatPrice(property.price, property.price_period) : '-'}
                          </p>
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
                              className="text-red-500"
                              onClick={() => setDeleteConfirmId(property.id)}
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

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProperty 
                  ? (isRussian ? 'Редактировать объект' : 'Edit Property')
                  : (isRussian ? 'Новый объект' : 'New Property')}
              </DialogTitle>
            </DialogHeader>

            <div className="grid md:grid-cols-[1fr,280px] gap-6 py-4">
              {/* Form */}
              <div className="space-y-4">
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
                    <Label>{isRussian ? 'Тип объявления' : 'Listing Type'}</Label>
                    <Select
                      value={formData.listing_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, listing_type: value }))}
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

                <div className="space-y-2">
                  <Label htmlFor="title_en">{isRussian ? 'Название (EN) *' : 'Title (EN) *'}</Label>
                  <Input
                    id="title_en"
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    placeholder="Luxury Beachfront Villa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title_ru">{isRussian ? 'Название (RU)' : 'Title (Russian)'}</Label>
                  <Input
                    id="title_ru"
                    value={formData.title_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_ru: e.target.value }))}
                    placeholder="Роскошная вилла на пляже"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_en">{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_ru">{isRussian ? 'Описание (RU)' : 'Description (Russian)'}</Label>
                  <Textarea
                    id="description_ru"
                    value={formData.description_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">{isRussian ? 'Цена (฿) *' : 'Price (฿) *'}</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="50000"
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
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">{isRussian ? 'Спален' : 'Bedrooms'}</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">{isRussian ? 'Санузлов' : 'Bathrooms'}</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">{isRussian ? 'Площадь м²' : 'Area m²'}</Label>
                    <Input
                      id="area"
                      type="number"
                      value={formData.area_sqm}
                      onChange={(e) => setFormData(prev => ({ ...prev, area_sqm: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_guests">{isRussian ? 'Макс. гостей' : 'Max Guests'}</Label>
                    <Input
                      id="max_guests"
                      type="number"
                      value={formData.max_guests}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_guests: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_stay">{isRussian ? 'Мин. ночей' : 'Min Nights'}</Label>
                    <Input
                      id="min_stay"
                      type="number"
                      value={formData.min_stay_nights}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_stay_nights: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">{isRussian ? 'Район' : 'District'}</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                    placeholder="Chalong, Rawai..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{isRussian ? 'Адрес' : 'Address'}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lat">{isRussian ? 'Широта (lat)' : 'Latitude'}</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                      placeholder="7.8386"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">{isRussian ? 'Долгота (lng)' : 'Longitude'}</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                      placeholder="98.3048"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isRussian ? 'Фото обложки' : 'Cover Image'}</Label>
                  <ImageUpload
                    value={formData.cover_image}
                    onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                    folder="properties"
                    placeholder={isRussian ? 'Загрузить фото' : 'Upload photo'}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRussian ? 'Галерея фото' : 'Photo Gallery'}</Label>
                  <MultiImageUpload
                    value={formData.images}
                    onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                    folder="properties"
                    maxImages={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRussian ? 'Удобства' : 'Amenities'}</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {amenitiesList.map(amenity => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity.id}
                          checked={formData.amenities.includes(amenity.id)}
                          onCheckedChange={() => handleAmenityToggle(amenity.id)}
                        />
                        <label htmlFor={amenity.id} className="text-sm cursor-pointer">
                          {isRussian ? amenity.labelRu : amenity.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      <div>
                        <Label htmlFor="instant_booking" className="font-medium">
                          {isRussian ? 'Мгновенное бронирование' : 'Instant Booking'}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {isRussian 
                            ? 'Гости могут бронировать без подтверждения' 
                            : 'Guests can book without approval'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="instant_booking"
                      checked={formData.instant_booking}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, instant_booking: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">{isRussian ? 'Объект активен' : 'Property active'}</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <CardPreviewSection className="hidden md:block sticky top-0">
                <CardPreview
                  type="property"
                  image={formData.cover_image}
                  title={formData.title_en}
                  titleRu={formData.title_ru}
                  description={formData.description_en}
                  descriptionRu={formData.description_ru}
                  price={formData.price ? parseFloat(formData.price) : undefined}
                  pricePeriod={formData.price_period}
                  propertyType={formData.property_type}
                  bedrooms={formData.bedrooms ? parseInt(formData.bedrooms) : undefined}
                  bathrooms={formData.bathrooms ? parseInt(formData.bathrooms) : undefined}
                  areaSqm={formData.area_sqm ? parseInt(formData.area_sqm) : undefined}
                  district={formData.district}
                  amenities={formData.amenities}
                  instantBooking={formData.instant_booking}
                />
              </CardPreviewSection>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isRussian ? 'Сохранить' : 'Save'}
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
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
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
};

export default VendorProperties;
