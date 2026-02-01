import { Card, CardContent } from '@/components/ui/card';
import { AirbnbStyleImageUpload } from '@/components/upload/AirbnbStyleImageUpload';
import { PropertyFormData } from '@/hooks/usePropertyWizard';

interface PhotosStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function PhotosStep({ formData, updateFormData }: PhotosStepProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <AirbnbStyleImageUpload
          value={formData.cover_image 
            ? [formData.cover_image, ...formData.images] 
            : formData.images}
          onChange={(urls) => {
            if (urls.length === 0) {
              updateFormData({ cover_image: '', images: [] });
            } else {
              updateFormData({ 
                cover_image: urls[0], 
                images: urls.slice(1) 
              });
            }
          }}
          folder="property-care"
          maxImages={20}
        />
      </CardContent>
    </Card>
  );
}
