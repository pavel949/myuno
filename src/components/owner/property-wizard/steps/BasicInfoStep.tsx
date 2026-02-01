import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Bed, Bath, SquareStack } from 'lucide-react';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { ProjectSelector } from '@/components/property/ProjectSelector';
import { UnitFields } from '@/components/property/UnitFields';
import { PropertyFormData } from '@/hooks/usePropertyWizard';
import { PropertyProject } from '@/hooks/usePropertyProjects';

interface BasicInfoStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  selectedProject: PropertyProject | null;
  setSelectedProject: (project: PropertyProject | null) => void;
}

const propertyTypes = [
  { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла' },
  { value: 'house', labelEn: 'House', labelRu: 'Дом' },
  { value: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус' },
  { value: 'apartment', labelEn: 'Apartment', labelRu: 'Квартира' },
  { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо' },
  { value: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
  { value: 'penthouse', labelEn: 'Penthouse', labelRu: 'Пентхаус' },
];

export function BasicInfoStep({ 
  formData, 
  updateFormData,
  selectedProject,
  setSelectedProject
}: BasicInfoStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

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
              updateFormData({ 
                project_id: projectId,
                address: project?.address || formData.address,
                district: project?.district || formData.district,
                lat: project?.lat ?? formData.lat,
                lng: project?.lng ?? formData.lng,
              });
            }}
          />
        </CardContent>
      </Card>

      {/* Unit Fields */}
      {(formData.project_id || ['villa', 'house', 'townhouse'].includes(formData.property_type)) && (
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
            onChange={(val) => updateFormData({ [isRu ? 'title_ru' : 'title']: val })}
            onTranslatedChange={(val) => updateFormData({ [isRu ? 'title' : 'title_ru']: val })}
            placeholder={isRu ? 'Современная вилла с бассейном' : 'Modern Villa with Pool'}
            translatedPlaceholder={isRu ? 'Modern Villa with Pool' : 'Современная вилла с бассейном'}
          />

          <div className="space-y-2">
            <Label>{isRu ? 'Тип недвижимости' : 'Property Type'} *</Label>
            <Select 
              value={formData.property_type}
              onValueChange={(value) => updateFormData({ property_type: value })}
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
            <div className="space-y-2">
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
    </div>
  );
}
