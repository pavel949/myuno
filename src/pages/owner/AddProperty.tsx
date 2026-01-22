import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateOwnerProperty, useOwnerProperty } from '@/hooks/usePropertyCare';
import { useSendOwnershipInvite } from '@/hooks/usePropertyOwnership';
import { useUserContext } from '@/hooks/useUserContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { PropertyWizard } from '@/components/owner/PropertyWizard';
import { OwnershipTypeStep, OwnershipType } from '@/components/owner/OwnershipTypeStep';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Bed, Bath, SquareStack, Upload, DollarSign, Clock, Users, Copy, BadgeDollarSign, Building2, Landmark, Briefcase } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { ProjectSelector } from '@/components/property/ProjectSelector';
import { UnitFields } from '@/components/property/UnitFields';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { ProjectLocationPicker } from '@/components/property/ProjectLocationPicker';
import { Skeleton } from '@/components/ui/skeleton';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { LivePropertyPreview } from '@/components/property/LivePropertyPreview';

export default function AddProperty() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';
  
  const cloneFromId = searchParams.get('cloneFrom');
  const { data: sourceProperty, isLoading: isLoadingSource } = useOwnerProperty(cloneFromId || undefined);
  
  const createProperty = useCreateOwnerProperty();
  const sendInvite = useSendOwnershipInvite();
  const { activeOrgId } = useUserContext();

  const [selectedProject, setSelectedProject] = useState<PropertyProject | null>(null);
  const [isCloneDataApplied, setIsCloneDataApplied] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  
  // Ownership data
  const [ownershipData, setOwnershipData] = useState({
    ownership_type: 'own' as OwnershipType,
    actual_owner_email: '',
    actual_owner_name: '',
    actual_owner_phone: '',
    send_invite_immediately: true,
    management_document_url: '',
    management_document_name: '',
    commercial_terms_redacted: false,
    ownership_document_url: '',
    ownership_document_name: '',
  });

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
    project_id: undefined as string | undefined,
    // Multi-unit fields
    floor: undefined as number | undefined,
    unit_number: '',
    // Standalone fields (villa, house, townhouse)
    total_floors: undefined as number | undefined,
    plot_size_sqm: undefined as number | undefined,
    has_elevator: false,
    parking_type: '',
    pool_type: '',
    garden_type: '',
    // Common fields
    view_type: '',
    furnishing_level: '',
    equipment: [] as string[],
    price_per_night: '',
    min_stay_nights: 1,
    max_guests: 2,
    deposit_amount: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
    instant_booking: false,
    // Ownership & Sale fields
    ownership_form: undefined as 'freehold' | 'leasehold' | 'company' | 'foreign_company' | undefined,
    is_for_sale: false,
    sale_price: '',
  });

  // Apply cloned property data when loaded
  useEffect(() => {
    if (sourceProperty && !isCloneDataApplied) {
      setFormData({
        title: sourceProperty.title || '',
        title_ru: sourceProperty.title_ru || '',
        address: sourceProperty.address || '',
        district: sourceProperty.district || '',
        lat: sourceProperty.lat ?? undefined,
        lng: sourceProperty.lng ?? undefined,
        property_type: sourceProperty.property_type || 'apartment',
        bedrooms: sourceProperty.bedrooms || 1,
        bathrooms: sourceProperty.bathrooms || 1,
        area_sqm: sourceProperty.area_sqm?.toString() || '',
        description: sourceProperty.description || '',
        description_ru: sourceProperty.description_ru || '',
        cover_image: sourceProperty.cover_image || '',
        images: sourceProperty.images || [],
        management_type: sourceProperty.management_type || 'full',
        is_rented: sourceProperty.is_rented || false,
        rental_platforms: sourceProperty.rental_platform ? [sourceProperty.rental_platform] : [],
        custom_platform: '',
        project_id: sourceProperty.project_id ?? undefined,
        // Multi-unit fields - intentionally left empty for the user to fill
        floor: undefined,
        unit_number: '',
        // Standalone fields
        total_floors: (sourceProperty as any).total_floors ?? undefined,
        plot_size_sqm: (sourceProperty as any).plot_size_sqm ?? undefined,
        has_elevator: (sourceProperty as any).has_elevator ?? false,
        parking_type: (sourceProperty as any).parking_type || '',
        pool_type: (sourceProperty as any).pool_type || '',
        garden_type: (sourceProperty as any).garden_type || '',
        // Common fields
        view_type: sourceProperty.view_type || '',
        furnishing_level: sourceProperty.furnishing_level || '',
        equipment: sourceProperty.equipment || [],
        price_per_night: sourceProperty.price_per_night?.toString() || '',
        min_stay_nights: sourceProperty.min_stay_nights || 1,
        max_guests: sourceProperty.max_guests || 2,
        deposit_amount: sourceProperty.deposit_amount?.toString() || '',
        check_in_time: sourceProperty.check_in_time || '14:00',
        check_out_time: sourceProperty.check_out_time || '12:00',
        instant_booking: sourceProperty.instant_booking || false,
        // Ownership & Sale fields
        ownership_form: (sourceProperty as any).ownership_form as 'freehold' | 'leasehold' | 'company' | 'foreign_company' | undefined,
        is_for_sale: (sourceProperty as any).is_for_sale || false,
        sale_price: (sourceProperty as any).sale_price?.toString() || '',
      });
      setIsCloneDataApplied(true);
      toast.success(isRu ? 'Данные объекта загружены. Заполните этаж и номер квартиры.' : 'Property data loaded. Fill in floor and unit number.');
    }
  }, [sourceProperty, isCloneDataApplied, isRu]);

  const districts = [
    'Patong', 'Kata', 'Karon', 'Rawai', 'Nai Harn', 
    'Kamala', 'Surin', 'Bang Tao', 'Laguna', 'Cherngtalay',
    'Phuket Town', 'Chalong', 'Kathu'
  ];

  const propertyTypes = [
    { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла' },
    { value: 'house', labelEn: 'House', labelRu: 'Дом' },
    { value: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус' },
    { value: 'apartment', labelEn: 'Apartment', labelRu: 'Квартира' },
    { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо' },
    { value: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
    { value: 'penthouse', labelEn: 'Penthouse', labelRu: 'Пентхаус' },
  ];

  const managementTypes = [
    { value: 'full', labelEn: 'Full Management', labelRu: 'Полное управление', desc: isRu ? 'UNO берёт на себя всё: маркетинг, бронирования, гостей, обслуживание' : 'UNO handles everything: marketing, bookings, guests, maintenance' },
    { value: 'partial', labelEn: 'Service Partner', labelRu: 'Сервис-партнёр', desc: isRu ? 'Check-in/out, депозит, коммуналка + услуги по партнёрским ценам' : 'Check-in/out, deposit, utilities + services at partner rates' },
    { value: 'self', labelEn: 'Listing Only', labelRu: 'Только листинг', desc: isRu ? 'Публикация на платформе, услуги по стандартным ценам' : 'Platform listing, services at standard rates' },
  ];

  const validateStep = (stepId: string): boolean => {
    switch (stepId) {
      case 'ownership':
        // Verbal agreement requires all owner contact fields
        if (ownershipData.ownership_type === 'verbal') {
          if (!ownershipData.actual_owner_name.trim()) {
            toast.error(isRu ? 'Введите имя собственника' : 'Enter owner name');
            return false;
          }
          if (!ownershipData.actual_owner_email.trim()) {
            toast.error(isRu ? 'Введите email собственника' : 'Enter owner email');
            return false;
          }
          if (!ownershipData.actual_owner_phone.trim()) {
            toast.error(isRu ? 'Введите телефон собственника' : 'Enter owner phone');
            return false;
          }
        }
        // Management agreement requires document upload
        if (ownershipData.ownership_type === 'management_agreement') {
          if (!ownershipData.management_document_url) {
            toast.error(isRu ? 'Загрузите договор управления или доверенность' : 'Upload management agreement or POA');
            return false;
          }
        }
        return true;
      case 'basic':
        if (!formData.title.trim()) {
          toast.error(isRu ? 'Введите название объекта' : 'Enter property title');
          return false;
        }
        return true;
      case 'location':
        if (!formData.address.trim()) {
          toast.error(isRu ? 'Введите адрес' : 'Enter address');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    // Create property with ownership data
    const isOnBehalf = ownershipData.ownership_type !== 'own';
    
    const property = await createProperty.mutateAsync({
      ...formData,
      area_sqm: formData.area_sqm ? Number(formData.area_sqm) : undefined,
      price_per_night: formData.price_per_night ? Number(formData.price_per_night) : undefined,
      deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : undefined,
      sale_price: formData.sale_price ? Number(formData.sale_price) : undefined,
      // Add ownership fields
      created_on_behalf: isOnBehalf,
      ownership_type: ownershipData.ownership_type,
      actual_owner_email: isOnBehalf ? ownershipData.actual_owner_email : undefined,
      actual_owner_name: isOnBehalf ? ownershipData.actual_owner_name : undefined,
      actual_owner_phone: isOnBehalf ? ownershipData.actual_owner_phone : undefined,
      managed_by_org_id: ownershipData.ownership_type === 'management_agreement' ? activeOrgId : undefined,
      // New verification fields
      management_document_url: ownershipData.management_document_url || undefined,
      management_document_name: ownershipData.management_document_name || undefined,
      commercial_terms_redacted: ownershipData.commercial_terms_redacted,
      ownership_verification_status: isOnBehalf ? 'pending' : 'verified',
    });

    // Save documents to property_documents table for profile access
    if (property?.id) {
      const { supabase } = await import('@/integrations/supabase/client');
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Save management document
      if (ownershipData.management_document_url) {
        await supabase.from('property_documents').insert({
          property_id: property.id,
          document_type: 'power_of_attorney',
          title: 'Management Agreement / POA',
          title_ru: 'Договор управления / Доверенность',
          file_url: ownershipData.management_document_url,
          file_name: ownershipData.management_document_name || 'management-document',
          is_sensitive: true,
          uploaded_by: userId,
        });
      }

      // Save ownership document
      if (ownershipData.ownership_document_url) {
        await supabase.from('property_documents').insert({
          property_id: property.id,
          document_type: 'ownership_title',
          title: 'Ownership Document',
          title_ru: 'Документ о праве собственности',
          file_url: ownershipData.ownership_document_url,
          file_name: ownershipData.ownership_document_name || 'ownership-document',
          is_sensitive: true,
          uploaded_by: userId,
        });
      }
    }

    // Send ownership invite if needed
    if (isOnBehalf && ownershipData.send_invite_immediately && property?.id) {
      try {
        await sendInvite.mutateAsync({
          propertyId: property.id,
          inviteeEmail: ownershipData.actual_owner_email,
          inviteeName: ownershipData.actual_owner_name,
          inviteType: 'ownership_transfer',
        });
        toast.success(isRu ? 'Приглашение отправлено собственнику' : 'Invitation sent to owner');
      } catch (error) {
        console.error('Failed to send invite:', error);
        // Don't fail the whole operation, property is already created
      }
    }

    navigate('/owner/properties');
  };

  const handleImageUpload = (url: string) => {
    if (!formData.cover_image) {
      setFormData(prev => ({ ...prev, cover_image: url }));
    } else {
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    }
  };

  const renderStep = (stepId: string) => {
    switch (stepId) {
      case 'ownership':
        return (
          <OwnershipTypeStep
            data={ownershipData}
            onChange={(updates) => setOwnershipData(prev => ({ ...prev, ...updates }))}
          />
        );
      case 'basic':
        return (
          <div className="space-y-6">
            {/* Project Selection */}
            <Card>
              <CardHeader className="pb-3">
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
                      address: project?.address || prev.address,
                      district: project?.district || prev.district,
                      lat: project?.lat ?? prev.lat,
                      lng: project?.lng ?? prev.lng,
                    }));
                  }}
                />
              </CardContent>
            </Card>

            {/* Unit/Property-specific fields - show based on property type or when project is selected */}
            {(formData.project_id || ['villa', 'house', 'townhouse'].includes(formData.property_type)) && (
              <UnitFields
                propertyType={formData.property_type}
                // Multi-unit fields
                floor={formData.floor}
                unitNumber={formData.unit_number}
                onFloorChange={(floor) => setFormData(prev => ({ ...prev, floor }))}
                onUnitNumberChange={(unit_number) => setFormData(prev => ({ ...prev, unit_number }))}
                // Standalone fields
                totalFloors={formData.total_floors}
                plotSizeSqm={formData.plot_size_sqm}
                hasElevator={formData.has_elevator}
                parkingType={formData.parking_type}
                poolType={formData.pool_type}
                gardenType={formData.garden_type}
                onTotalFloorsChange={(total_floors) => setFormData(prev => ({ ...prev, total_floors }))}
                onPlotSizeChange={(plot_size_sqm) => setFormData(prev => ({ ...prev, plot_size_sqm }))}
                onHasElevatorChange={(has_elevator) => setFormData(prev => ({ ...prev, has_elevator }))}
                onParkingTypeChange={(parking_type) => setFormData(prev => ({ ...prev, parking_type }))}
                onPoolTypeChange={(pool_type) => setFormData(prev => ({ ...prev, pool_type }))}
                onGardenTypeChange={(garden_type) => setFormData(prev => ({ ...prev, garden_type }))}
                // Common fields
                viewType={formData.view_type}
                furnishingLevel={formData.furnishing_level}
                equipment={formData.equipment}
                onViewTypeChange={(view_type) => setFormData(prev => ({ ...prev, view_type }))}
                onFurnishingLevelChange={(furnishing_level) => setFormData(prev => ({ ...prev, furnishing_level }))}
                onEquipmentChange={(equipment) => setFormData(prev => ({ ...prev, equipment }))}
              />
            )}

            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {isRu ? 'Основная информация' : 'Basic Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TranslatableInput
                  label={isRu ? 'Название' : 'Title'}
                  value={isRu ? formData.title_ru : formData.title}
                  translatedValue={isRu ? formData.title : formData.title_ru}
                  onChange={(val) => setFormData(prev => ({ 
                    ...prev, 
                    [isRu ? 'title_ru' : 'title']: val 
                  }))}
                  onTranslatedChange={(val) => setFormData(prev => ({ 
                    ...prev, 
                    [isRu ? 'title' : 'title_ru']: val 
                  }))}
                  placeholder={isRu ? 'Современная вилла с бассейном' : 'Modern Villa with Pool'}
                  translatedPlaceholder={isRu ? 'Modern Villa with Pool' : 'Современная вилла с бассейном'}
                />

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
          </div>
        );

      case 'location':
        return (
          <Card>
            <CardHeader className="pb-3">
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
        );

      case 'photos':
        return (
          <Card>
            <CardHeader className="pb-3">
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
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-4">
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

              <p className="text-xs text-muted-foreground mt-4">
                {isRu 
                  ? '💡 Первое фото станет обложкой. Рекомендуем загрузить 5-10 качественных снимков.' 
                  : '💡 First photo becomes the cover. We recommend 5-10 quality images.'}
              </p>
            </CardContent>
          </Card>
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            {/* Ownership Form - Legal Structure */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  {isRu ? 'Форма собственности' : 'Ownership Structure'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Укажите юридическую форму владения недвижимостью' 
                    : 'Specify the legal ownership structure of the property'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'freehold', labelEn: 'Freehold (Chanote)', labelRu: 'Фрихолд (Чанот)', icon: <Landmark className="h-4 w-4" />, desc: isRu ? 'Полная собственность' : 'Full ownership' },
                    { value: 'leasehold', labelEn: 'Leasehold', labelRu: 'Лизхолд', icon: <Clock className="h-4 w-4" />, desc: isRu ? 'Аренда земли' : 'Land lease' },
                    { value: 'company', labelEn: 'Thai Company', labelRu: 'Тайская компания', icon: <Building2 className="h-4 w-4" />, desc: isRu ? 'Владение через ООО' : 'LLC ownership' },
                    { value: 'foreign_company', labelEn: 'Foreign Company', labelRu: 'Иностранная компания', icon: <Briefcase className="h-4 w-4" />, desc: isRu ? 'Офшор / иностранное ООО' : 'Offshore / foreign LLC' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, ownership_form: option.value as 'freehold' | 'leasehold' | 'company' | 'foreign_company' }))}
                      className={`p-3 rounded-xl border-2 text-left transition-colors ${
                        formData.ownership_form === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground">{option.icon}</span>
                        <span className="font-medium text-sm">{isRu ? option.labelRu : option.labelEn}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rental Terms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {isRu ? 'Условия аренды' : 'Rental Terms'}
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
              </CardContent>
            </Card>

            {/* Sale Option */}
            <Card className={formData.is_for_sale ? 'border-green-500/50 bg-green-500/5' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BadgeDollarSign className="h-4 w-4" />
                    {isRu ? 'Готов к продаже' : 'Available for Sale'}
                  </CardTitle>
                  <Switch
                    checked={formData.is_for_sale}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_for_sale: checked }))}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.is_for_sale ? (
                  <>
                    <div className="space-y-2">
                      <Label>{isRu ? 'Цена продажи (THB)' : 'Sale Price (THB)'}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.sale_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                        placeholder="5000000"
                        className="text-lg"
                      />
                      {formData.sale_price && Number(formData.sale_price) > 0 && (
                        <p className="text-sm text-muted-foreground">
                          ≈ ${(Number(formData.sale_price) / 35).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        🏷️ {isRu ? 'Комиссия платформы: 5%' : 'Platform Commission: 5%'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isRu 
                          ? 'При успешной продаже через UNO. Объект также появится в разделе "Продажа" на маркетплейсе.' 
                          : 'On successful sale through UNO. Property will also appear in the "For Sale" marketplace section.'}
                      </p>
                    </div>

                    {!formData.ownership_form && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          ⚠️ {isRu ? 'Укажите форму собственности выше для публикации в разделе продажи' : 'Please specify ownership structure above to list in sales section'}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isRu 
                      ? 'Включите эту опцию, если готовы рассмотреть продажу объекта. Карточка появится в разделе "Продажа" на маркетплейсе.' 
                      : 'Enable this option if you\'re open to selling the property. It will appear in the "For Sale" marketplace section.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'management':
        return (
          <Card>
            <CardHeader className="pb-3">
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

              {/* Management type details */}
              {formData.management_type === 'full' && (
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 space-y-3">
                  <h4 className="font-semibold text-primary">
                    🏆 {isRu ? 'Полное управление UNO' : 'Full UNO Management'}
                  </h4>
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="font-bold text-lg text-primary">
                      {isRu ? 'Доход: 70% вам / 30% UNO' : 'Revenue: 70% You / 30% UNO'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Чистый доход после вычета операционных расходов' 
                        : 'Net income after operational expenses'}
                    </p>
                  </div>
                  <ul className="text-sm space-y-1 pl-4">
                    <li>✓ {isRu ? 'Маркетинг и динамическое ценообразование' : 'Marketing and dynamic pricing'}</li>
                    <li>✓ {isRu ? 'Проверка и поддержка гостей 24/7' : 'Guest verification and 24/7 support'}</li>
                    <li>✓ {isRu ? 'Уборка и техобслуживание' : 'Cleaning and maintenance'}</li>
                    <li>✓ {isRu ? 'Ежемесячные финансовые отчёты' : 'Monthly financial reports'}</li>
                  </ul>
                </div>
              )}

              {formData.management_type === 'partial' && (
                <div className="p-4 bg-secondary/50 rounded-xl border border-secondary space-y-3">
                  <h4 className="font-semibold">
                    🤝 {isRu ? 'Сервис-партнёр — 15%' : 'Service Partner — 15%'}
                  </h4>
                  <ul className="text-sm space-y-1 pl-4">
                    <li>✓ {isRu ? 'Check-in/out гостей' : 'Guest Check-in/out'}</li>
                    <li>✓ {isRu ? 'Управление депозитом' : 'Deposit management'}</li>
                    <li>✓ {isRu ? 'Оплата коммунальных' : 'Utility payments'}</li>
                    <li>✓ {isRu ? 'Партнёрские цены на услуги' : 'Partner rates on services'}</li>
                  </ul>
                </div>
              )}

              {formData.management_type === 'self' && (
                <div className="p-4 bg-muted rounded-xl border border-border space-y-3">
                  <h4 className="font-semibold">
                    📋 {isRu ? 'Только листинг — 10%' : 'Listing Only — 10%'}
                  </h4>
                  <ul className="text-sm space-y-1 pl-4">
                    <li>✓ {isRu ? 'Публикация на платформе UNO' : 'Listing on UNO platform'}</li>
                    <li>✓ {isRu ? 'Синхронизация календаря' : 'Calendar sync'}</li>
                    <li>✓ {isRu ? 'Услуги по запросу' : 'On-demand services'}</li>
                  </ul>
                </div>
              )}

              {/* Rental status */}
              <div className="pt-4 border-t">
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
                  <div className="mt-4 space-y-3">
                    <Label>{isRu ? 'Каналы бронирования' : 'Booking Channels'}</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Airbnb', 'Booking.com', 'Agoda', 'VRBO', isRu ? 'Напрямую' : 'Direct'].map((platform) => {
                        const value = platform.toLowerCase().replace('.com', '').replace('напрямую', 'direct');
                        const isSelected = formData.rental_platforms.includes(value);
                        return (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                rental_platforms: isSelected
                                  ? prev.rental_platforms.filter(p => p !== value)
                                  : [...prev.rental_platforms, value]
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {platform}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'description':
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isRu ? 'Описание объекта' : 'Property Description'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TranslatableInput
                label={isRu ? 'Описание' : 'Description'}
                value={isRu ? formData.description_ru : formData.description}
                translatedValue={isRu ? formData.description : formData.description_ru}
                onChange={(val) => setFormData(prev => ({ 
                  ...prev, 
                  [isRu ? 'description_ru' : 'description']: val 
                }))}
                onTranslatedChange={(val) => setFormData(prev => ({ 
                  ...prev, 
                  [isRu ? 'description' : 'description_ru']: val 
                }))}
                placeholder={isRu ? 'Опишите вашу недвижимость...' : 'Describe your property...'}
                translatedPlaceholder={isRu ? 'Describe your property...' : 'Опишите вашу недвижимость...'}
                multiline
                rows={4}
              />

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <p className="text-sm font-medium text-primary">
                  {isRu ? '🎯 Это только начало!' : '🎯 This is just the beginning!'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'После создания карточки вы сможете детально настроить условия аренды: тарифы по сезонам, скидки за длительное проживание, правила заезда, штрафы, депозиты и многое другое.' 
                    : 'After creating the listing, you can fine-tune rental terms: seasonal rates, long-stay discounts, check-in rules, penalties, deposits, and more.'}
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? '💡 После добавления объект будет проверен модератором UNO. Вы получите уведомление о статусе в течение 24 часов.' 
                    : "💡 After adding, the property will be reviewed by UNO. You'll receive a status update within 24 hours."}
                </p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // Preview data mapped from formData
  const previewData = {
    title: formData.title,
    titleRu: formData.title_ru,
    coverImage: formData.cover_image,
    images: formData.images,
    propertyType: formData.property_type,
    district: formData.district,
    address: formData.address,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    maxGuests: formData.max_guests,
    areaSqm: formData.area_sqm,
    pricePerNight: formData.price_per_night,
    instantBooking: formData.instant_booking,
    totalFloors: formData.total_floors,
    plotSizeSqm: formData.plot_size_sqm,
    poolType: formData.pool_type,
    gardenType: formData.garden_type,
    parkingType: formData.parking_type,
    floor: formData.floor,
    unitNumber: formData.unit_number,
    viewType: formData.view_type,
    furnishingLevel: formData.furnishing_level,
    equipment: formData.equipment,
  };

  // Show loading state when fetching source property for cloning
  if (cloneFromId && isLoadingSource) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Загрузка...' : 'Loading...'}
          showBack
          fallbackPath="/owner/properties"
        />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={cloneFromId 
          ? (isRu ? 'Создать на основе' : 'Duplicate Property')
          : (isRu ? 'Добавить объект' : 'Add Property')
        }
        showBack
        fallbackPath="/owner/properties"
        subtitle={cloneFromId 
          ? (isRu ? 'Заполните этаж и номер квартиры' : 'Fill in floor and unit number')
          : (isRu ? 'Зарегистрируйте недвижимость' : 'Register your property')
        }
      />

      {cloneFromId && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
          <Copy className="h-4 w-4 text-primary" />
          <span className="text-sm">
            {isRu 
              ? 'Данные скопированы. Этаж и номер квартиры нужно указать заново.' 
              : 'Data copied. Floor and unit number need to be filled in.'}
          </span>
        </div>
      )}
      <div className="lg:grid lg:grid-cols-[1fr,320px] lg:gap-6">
        <PropertyWizard
          onSubmit={handleSubmit}
          isSubmitting={createProperty.isPending}
          validateStep={validateStep}
        >
          {renderStep}
        </PropertyWizard>

        {/* Desktop preview sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <LivePropertyPreview data={previewData} />
          </div>
        </div>
      </div>

      {/* Mobile preview - moved below the form */}
      <div className="lg:hidden mt-6">
        <LivePropertyPreview 
          data={previewData}
          collapsed={isPreviewCollapsed}
          onToggle={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
        />
      </div>
    </PageContainer>
  );
}
