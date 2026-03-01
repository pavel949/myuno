import React, { memo, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Bed, Bath, SquareStack, FileSignature, MessageCircle, Shield, Phone, Upload, UserPlus, X, Info } from 'lucide-react';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { ProjectSelector } from '@/components/property/ProjectSelector';
import { UnitFields } from '@/components/property/UnitFields';
import { PropertyFormData, OwnershipData, OwnershipType } from '@/hooks/usePropertyWizard';
import { PropertyFeaturesSelector } from '../PropertyFeaturesSelector';
import { toast } from 'sonner';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { useTaxonomy } from '@/hooks/useTaxonomy';

const DISMISS_KEY = 'owner_contact_auto_create_hint_dismissed';

interface BasicInfoStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  selectedProject: PropertyProject | null;
  setSelectedProject: (project: PropertyProject | null) => void;
  ownershipData?: OwnershipData;
  updateOwnershipData?: (updates: Partial<OwnershipData>) => void;
}

interface OwnershipOption {
  id: OwnershipType;
  icon: React.ReactNode;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
}

const ownershipOptions: OwnershipOption[] = [
  {
    id: 'own',
    icon: <Home className="h-5 w-5" />,
    titleEn: 'My own property',
    titleRu: 'Мой объект',
    descEn: 'I am the legal owner',
    descRu: 'Я — собственник',
  },
  {
    id: 'management_agreement',
    icon: <FileSignature className="h-5 w-5" />,
    titleEn: 'Management Agreement',
    titleRu: 'Договор управления',
    descEn: 'I manage under contract',
    descRu: 'Управление по договору',
  },
  {
    id: 'verbal',
    icon: <MessageCircle className="h-5 w-5" />,
    titleEn: 'Verbal Agreement',
    titleRu: 'Устные договорённости',
    descEn: 'Managing by arrangement',
    descRu: 'На основании договорённости',
  },
];


