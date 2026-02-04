import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Bed, Bath, SquareStack, MapPin } from 'lucide-react';
import { AirbnbStyleImageUpload } from '@/components/upload/AirbnbStyleImageUpload';
import { PropertyHighlights } from '@/components/property/PropertyHighlights';
import { useTaxonomy } from '@/hooks/useTaxonomy';

interface ListingSectionProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
  activeTab?: 'details' | 'photos';
}

export function PropertyManageListingSection({ 
  formData, 
  updateFormData,
  activeTab = 'details' 
}: ListingSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  // Dynamic taxonomy data
  const { options: propertyTypes } = useTaxonomy('property_type');
  const { options: districts } = useTaxonomy('district');

  const handleImagesChange = (urls: string[]) => {
    if (urls.length === 0) {
      updateFormData({ cover_image: '', images: [] });
    } else {
      updateFormData({ 
        cover_image: urls[0], 
        images: urls.slice(1) 
      });
    }
  };

  const allImages = formData.cover_image 
    ? [formData.cover_image, ...(formData.images || [])]
    : formData.images || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {isRu ? 'Объявление' : 'Listing Details'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu 
            ? 'Информация, которую видят гости при просмотре вашего объекта' 
            : 'Information guests see when viewing your property'}
        </p>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">{isRu ? 'Детали' : 'Details'}</TabsTrigger>
          <TabsTrigger value="photos">{isRu ? 'Фото' : 'Photos'}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Title Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-4 w-4" />
                {isRu ? 'Название' : 'Title'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isRu ? 'Название (EN)' : 'Title (EN)'} *</Label>
                  <Input
                    value={formData.title || ''}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="Modern Villa with Pool"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Название (RU)' : 'Title (RU)'}</Label>
                  <Input
                    value={formData.title_ru || ''}
                    onChange={(e) => updateFormData({ title_ru: e.target.value })}
                    placeholder="Современная вилла с бассейном"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Type & Specs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bed className="h-4 w-4" />
                {isRu ? 'Тип и характеристики' : 'Type & Specifications'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isRu ? 'Тип недвижимости' : 'Property Type'}</Label>
                  <Select
                    value={formData.property_type || 'apartment'}
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
                <div className="space-y-2">
                  <Label>{isRu ? 'Площадь (м²)' : 'Area (sqm)'}</Label>
                  <Input
                    type="number"
                    value={formData.area_sqm || ''}
                    onChange={(e) => updateFormData({ area_sqm: e.target.value })}
                    placeholder="75"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Bed className="h-3 w-3" />
                    {isRu ? 'Спальни' : 'Bedrooms'}
                  </Label>
                  <Select
                    value={String(formData.bedrooms || 1)}
                    onValueChange={(value) => updateFormData({ bedrooms: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Bath className="h-3 w-3" />
                    {isRu ? 'Ванные' : 'Bathrooms'}
                  </Label>
                  <Select
                    value={String(formData.bathrooms || 1)}
                    onValueChange={(value) => updateFormData({ bathrooms: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {isRu ? 'Местоположение' : 'Location'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Адрес' : 'Address'}</Label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => updateFormData({ address: e.target.value })}
                  placeholder={isRu ? 'Полный адрес' : 'Full address'}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Район' : 'District'}</Label>
                <Select
                  value={formData.district || ''}
                  onValueChange={(value) => updateFormData({ district: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите район' : 'Select district'} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {isRu ? d.labelRu : d.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isRu ? 'Описание' : 'Description'}
              </CardTitle>
              <CardDescription>
                {isRu 
                  ? 'Расскажите гостям о вашем объекте' 
                  : 'Tell guests about your property'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder={isRu ? 'Опишите ваш объект...' : 'Describe your property...'}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label>
                <Textarea
                  value={formData.description_ru || ''}
                  onChange={(e) => updateFormData({ description_ru: e.target.value })}
                  placeholder="Опишите ваш объект..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Highlights */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isRu ? 'Особенности' : 'Highlights'}
              </CardTitle>
              <CardDescription>
                {isRu 
                  ? 'Выделите главные преимущества' 
                  : 'Highlight key features of your property'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyHighlights
                highlights={formData.highlights || []}
                onChange={(highlights) => updateFormData({ highlights })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isRu ? 'Фотографии' : 'Photos'}
              </CardTitle>
              <CardDescription>
                {isRu 
                  ? 'Добавьте до 20 фото. Первое фото станет обложкой.' 
                  : 'Add up to 20 photos. The first photo will be the cover.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AirbnbStyleImageUpload
                value={allImages}
                onChange={handleImagesChange}
                folder="property-care"
                maxImages={20}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
