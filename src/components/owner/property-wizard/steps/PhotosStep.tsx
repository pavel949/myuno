import { Card, CardContent } from '@/components/ui/card';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { PropertyFormData } from '@/hooks/usePropertyWizard';

interface PhotosStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function PhotosStep({ formData, updateFormData }: PhotosStepProps) {
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

  return (
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
  );
}