function BasicInfoStepInner({ 
  formData, 
  updateFormData,
  selectedProject,
  setSelectedProject,
  ownershipData,
  updateOwnershipData
}: BasicInfoStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { options: propertyTypes } = useTaxonomy('property_type');
  
  // Hint about auto-creating CRM contact
  const [hintDismissed, setHintDismissed] = useState(() => 
    localStorage.getItem(DISMISS_KEY) === '1'
  );
  const [showHint, setShowHint] = useState(false);

  // Show hint when user starts typing owner data
  const hasOwnerInput = ownershipData && 
    ownershipData.ownership_type !== 'own' && 
    (ownershipData.actual_owner_name.trim() || ownershipData.actual_owner_email.trim() || ownershipData.actual_owner_phone.trim());

  useEffect(() => {
    if (hasOwnerInput && !hintDismissed) {
      setShowHint(true);
    }
  }, [hasOwnerInput, hintDismissed]);

  const handleDismissForever = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setHintDismissed(true);
    setShowHint(false);
  }, []);
  return (
    <div className="space-y-6">
      {/* Basic Info — Title FIRST (most important) */}
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
            onChange={(val) => updateFormData({ [isRu ? 'title_ru' : 'title']: val })}
            onTranslatedChange={(val) => updateFormData({ [isRu ? 'title' : 'title_ru']: val })}
            placeholder={isRu ? 'Современная вилла с бассейном' : 'Modern Villa with Pool'}
            translatedPlaceholder={isRu ? 'Modern Villa with Pool' : 'Современная вилла с бассейном'}
          />

          <div className="space-y-2">
            <Label>{isRu ? 'Внутреннее название' : 'Internal Name'}</Label>
            <Input
              value={formData.internal_name || ''}
              onChange={(e) => updateFormData({ internal_name: e.target.value })}
              placeholder={isRu ? 'Только для вас (не публикуется)' : 'Private note (not published)'}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                {isRu ? 'Спальни' : 'Bedrooms'}
              </Label>
              <Input
                type="number"
                min={0}
                value={formData.bedrooms}
                onChange={(e) => updateFormData({ bedrooms: Number(e.target.value) })}
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
                onChange={(e) => updateFormData({ bathrooms: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label className="flex items-center gap-1">
                <SquareStack className="h-3 w-3" />
                {isRu ? 'Площадь (м²)' : 'Area (m²)'}
              </Label>
              <Input
                type="number"
                min={0}
                value={formData.area_sqm}
                onChange={(e) => updateFormData({ area_sqm: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ownership Type Selection (Compact) */}
      {ownershipData && updateOwnershipData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {isRu ? 'Право на управление' : 'Management Rights'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ownershipOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateOwnershipData({ ownership_type: option.id })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    ownershipData.ownership_type === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    ownershipData.ownership_type === option.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {option.icon}
                  </div>
                  <p className="font-medium text-xs">
                    {isRu ? option.titleRu : option.titleEn}
                  </p>
                </button>
              ))}
                </div>

                {/* Auto-create contact hint */}
                {showHint && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    <UserPlus className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-foreground font-medium">
                        {isRu 
                          ? 'Контакт собственника будет создан автоматически' 
                          : 'Owner contact will be created automatically'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {isRu 
                          ? 'После сохранения объекта в CRM появится карточка собственника с указанными данными. Вы сможете дополнить её позже.'
                          : 'After saving, a CRM contact card will be created with this data. You can fill in more details later.'}
                      </p>
                      <button 
                        type="button" 
                        onClick={handleDismissForever}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                      >
                        {isRu ? 'Больше не показывать' : "Don't show again"}
                      </button>
                    </div>
                    <button type="button" onClick={() => setShowHint(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
            {/* Quick owner contact for verbal/management */}
            {ownershipData.ownership_type !== 'own' && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Контакты собственника для верификации:' : 'Owner contacts for verification:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder={isRu ? 'Имя' : 'Name'}
                    value={ownershipData.actual_owner_name}
                    onChange={(e) => updateOwnershipData({ actual_owner_name: e.target.value })}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={ownershipData.actual_owner_email}
                    onChange={(e) => updateOwnershipData({ actual_owner_email: e.target.value })}
                  />
                  <Input
                    placeholder={isRu ? 'Телефон' : 'Phone'}
                    type="tel"
                    value={ownershipData.actual_owner_phone}
                    onChange={(e) => updateOwnershipData({ actual_owner_phone: e.target.value })}
                  />
                </div>

                {/* Document upload for management agreement */}
                {ownershipData.ownership_type === 'management_agreement' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm">
                      <Upload className="h-3.5 w-3.5" />
                      {isRu ? 'Договор управления *' : 'Management Agreement *'}
                    </Label>
                    <UnifiedMediaUploader
                      mode="document"
                      value={ownershipData.management_document_url || ''}
                      onChange={(url) => updateOwnershipData({ management_document_url: typeof url === 'string' ? url : '' })}
                      bucket="property-documents"
                      placeholder={isRu ? 'Загрузите скан или фото договора' : 'Upload scan or photo of agreement'}
                    />
                  </div>
                )}

                {/* Optional ownership document */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Upload className="h-3.5 w-3.5" />
                    {isRu ? 'Документ о собственности (необязательно)' : 'Ownership document (optional)'}
                  </Label>
                  <UnifiedMediaUploader
                    mode="document"
                    value={ownershipData.ownership_document_url || ''}
                    onChange={(url) => updateOwnershipData({ ownership_document_url: typeof url === 'string' ? url : '' })}
                    bucket="property-documents"
                    placeholder={isRu ? 'Чанот, договор аренды и т.д.' : 'Chanote, lease contract, etc.'}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Property Type — FIRST like Airbnb */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4" />
            {isRu ? 'Тип недвижимости' : 'Property Type'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={formData.property_type}
            onValueChange={(value) => updateFormData({ property_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Выберите тип' : 'Select type'} />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {isRu ? type.labelRu : type.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Project Selection — for all types (villas can be in compounds too) */}
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
              updateFormData({ 
                project_id: projectId,
                address: project?.address || formData.address,
                district: project?.district || formData.district,
                lat: project?.lat ?? formData.lat,
                lng: project?.lng ?? formData.lng,
              });
              
              if (project) {
                const projectName = isRu 
                  ? (project.name_ru || project.name_en) 
                  : project.name_en;
                toast.success(
                  isRu 
                    ? `Данные проекта "${projectName}" загружены` 
                    : `Project data loaded: "${projectName}"`
                );
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Unit Fields — always shown after type is selected */}
      <UnitFields
        propertyType={formData.property_type}
        floor={formData.floor}
        unitNumber={formData.unit_number}
        onFloorChange={(floor) => updateFormData({ floor })}
        onUnitNumberChange={(unit_number) => updateFormData({ unit_number })}
        totalFloors={formData.total_floors}
        plotSizeSqm={formData.plot_size_sqm}
        hasElevator={formData.has_elevator}
        parkingType={formData.parking_type}
        poolType={formData.pool_type}
        gardenType={formData.garden_type}
        onTotalFloorsChange={(total_floors) => updateFormData({ total_floors })}
        onPlotSizeChange={(plot_size_sqm) => updateFormData({ plot_size_sqm })}
        onHasElevatorChange={(has_elevator) => updateFormData({ has_elevator })}
        onParkingTypeChange={(parking_type) => updateFormData({ parking_type })}
        onPoolTypeChange={(pool_type) => updateFormData({ pool_type })}
        onGardenTypeChange={(garden_type) => updateFormData({ garden_type })}
        viewType={formData.view_type}
        furnishingLevel={formData.furnishing_level}
        equipment={formData.equipment}
        onViewTypeChange={(view_type) => updateFormData({ view_type })}
        onFurnishingLevelChange={(furnishing_level) => updateFormData({ furnishing_level })}
        onEquipmentChange={(equipment) => updateFormData({ equipment })}
      />

      {/* Property Features / Highlights */}
      <PropertyFeaturesSelector
        highlights={formData.highlights}
        onChange={(highlights) => updateFormData({ highlights })}
      />

      {/* Management Type & Terms — hidden, management_type defaults to 'full' in usePropertyWizard */}
    </div>
  );
}

export const BasicInfoStep = memo(BasicInfoStepInner);
