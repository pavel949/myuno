import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { ProjectLocationPicker } from '@/components/property/ProjectLocationPicker';
import { PropertyFormData } from '@/hooks/usePropertyWizard';
import { PHUKET_DISTRICTS } from '@/lib/propertyTaxonomy';

interface LocationStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function LocationStep({ formData, updateFormData }: LocationStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

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
            onChange={(e) => updateFormData({ address: e.target.value })}
            placeholder="123 Beach Road, Patong"
          />
        </div>

        <div className="space-y-2">
          <Label>{isRu ? 'Район' : 'District'}</Label>
          <Select 
            value={formData.district}
            onValueChange={(value) => updateFormData({ district: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Выберите район' : 'Select district'} />
            </SelectTrigger>
            <SelectContent>
              {PHUKET_DISTRICTS.map((district) => (
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
            updateFormData({
              lat: location.lat,
              lng: location.lng,
              address: location.address || formData.address,
            });
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
}
