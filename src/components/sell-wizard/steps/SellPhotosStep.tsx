import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserListingDraft } from '@/types/userListing';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';

interface SellPhotosStepProps {
  draft: UserListingDraft;
  onChange: (updates: Partial<UserListingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SellPhotosStep({ draft, onChange, onNext, onBack }: SellPhotosStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const images = draft.images || [];
  
  const handleImagesChange = (urls: string | string[]) => {
    const imageArray = Array.isArray(urls) ? urls : urls ? [urls] : [];
    onChange({ 
      images: imageArray,
      cover_image: imageArray[0] || ''
    });
  };
  
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {isRu 
          ? 'Добавьте до 10 фотографий. Первое фото будет главным.' 
          : 'Add up to 10 photos. The first photo will be your cover image.'}
      </p>
      
      <UnifiedMediaUploader
        mode="gallery"
        value={images}
        onChange={handleImagesChange}
        folder="marketplace"
        maxItems={10}
        enableCloudImport={false}
        enableUrlImport={false}
        enableEditing={true}
        enableQualityTips={true}
      />
      
      <p className="text-xs text-muted-foreground text-center">
        {images.length}/10 {isRu ? 'фото добавлено' : 'photos added'}
      </p>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {isRu ? 'Назад' : 'Back'}
        </Button>
        <Button onClick={onNext} className="flex-1">
          {isRu ? 'Продолжить' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
