import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, AlertTriangle, Lock, EyeOff, Pencil } from 'lucide-react';
import { ProjectLocationPicker } from '@/components/property/ProjectLocationPicker';
import { PropertyFormData } from '@/hooks/usePropertyWizard';
import { PHUKET_DISTRICTS } from '@/lib/taxonomies';

interface LocationStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function LocationStep({ formData, updateFormData }: LocationStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [showEditAddress, setShowEditAddress] = useState(false);

  const hasLocationFromSearch = !!(formData.address && formData.lat != null && formData.lng != null);
  const showCompactLocation = hasLocationFromSearch && !showEditAddress;

  const projectLocationValue = useMemo(
    () =>
      formData.lat != null && formData.lng != null
        ? { lat: formData.lat, lng: formData.lng, address: formData.address }
        : undefined,
    [formData.lat, formData.lng, formData.address],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {isRu ? 'Расположение' : 'Location'}
          </CardTitle>
          {showCompactLocation && (
            <p className="text-xs text-muted-foreground mt-1">
              {isRu ? 'Адрес задан на предыдущем шаге. Уточните точку на карте при необходимости.' : 'Address was set on the previous step. Refine the pin on the map if needed.'}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {showCompactLocation ? (
            <>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-3">
                <p className="text-sm truncate flex-1" title={formData.address}>
                  <MapPin className="h-3.5 w-3 inline-block mr-1.5 text-muted-foreground" />
                  {formData.address || (formData.lat != null && formData.lng != null ? `${formData.lat.toFixed(4)}, ${formData.lng.toFixed(4)}` : '')}
                </p>
                <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1" onClick={() => setShowEditAddress(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  {isRu ? 'Изменить' : 'Edit'}
                </Button>
              </div>
            </>
          ) : (
            <>
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
                  onValueChange={(value) => {
                    const district = PHUKET_DISTRICTS.find(d => d.id === value);
                    const updates: Partial<PropertyFormData> = { district: value };
                    if (!formData.address.trim() && district) {
                      updates.address = `${isRu ? district.labelRu : district.labelEn}, Phuket`;
                    }
                    updateFormData(updates);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите район' : 'Select district'} />
                  </SelectTrigger>
                  <SelectContent>
                    {[...PHUKET_DISTRICTS]
                      .sort((a, b) => {
                        const labelA = isRu ? a.labelRu : a.labelEn;
                        const labelB = isRu ? b.labelRu : b.labelEn;
                        return labelA.localeCompare(labelB, isRu ? 'ru' : 'en');
                      })
                      .map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {isRu ? district.labelRu : district.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasLocationFromSearch && (
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowEditAddress(false)}>
                  {isRu ? 'Свернуть' : 'Collapse'}
                </Button>
              )}
            </>
          )}

          <ProjectLocationPicker
            value={projectLocationValue}
            onChange={(location) => {
              updateFormData({
                lat: location.lat,
                lng: location.lng,
                address: location.address || formData.address,
              });
            }}
          />

          {formData.lat && formData.lng ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
            </p>
          ) : (
            <Alert variant="default" className="bg-warning/10 border-warning/30">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-xs">
                {isRu 
                  ? 'Укажите точку на карте — без координат объект не появится в поиске на карте' 
                  : 'Pin a location on the map — without coordinates the property won\'t appear in map search'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Smart Lock / Access Code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {isRu ? 'Электронный замок' : 'Smart Lock'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {isRu ? 'Код доступа' : 'Access Code'}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
                <EyeOff className="h-3 w-3" />
                {isRu ? 'не виден гостю' : 'hidden from guest'}
              </span>
            </Label>
            <Input
              type="password"
              value={formData.lock_code || ''}
              onChange={(e) => updateFormData({ lock_code: e.target.value })}
              placeholder={isRu ? 'Код замка или пин-код' : 'Lock code or PIN'}
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isRu 
              ? 'Код хранится в зашифрованном виде и доступен только управляющим. Гости не видят это поле.' 
              : 'The code is stored securely and only visible to managers. Guests cannot see this field.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
