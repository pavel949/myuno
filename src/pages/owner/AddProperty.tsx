import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateOwnerProperty } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Home, MapPin, Bed, Bath, SquareStack, Upload, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { ProjectSelector } from '@/components/property/ProjectSelector';
import { UnitFields } from '@/components/property/UnitFields';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { ProjectLocationPicker } from '@/components/property/ProjectLocationPicker';

export default function AddProperty() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const createProperty = useCreateOwnerProperty();

  const [selectedProject, setSelectedProject] = useState<PropertyProject | null>(null);
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
    rental_platforms: [] as string[],
    custom_platform: '',
    // Unit-specific fields (when part of a project)
    project_id: undefined as string | undefined,
    floor: undefined as number | undefined,
    unit_number: '',
    view_type: '',
    furnishing_level: '',
    equipment: [] as string[],
  });

  const districts = [
    'Patong', 'Kata', 'Karon', 'Rawai', 'Nai Harn', 
    'Kamala', 'Surin', 'Bang Tao', 'Laguna', 'Cherngtalay',
    'Phuket Town', 'Chalong', 'Kathu'
  ];

  const propertyTypes = [
    { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла' },
    { value: 'apartment', labelEn: 'Apartment', labelRu: 'Квартира' },
    { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо' },
    { value: 'house', labelEn: 'House', labelRu: 'Дом' },
  ];

  const managementTypes = [
    { value: 'full', labelEn: 'Full Management', labelRu: 'Полное управление', desc: isRu ? 'UNO управляет всеми аспектами' : 'UNO manages all aspects' },
    { value: 'partial', labelEn: 'Partial Management', labelRu: 'Частичное управление', desc: isRu ? 'Только отдельные услуги' : 'Selected services only' },
    { value: 'self', labelEn: 'Self Management', labelRu: 'Самоуправление', desc: isRu ? 'Вы управляете, мы помогаем' : 'You manage, we assist' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createProperty.mutateAsync({
      ...formData,
      area_sqm: formData.area_sqm ? Number(formData.area_sqm) : undefined,
    });

    navigate('/owner/properties');
  };

  const handleImageUpload = (url: string) => {
    if (!formData.cover_image) {
      setFormData(prev => ({ ...prev, cover_image: url }));
    } else {
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    }
  };

  return (
    <PageContainer>
      <BackButton fallbackPath="/owner/properties" />
      <PageHeader 
        title={isRu ? 'Добавить объект' : 'Add Property'}
        subtitle={isRu ? 'Зарегистрируйте недвижимость' : 'Register your property'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRu ? 'Проект / ЖК' : 'Project / Complex'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectSelector
              value={formData.project_id}
              selectedProject={selectedProject}
              onChange={(projectId, project) => {
                setSelectedProject(project || null);
                setFormData(prev => ({ 
                  ...prev, 
                  project_id: projectId,
                  // Auto-fill fields from project
                  address: project?.address || prev.address,
                  district: project?.district || prev.district,
                  lat: project?.lat ?? prev.lat,
                  lng: project?.lng ?? prev.lng,
                }));
              }}
            />
          </CardContent>
        </Card>

        {/* Unit-specific fields (shown when project is selected) */}
        {formData.project_id && (
          <UnitFields
            floor={formData.floor}
            unitNumber={formData.unit_number}
            viewType={formData.view_type}
            furnishingLevel={formData.furnishing_level}
            equipment={formData.equipment}
            onFloorChange={(floor) => setFormData(prev => ({ ...prev, floor }))}
            onUnitNumberChange={(unit_number) => setFormData(prev => ({ ...prev, unit_number }))}
            onViewTypeChange={(view_type) => setFormData(prev => ({ ...prev, view_type }))}
            onFurnishingLevelChange={(furnishing_level) => setFormData(prev => ({ ...prev, furnishing_level }))}
            onEquipmentChange={(equipment) => setFormData(prev => ({ ...prev, equipment }))}
          />
        )}

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
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Map Location Picker */}
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
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary">
                    <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-xs text-center py-0.5">
                      {isRu ? 'Обложка' : 'Cover'}
                    </span>
                  </div>
                )}
                {formData.images.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                    <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
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

            {/* Conditions for Full Management */}
            {formData.management_type === 'full' && (
              <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20 space-y-3">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  🏆 {isRu ? 'Полное управление UNO' : 'Full UNO Management'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Распределение дохода: 70/30' : 'Revenue Split: 70/30'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Вы получаете 70% чистого дохода после вычета операционных расходов' 
                          : 'You receive 70% of net income after operational expenses'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Операционные расходы' : 'Operational Costs'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Коммунальные услуги, уборка, мелкий ремонт — вычитаются из дохода' 
                          : 'Utilities, cleaning, minor repairs — deducted from revenue'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Что включено' : 'What\'s Included'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Маркетинг, бронирования, встреча гостей, уборка, техподдержка 24/7' 
                          : 'Marketing, bookings, guest check-in, cleaning, 24/7 support'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Минимальный срок' : 'Minimum Term'}</p>
                      <p className="text-muted-foreground">
                        {isRu ? 'Контракт на 12 месяцев' : '12-month contract'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    {isRu 
                      ? '* После регистрации менеджер свяжется для обсуждения условий и подписания договора' 
                      : '* After registration, a manager will contact you to discuss terms and sign the agreement'}
                  </p>
                </div>
              </div>
            )}

            {/* Conditions for Partial Management */}
            {formData.management_type === 'partial' && (
              <div className="mt-4 p-4 bg-secondary/50 rounded-xl border border-secondary space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  🤝 {isRu ? 'Частичное управление' : 'Partial Management'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-foreground">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Оплата за услуги' : 'Pay Per Service'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Выбирайте только нужные услуги: уборка, встреча гостей, ремонт' 
                          : 'Choose only needed services: cleaning, check-in, maintenance'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-foreground">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Комиссия за бронирования' : 'Booking Commission'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? '15% от суммы аренды за клиентов через UNO' 
                          : '15% of rental amount for clients via UNO'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-foreground">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Гибкие условия' : 'Flexible Terms'}</p>
                      <p className="text-muted-foreground">
                        {isRu ? 'Без долгосрочных обязательств' : 'No long-term commitments'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conditions for Self Management */}
            {formData.management_type === 'self' && (
              <div className="mt-4 p-4 bg-muted rounded-xl border border-border space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  🏠 {isRu ? 'Самоуправление' : 'Self Management'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Комиссия за бронирования UNO' : 'UNO Booking Commission'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? '10% от суммы аренды за клиентов, пришедших через платформу UNO' 
                          : '10% of rental amount for clients coming through UNO platform'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Дополнительные услуги' : 'Additional Services'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Заказывайте уборку, ремонт и другие услуги по необходимости' 
                          : 'Order cleaning, repairs and other services as needed'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Синхронизация календаря' : 'Calendar Sync'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Подключите свои календари бронирований для единого управления' 
                          : 'Connect your booking calendars for unified management'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Бесплатное размещение' : 'Free Listing'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Размещение объекта на платформе бесплатно' 
                          : 'Property listing on platform is free'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rental Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRu ? 'Статус аренды' : 'Rental Status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{isRu ? 'Сдаётся в аренду' : 'Currently Rented'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Объект сдаётся через площадки' : 'Property is listed on platforms'}
                </p>
              </div>
              <Switch
                checked={formData.is_rented}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_rented: checked }))}
              />
            </div>

            {formData.is_rented && (
              <div className="space-y-3">
                <Label>{isRu ? 'Каналы бронирования' : 'Booking Channels'}</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'airbnb', label: 'Airbnb' },
                    { value: 'booking', label: 'Booking.com' },
                    { value: 'agoda', label: 'Agoda' },
                    { value: 'vrbo', label: 'VRBO' },
                    { value: 'expedia', label: 'Expedia' },
                    { value: 'direct', label: isRu ? 'Напрямую' : 'Direct' },
                  ].map((platform) => {
                    const isSelected = formData.rental_platforms.includes(platform.value);
                    return (
                      <button
                        key={platform.value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            rental_platforms: isSelected
                              ? prev.rental_platforms.filter(p => p !== platform.value)
                              : [...prev.rental_platforms, platform.value]
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {platform.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom platforms */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    {isRu ? 'Добавить свой канал' : 'Add custom channel'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.custom_platform}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_platform: e.target.value }))}
                      placeholder={isRu ? 'Название канала' : 'Channel name'}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (formData.custom_platform.trim()) {
                          setFormData(prev => ({
                            ...prev,
                            rental_platforms: [...prev.rental_platforms, prev.custom_platform.trim()],
                            custom_platform: ''
                          }));
                        }
                      }}
                      disabled={!formData.custom_platform.trim()}
                    >
                      {isRu ? 'Добавить' : 'Add'}
                    </Button>
                  </div>
                </div>

                {/* Display selected platforms */}
                {formData.rental_platforms.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      {isRu ? 'Выбранные каналы:' : 'Selected channels:'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {formData.rental_platforms.map((platform) => (
                        <span
                          key={platform}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                        >
                          {platform}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                rental_platforms: prev.rental_platforms.filter(p => p !== platform)
                              }));
                            }}
                            className="hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={createProperty.isPending}
        >
          {createProperty.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isRu ? 'Сохранение...' : 'Saving...'}
            </>
          ) : (
            isRu ? 'Добавить объект' : 'Add Property'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {isRu 
            ? 'После добавления объект будет проверен модератором UNO' 
            : 'After adding, the property will be reviewed by UNO moderator'}
        </p>
      </form>
    </PageContainer>
  );
}
