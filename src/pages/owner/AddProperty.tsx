import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateOwnerProperty } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Home, MapPin, Bed, Bath, SquareStack, Upload, Loader2, DollarSign, Clock, Users } from 'lucide-react';
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
    // Basic rental terms
    price_per_night: '',
    min_stay_nights: 1,
    max_guests: 2,
    deposit_amount: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
    instant_booking: false,
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
    { value: 'full', labelEn: 'Full Management', labelRu: 'Полное управление', desc: isRu ? 'UNO берёт на себя всё: маркетинг, бронирования, гостей, обслуживание' : 'UNO handles everything: marketing, bookings, guests, maintenance' },
    { value: 'partial', labelEn: 'Service Partner', labelRu: 'Сервис-партнёр', desc: isRu ? 'Check-in/out, депозит, коммуналка + услуги по партнёрским ценам' : 'Check-in/out, deposit, utilities + services at partner rates' },
    { value: 'self', labelEn: 'Listing Only', labelRu: 'Только листинг', desc: isRu ? 'Публикация на платформе, услуги по стандартным ценам' : 'Platform listing, services at standard rates' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createProperty.mutateAsync({
      ...formData,
      area_sqm: formData.area_sqm ? Number(formData.area_sqm) : undefined,
      price_per_night: formData.price_per_night ? Number(formData.price_per_night) : undefined,
      deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : undefined,
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
      <PageHeader 
        title={isRu ? 'Добавить объект' : 'Add Property'}
        showBack
        fallbackPath="/owner/properties"
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
                ? '💡 Детальные настройки (электричество, уборка, штрафы) можно настроить после добавления объекта' 
                : '💡 Detailed settings (electricity, cleaning, penalties) can be configured after adding the property'}
            </p>
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
              <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20 space-y-4">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  🏆 {isRu ? 'Полное управление UNO' : 'Full UNO Management'}
                </h4>
                
                {/* Revenue Split */}
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="font-bold text-lg text-primary">{isRu ? 'Доход: 70% вам / 30% UNO' : 'Revenue: 70% You / 30% UNO'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRu 
                      ? 'Чистый доход после вычета операционных расходов (коммуналка, уборка, мелкий ремонт)' 
                      : 'Net income after operational expenses (utilities, cleaning, minor repairs)'}
                  </p>
                </div>

                {/* Calendar & Marketing */}
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-primary flex items-center gap-2">
                    📅 {isRu ? 'Календарь и маркетинг' : 'Calendar & Marketing'}
                  </p>
                  <div className="grid gap-2 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Мастер-календарь — синхронизация всех каналов (Airbnb, Booking, Agoda)' : 'Master calendar — sync across all channels (Airbnb, Booking, Agoda)'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Динамическое ценообразование под сезон и спрос' : 'Dynamic pricing based on season and demand'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Профессиональная фотосъёмка объекта' : 'Professional property photography'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Приоритетное размещение в поиске UNO' : 'Priority placement in UNO search'}</span>
                    </div>
                  </div>
                </div>

                {/* Guest Services */}
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-primary flex items-center gap-2">
                    👥 {isRu ? 'Работа с гостями' : 'Guest Services'}
                  </p>
                  <div className="grid gap-2 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Проверка и верификация гостей' : 'Guest verification and vetting'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Check-in/out, передача ключей, инструктаж' : 'Check-in/out, key handover, instructions'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Поддержка гостей 24/7 на русском и английском' : '24/7 guest support in Russian and English'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Страховка от повреждений гостями' : 'Insurance against guest damages'}</span>
                    </div>
                  </div>
                </div>

                {/* Property Care */}
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-primary flex items-center gap-2">
                    🏠 {isRu ? 'Обслуживание объекта' : 'Property Care'}
                  </p>
                  <div className="grid gap-2 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Уборка и подготовка к заезду' : 'Cleaning and turnover preparation'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Контроль и оплата коммунальных услуг' : 'Utility monitoring and payments'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Мелкий ремонт и техобслуживание' : 'Minor repairs and maintenance'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Координация с управляющей компанией' : 'Coordination with building management'}</span>
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-primary flex items-center gap-2">
                    📊 {isRu ? 'Аналитика и отчётность' : 'Analytics & Reporting'}
                  </p>
                  <div className="grid gap-2 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Ежемесячные финансовые отчёты' : 'Monthly financial reports'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Статистика загрузки и доходности' : 'Occupancy and revenue statistics'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span>{isRu ? 'Персональный менеджер для связи' : 'Personal account manager'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-primary/20 space-y-2">
                  <p className="text-sm font-medium">{isRu ? '📋 Контракт: 12 месяцев' : '📋 Contract: 12 months'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRu 
                      ? '* После регистрации менеджер свяжется для осмотра объекта и подписания договора' 
                      : '* After registration, a manager will contact you for property inspection and contract signing'}
                  </p>
                </div>
              </div>
            )}

            {/* Conditions for Service Partner */}
            {formData.management_type === 'partial' && (
              <div className="mt-4 p-4 bg-secondary/50 rounded-xl border border-secondary space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  🤝 {isRu ? 'Сервис-партнёр' : 'Service Partner'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Мы берём на себя операционные задачи, вы управляете бронированиями' 
                    : 'We handle operational tasks, you manage bookings'}
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-primary">{isRu ? 'Включено в 15%:' : 'Included in 15%:'}</p>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Check-in и Check-out гостей' : 'Guest Check-in & Check-out'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Встреча, передача ключей, инструктаж, выселение' 
                          : 'Meeting, key handover, instructions, checkout'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Управление депозитом' : 'Deposit Management'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Приём, проверка состояния, возврат депозита' 
                          : 'Collection, condition check, deposit return'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Оплата коммунальных' : 'Utility Payments'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Контроль счётчиков, оплата электричества и воды' 
                          : 'Meter reading, electricity and water payments'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Партнёрские цены на услуги' : 'Partner Rates on Services'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Скидки на уборку, ремонт и другие услуги UNO' 
                          : 'Discounts on cleaning, repairs and other UNO services'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-secondary">
                  <p className="text-xs text-muted-foreground">
                    {isRu 
                      ? '* 15% комиссия от бронирований через UNO. За ваших клиентов — только оплата услуг' 
                      : '* 15% commission from UNO bookings. For your clients — only pay for services'}
                  </p>
                </div>
              </div>
            )}

            {/* Conditions for Listing Only */}
            {formData.management_type === 'self' && (
              <div className="mt-4 p-4 bg-muted rounded-xl border border-border space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  📋 {isRu ? 'Только листинг' : 'Listing Only'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Ваш объект на платформе UNO, услуги доступны по стандартным ценам' 
                    : 'Your property on UNO platform, services available at standard rates'}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Комиссия 10%' : '10% Commission'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'От суммы аренды за клиентов через платформу UNO' 
                          : 'Of rental amount for clients via UNO platform'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Услуги по запросу' : 'On-Demand Services'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Уборка, ремонт и другие услуги по стандартному прайсу' 
                          : 'Cleaning, repairs and other services at standard prices'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <div>
                      <p className="font-medium">{isRu ? 'Синхронизация календаря' : 'Calendar Sync'}</p>
                      <p className="text-muted-foreground">
                        {isRu 
                          ? 'Подключите iCal для автоматической синхронизации' 
                          : 'Connect iCal for automatic sync'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    {isRu 
                      ? '💡 Хотите check-in/out и управление депозитом? Выберите "Сервис-партнёр"' 
                      : '💡 Want check-in/out and deposit management? Choose "Service Partner"'}
                  </p>
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
