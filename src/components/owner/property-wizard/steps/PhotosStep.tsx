import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { PropertyFormData } from '@/hooks/usePropertyWizard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Camera, Star } from 'lucide-react';

interface PhotosStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

const RECOMMENDED_COUNT = 5;

export function PhotosStep({ formData, updateFormData }: PhotosStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleImagesChange = (urls: string | string[]) => {
    const imageArray = Array.isArray(urls) ? urls : urls ? [urls] : [];
    if (imageArray.length === 0) {
      updateFormData({ cover_image: '', images: [] });
    } else {
      updateFormData({
        cover_image: imageArray[0],
        images: imageArray.slice(1)
      });
    }
  };

  // Combine cover_image and images for the uploader
  const allImages = formData.cover_image
    ? [formData.cover_image, ...formData.images]
    : formData.images;

  const photoCount = allImages.length;
  const hasEnough = photoCount >= RECOMMENDED_COUNT;

  return (
    <div className="space-y-4">
      {/* Header with guidance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {isRu ? 'Фотографии объекта' : 'Property Photos'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Photo count indicator */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${hasEnough ? 'bg-success' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, (photoCount / RECOMMENDED_COUNT) * 100)}%` }}
                />
              </div>
            </div>
            <Badge variant={hasEnough ? 'default' : 'secondary'} className="shrink-0 text-xs">
              {photoCount} / {RECOMMENDED_COUNT}+
            </Badge>
          </div>

          {/* Hints */}
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Star className="h-3 w-3 text-warning shrink-0" />
              {isRu
                ? 'Первая фото станет обложкой объявления'
                : 'The first photo will be used as the cover image'}
            </p>
            <p className="pl-5">
              {isRu
                ? 'Рекомендуем минимум 5 фото: фасад, гостиная, спальня, кухня, вид с балкона'
                : 'Recommended: at least 5 photos — facade, living room, bedroom, kitchen, view'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploader */}
      <Card>
        <CardContent className="pt-6">
          <UnifiedMediaUploader
            mode="gallery"
            value={allImages}
            onChange={handleImagesChange}
            folder="property-care"
            maxItems={20}
            enableCloudImport={true}
            enableUrlImport={true}
            enableEditing={true}
            enableQualityTips={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
